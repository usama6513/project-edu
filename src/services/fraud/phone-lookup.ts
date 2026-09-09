// ============================================
// Truecaller Multi-Key Backup System (Unlimited Keys)
// ============================================
// Keys can be added in 3 ways (all merged into one pool):
//   1. Comma-separated in env vars: TRUECALLER_API_KEY="key1,key2,key3"
//   2. Numbered env vars: TRUECALLER_KEY_1="...", TRUECALLER_KEY_2="...", ... TRUECALLER_KEY_N
//   3. JSON file: config/truecaller-keys.json → { "keys": ["key1", "key2", ...] }
// ============================================

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/** In-memory cache: number → result (avoids wasting API quota on repeats) */
const truecallerCache = new Map<string, { result: NonNullable<Awaited<ReturnType<typeof lookupTruecaller>>>; timestamp: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

/** Rate-limit tracking per key: tracks remaining calls & cooldown */
const keyRateState = new Map<string, { remaining: number; resetAt: number; exhausted: boolean }>();

/** Cached unified key pools (loaded once at startup per tier) */
const poolCache = new Map<string, { keys: string[]; loadedAt: number }>();
const POOL_CACHE_TTL = 5 * 60 * 1000; // refresh pool every 5 min

/**
 * Collect keys from ALL sources for a given tier:
 *   - Base env var (comma-separated): TRUECALLER_API_KEY / TRUECALLER_BACKUP_API_KEY / TRUECALLER_TERTIARY_API_KEY
 *   - Numbered env vars: TRUECALLER_KEY_1 .. TRUECALLER_KEY_99
 *   - JSON file: config/truecaller-keys.json
 *
 * Tier mapping:
 *   "primary"   → TRUECALLER_API_KEY + TRUECALLER_KEY_1..N + JSON "primary" keys
 *   "backup"    → TRUECALLER_BACKUP_API_KEY + JSON "backup" keys
 *   "tertiary"  → TRUECALLER_TERTIARY_API_KEY + JSON "tertiary" keys
 *   "all"       → every key from every source (used in last-resort scans)
 */
function getKeyPool(tier: string = 'primary'): string[] {
  const now = Date.now();
  const cached = poolCache.get(tier);
  if (cached && now - cached.loadedAt < POOL_CACHE_TTL) return cached.keys;

  const keys = new Set<string>();

  // --- Source 1: Base env var (comma-separated) ---
  const envMap: Record<string, string> = {
    primary: 'TRUECALLER_API_KEY',
    backup: 'TRUECALLER_BACKUP_API_KEY',
    tertiary: 'TRUECALLER_TERTIARY_API_KEY',
  };
  const baseVar = envMap[tier];
  if (baseVar) {
    const raw = process.env[baseVar];
    if (raw) {
      raw.split(',').map(k => k.trim()).filter(Boolean).forEach(k => keys.add(k));
    }
  }

  // --- Source 2: Numbered env vars TRUECALLER_KEY_1 .. TRUECALLER_KEY_99 ---
  // For "primary" tier or "all", scan all numbered vars
  if (tier === 'primary' || tier === 'all') {
    for (let i = 1; i <= 99; i++) {
      const val = process.env[`TRUECALLER_KEY_${i}`];
      if (val?.trim()) keys.add(val.trim());
    }
  }
  // For backup/tertiary, also scan numbered backup/tertiary vars
  if (tier === 'backup' || tier === 'all') {
    for (let i = 1; i <= 99; i++) {
      const val = process.env[`TRUECALLER_BACKUP_KEY_${i}`];
      if (val?.trim()) keys.add(val.trim());
    }
  }
  if (tier === 'tertiary' || tier === 'all') {
    for (let i = 1; i <= 99; i++) {
      const val = process.env[`TRUECALLER_TERTIARY_KEY_${i}`];
      if (val?.trim()) keys.add(val.trim());
    }
  }

  // --- Source 3: JSON config file ---
  try {
    const jsonPath = join(process.cwd(), 'config', 'truecaller-keys.json');
    if (existsSync(jsonPath)) {
      const raw = readFileSync(jsonPath, 'utf-8');
      const data = JSON.parse(raw);
      // Format: { "primary": ["k1","k2"], "backup": ["k3"], "tertiary": ["k4"], "keys": ["k5"] }
      if (tier === 'all') {
        // Grab everything
        for (const arr of Object.values(data)) {
          if (Array.isArray(arr)) arr.forEach((k: string) => keys.add(k.trim()));
        }
      } else {
        // Tier-specific array
        if (Array.isArray(data[tier])) data[tier].forEach((k: string) => keys.add(k.trim()));
        // Also include the generic "keys" array for primary tier
        if (tier === 'primary' && Array.isArray(data.keys)) data.keys.forEach((k: string) => keys.add(k.trim()));
      }
    }
  } catch (err) {
    // JSON file is optional — don't crash if missing or malformed
    if (tier === 'primary') {
      console.log('[Truecaller Key Pool] No config/truecaller-keys.json found (optional)');
    }
  }

  // If "all" tier, also pull from all base env vars
  if (tier === 'all') {
    for (const envVar of Object.values(envMap)) {
      const raw = process.env[envVar];
      if (raw) raw.split(',').map(k => k.trim()).filter(Boolean).forEach(k => keys.add(k));
    }
  }

  const result = Array.from(keys);
  poolCache.set(tier, { keys: result, loadedAt: now });

  if (result.length > 0 && (tier === 'primary' || tier === 'all')) {
    const available = result.filter(k => !isKeyExhausted(k, 'tc-pool')).length;
    console.log(`[Truecaller Key Pool] ${tier}: ${result.length} keys loaded, ${available} available`);
  }

  return result;
}

/**
 * Check if a key is rate-limited / in cooldown.
 * Returns true if the key should be SKIPPED.
 * Provider prefix ensures same key value on different APIs is tracked independently.
 */
function isKeyExhausted(key: string, provider = 'default'): boolean {
  const compositeKey = `${provider}:${key}`;
  const state = keyRateState.get(compositeKey);
  if (!state) return false;
  if (state.exhausted && Date.now() < state.resetAt) return true;
  // Cooldown expired — allow retry
  if (state.exhausted && Date.now() >= state.resetAt) {
    keyRateState.delete(compositeKey);
    return false;
  }
  if (state.remaining <= 0) return true;
  return false;
}

/**
 * Update rate-limit state from response headers.
 * Provider prefix ensures same key value on different APIs is tracked independently.
 */
function updateRateState(key: string, headers: Headers, status: number, provider = 'default') {
  const compositeKey = `${provider}:${key}`;
  const remaining = headers.get('x-ratelimit-requests-remaining')
    ?? headers.get('X-RateLimit-Remaining')
    ?? headers.get('x-rate-limit-remaining');
  const reset = headers.get('x-ratelimit-requests-reset')
    ?? headers.get('X-RateLimit-Reset')
    ?? headers.get('x-rate-limit-reset');

  let remainNum = remaining ? parseInt(remaining, 10) : NaN;
  let resetMs = 0;

  if (reset) {
    const resetSec = parseInt(reset, 10);
    // If it looks like epoch seconds, convert; otherwise treat as seconds-from-now
    resetMs = resetSec > 1e12 ? resetSec : Date.now() + resetSec * 1000;
  }

  if (status === 429 || (Number.isFinite(remainNum) && remainNum <= 0)) {
    // Key exhausted — set cooldown (use reset header or default 1 hour)
    keyRateState.set(compositeKey, {
      remaining: 0,
      resetAt: resetMs || Date.now() + 60 * 60 * 1000,
      exhausted: true,
    });
    console.log(`[${provider}] Key ...${key.slice(-6)} exhausted, cooldown until ${new Date(keyRateState.get(compositeKey)!.resetAt).toISOString()}`);
  } else if (Number.isFinite(remainNum)) {
    keyRateState.set(compositeKey, {
      remaining: remainNum,
      resetAt: resetMs,
      exhausted: false,
    });
  }
}

export interface LivePhoneData {
  isValid: boolean;
  lineType: string;
  carrier: string;
  location: string;
  country: string;
  countryCode: string;
  isRegistered: boolean;
  isRoaming: boolean;
  isWhatsApp: boolean;
  isVoIP: boolean;
  source: string;
  // Truecaller data
  truecallerName?: string;
  truecallerSpamScore?: number;
  truecallerType?: string;
  truecallerVerified?: boolean;
}

async function lookupAbstractAPI(phoneNumber: string): Promise<Partial<LivePhoneData> | null> {
  const apiKey = process.env.ABSTRACT_PHONE_API_KEY;
  if (!apiKey) return null;

  try {
    let phone = phoneNumber;
    if (!phone.startsWith('+')) {
      if (phone.startsWith('0')) phone = '92' + phone.slice(1);
      else phone = '+' + phone;
    } else {
      phone = phone;
    }
    const url = `https://phonevalidation.abstractapi.com/v1/?api_key=${apiKey}&phone=${encodeURIComponent(phone)}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return null;
    const data = await response.json();
    return {
      isValid: data.valid === true,
      lineType: data.type || 'unknown',
      carrier: data.carrier || 'Unknown',
      location: [data.location?.city, data.location?.region, data.location?.country].filter(Boolean).join(', '),
      country: data.country?.name || 'Unknown',
      countryCode: data.country?.code || '',
      isRegistered: data.valid === true,
      isRoaming: data.roaming === true,
      source: 'Abstract API',
    };
  } catch {
    return null;
  }
}

async function lookupNumverify(phoneNumber: string): Promise<Partial<LivePhoneData> | null> {
  const apiKey = process.env.NUMVERIFY_API_KEY;
  if (!apiKey) return null;

  try {
    let number = phoneNumber;
    if (!number.startsWith('+')) {
      if (number.startsWith('0')) number = '92' + number.slice(1);
      else number = '+' + number;
    }
    number = number.replace('+', '');
    const url = `http://apilayer.net/api/validate?access_key=${apiKey}&number=${number}&country_code=&format=1`;
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return null;
    const data = await response.json();
    if (data.valid === undefined) return null;
    return {
      isValid: data.valid === true,
      lineType: data.line_type || 'unknown',
      carrier: data.carrier || 'Unknown',
      location: [data.location, data.country_name].filter(Boolean).join(', '),
      country: data.country_name || 'Unknown',
      countryCode: data.country_code || '',
      isRegistered: data.valid === true,
      isRoaming: false,
      source: 'Numverify',
    };
  } catch {
    return null;
  }
}

export async function checkWhatsApp(phoneNumber: string): Promise<boolean> {
  try {
    const clean = phoneNumber.replace(/[^\d]/g, '');
    const number = clean.startsWith('+') ? clean.slice(1) : clean;
    const response = await fetch(`https://api.whatsapp.com/send?phone=${number}`, {
      method: 'HEAD',
      redirect: 'manual',
      signal: AbortSignal.timeout(5000),
    });
    const location = response.headers.get('location') || '';
    return !location.includes('send?phone=');
  } catch {
    return false;
  }
}

/**
 * Truecaller Lookup — returns owner name, spam score, and number type
 * Tries ALL available keys from the pool, skipping rate-limited ones.
 * Uses RapidAPI TrueCaller API by API Wala (truecaller-api13)
 * POST endpoint with phone + countryCode form data
 * Get key: https://rapidapi.com/apiwala2025/api/truecaller-api13
 */
async function lookupTruecaller(phoneNumber: string): Promise<Partial<LivePhoneData> & {
  truecallerName?: string;
  truecallerSpamScore?: number;
  truecallerType?: string;
  truecallerVerified?: boolean;
} | null> {
  const keys = getKeyPool('primary');
  if (keys.length === 0) return null;

  let number = phoneNumber;
  let countryCode = 'pk'; // default Pakistan

  if (!number.startsWith('+')) {
    if (number.startsWith('0')) {
      number = '+92' + number.slice(1);
    } else {
      number = '+' + number;
    }
  }

  // Extract country code from phone number prefix
  const cleanForCountry = number.replace('+', '');
  if (cleanForCountry.startsWith('92')) countryCode = 'pk';
  else if (cleanForCountry.startsWith('91')) countryCode = 'in';
  else if (cleanForCountry.startsWith('1')) countryCode = 'us';
  else if (cleanForCountry.startsWith('44')) countryCode = 'gb';
  else if (cleanForCountry.startsWith('971')) countryCode = 'ae';
  else if (cleanForCountry.startsWith('966')) countryCode = 'sa';
  else if (cleanForCountry.startsWith('86')) countryCode = 'cn';
  else if (cleanForCountry.startsWith('61')) countryCode = 'au';

  const cleanNumber = cleanForCountry;

  // Try each key in the pool
  for (const apiKey of keys) {
    if (isKeyExhausted(apiKey, 'tc-primary')) {
      console.log(`[Truecaller] Skipping exhausted key ...${apiKey.slice(-6)}`);
      continue;
    }

    try {
      const formData = new URLSearchParams();
      formData.append('phone', cleanNumber);
      formData.append('countryCode', countryCode);

      const response = await fetch(
        'https://truecaller-api13.p.rapidapi.com/v2.php',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': 'truecaller-api13.p.rapidapi.com',
          },
          body: formData.toString(),
          signal: AbortSignal.timeout(10000),
        }
      );

      updateRateState(apiKey, response.headers, response.status, 'tc-primary');

      if (!response.ok) {
        console.log(`[Truecaller] Key ...${apiKey.slice(-6)} response not OK:`, response.status);
        continue; // try next key
      }
      const data = await response.json();
      console.log('[Truecaller] Raw response:', JSON.stringify(data).substring(0, 500));

      const resultData = data.data || data;
      const name = resultData.name || resultData.displayName || resultData.owner || 
                   resultData.data?.name || resultData.result?.name ||
                   (Array.isArray(resultData.data) && resultData.data[0]?.name) ||
                   (Array.isArray(resultData.addresses) && resultData.addresses[0]?.name) ||
                   undefined;
      const spamScore = resultData.spamScore ?? resultData.spam_score ?? resultData.score ?? resultData.data?.spamScore ?? 0;
      const numberType = resultData.numberType || resultData.type || resultData.phoneType || resultData.data?.numberType || undefined;
      const isVerified = resultData.verified === true || resultData.isVerified === true || resultData.data?.verified === true || false;

      if (!name && spamScore === 0) {
        console.log(`[Truecaller] Key ...${apiKey.slice(-6)}: No name or spam score found`);
        continue;
      }

      console.log('[Truecaller] Parsed - Name:', name, 'Spam:', spamScore, 'Type:', numberType);

      return {
        truecallerName: name,
        truecallerSpamScore: spamScore,
        truecallerType: numberType,
        truecallerVerified: isVerified,
        source: 'Truecaller',
      };
    } catch (error) {
      console.error(`[Truecaller] Key ...${apiKey.slice(-6)} Error:`, error instanceof Error ? error.message : 'Unknown error');
      continue;
    }
  }
  return null;
}

