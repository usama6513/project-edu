/**
 * AI Fraud Classifier — uses AI (Groq/Gemini) as the sole judge for fraud detection.
 * No regex, no keyword matching. AI analyzes content + evidence and returns a verdict.
 */

import { getAIProvider, getFallbackProvider } from '@/services/ai';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AIFraudIndicator {
  type: string;
  description: string;
  descriptionUrdu: string;
  descriptionRomanUrdu: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  evidence: string;
}

export interface AIFraudVerdict {
  isScam: boolean;
  confidence: number;
  scamType: string;
  scamTypeUrdu: string;
  scamTypeRomanUrdu: string;
  riskScore: number;
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  indicators: AIFraudIndicator[];
  explanation: string;
  explanationUrdu: string;
  explanationRomanUrdu: string;
  recommendedActions: string[];
  recommendedActionsUrdu: string[];
  recommendedActionsRomanUrdu: string[];
}

export type ScanContentType = 'text' | 'sms' | 'email' | 'url' | 'phone';

export interface ClassificationInput {
  contentType: ScanContentType;
  content: string;
  /** Additional evidence collected from real checks (DNS, SSL, APIs, etc.) */
  evidence?: Record<string, unknown>;
}

// ─── Valid scam types (AI must pick one of these) ────────────────────────────

const VALID_SCAM_TYPES = [
  'Not a Scam',
  'Bank/Wallet Phishing',
  'Investment Scam',
  'Job Scam',
  'Prize/Lottery Scam',
  'Gambling',
  'SMS/Text Scam',
  'Romance Scam',
  'Crypto Scam',
  'Social Media Scam',
  'Generic Scam',
  'Account Hacking',
  'Identity Theft',
  'Online Shopping Scam',
  'Online Harassment',
  'Sextortion',
  'Fake Loan App',
  'Tech Support Scam',
  'QR Code Fraud',
  'Charity/Donation Scam',
  'Fake Visa/Immigration Fraud',
  'Rental/Housing Scam',
  'SIM Swap Fraud',
  'Freelancing/Escrow Scam',
  'Ponzi/Pyramid Scheme',
  'Fake Educational Institution',
  'ATM/Card Skimming',
  'Fake Government Document',
  'Insurance Fraud',
  'Utility Bill Scam',
  'Fake Matrimonial Scam',
  'Extortion Call',
  'Fake Health/Medicine Scam',
  'Work From Home Task Scam',
  'Fake Courier/Delivery Scam',
  'Hajj/Umrah Travel Scam',
  'Digital Payment Fraud',
  'Fake Solar Panel Scam',
  'Vehicle Sale Scam',
  'Event/Trending Scam',
  'AI Voice/Deepfake Scam',
  'Fake Online Store Scam',
  'Overseas Employment/Visa Consultancy Scam',
  'Fake Scholarship Scam',
  'Fake Banking App Scam',
];

// ─── System Prompt ───────────────────────────────────────────────────────────