/**
 * Alternative Truecaller lookup using second RapidAPI endpoint (backup)
 * Uses truecaller-data2 API (GET endpoint — simpler and more reliable)
 * Supports multi-key pool from TRUECALLER_BACKUP_API_KEY (comma-separated)
 * Get key: https://rapidapi.com/do3t/api/truecaller-data2
 */
async function lookupTruecallerBackup(phoneNumber: string): Promise<Partial<LivePhoneData> & {
  truecallerName?: string;
  truecallerSpamScore?: number;
  truecallerType?: string;
  truecallerVerified?: boolean;
} | null> {
  const keys = getKeyPool('backup');
  if (keys.length === 0) return null;

  let number = phoneNumber;
  if (!number.startsWith('+')) {
    if (number.startsWith('0')) number = '+92' + number.slice(1);
    else number = '+' + number;
  }
  const cleanNumber = number.replace('+', '');

  // Try each key in the backup pool
  for (const apiKey of keys) {
    if (isKeyExhausted(apiKey, 'tc-backup')) {
      console.log(`[Truecaller Backup] Skipping exhausted key ...${apiKey.slice(-6)}`);
      continue;
    }

    try {
      const response = await fetch(
        `https://truecaller-data2.p.rapidapi.com/search/${cleanNumber}`,
        {
          headers: {
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': 'truecaller-data2.p.rapidapi.com',
          },
          signal: AbortSignal.timeout(8000),
        }
      );

      updateRateState(apiKey, response.headers, response.status, 'tc-backup');

      if (!response.ok) {
        console.log(`[Truecaller Backup] data2 Key ...${apiKey.slice(-6)} response not OK:`, response.status);
        continue; // try next key
      }
      const data = await response.json();
      console.log('[Truecaller Backup] data2 Raw response:', JSON.stringify(data).substring(0, 500));

      const resultData = data.data || data;
      const name = resultData.basicInfo?.name?.fullName || resultData.name || resultData.displayName || resultData.data?.name || resultData.result?.name || undefined;
      const spamScore = resultData.phoneInfo?.spamScore ?? resultData.spamInfo?.spamScore ?? resultData.spamScore ?? resultData.spam_score ?? resultData.data?.spamScore ?? 0;
      const numberType = resultData.phoneInfo?.numberType || resultData.numberType || resultData.type || resultData.data?.numberType || undefined;
      const isVerified = resultData.verified === true || resultData.isVerified === true || (resultData.badges && resultData.badges.includes('verified')) || false;

      if (!name && spamScore === 0) {
        console.log(`[Truecaller Backup] data2 Key ...${apiKey.slice(-6)}: No name or spam score`);
        continue;
      }

      console.log('[Truecaller Backup] data2 Parsed - Name:', name, 'Spam:', spamScore);

      return {
        truecallerName: name,
        truecallerSpamScore: spamScore,
        truecallerType: numberType,
        truecallerVerified: isVerified,
        source: 'Truecaller (backup)',
      };
    } catch (error) {
      console.error(`[Truecaller Backup] Key ...${apiKey.slice(-6)} Error:`, error instanceof Error ? error.message : 'Unknown');
      continue;
    }
  }

  // All data2 keys failed — try v15 fallback with backup keys, then tertiary keys
  const allFallbackKeys = [...keys, ...getKeyPool('tertiary')];
  for (const apiKey of allFallbackKeys) {
    if (isKeyExhausted(apiKey, 'tc-v15')) continue;
    const v15Result = await lookupTruecallerBackupV15(cleanNumber, apiKey);
    if (v15Result) return v15Result;
  }
  return null;
}

/**
 * Fallback Truecaller lookup using truecaller15 API
 * Now also tries truecaller46 as a last-resort endpoint.
 */
async function lookupTruecallerBackupV15(cleanNumber: string, apiKey: string): Promise<Partial<LivePhoneData> & {
  truecallerName?: string;
  truecallerSpamScore?: number;
  truecallerType?: string;
  truecallerVerified?: boolean;
} | null> {
  const number = '+' + cleanNumber;

  // Try truecaller15 first, then truecaller46 as last resort
  const endpoints = [
    { host: 'truecaller15.p.rapidapi.com', path: `/search?query=${encodeURIComponent(number)}`, label: 'v15' },
    { host: 'truecaller46.p.rapidapi.com', path: `/search?query=${encodeURIComponent(number)}`, label: 'v46' },
  ];

  for (const ep of endpoints) {
    if (isKeyExhausted(apiKey, 'tc-v15')) return null;

    try {
      const response = await fetch(
        `https://${ep.host}${ep.path}`,
        {
          headers: {
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': ep.host,
          },
          signal: AbortSignal.timeout(8000),
        }
      );

      updateRateState(apiKey, response.headers, response.status, 'tc-v15');

      if (!response.ok) {
        console.log(`[Truecaller Backup ${ep.label}] Key ...${apiKey.slice(-6)} response not OK:`, response.status);
        continue;
      }
      const data = await response.json();
      console.log(`[Truecaller Backup ${ep.label}] Raw response:`, JSON.stringify(data).substring(0, 500));

      const name = data.name || data.displayName || data.data?.[0]?.name || data.result?.name || undefined;
      const spamScore = data.spamScore ?? data.data?.[0]?.spamScore ?? data.result?.spamScore ?? 0;
      const numberType = data.numberType || data.data?.[0]?.numberType || undefined;
      const isVerified = data.verified === true || data.data?.[0]?.verified === true || false;

      if (!name && spamScore === 0) {
        console.log(`[Truecaller Backup ${ep.label}] No name or spam score found`);
        continue;
      }

      console.log(`[Truecaller Backup ${ep.label}] Parsed - Name:`, name, 'Spam:', spamScore);

      return {
        truecallerName: name,
        truecallerSpamScore: spamScore,
        truecallerType: numberType,
        truecallerVerified: isVerified,
        source: `Truecaller (backup ${ep.label})`,
      };
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * ============================================
 * Direct Truecaller API (no RapidAPI middleman)
 * Uses Truecaller's internal search5-noneu endpoint
 * Auth: Bearer <installationId> (from truecallerjs login)
 * ============================================
 * Setup: npm install -g truecallerjs && truecallerjs login
 * Get ID: truecallerjs -i
 * Add as: TRUECALLER_DIRECT_ID_1="id1", TRUECALLER_DIRECT_ID_2="id2", ...
 * Or comma-separated: TRUECALLER_DIRECT_IDS="id1,id2,id3"
 */

function getDirectInstallationIds(): string[] {
  const ids = new Set<string>();

  // Source 1: Comma-separated TRUECALLER_DIRECT_IDS
  const csv = process.env.TRUECALLER_DIRECT_IDS;
  if (csv) csv.split(',').map(k => k.trim()).filter(Boolean).forEach(k => ids.add(k));

  // Source 2: Numbered vars TRUECALLER_DIRECT_ID_1 .. TRUECALLER_DIRECT_ID_99
  for (let i = 1; i <= 99; i++) {
    const val = process.env[`TRUECALLER_DIRECT_ID_${i}`];
    if (val?.trim()) ids.add(val.trim());
  }

  // Source 3: Single TRUECALLER_DIRECT_ID
  const single = process.env.TRUECALLER_DIRECT_ID;
  if (single?.trim()) ids.add(single.trim());

  return Array.from(ids);
}

async function lookupTruecallerDirect(phoneNumber: string): Promise<Partial<LivePhoneData> & {
  truecallerName?: string;
  truecallerSpamScore?: number;
  truecallerType?: string;
  truecallerVerified?: boolean;
} | null> {
  const ids = getDirectInstallationIds();
  if (ids.length === 0) return null;

  // Normalize number
  let number = phoneNumber;
  if (!number.startsWith('+')) {
    if (number.startsWith('0')) number = '+92' + number.slice(1);
    else number = '+' + number;
  }

  // Extract country code and significant number
  const cleanForCountry = number.replace('+', '');
  let countryCode = 'PK';
  if (cleanForCountry.startsWith('92')) countryCode = 'PK';
  else if (cleanForCountry.startsWith('91')) countryCode = 'IN';
  else if (cleanForCountry.startsWith('1')) countryCode = 'US';
  else if (cleanForCountry.startsWith('44')) countryCode = 'GB';
  else if (cleanForCountry.startsWith('971')) countryCode = 'AE';
  else if (cleanForCountry.startsWith('966')) countryCode = 'SA';
  else if (cleanForCountry.startsWith('86')) countryCode = 'CN';
  else if (cleanForCountry.startsWith('61')) countryCode = 'AU';

  // Remove country code prefix to get significant number
  const countryDialMap: Record<string, string> = {
    PK: '92', IN: '91', US: '1', GB: '44', AE: '971', SA: '966', CN: '86', AU: '61',
  };
  const dialCode = countryDialMap[countryCode] || '';
  const significantNumber = dialCode ? cleanForCountry.replace(dialCode, '') : cleanForCountry;

  // Try each installation ID
  for (const installationId of ids) {
    if (isKeyExhausted(installationId, 'tc-direct')) {
      console.log(`[Truecaller Direct] Skipping exhausted ID ...${installationId.slice(-8)}`);
      continue;
    }

    try {
      const url = new URL('https://search5-noneu.truecaller.com/v2/search');
      url.searchParams.set('q', significantNumber);
      url.searchParams.set('countryCode', countryCode);
      url.searchParams.set('type', '4');
      url.searchParams.set('locAddr', '');
      url.searchParams.set('placement', 'SEARCHRESULTS,HISTORY,DETAILS');
      url.searchParams.set('encoding', 'json');

      const response = await fetch(url.toString(), {
        headers: {
          'content-type': 'application/json; charset=UTF-8',
          'accept-encoding': 'gzip',
          'user-agent': 'Truecaller/11.75.5 (Android;10)',
          'Authorization': `Bearer ${installationId}`,
        },
        signal: AbortSignal.timeout(10000),
      });

      updateRateState(installationId, response.headers, response.status, 'tc-direct');

      if (!response.ok) {
        console.log(`[Truecaller Direct] ID ...${installationId.slice(-8)} response not OK:`, response.status);
        continue;
      }

      const data = await response.json();
      console.log('[Truecaller Direct] Raw response:', JSON.stringify(data).substring(0, 500));

      // Response format: { data: [{ name, addresses, spamInfo, phoneNumbers, ... }] }
      const resultData = data.data?.[0] || data;
      const name = resultData.name || resultData.displayName || undefined;
      const spamScore = resultData.spamInfo?.score ?? resultData.spamScore ?? 0;
      const numberType = resultData.phoneNumbers?.[0]?.numberType || resultData.numberType || undefined;
      const isVerified = resultData.verified === true || resultData.badges?.some((b: { text?: string }) => b.text === 'verified') || false;

      if (!name && spamScore === 0) {
        console.log(`[Truecaller Direct] ID ...${installationId.slice(-8)}: No name or spam score`);
        continue;
      }

      console.log('[Truecaller Direct] Parsed - Name:', name, 'Spam:', spamScore, 'Type:', numberType);

      return {
        truecallerName: name,
        truecallerSpamScore: spamScore,
        truecallerType: numberType,
        truecallerVerified: isVerified,
        source: 'Truecaller (direct)',
      };
    } catch (error) {
      console.error(`[Truecaller Direct] ID ...${installationId.slice(-8)} Error:`, error instanceof Error ? error.message : 'Unknown');
      continue;
    }
  }
  return null;
}

/**
 * Truecaller API3 — POST /v2.php (same format as api13 but different provider/quota)
 * Uses the same RapidAPI key but tracked independently via provider-scoped rate limiting.
 */
async function lookupTruecallerApi3(phoneNumber: string): Promise<Partial<LivePhoneData> & {
  truecallerName?: string;
  truecallerSpamScore?: number;
  truecallerType?: string;
  truecallerVerified?: boolean;
} | null> {
  const keys = getKeyPool('primary'); // Uses same key pool but tracked as tc-api3
  if (keys.length === 0) return null;

  let number = phoneNumber;
  if (!number.startsWith('+')) {
    if (number.startsWith('0')) number = '+92' + number.slice(1);
    else number = '+' + number;
  }
  const clean = number.replace('+', '');

  const countryMap: { dial: string; iso: string }[] = [
    { dial: '92', iso: 'PK' }, { dial: '91', iso: 'IN' }, { dial: '1', iso: 'US' },
    { dial: '44', iso: 'GB' }, { dial: '971', iso: 'AE' }, { dial: '966', iso: 'SA' },
  ];
  let countryCode = 'PK';
  for (const c of countryMap) {
    if (clean.startsWith(c.dial)) { countryCode = c.iso; break; }
  }

  for (const apiKey of keys) {
    if (isKeyExhausted(apiKey, 'tc-api3')) continue;

    try {
      const formData = new URLSearchParams();
      formData.append('phone', clean);
      formData.append('countryCode', countryCode);

      const response = await fetch(
        'https://truecaller-api3.p.rapidapi.com/v2.php',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': 'truecaller-api3.p.rapidapi.com',
          },
          body: formData.toString(),
          signal: AbortSignal.timeout(10000),
        }
      );

      updateRateState(apiKey, response.headers, response.status, 'tc-api3');

      if (!response.ok) {
        console.log(`[Truecaller API3] Key ...${apiKey.slice(-6)} response not OK:`, response.status);
        continue;
      }

      const data = await response.json();
      if (data.success && data.data?.name) {
        console.log(`[Truecaller API3] Found: ${data.data.name}`);
        return {
          truecallerName: data.data.name,
          truecallerType: 'mobile',
          truecallerVerified: false,
        };
      }
    } catch (error) {
      console.log(`[Truecaller API3] Key ...${apiKey.slice(-6)} error:`, error instanceof Error ? error.message : 'unknown');
    }
  }
  return null;
}

/**
 * Truecaller API4 — GET /api/v1/getDetails (different provider, different response format)
 * Returns name + address + spam score. Tracked independently via tc-api4 provider.
 */
async function lookupTruecaller4(phoneNumber: string): Promise<Partial<LivePhoneData> & {
  truecallerName?: string;
  truecallerSpamScore?: number;
  truecallerType?: string;
  truecallerVerified?: boolean;
} | null> {
  const keys = getKeyPool('primary'); // Uses same key pool but tracked as tc-api4
  if (keys.length === 0) return null;

  let number = phoneNumber;
  if (!number.startsWith('+')) {
    if (number.startsWith('0')) number = '+92' + number.slice(1);
    else number = '+' + number;
  }
  const clean = number.replace('+', '');

  const countryMap: { dial: string; iso: string }[] = [
    { dial: '92', iso: 'PK' }, { dial: '91', iso: 'IN' }, { dial: '1', iso: 'US' },
    { dial: '44', iso: 'GB' }, { dial: '971', iso: 'AE' }, { dial: '966', iso: 'SA' },
  ];
  let countryCode = 'PK';
  for (const c of countryMap) {
    if (clean.startsWith(c.dial)) { countryCode = c.iso; break; }
  }

  for (const apiKey of keys) {
    if (isKeyExhausted(apiKey, 'tc-api4')) continue;

    try {
      const response = await fetch(
        `https://truecaller4.p.rapidapi.com/api/v1/getDetails?countryCode=${countryCode}&phone=${clean}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': 'truecaller4.p.rapidapi.com',
          },
          signal: AbortSignal.timeout(10000),
        }
      );

      updateRateState(apiKey, response.headers, response.status, 'tc-api4');

      if (!response.ok) {
        console.log(`[Truecaller4] Key ...${apiKey.slice(-6)} response not OK:`, response.status);
        continue;
      }

      const data = await response.json();
      if (data.status && data.data?.[0]?.name) {
        const entry = data.data[0];
        const spamScore = entry.score ? Math.round(entry.score * 100) : 0;
        console.log(`[Truecaller4] Found: ${entry.name} (spam: ${spamScore})`);
        return {
          truecallerName: entry.name,
          truecallerSpamScore: spamScore,
          truecallerType: entry.phones?.[0]?.numberType || 'unknown',
          truecallerVerified: entry.access === 'PUBLIC',
        };
      }
    } catch (error) {
      console.log(`[Truecaller4] Key ...${apiKey.slice(-6)} error:`, error instanceof Error ? error.message : 'unknown');
    }
  }
  return null;
}

/**
 * Truecaller API11 — POST /v2.php (same format as api3/api13 but different provider/quota)
 * Uses the same RapidAPI key but tracked independently via provider-scoped rate limiting.
 */
async function lookupTruecallerApi11(phoneNumber: string): Promise<Partial<LivePhoneData> & {
  truecallerName?: string;
  truecallerSpamScore?: number;
  truecallerType?: string;
  truecallerVerified?: boolean;
} | null> {
  const keys = getKeyPool('primary'); // Uses same key pool but tracked as tc-api11
  if (keys.length === 0) return null;

  let number = phoneNumber;
  if (!number.startsWith('+')) {
    if (number.startsWith('0')) number = '+92' + number.slice(1);
    else number = '+' + number;
  }
  const clean = number.replace('+', '');

  const countryMap: { dial: string; iso: string }[] = [
    { dial: '92', iso: 'PK' }, { dial: '91', iso: 'IN' }, { dial: '1', iso: 'US' },
    { dial: '44', iso: 'GB' }, { dial: '971', iso: 'AE' }, { dial: '966', iso: 'SA' },
  ];
  let countryCode = 'PK';
  for (const c of countryMap) {
    if (clean.startsWith(c.dial)) { countryCode = c.iso; break; }
  }

  for (const apiKey of keys) {
    if (isKeyExhausted(apiKey, 'tc-api11')) continue;

    try {
      const formData = new URLSearchParams();
      formData.append('phone', clean);
      formData.append('countryCode', countryCode);

      const response = await fetch(
        'https://truecaller-api11.p.rapidapi.com/v2.php',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': 'truecaller-api11.p.rapidapi.com',
          },
          body: formData.toString(),
          signal: AbortSignal.timeout(10000),
        }
      );

      updateRateState(apiKey, response.headers, response.status, 'tc-api11');

      if (!response.ok) {
        console.log(`[Truecaller API11] Key ...${apiKey.slice(-6)} response not OK:`, response.status);
        continue;
      }

      const data = await response.json();
      if (data.success && data.data?.name) {
        console.log(`[Truecaller API11] Found: ${data.data.name}`);
        return {
          truecallerName: data.data.name,
          truecallerType: 'mobile',
          truecallerVerified: false,
        };
      }
    } catch (error) {
      console.log(`[Truecaller API11] Key ...${apiKey.slice(-6)} error:`, error instanceof Error ? error.message : 'unknown');
    }
  }
  return null;
}

/**
 * Truecaller API12 — POST /v2.php (same format as api3/api11/api13 but different provider/quota)
 * Uses the same RapidAPI key but tracked independently via provider-scoped rate limiting.
 */
async function lookupTruecallerApi12(phoneNumber: string): Promise<Partial<LivePhoneData> & {
  truecallerName?: string;
  truecallerSpamScore?: number;
  truecallerType?: string;
  truecallerVerified?: boolean;
} | null> {
  const keys = getKeyPool('primary'); // Uses same key pool but tracked as tc-api12
  if (keys.length === 0) return null;

  let number = phoneNumber;
  if (!number.startsWith('+')) {
    if (number.startsWith('0')) number = '+92' + number.slice(1);
    else number = '+' + number;
  }
  const clean = number.replace('+', '');

  const countryMap: { dial: string; iso: string }[] = [
    { dial: '92', iso: 'PK' }, { dial: '91', iso: 'IN' }, { dial: '1', iso: 'US' },
    { dial: '44', iso: 'GB' }, { dial: '971', iso: 'AE' }, { dial: '966', iso: 'SA' },
  ];
  let countryCode = 'PK';
  for (const c of countryMap) {
    if (clean.startsWith(c.dial)) { countryCode = c.iso; break; }
  }

  for (const apiKey of keys) {
    if (isKeyExhausted(apiKey, 'tc-api12')) continue;

    try {
      const formData = new URLSearchParams();
      formData.append('phone', clean);
      formData.append('countryCode', countryCode);

      const response = await fetch(
        'https://truecaller-api12.p.rapidapi.com/v2.php',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': 'truecaller-api12.p.rapidapi.com',
          },
          body: formData.toString(),
          signal: AbortSignal.timeout(10000),
        }
      );

      updateRateState(apiKey, response.headers, response.status, 'tc-api12');

      if (!response.ok) {
        console.log(`[Truecaller API12] Key ...${apiKey.slice(-6)} response not OK:`, response.status);
        continue;
      }

      const data = await response.json();
      if (data.success && data.data?.name) {
        console.log(`[Truecaller API12] Found: ${data.data.name}`);
        return {
          truecallerName: data.data.name,
          truecallerType: 'mobile',
          truecallerVerified: false,
        };
      }
    } catch (error) {
      console.log(`[Truecaller API12] Key ...${apiKey.slice(-6)} error:`, error instanceof Error ? error.message : 'unknown');
    }
  }
  return null;
}

/**
 * Truecaller API9 — POST /v2.php (same format as api3/api11/api12/api13 but different provider/quota)
 * Uses the same RapidAPI key but tracked independently via provider-scoped rate limiting.
 */
async function lookupTruecallerApi9(phoneNumber: string): Promise<Partial<LivePhoneData> & {
  truecallerName?: string;
  truecallerSpamScore?: number;
  truecallerType?: string;
  truecallerVerified?: boolean;
} | null> {
  const keys = getKeyPool('primary'); // Uses same key pool but tracked as tc-api9
  if (keys.length === 0) return null;

  let number = phoneNumber;
  if (!number.startsWith('+')) {
    if (number.startsWith('0')) number = '+92' + number.slice(1);
    else number = '+' + number;
  }
  const clean = number.replace('+', '');

  const countryMap: { dial: string; iso: string }[] = [
    { dial: '92', iso: 'PK' }, { dial: '91', iso: 'IN' }, { dial: '1', iso: 'US' },
    { dial: '44', iso: 'GB' }, { dial: '971', iso: 'AE' }, { dial: '966', iso: 'SA' },
  ];
  let countryCode = 'PK';
  for (const c of countryMap) {
    if (clean.startsWith(c.dial)) { countryCode = c.iso; break; }
  }

  for (const apiKey of keys) {
    if (isKeyExhausted(apiKey, 'tc-api9')) continue;

    try {
      const formData = new URLSearchParams();
      formData.append('phone', clean);
      formData.append('countryCode', countryCode);

      const response = await fetch(
        'https://truecaller-api9.p.rapidapi.com/v2.php',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': 'truecaller-api9.p.rapidapi.com',
          },
          body: formData.toString(),
          signal: AbortSignal.timeout(10000),
        }
      );

      updateRateState(apiKey, response.headers, response.status, 'tc-api9');

      if (!response.ok) {
        console.log(`[Truecaller API9] Key ...${apiKey.slice(-6)} response not OK:`, response.status);
        continue;
      }

      const data = await response.json();
      if (data.success && data.data?.name) {
        console.log(`[Truecaller API9] Found: ${data.data.name}`);
        return {
          truecallerName: data.data.name,
          truecallerType: 'mobile',
          truecallerVerified: false,
        };
      }
    } catch (error) {
      console.log(`[Truecaller API9] Key ...${apiKey.slice(-6)} error:`, error instanceof Error ? error.message : 'unknown');
    }
  }
  return null;
}

/**
 * ViewCaller — NEW active Truecaller provider on RapidAPI
 * GET /api/v1/search?code={dialCode}&number={significantNumber}
 * Get key: https://rapidapi.com/user4565456456/api/viewcaller
 */
async function lookupViewCaller(phoneNumber: string): Promise<Partial<LivePhoneData> & {
  truecallerName?: string;
  truecallerSpamScore?: number;
  truecallerType?: string;
  truecallerVerified?: boolean;
} | null> {
  const keys = getKeyPool('primary');
  if (keys.length === 0) return null;

  // Normalize number
  let number = phoneNumber;
  if (!number.startsWith('+')) {
    if (number.startsWith('0')) number = '+92' + number.slice(1);
    else number = '+' + number;
  }
  const fullDigits = number.replace('+', '');

  // Extract dialing code and significant number
  const dialCodes = ['92', '91', '1', '44', '971', '966', '86', '61', '49', '33', '81', '90'];
  let dialCode = '92';
  let significant = fullDigits.slice(2);
  for (const dc of dialCodes) {
    if (fullDigits.startsWith(dc)) {
      dialCode = dc;
      significant = fullDigits.slice(dc.length);
      break;
    }
  }

  for (const apiKey of keys) {
    if (isKeyExhausted(apiKey, 'viewcaller')) continue;

    try {
      const response = await fetch(
        `https://viewcaller.p.rapidapi.com/api/v1/search?code=${dialCode}&number=${significant}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': 'viewcaller.p.rapidapi.com',
          },
          signal: AbortSignal.timeout(10000),
        }
      );

      updateRateState(apiKey, response.headers, response.status, 'viewcaller');

      if (!response.ok) {
        console.log(`[ViewCaller] Key ...${apiKey.slice(-6)} response not OK:`, response.status);
        continue;
      }

      const data = await response.json();
      console.log('[ViewCaller] Raw response:', JSON.stringify(data).substring(0, 500));

      if (!data.status || !Array.isArray(data.data) || data.data.length === 0) {
        console.log(`[ViewCaller] Key ...${apiKey.slice(-6)}: No data found`);
        continue;
      }

      const entry = data.data[0];
      const name = entry.name || undefined;
      const spamScore = entry.spamCounter ?? 0;
      const isSpam = entry.spam === true;

      if (!name && spamScore === 0) {
        console.log(`[ViewCaller] Key ...${apiKey.slice(-6)}: No name or spam`);
        continue;
      }

      console.log(`[ViewCaller] Parsed - Name: ${name}, Spam: ${spamScore}, isSpam: ${isSpam}`);

      return {
        truecallerName: name,
        truecallerSpamScore: spamScore,
        truecallerType: 'mobile',
        truecallerVerified: false,
        source: 'ViewCaller',
      };
    } catch (error) {
      console.log(`[ViewCaller] Key ...${apiKey.slice(-6)} error:`, error instanceof Error ? error.message : 'unknown');
    }
  }
  return null;
}