const FRAUD_ANALYST_PROMPT = `You are EduGuard FraudGuard — an expert fraud analyst AI for Pakistan. Your job is to analyze content (SMS, email, text, URL data, or phone number data) and determine whether it is a SCAM or LEGITIMATE.

## CRITICAL RULES — Follow These Exactly:

1. **BE FAIR AND ACCURATE**: Legitimate messages from banks, universities, government, telecom companies are NOT scams — even if they contain words like "OTP", "password", "fee", "payment", "account", "verify". Context matters enormously.

2. **LEGITIMATE sources include**:
   - Messages from recognized banks (HBL, UBL, Meezan, Allied, etc.) about YOUR account
   - University admission/fee messages (NUST, LUMS, UET, etc.)
   - Government schemes (BISP, Ehsaas, PM programs) from official numbers
   - Telecom company messages (Jazz, Zong, Telenor, Ufone) about balance/packages
   - Official payment reminders from utility companies (WAPDA, SSGC, K-Electric)
   - Legitimate e-commerce order confirmations (Daraz, Foodpanda)

3. **SCAM indicators include**:
   - Unsolicited messages asking YOU to send OTP/password/CVV to someone
   - Urgency + threat ("account will be BLOCKED", "police case") combined with suspicious links
   - Requests to transfer money to "verify" or "unlock" your account
   - Fake websites impersonating banks (hbl-verify.xyz, not hbl.com.pk)
   - Prize/lottery wins you never entered
   - Job offers asking for registration fees
   - Numbers with high spam reports on Truecaller
   - Newly registered domains pretending to be known brands

4. **When in doubt for LEGITIMATE-LOOKING content, lean towards SAFE**. It is better to miss a scam than to falsely accuse a legitimate message. Only flag as scam when there is CLEAR fraudulent intent.

5. **PHONE-NUMBER-SPECIFIC STRICT RULES — These OVERRIDE the "lean towards safe" rule for phone numbers**:
   - If Truecaller spam score is 50+, this number is a CONFIRMED scammer. Set riskScore=70-85, riskLevel="high" or "critical".
   - If Truecaller spam score is 20-49, this number has moderate spam reports. Set riskScore=45-60, riskLevel="medium".
   - If the number is a VoIP/virtual number, it is commonly used in scams. Set riskScore=40-55 minimum.
   - If the number format is INVALID (does not match country format), this is suspicious — scammers use fake numbers. Set riskScore=35-45 minimum.
   - A phone number with NO live data and NO Truecaller presence is NOT "safe" — it is UNVERIFIED. Set riskScore=20-30 minimum (not 0-5).
   - If a number is identified as premium rate, it may be a scam toll scheme. Set riskScore=50+ minimum.
   - Never give a phone number a score below 15 unless it has verified live data AND low Truecaller spam score.

6. **URL-SPECIFIC STRICT RULES — These OVERRIDE the "lean towards safe" rule for URLs**:
   - If DNS records show DOMAIN_NOT_FOUND or DOMAIN_UNREACHABLE **AND** the domain name contains/mimics a known brand (e.g., "dukihble" contains "hbl"), this is a **CONFIRMED phishing domain**. Set riskScore=80-90, riskLevel="critical".
   - If the domain mimics a bank brand (HBL, UBL, MCB, NBP, etc.) and the domain does not resolve in DNS, this is a **brand impersonation phishing domain** — ALWAYS score 80+.
   - An empty page on a non-existent domain that mimics a brand is NOT "low risk" — it is a placeholder phishing domain. Score it HIGH (70+).
   - Never give a score below 60 when DNS fails AND the domain name resembles a financial institution.
   - **GENERAL FAKE URL RULE**: If a domain does not exist in DNS (DOMAIN_NOT_FOUND) OR the page is unreachable AND the page is empty, this is highly suspicious. Score it 55+ minimum.
   - Multiple critical indicators (2+) = score 65+ minimum.
   - A URL with critical DNS failure + empty page + HTTP (no HTTPS) = score 65+.

7. **You MUST respond with valid JSON only** — no markdown, no explanation outside JSON.

## Response Format (valid JSON):

{
  "isScam": false,
  "confidence": 85,
  "scamType": "Not a Scam",
  "scamTypeUrdu": "کوئی اسکیم نہیں",
  "scamTypeRomanUrdu": "Not a Scam",
  "riskScore": 5,
  "riskLevel": "safe",
  "indicators": [
    {
      "type": "INDICATOR_TYPE",
      "description": "English description of what was found",
      "descriptionUrdu": "اردو میں تفصیل",
      "descriptionRomanUrdu": "Roman Urdu description",
      "severity": "low",
      "evidence": "Specific evidence from the content"
    }
  ],
  "explanation": "Detailed English explanation of why this is or is not a scam",
  "explanationUrdu": "اردو میں تفصیلی وضاحت",
  "explanationRomanUrdu": "Roman Urdu mein tafseeli wazahat",
  "recommendedActions": ["Action 1", "Action 2"],
  "recommendedActionsUrdu": ["عمل ۱", "عمل ۲"],
  "recommendedActionsRomanUrdu": ["Action 1 Roman Urdu", "Action 2 Roman Urdu"]
}

## Valid scamType values (pick exactly one):
${VALID_SCAM_TYPES.map(t => `  - "${t}"`).join('\n')}

## riskLevel mapping:
  - riskScore 0-19 → "safe"
  - riskScore 20-39 → "low"
  - riskScore 40-59 → "medium"
  - riskScore 60-79 → "high"
  - riskScore 80-100 → "critical"

## Important:
- If the content is clearly legitimate, set isScam=false, riskScore=0-10, scamType="Not a Scam"
- indicators array can be empty if nothing suspicious found
- Always provide all three languages (English, Urdu, Roman Urdu)
- Be specific in evidence — quote the actual suspicious text
- If analyzing a URL with real DNS/SSL/VirusTotal data, base your judgment on THAT data, not assumptions`;

// ─── Classifier Function ─────────────────────────────────────────────────────

/**
 * Classifies content as scam or legitimate using AI.
 * This is the sole classification mechanism — no regex, no keyword matching.
 */
export async function classifyWithAI(input: ClassificationInput): Promise<AIFraudVerdict> {
  const userMessage = buildUserMessage(input);

  let response: string | null = null;

  // Try primary provider (Groq)
  try {
    const provider = getAIProvider();
    const result = await provider.complete({
      messages: [{ role: 'user', content: userMessage }],
      systemPrompt: FRAUD_ANALYST_PROMPT,
      temperature: 0.1, // Low temperature for consistent classification
      maxTokens: 2000,
    });
    response = result.content;
  } catch (err) {
    console.error('[AI Classifier] Primary provider failed:', err);
  }

  // Try fallback provider (Gemini)
  if (!response) {
    try {
      const fallback = getFallbackProvider();
      if (fallback) {
        const result = await fallback.complete({
          messages: [{ role: 'user', content: userMessage }],
          systemPrompt: FRAUD_ANALYST_PROMPT,
          temperature: 0.1,
          maxTokens: 2000,
        });
        response = result.content;
      }
    } catch (err) {
      console.error('[AI Classifier] Fallback provider failed:', err);
    }
  }

  // If all AI providers failed, return a safe default
  if (!response) {
    return getSafeDefaultVerdict(input);
  }

  // Parse AI response
  return parseAIResponse(response, input);
}

// ─── Build User Message ──────────────────────────────────────────────────────

function buildUserMessage(input: ClassificationInput): string {
  const parts: string[] = [];

  parts.push(`## Content Type: ${input.contentType.toUpperCase()}`);
  parts.push('');

  if (input.contentType === 'url') {
    parts.push(`## URL to Analyze: ${input.content}`);
  } else if (input.contentType === 'phone') {
    parts.push(`## Phone Number to Analyze: ${input.content}`);
  } else {
    parts.push(`## Message to Analyze:`);
    parts.push(input.content);
  }

  if (input.evidence && Object.keys(input.evidence).length > 0) {
    parts.push('');
    parts.push('## Evidence from Real Network Checks:');
    parts.push('```json');
    parts.push(JSON.stringify(input.evidence, null, 2));
    parts.push('```');
  }

  parts.push('');
  parts.push('Analyze this content and determine if it is a scam. Respond with valid JSON only.');

  return parts.join('\n');
}

// ─── Parse AI Response ───────────────────────────────────────────────────────