/**
 * Smart Truecaller cascade with cache + multi-key + multi-endpoint fallback.
 * Cache → ViewCaller (NEW) → Direct → Primary → Backup → Tertiary → API3 → API4 → API11 → API12 → API9 → Eyecon
 */
async function lookupTruecallerWithCache(phoneNumber: string): Promise<Partial<LivePhoneData> & {
  truecallerName?: string;
  truecallerSpamScore?: number;
  truecallerType?: string;
  truecallerVerified?: boolean;
} | null> {
  // Normalize the number for cache key
  let normalized = phoneNumber;
  if (!normalized.startsWith('+')) {
    if (normalized.startsWith('0')) normalized = '+92' + normalized.slice(1);
    else normalized = '+' + normalized;
  }
  const cacheKey = normalized.replace('+', '');

  // Check cache first
  const cached = truecallerCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    console.log(`[Truecaller Cache] Hit for ${cacheKey} (age: ${Math.round((Date.now() - cached.timestamp) / 1000)}s)`);
    return cached.result;
  }
  if (cached) truecallerCache.delete(cacheKey); // expired

  // Cascade: ViewCaller (NEW, active) → Direct → Primary → Backup → Tertiary → API3 → API4 → API11 → API12 → API9 → Eyecon
  const result = await lookupViewCaller(phoneNumber)
    ?? await lookupTruecallerDirect(phoneNumber)
    ?? await lookupTruecaller(phoneNumber)
    ?? await lookupTruecallerBackup(phoneNumber)
    ?? await lookupTruecallerTertiary(phoneNumber)
    ?? await lookupTruecallerApi3(phoneNumber)
    ?? await lookupTruecaller4(phoneNumber)
    ?? await lookupTruecallerApi11(phoneNumber)
    ?? await lookupTruecallerApi12(phoneNumber)
    ?? await lookupTruecallerApi9(phoneNumber)
    ?? await lookupEyecon(phoneNumber);

  // Cache successful results (don't cache nulls — retry next time)
  if (result) {
    truecallerCache.set(cacheKey, { result, timestamp: Date.now() });
    console.log(`[Truecaller Cache] Stored result for ${cacheKey}`);
  }

  return result;
}

/**
 * Eyecon Caller ID lookup — completely different database from Truecaller.
 * Uses RapidAPI Eyecon API for phone reverse lookup (name + social profiles).
 * Eyecon: GET /api/v1/search?number={significant}&code={dialingCode} (Search Contact)
 * Eyecon Social: GET /search?phone={fullDigitsWithCountryCode} (Get Phone Details)
 * Get key: https://rapidapi.com/datacrawler/api/eyecon
 * Supports comma-separated multi-key pool: EYECON_API_KEY="key1,key2"
 */
async function lookupEyecon(phoneNumber: string): Promise<Partial<LivePhoneData> & {
  truecallerName?: string;
  truecallerSpamScore?: number;
  truecallerType?: string;
  truecallerVerified?: boolean;
} | null> {
  const rawKeys = process.env.EYECON_API_KEY;
  if (!rawKeys) return null;
  const keys = rawKeys.split(',').map(k => k.trim()).filter(Boolean);
  if (keys.length === 0) return null;

  // Normalize number
  let number = phoneNumber;
  if (!number.startsWith('+')) {
    if (number.startsWith('0')) number = '+92' + number.slice(1);
    else number = '+' + number;
  }
  const fullDigits = number.replace('+', ''); // e.g. 923306866513

  // Extract dialing code and significant number
  const dialCodes = ['92', '91', '1', '44', '971', '966', '86', '61'];
  let dialCode = '92';
  let significant = fullDigits.slice(2);
  for (const dc of dialCodes) {
    if (fullDigits.startsWith(dc)) {
      dialCode = dc;
      significant = fullDigits.slice(dc.length);
      break;
    }
  }

  // --- Eyecon Primary: Search Contact endpoint ---
  for (const apiKey of keys) {
    if (isKeyExhausted(apiKey, 'eyecon')) {
      console.log(`[Eyecon] Skipping exhausted key ...${apiKey.slice(-6)}`);
      continue;
    }

    try {
      const response = await fetch(
        `https://eyecon.p.rapidapi.com/api/v1/search?number=${encodeURIComponent(significant)}&code=${encodeURIComponent(dialCode)}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': 'eyecon.p.rapidapi.com',
          },
          signal: AbortSignal.timeout(8000),
        }
      );

      updateRateState(apiKey, response.headers, response.status, 'eyecon');

      if (!response.ok) {
        console.log(`[Eyecon] Key ...${apiKey.slice(-6)} response not OK:`, response.status);
        continue;
      }

      const data = await response.json();
      console.log('[Eyecon] Raw response:', JSON.stringify(data).substring(0, 500));

      // Parse Eyecon response: { status: true, data: { fullName, image, b64 } }
      const resultData = data.data || data;
      const name = resultData.fullName || resultData.name || resultData.displayName || resultData.callerName || undefined;
      const isVerified = resultData.verified === true || resultData.isVerified === true || false;

      if (!name) {
        console.log(`[Eyecon] Key ...${apiKey.slice(-6)}: No name found`);
        continue;
      }

      console.log('[Eyecon] Parsed - Name:', name, 'Verified:', isVerified);

      return {
        truecallerName: name,
        truecallerSpamScore: 0, // Eyecon doesn't provide spam score
        truecallerType: undefined,
        truecallerVerified: isVerified,
        source: 'Eyecon',
      };
    } catch (error) {
      console.error(`[Eyecon] Key ...${apiKey.slice(-6)} Error:`, error instanceof Error ? error.message : 'Unknown');
      continue;
    }
  }

  // --- Eyecon Social: Get Phone Details endpoint ---
  const socialKeys = (process.env.EYECON_SOCIAL_API_KEY || '').split(',').map(k => k.trim()).filter(Boolean);
  for (const apiKey of socialKeys) {
    if (isKeyExhausted(apiKey, 'eyecon-social')) continue;

    try {
      const response = await fetch(
        `https://caller-id-social-search-eyecon.p.rapidapi.com/search?phone=${encodeURIComponent(fullDigits)}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': 'caller-id-social-search-eyecon.p.rapidapi.com',
          },
          signal: AbortSignal.timeout(8000),
        }
      );

      updateRateState(apiKey, response.headers, response.status, 'eyecon-social');

      if (!response.ok) {
        console.log(`[Eyecon Social] Key ...${apiKey.slice(-6)} response not OK:`, response.status);
        continue;
      }

      const data = await response.json();
      console.log('[Eyecon Social] Raw response:', JSON.stringify(data).substring(0, 500));

      // Parse Eyecon Social response: { status: "success", data: { name, type, fb: { image_url, profile_url } } }
      const resultData = data.data || data;
      const name = resultData.name || resultData.fullName || resultData.displayName || resultData.callerName || undefined;

      if (name) {
        console.log('[Eyecon Social] Parsed - Name:', name);
        return {
          truecallerName: name,
          truecallerSpamScore: 0,
          truecallerType: undefined,
          truecallerVerified: false,
          source: 'Eyecon (social)',
        };
      }
    } catch (error) {
      console.error(`[Eyecon Social] Key ...${apiKey.slice(-6)} Error:`, error instanceof Error ? error.message : 'Unknown');
      continue;
    }
  }

  return null;
}