function parseAIResponse(response: string, input: ClassificationInput): AIFraudVerdict {
  try {
    // Strip markdown code blocks if present
    let cleaned = response.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3);
    }
    cleaned = cleaned.trim();

    const parsed = JSON.parse(cleaned);

    // Validate and normalize
    const verdict: AIFraudVerdict = {
      isScam: typeof parsed.isScam === 'boolean' ? parsed.isScam : false,
      confidence: clampNumber(parsed.confidence, 0, 100),
      scamType: validateScamType(parsed.scamType),
      scamTypeUrdu: parsed.scamTypeUrdu || parsed.scamType || 'نامعلوم',
      scamTypeRomanUrdu: parsed.scamTypeRomanUrdu || parsed.scamType || 'Unknown',
      riskScore: clampNumber(parsed.riskScore, 0, 100),
      riskLevel: mapRiskLevel(clampNumber(parsed.riskScore, 0, 100)),
      indicators: Array.isArray(parsed.indicators) ? parsed.indicators.map(normalizeIndicator) : [],
      explanation: parsed.explanation || 'Analysis completed.',
      explanationUrdu: parsed.explanationUrdu || parsed.explanation || 'تجزیہ مکمل ہوا۔',
      explanationRomanUrdu: parsed.explanationRomanUrdu || parsed.explanation || 'Analysis completed.',
      recommendedActions: Array.isArray(parsed.recommendedActions) ? parsed.recommendedActions : [],
      recommendedActionsUrdu: Array.isArray(parsed.recommendedActionsUrdu) ? parsed.recommendedActionsUrdu : [],
      recommendedActionsRomanUrdu: Array.isArray(parsed.recommendedActionsRomanUrdu) ? parsed.recommendedActionsRomanUrdu : [],
    };

    return verdict;
  } catch (err) {
    console.error('[AI Classifier] Failed to parse AI response:', err);
    console.error('[AI Classifier] Raw response:', response.substring(0, 500));
    return getSafeDefaultVerdict(input);
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeIndicator(ind: unknown): AIFraudIndicator {
  if (!ind || typeof ind !== 'object') {
    return {
      type: 'UNKNOWN',
      description: 'Unknown indicator',
      descriptionUrdu: 'نامعلوم اشارہ',
      descriptionRomanUrdu: 'Unknown indicator',
      severity: 'low',
      evidence: '',
    };
  }
  const obj = ind as Record<string, unknown>;
  return {
    type: String(obj.type || 'UNKNOWN'),
    description: String(obj.description || ''),
    descriptionUrdu: String(obj.descriptionUrdu || obj.description || ''),
    descriptionRomanUrdu: String(obj.descriptionRomanUrdu || obj.description || ''),
    severity: ['low', 'medium', 'high', 'critical'].includes(String(obj.severity))
      ? (obj.severity as AIFraudIndicator['severity'])
      : 'low',
    evidence: String(obj.evidence || ''),
  };
}

function validateScamType(type: unknown): string {
  if (!type || typeof type !== 'string') return 'Generic Scam';
  // Check if it matches one of our valid types (case-insensitive)
  const normalized = type.trim();
  const match = VALID_SCAM_TYPES.find(
    (vt) => vt.toLowerCase() === normalized.toLowerCase()
  );
  return match || 'Generic Scam';
}

function clampNumber(value: unknown, min: number, max: number): number {
  const num = typeof value === 'number' ? value : parseInt(String(value), 10);
  if (isNaN(num)) return min;
  return Math.max(min, Math.min(max, num));
}

function mapRiskLevel(score: number): AIFraudVerdict['riskLevel'] {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  if (score >= 20) return 'low';
  return 'safe';
}

/**
 * Returns a safe default verdict when AI is unavailable.
 * Does NOT accuse — tells user to exercise caution and verify manually.
 */
function getSafeDefaultVerdict(_input: ClassificationInput): AIFraudVerdict {
  return {
    isScam: false,
    confidence: 0,
    scamType: 'Not a Scam',
    scamTypeUrdu: 'کوئی اسکیم نہیں',
    scamTypeRomanUrdu: 'Not a Scam',
    riskScore: 0,
    riskLevel: 'safe',
    indicators: [],
    explanation: 'AI analysis service is temporarily unavailable. Unable to determine if this content is safe or suspicious. Please verify manually through official channels.',
    explanationUrdu: 'اے آئی تجزیہ سروس عارضی طور پر دستیاب نہیں ہے۔ براہ کرم سرکاری ذرائع سے تصدیق کریں۔',
    explanationRomanUrdu: 'AI analysis service temporarily unavailable. Please verify through official channels.',
    recommendedActions: [
      'AI analysis is currently unavailable',
      'Verify this content through official channels manually',
      'Do not share OTP, password, or CNIC with anyone',
      'If unsure, contact the organization directly using their official number',
    ],
    recommendedActionsUrdu: [
      'اے آئی تجزیہ فی الحال دستیاب نہیں ہے',
      'اس مواد کی تصدیق سرکاری ذرائع سے خود کریں',
      'OTP، پاسورڈ یا CNIC کسی کے ساتھ شیئر نہ کریں',
      'اگر شک ہو تو تنظیم سے ان کے سرکاری نمبر پر رابطہ کریں',
    ],
    recommendedActionsRomanUrdu: [
      'AI analysis currently unavailable',
      'Verify this content through official channels manually',
      'Do not share OTP, password, or CNIC with anyone',
      'If unsure, contact the organization directly using their official number',
    ],
  };
}