/**
 * Tertiary Truecaller lookup — uses TRUECALLER_TERTIARY_API_KEY on dedicated endpoints.
 * Last resort before giving up on owner lookup.
 */
async function lookupTruecallerTertiary(phoneNumber: string): Promise<Partial<LivePhoneData> & {
  truecallerName?: string;
  truecallerSpamScore?: number;
  truecallerType?: string;
  truecallerVerified?: boolean;
} | null> {
  const keys = getKeyPool('tertiary');
  if (keys.length === 0) return null;

  let number = phoneNumber;
  if (!number.startsWith('+')) {
    if (number.startsWith('0')) number = '+92' + number.slice(1);
    else number = '+' + number;
  }
  const cleanNumber = number.replace('+', '');

  for (const apiKey of keys) {
    if (isKeyExhausted(apiKey, 'tc-tertiary')) continue;

    // Try data2 endpoint with tertiary key
    try {
      const response = await fetch(
        `https://truecaller-data2.p.rapidapi.com/search/${cleanNumber}`,
        {
          headers: {
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': 'truecaller-data2.p.rapidapi.com',
          },
          signal: AbortSignal.timeout(8000),
        }
      );
      updateRateState(apiKey, response.headers, response.status, 'tc-tertiary');

      if (response.ok) {
        const data = await response.json();
        const resultData = data.data || data;
        const name = resultData.basicInfo?.name?.fullName || resultData.name || resultData.displayName || undefined;
        const spamScore = resultData.phoneInfo?.spamScore ?? resultData.spamInfo?.spamScore ?? resultData.spamScore ?? 0;
        const numberType = resultData.phoneInfo?.numberType || resultData.numberType || resultData.type || undefined;
        const isVerified = resultData.verified === true || resultData.isVerified === true || false;

        if (name || spamScore > 0) {
          console.log(`[Truecaller Tertiary] data2 Key ...${apiKey.slice(-6)} hit - Name:`, name, 'Spam:', spamScore);
          return {
            truecallerName: name,
            truecallerSpamScore: spamScore,
            truecallerType: numberType,
            truecallerVerified: isVerified,
            source: 'Truecaller (tertiary)',
          };
        }
      }
    } catch { /* continue */ }

    // Try v15/v46 endpoints with tertiary key
    const v15Result = await lookupTruecallerBackupV15(cleanNumber, apiKey);
    if (v15Result) return v15Result;
  }
  return null;
}

export async function lookupPhoneRealtime(phoneNumber: string): Promise<LivePhoneData | null> {
  const abstractResult = await lookupAbstractAPI(phoneNumber);
  if (abstractResult && abstractResult.isValid !== undefined) {
    const [whatsapp, truecallerResult] = await Promise.all([
      checkWhatsApp(phoneNumber),
      lookupTruecallerWithCache(phoneNumber),
    ]);
    return {
      isValid: abstractResult.isValid ?? false,
      lineType: abstractResult.lineType || 'unknown',
      carrier: abstractResult.carrier || 'Unknown',
      location: abstractResult.location || 'Unknown',
      country: abstractResult.country || 'Unknown',
      countryCode: abstractResult.countryCode || '',
      isRegistered: abstractResult.isRegistered ?? false,
      isRoaming: abstractResult.isRoaming ?? false,
      isWhatsApp: whatsapp,
      isVoIP: abstractResult.lineType === 'voip' || abstractResult.lineType === 'virtual',
      source: 'Abstract API',
      truecallerName: truecallerResult?.truecallerName,
      truecallerSpamScore: truecallerResult?.truecallerSpamScore,
      truecallerType: truecallerResult?.truecallerType,
      truecallerVerified: truecallerResult?.truecallerVerified,
    };
  }

  const numverifyResult = await lookupNumverify(phoneNumber);
  if (numverifyResult && numverifyResult.isValid !== undefined) {
    const [whatsapp, truecallerResult] = await Promise.all([
      checkWhatsApp(phoneNumber),
      lookupTruecallerWithCache(phoneNumber),
    ]);
    return {
      isValid: numverifyResult.isValid ?? false,
      lineType: numverifyResult.lineType || 'unknown',
      carrier: numverifyResult.carrier || 'Unknown',
      location: numverifyResult.location || 'Unknown',
      country: numverifyResult.country || 'Unknown',
      countryCode: numverifyResult.countryCode || '',
      isRegistered: numverifyResult.isRegistered ?? false,
      isRoaming: false,
      isWhatsApp: whatsapp,
      isVoIP: numverifyResult.lineType === 'voip' || numverifyResult.lineType === 'virtual',
      source: 'Numverify',
      truecallerName: truecallerResult?.truecallerName,
      truecallerSpamScore: truecallerResult?.truecallerSpamScore,
      truecallerType: truecallerResult?.truecallerType,
      truecallerVerified: truecallerResult?.truecallerVerified,
    };
  }

  // Even if Abstract/Numverify fail, try Truecaller cascade alone (works for landlines too)
  const truecallerOnly = await lookupTruecallerWithCache(phoneNumber);
  if (truecallerOnly && truecallerOnly.truecallerName) {
    return {
      isValid: true,
      lineType: truecallerOnly.truecallerType || 'unknown',
      carrier: 'Unknown',
      location: 'Unknown',
      country: 'Unknown',
      countryCode: '',
      isRegistered: true,
      isRoaming: false,
      isWhatsApp: false,
      isVoIP: false,
      source: truecallerOnly.source || 'Truecaller',
      truecallerName: truecallerOnly.truecallerName,
      truecallerSpamScore: truecallerOnly.truecallerSpamScore,
      truecallerType: truecallerOnly.truecallerType,
      truecallerVerified: truecallerOnly.truecallerVerified,
    };
  }

  return null;
}
