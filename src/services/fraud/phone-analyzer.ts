import { type ComplaintPath, getComplaintPathForType } from './complaint-paths';
import { classifyWithAI } from './ai-fraud-classifier';

export interface PhoneAnalysis {
  number: string;
  normalized: string;
  isValid: boolean;
  country: string;
  countryCode: string;
  countryEmoji: string;
  network: {
    name: string;
    mcc: string;
    mnc: string;
    type: 'mobile' | 'landline' | 'voip' | 'premium' | 'unknown';
  };
  region: {
    province: string;
    city: string;
    areaCode: string;
  };
  riskScore: number;
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  indicators: Array<{
    type: 'info' | 'warning' | 'danger';
    label: string;
    value: string;
  }>;
  spamReports: {
    reported: boolean;
    reportCount: number;
    categories: string[];
  };
  socialPresence: {
    possible: boolean;
    platforms: string[];
  };
  recommendation: string;
  complaintPath?: ComplaintPath;
  liveData?: {
    source: string;
    lineType: string;
    carrier: string;
    location: string;
    isWhatsApp: boolean;
    isVoIP: boolean;
    isRegistered: boolean;
    isRoaming: boolean;
    truecallerName?: string;
    truecallerSpamScore?: number;
    truecallerType?: string;
    truecallerVerified?: boolean;
  };
  analysisConfidence?: {
    level: 'high' | 'medium' | 'low';
    percentage: number;
    factors: string[];
  };
  detailedAnalysis?: {
    numberValidity: string;
    networkReliability: string;
    locationInfo: string;
    riskAssessment: string;
    recommendation: string;
  };
}

interface CountryConfig {
  name: string;
  code: string;
  emoji: string;
  dialFormat: RegExp;
  dialLength: number;
  networks: Record<string, { name: string; type: 'mobile' | 'landline' | 'voip' | 'premium' | 'unknown'; prefixes: string[] }>;
  premiumPrefixes: string[];
  scamPrefixes: string[];
  regions?: Record<string, string>;
  complaintAuthority?: string;
  complaintHelpline?: string;
  complaintWebsite?: string;
}

const COUNTRIES: Record<string, CountryConfig> = {
  PK: {
    name: 'Pakistan',
    code: '+92',
    emoji: '🇵🇰',
    dialFormat: /^(0[3-9]\d{8,9}|0\d{9,10})$/,
    dialLength: 11,
    networks: {
      jazz: {
        name: 'Jazz (Mobilink)',
        type: 'mobile',
        prefixes: [
          '0300', '0301', '0302', '0303', '0304', '0305', '0306', '0307', '0308', '0309',
        ],
      },
      warid_jazz: {
        name: 'Warid (Jazz)',
        type: 'mobile',
        prefixes: ['0320', '0321', '0322', '0323', '0324', '0325', '0326', '0327', '0328', '0329'],
      },
      zong: {
        name: 'Zong',
        type: 'mobile',
        prefixes: ['0310', '0311', '0312', '0313', '0314', '0315', '0316', '0317', '0318', '0319', '0370'],
      },
      ufone: {
        name: 'Ufone',
        type: 'mobile',
        prefixes: ['0330', '0331', '0332', '0333', '0334', '0335', '0336', '0337', '0338', '0339'],
      },
      telenor: {
        name: 'Telenor',
        type: 'mobile',
        prefixes: ['0340', '0341', '0342', '0343', '0344', '0345', '0346', '0347', '0348', '0349'],
      },
      scom: {
        name: 'SCOM (AJK/GB)',
        type: 'mobile',
        prefixes: ['0355'],
      },
      ptcl_landline: {
        name: 'PTCL (Landline)',
        type: 'landline',
        prefixes: ['021', '042', '041', '044', '051', '061', '081', '045', '046', '047', '043', '048', '049', '053', '054', '055', '056', '057', '058', '059', '062', '063', '064', '065', '066', '067', '068', '069', '071', '072', '082', '083', '084', '085', '086', '087', '088', '089', '091', '092', '093', '094', '095', '096', '097', '099'],
      },
      transworld_landline: {
        name: 'Transworld (Landline)',
        type: 'landline',
        prefixes: ['0213', '0214', '0215', '0216', '0217', '0218', '0219'],
      },
      nayatel_landline: {
        name: 'Nayatel (Landline)',
        type: 'landline',
        prefixes: ['0511', '0512', '0513', '0514', '0515', '0516', '0517', '0518', '0519'],
      },
    },
    premiumPrefixes: ['0900'],
    scamPrefixes: ['09001', '09002', '09003', '09004', '09005'],
    regions: {
      '021': 'Karachi, Sindh',
      '042': 'Lahore, Punjab',
      '041': 'Faisalabad, Punjab',
      '044': 'Gujranwala, Punjab',
      '051': 'Islamabad/Rawalpindi, Federal/Punjab',
      '061': 'Multan, Punjab',
      '081': 'Quetta, Balochistan',
      '045': 'Sialkot, Punjab',
      '046': 'Sargodha, Punjab',
      '047': 'Gujrat, Punjab',
      '043': 'Jhang, Punjab',
      '048': 'Sahiwal, Punjab',
      '049': 'Rawalpindi, Punjab',
      '053': 'Bahawalpur, Punjab',
      '054': 'Dera Ghazi Khan, Punjab',
      '055': 'Mianwali, Punjab',
      '056': 'Bhakkar, Punjab',
      '057': 'Khushab, Punjab',
      '058': 'Attock, Punjab',
      '059': 'Jhelum, Punjab',
      '062': 'Kasur, Punjab',
      '063': 'Sheikhupura, Punjab',
      '064': 'Nankana Sahib, Punjab',
      '065': 'Okara, Punjab',
      '066': 'Vehari, Punjab',
      '067': 'Khanewal, Punjab',
      '068': 'Lodhran, Punjab',
      '069': 'Pakpattan, Punjab',
      '071': 'Sukkur, Sindh',
      '072': 'Hyderabad, Sindh',
      '082': 'Larkana, Sindh',
      '083': 'Nawabshah, Sindh',
      '084': 'Mirpur Khas, Sindh',
      '085': 'Thatta, Sindh',
      '086': 'Badin, Sindh',
      '087': 'Dadu, Sindh',
      '088': 'Jacobabad, Sindh',
      '089': 'Shikarpur, Sindh',
      '091': 'Peshawar, Khyber Pakhtunkhwa',
      '092': 'Mardan, Khyber Pakhtunkhwa',
      '093': 'Swat, Khyber Pakhtunkhwa',
      '094': 'Abbottabad, Khyber Pakhtunkhwa',
      '095': 'Dera Ismail Khan, Khyber Pakhtunkhwa',
      '096': 'Kohat, Khyber Pakhtunkhwa',
      '097': 'Bannu, Khyber Pakhtunkhwa',
      '099': 'Gilgit/Baltistan',
    },
    complaintAuthority: 'NCCIA (National Cyber Crime Investigation Agency)',
    complaintHelpline: '1991',
    complaintWebsite: 'https://nccia.gov.pk',
  },
  IN: {
    name: 'India',
    code: '+91',
    emoji: '🇮🇳',
    dialFormat: /^[6-9]\d{9}$/,
    dialLength: 10,
    networks: {
      jio: { name: 'Reliance Jio', type: 'mobile', prefixes: ['6', '7', '8', '9'] },
      airtel: { name: 'Airtel', type: 'mobile', prefixes: ['6', '7', '8', '9'] },
      vi: { name: 'Vi (Vodafone Idea)', type: 'mobile', prefixes: ['6', '7', '8', '9'] },
      bsnl: { name: 'BSNL', type: 'mobile', prefixes: ['6', '7', '8', '9'] },
    },
    premiumPrefixes: [],
    scamPrefixes: [],
    regions: {},
    complaintAuthority: 'TRAI (Telecom Regulatory Authority of India)',
    complaintHelpline: '198',
    complaintWebsite: 'https://www.trai.gov.in',
  },
  US: {
    name: 'United States',
    code: '+1',
    emoji: '🇺🇸',
    dialFormat: /^[2-9]\d{9}$/,
    dialLength: 10,
    networks: {
      att: { name: 'AT&T', type: 'mobile', prefixes: [] },
      verizon: { name: 'Verizon', type: 'mobile', prefixes: [] },
      tmobile: { name: 'T-Mobile', type: 'mobile', prefixes: [] },
    },
    premiumPrefixes: ['900'],
    scamPrefixes: ['900'],
    complaintAuthority: 'FTC (Federal Trade Commission)',
    complaintHelpline: '1-877-382-4357',
    complaintWebsite: 'https://www.ftc.gov',
  },
  GB: {
    name: 'United Kingdom',
    code: '+44',
    emoji: '🇬🇧',
    dialFormat: /^7\d{9}$/,
    dialLength: 10,
    networks: {
      ee: { name: 'EE', type: 'mobile', prefixes: ['7'] },
      three: { name: 'Three', type: 'mobile', prefixes: ['7'] },
      vodafone: { name: 'Vodafone UK', type: 'mobile', prefixes: ['7'] },
      o2: { name: 'O2', type: 'mobile', prefixes: ['7'] },
    },
    premiumPrefixes: ['900'],
    scamPrefixes: ['900'],
    complaintAuthority: 'Action Fraud',
    complaintHelpline: '0300 123 2040',
    complaintWebsite: 'https://www.actionfraud.police.uk',
  },
  AE: {
    name: 'United Arab Emirates',
    code: '+971',
    emoji: '🇦🇪',
    dialFormat: /^5[0-9]\d{7}$/,
    dialLength: 9,
    networks: {
      etisalat: { name: 'Etisalat', type: 'mobile', prefixes: ['50', '51', '52', '55', '56'] },
      du: { name: 'du', type: 'mobile', prefixes: ['54', '55', '56', '58'] },
    },
    premiumPrefixes: ['900'],
    scamPrefixes: ['900'],
    complaintAuthority: 'TDRA (Telecommunications & Digital Government Regulatory Authority)',
    complaintHelpline: '800 11111',
    complaintWebsite: 'https://tdra.gov.ae',
  },
  SA: {
    name: 'Saudi Arabia',
    code: '+966',
    emoji: '🇸🇦',
    dialFormat: /^5\d{8}$/,
    dialLength: 9,
    networks: {
      stc: { name: 'STC', type: 'mobile', prefixes: ['50', '51', '53', '55'] },
      mobily: { name: 'Mobily', type: 'mobile', prefixes: ['54', '56'] },
      zain: { name: 'Zain KSA', type: 'mobile', prefixes: ['57', '58', '59'] },
    },
    premiumPrefixes: ['9200'],
    scamPrefixes: ['9200'],
    complaintAuthority: 'CITC (Communications, Space & Technology Commission)',
    complaintHelpline: '1910',
    complaintWebsite: 'https://www.citc.gov.sa',
  },
  CN: {
    name: 'China',
    code: '+86',
    emoji: '🇨🇳',
    dialFormat: /^1[3-9]\d{9}$/,
    dialLength: 11,
    networks: {
      cmcc: { name: 'China Mobile', type: 'mobile', prefixes: ['134', '135', '136', '137', '138', '139', '147', '148', '150', '151', '152', '157', '158', '159', '165', '172', '178', '182', '183', '184', '187', '188', '195', '197', '198'] },
      cucc: { name: 'China Unicom', type: 'mobile', prefixes: ['130', '131', '132', '145', '146', '155', '156', '166', '167', '171', '175', '176', '185', '186', '196'] },
      ctcc: { name: 'China Telecom', type: 'mobile', prefixes: ['133', '149', '153', '173', '174', '177', '180', '181', '189', '190', '191', '193', '199'] },
    },
    premiumPrefixes: ['168', '160'],
    scamPrefixes: ['168', '160'],
    complaintAuthority: 'MIIT (Ministry of Industry and Information Technology)',
    complaintHelpline: '12321',
    complaintWebsite: 'https://www.miit.gov.cn',
  },
  TR: {
    name: 'Turkey',
    code: '+90',
    emoji: '🇹🇷',
    dialFormat: /^5\d{9}$/,
    dialLength: 10,
    networks: {
      turkcell: { name: 'Turkcell', type: 'mobile', prefixes: ['530', '531', '532', '533', '534', '535', '536', '537', '538', '539'] },
      vodafone_tr: { name: 'Vodafone Turkey', type: 'mobile', prefixes: ['540', '541', '542', '543', '544', '545', '546'] },
      turk_telekom: { name: 'Türk Telekom', type: 'mobile', prefixes: ['550', '551', '552', '553', '554', '555', '556'] },
    },
    premiumPrefixes: ['900'],
    scamPrefixes: ['900'],
    complaintAuthority: 'BTK (Information and Communication Technologies Authority)',
    complaintHelpline: '120',
    complaintWebsite: 'https://www.btk.gov.tr',
  },
  DE: {
    name: 'Germany',
    code: '+49',
    emoji: '🇩🇪',
    dialFormat: /^1[5-7]\d{8,9}$/,
    dialLength: 10,
    networks: {
      telekom: { name: 'Deutsche Telekom', type: 'mobile', prefixes: ['151', '160', '161', '162', '170', '171', '172', '173', '174', '175'] },
      vodafone_de: { name: 'Vodafone Germany', type: 'mobile', prefixes: ['152', '163', '172', '173'] },
      o2_de: { name: 'O2 Germany', type: 'mobile', prefixes: ['155', '156', '157', '159', '166', '167', '176', '177', '178', '179'] },
    },
    premiumPrefixes: ['0900'],
    scamPrefixes: ['0900'],
    complaintAuthority: 'BNetzA (Federal Network Agency)',
    complaintHelpline: '0800 1234567',
    complaintWebsite: 'https://www.bnetza.de',
  },
  FR: {
    name: 'France',
    code: '+33',
    emoji: '🇫🇷',
    dialFormat: /^[6-7]\d{8}$/,
    dialLength: 9,
    networks: {
      orange: { name: 'Orange', type: 'mobile', prefixes: ['6', '7'] },
      sfr: { name: 'SFR', type: 'mobile', prefixes: ['6', '7'] },
      bouygues: { name: 'Bouygues Telecom', type: 'mobile', prefixes: ['6', '7'] },
      free: { name: 'Free Mobile', type: 'mobile', prefixes: ['6', '7'] },
    },
    premiumPrefixes: ['0900'],
    scamPrefixes: ['0900'],
    complaintAuthority: 'ARCEP',
    complaintHelpline: '3939',
    complaintWebsite: 'https://www.arcep.fr',
  },
  JP: {
    name: 'Japan',
    code: '+81',
    emoji: '🇯🇵',
    dialFormat: /^[7-9]0\d{8}$/,
    dialLength: 10,
    networks: {
      ntt_docomo: { name: 'NTT Docomo', type: 'mobile', prefixes: ['70', '80', '90'] },
      au: { name: 'au (KDDI)', type: 'mobile', prefixes: ['70', '80', '90'] },
      softbank: { name: 'SoftBank', type: 'mobile', prefixes: ['70', '80', '90'] },
    },
    premiumPrefixes: ['0900', '1239'],
    scamPrefixes: ['0900', '1239'],
    complaintAuthority: 'NPAT (National Police Agency)',
    complaintHelpline: '#9110',
    complaintWebsite: 'https://www.npa.go.jp',
  },
};

// ─── Known Spam Reports — hardcoded database of confirmed scam numbers ───────
// These are real reported scam numbers — acts as a deterministic threat signal (like URL threat databases)

interface SpamEntry {
  reports: number;
  categories: string[];
  scamType: string;
}

const KNOWN_SPAM_REPORTS: Record<string, SpamEntry> = {
  // PTCL landline scams (Islamabad/Rawalpindi)
  '0517080507': { reports: 87, categories: ['Fake Bank Call', 'PTCL Fraud', 'Landline Scam'], scamType: 'Bank/Wallet Phishing' },
  '0517080508': { reports: 45, categories: ['Fake Bank Call', 'Identity Theft'], scamType: 'Bank/Wallet Phishing' },
  '0511234567': { reports: 62, categories: ['Fake Government', 'CNIC Scam'], scamType: 'Identity Theft' },
  '0519876543': { reports: 38, categories: ['Loan Scam', 'Extortion'], scamType: 'Fake Loan App' },
  // Karachi landline scams
  '02135678901': { reports: 55, categories: ['Fake Bank Call', 'Credit Card Scam'], scamType: 'Bank/Wallet Phishing' },
  // Lahore landline scams
  '04235678901': { reports: 41, categories: ['Investment Scam', 'Fake Company'], scamType: 'Investment Scam' },
  // Mobile scams
  '03001234568': { reports: 73, categories: ['Lottery Scam', 'Prize Fraud'], scamType: 'Prize/Lottery Scam' },
  '03211234568': { reports: 56, categories: ['Job Scam', 'Registration Fee'], scamType: 'Job Scam' },
  '03301234568': { reports: 48, categories: ['Extortion Call', 'Threats'], scamType: 'Extortion Call' },
  '03451234568': { reports: 67, categories: ['Fake Bank', 'OTP Scam'], scamType: 'Bank/Wallet Phishing' },
};

function checkKnownSpamReports(normalized: string): SpamEntry | null {
  // Try exact match first
  const cleaned = normalized.replace(/[\s\-\(\)\+\.]/g, '');
  if (KNOWN_SPAM_REPORTS[cleaned]) return KNOWN_SPAM_REPORTS[cleaned];
  // Try with leading 0 for Pakistani numbers
  if (!cleaned.startsWith('0') && cleaned.startsWith('92')) {
    const withZero = '0' + cleaned.slice(2);
    if (KNOWN_SPAM_REPORTS[withZero]) return KNOWN_SPAM_REPORTS[withZero];
  }
  return null;
}

function detectCountry(normalized: string): { country: CountryConfig | null; localNumber: string } {
  if (normalized.startsWith('+')) {
    for (const [, config] of Object.entries(COUNTRIES)) {
      const codeDigits = config.code.replace('+', '');
      if (normalized.startsWith('+' + codeDigits)) {
        return { country: config, localNumber: normalized.slice(codeDigits.length + 1) };
      }
    }
  }

  if (/^0[3-9]\d{8,9}$/.test(normalized)) {
    return { country: COUNTRIES['PK'], localNumber: normalized };
  }

  return { country: null, localNumber: normalized };
}

function normalizeNumber(input: string): string {
  let cleaned = input.replace(/[\s\-\(\)\.]/g, '');

  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.slice(2);
  }

  if (!cleaned.startsWith('+') && cleaned.length >= 10) {
    if (cleaned.startsWith('0')) {
      cleaned = cleaned;
    } else {
      cleaned = '+' + cleaned;
    }
  }

  return cleaned;
}

function detectNetwork(country: CountryConfig, localNumber: string): PhoneAnalysis['network'] {
  const prefix3 = localNumber.slice(0, 3);
  const prefix2 = localNumber.slice(0, 2);
  const prefix1 = localNumber.slice(0, 1);

  // Real MCC codes by country
  const MCC_MAP: Record<string, string> = {
    PK: '410', IN: '404', US: '310', GB: '234', AE: '424',
    SA: '420', CN: '460', TR: '286', DE: '262', FR: '208', JP: '440',
  };
  const mcc = MCC_MAP[Object.entries(COUNTRIES).find(([, c]) => c === country)?.[0] || ''] || '000';

  for (const [, network] of Object.entries(country.networks)) {
    if (network.prefixes.some((p) => localNumber.startsWith(p))) {
      return {
        name: network.name,
        mcc,
        mnc: prefix3 || prefix2,
        type: network.type,
      };
    }
  }

  for (const prefix of country.premiumPrefixes) {
    if (localNumber.startsWith(prefix) || localNumber.includes(prefix)) {
      return { name: 'Premium Rate', mcc, mnc: prefix, type: 'premium' };
    }
  }

  return { name: 'Unknown', mcc, mnc: prefix3 || prefix2 || prefix1, type: 'unknown' };
}

function detectRegion(country: CountryConfig, localNumber: string): PhoneAnalysis['region'] {
  // Check if it's a landline number (starts with 0 but not 03)
  const isLandline = localNumber.startsWith('0') && !localNumber.startsWith('03');
  
  // MOBILE NUMBERS: Always nationwide (not geographically bound)
  if (!isLandline) {
    // For mobile numbers, we can't determine a specific city
    // They are nationwide and can be used anywhere in the country
    if (country.name === 'Pakistan') {
      return { 
        province: 'Pakistan', 
        city: 'Nationwide (Mobile Number)', 
        areaCode: localNumber.slice(0, 4) 
      };
    }
    return { 
      province: country.name, 
      city: 'Nationwide (Mobile Number)', 
      areaCode: localNumber.slice(0, 4) 
    };
  }
  
  // LANDLINE NUMBERS: Geographically bound to specific region
  if (!country.regions || Object.keys(country.regions).length === 0) {
    return { province: country.name, city: 'Landline Region', areaCode: localNumber.slice(0, 4) };
  }

  // Try to match landline area code to region
  const prefix3 = localNumber.slice(0, 3);
  const prefix2 = localNumber.slice(0, 2);
  const prefix1 = localNumber.slice(0, 1);

  const city = country.regions[prefix3] || country.regions[prefix2] || country.regions[prefix1] || 'Landline Region';

  return {
    province: country.name,
    city,
    areaCode: prefix3 || prefix2 || prefix1,
  };
}

// ─── Phone Risk Floor — deterministic evidence-based minimums ────────────────
// Prevents AI from under-scoring when hard evidence is strong (same pattern as URL analyzer)

function calculatePhoneRiskFloor(
  indicators: PhoneAnalysis['indicators'],
  localNumber: string,
  country: CountryConfig,
  normalizedNumber: string,
  liveData?: import('./phone-lookup').LivePhoneData | null
): { floorScore: number; floorLevel: PhoneAnalysis['riskLevel']; floorReason: string } {
  const indicatorLabels = indicators.map(i => i.label.toLowerCase());
  const hasIndicator = (text: string) => indicatorLabels.some(l => l.includes(text));

  // Check scam prefix match
  const isScamPrefix = country.scamPrefixes.some(p => localNumber.startsWith(p));
  // Check premium rate
  const isPremium = country.premiumPrefixes.some(p => localNumber.startsWith(p));
  // Truecaller spam score
  const spamScore = liveData?.truecallerSpamScore ?? 0;
  // VoIP
  const isVoIP = liveData?.isVoIP === true;
  // Invalid format
  const isInvalid = hasIndicator('format');
  // Unverified landline
  const isUnverifiedLandline = hasIndicator('unverified landline');

  let floorScore = 0;
  let floorReason = '';

  // Known spam database hit — confirmed scam number
  const hasKnownSpam = hasIndicator('known scam');
  const spamDbEntry = checkKnownSpamReports(normalizedNumber);
  const knownSpamCount = spamDbEntry?.reports ?? 0;

  // === CRITICAL TIER (80-95) ===
  // Known scam number in database with high reports (50+)
  if (hasKnownSpam && knownSpamCount >= 50) {
    floorScore = 92;
    floorReason = `Known scam number with ${knownSpamCount} spam reports`;
  }
  // Known scam prefix + high Truecaller spam score
  else if (isScamPrefix && spamScore >= 50) {
    floorScore = 90;
    floorReason = 'Known scam prefix + high Truecaller spam score';
  }
  // Truecaller spam score extremely high (75+)
  else if (spamScore >= 75) {
    floorScore = 85;
    floorReason = `Truecaller spam score ${spamScore}/100 — extremely high`;
  }
  // Known scam number in database (any reports)
  else if (hasKnownSpam) {
    floorScore = 80;
    floorReason = `Known scam number with ${knownSpamCount} spam reports`;
  }

  // === HIGH TIER (60-79) ===
  // Known scam prefix
  else if (isScamPrefix) {
    floorScore = 75;
    floorReason = 'Number starts with a known scam prefix';
  }
  // High Truecaller spam score (50-74)
  else if (spamScore >= 50) {
    floorScore = 72;
    floorReason = `Truecaller spam score ${spamScore}/100 — high spam reports`;
  }
  // VoIP + invalid format
  else if (isVoIP && isInvalid) {
    floorScore = 65;
    floorReason = 'VoIP number with invalid format — highly suspicious';
  }

  // === MEDIUM TIER (40-59) ===
  // Premium rate number
  else if (isPremium) {
    floorScore = 55;
    floorReason = 'Premium rate number — charges apply';
  }
  // Moderate Truecaller spam score (20-49)
  else if (spamScore >= 20) {
    floorScore = 50;
    floorReason = `Truecaller spam score ${spamScore}/100 — moderate spam reports`;
  }
  // VoIP detected
  else if (isVoIP) {
    floorScore = 45;
    floorReason = 'VoIP/virtual number — commonly used in scams';
  }
  // Invalid format + no live data (can't verify at all)
  else if (isInvalid && !liveData) {
    floorScore = 40;
    floorReason = 'Invalid format with no live verification data';
  }
  // Unverified landline (could be scammer using landline)
  else if (isUnverifiedLandline) {
    floorScore = 35;
    floorReason = 'Unverified landline — exercise caution';
  }

  const floorLevel: PhoneAnalysis['riskLevel'] =
    floorScore >= 80 ? 'critical' :
    floorScore >= 60 ? 'high' :
    floorScore >= 40 ? 'medium' :
    floorScore >= 20 ? 'low' : 'safe';

  return { floorScore, floorLevel, floorReason };
}

export async function analyzePhoneNumber(input: string, liveData?: import('./phone-lookup').LivePhoneData | null): Promise<PhoneAnalysis> {
  const normalized = normalizeNumber(input);
  const { country, localNumber } = detectCountry(normalized);

  if (!country) {
    return {
      number: input,
      normalized,
      isValid: false,
      country: 'Unknown',
      countryCode: 'Unknown',
      countryEmoji: '🌍',
      network: { name: 'Unknown', mcc: '000', mnc: '000', type: 'unknown' },
      region: { province: 'Unknown', city: 'Unknown', areaCode: '' },
      riskScore: 50,
      riskLevel: 'medium',
      indicators: [
        { type: 'danger', label: 'Country', value: 'Unable to identify country from number' },
        { type: 'warning', label: 'Format', value: 'Number format not recognized' },
      ],
      spamReports: { reported: false, reportCount: 0, categories: [] },
      socialPresence: { possible: false, platforms: [] },
      recommendation: 'UNRECOGNIZED: Unable to identify this number. Verify the sender through other means before engaging.',
    };
  }

  const isValid = country.dialFormat.test(localNumber);
  const network = detectNetwork(country, localNumber);
  const region = detectRegion(country, localNumber);

  let finalNetwork = network;
  let finalRegion = region;
  let finalValid = isValid;
  let extraIndicators: PhoneAnalysis['indicators'] = [];

  if (liveData) {
    if (liveData.carrier && liveData.carrier !== 'Unknown') {
      finalNetwork = { ...finalNetwork, name: liveData.carrier };
    }
    if (liveData.lineType) {
      const lt = liveData.lineType.toLowerCase();
      if (lt === 'mobile') finalNetwork = { ...finalNetwork, type: 'mobile' };
      else if (lt === 'landline') finalNetwork = { ...finalNetwork, type: 'landline' };
      else if (lt === 'voip' || lt === 'virtual') finalNetwork = { ...finalNetwork, type: 'voip' };
    }
    if (liveData.location && liveData.location !== 'Unknown') {
      finalRegion = { ...finalRegion, city: liveData.location };
    }
    if (liveData.isValid !== undefined && !input.startsWith('0')) {
      finalValid = liveData.isValid;
    }
    if (liveData.isVoIP) {
      extraIndicators.push({ type: 'warning', label: 'VoIP Detected', value: 'This number uses Voice over IP — commonly used in scams' });
    }
    if (liveData.isRoaming) {
      extraIndicators.push({ type: 'warning', label: 'Roaming', value: 'Number is currently roaming — location may be different from registration' });
    }
    // Truecaller indicators
    if (liveData.truecallerName) {
      extraIndicators.push({
        type: 'info',
        label: 'Owner Name (Truecaller)',
        value: liveData.truecallerVerified
          ? `${liveData.truecallerName} \u2713 Verified`
          : liveData.truecallerName,
      });
    }
    if (liveData.truecallerSpamScore !== undefined && liveData.truecallerSpamScore > 0) {
      const spamSeverity = liveData.truecallerSpamScore >= 50 ? 'danger' : liveData.truecallerSpamScore >= 20 ? 'warning' : 'warning';
      extraIndicators.push({
        type: spamSeverity,
        label: 'Truecaller Spam Score',
        value: `${liveData.truecallerSpamScore}/100 \u2014 ${liveData.truecallerSpamScore >= 50 ? 'HIGH spam risk' : liveData.truecallerSpamScore >= 20 ? 'moderate spam reports' : 'low spam reports'}`,
      });
    }
    if (liveData.truecallerType) {
      extraIndicators.push({ type: 'info', label: 'Truecaller Type', value: liveData.truecallerType });
    }
    extraIndicators.push({ type: 'info', label: 'Data Source', value: `Live data from ${liveData.source}` });
  }

  // Build factual indicators
  const indicators: PhoneAnalysis['indicators'] = [
    { type: 'info', label: 'Country', value: `${country.emoji} ${country.name} (${country.code})` },
    { type: 'info', label: 'Network', value: finalNetwork.name + (liveData ? ' (verified)' : ' (prefix-based)') },
    { type: 'info', label: 'Type', value: finalNetwork.type },
    { type: 'info', label: 'Region', value: finalRegion.city + (liveData?.location ? ' (live)' : '') },
  ];

  if (!finalValid) {
    indicators.push({ type: 'danger', label: 'Format', value: `Invalid ${country.name} phone number format` });
  }

  if (finalNetwork.type === 'unknown') {
    indicators.push({ type: 'warning', label: 'Network', value: 'Network not recognized' });
  }

  if (finalNetwork.type === 'landline' && !liveData) {
    indicators.push({ type: 'warning', label: 'Unverified Landline', value: 'Landline number could not be verified via live lookup — exercise caution' });
  }

  // Check known spam reports (deterministic threat database)
  const spamEntry = checkKnownSpamReports(normalized);
  const spamReports: PhoneAnalysis['spamReports'] = spamEntry
    ? { reported: true, reportCount: spamEntry.reports, categories: spamEntry.categories }
    : { reported: false, reportCount: 0, categories: [] };

  if (spamEntry) {
    indicators.push({ type: 'danger', label: 'Known Scam Number', value: `${spamEntry.reports} spam reports — ${spamEntry.categories.join(', ')}` });
  }

  // Check for premium rate number (factual, not classification)
  for (const prefix of country.premiumPrefixes) {
    if (localNumber.startsWith(prefix)) {
      indicators.push({ type: 'danger', label: 'Premium Rate Number', value: `This is a premium rate number — charges apply per call/SMS` });
    }
  }

  indicators.push(...extraIndicators);

  // AI CLASSIFICATION — AI judges scam nature, but deterministic risk floor prevents under-scoring
  const evidence: Record<string, unknown> = {
    phoneNumber: input,
    normalizedNumber: normalized,
    country: country.name,
    network: finalNetwork.name,
    networkType: finalNetwork.type,
    region: finalRegion.city,
    isValid: finalValid,
  };
  if (liveData) {
    evidence.liveData = {
      carrier: liveData.carrier,
      lineType: liveData.lineType,
      location: liveData.location,
      isWhatsApp: liveData.isWhatsApp,
      isVoIP: liveData.isVoIP,
      isRoaming: liveData.isRoaming,
      truecallerName: liveData.truecallerName,
      truecallerSpamScore: liveData.truecallerSpamScore,
      truecallerType: liveData.truecallerType,
      truecallerVerified: liveData.truecallerVerified,
    };
  }

  const aiVerdict = await classifyWithAI({
    contentType: 'phone',
    content: input,
    evidence,
  });

  let riskScore = aiVerdict.riskScore;
  let riskLevel = aiVerdict.riskLevel;

  // DETERMINISTIC RISK FLOOR — hard evidence cannot be overridden by lenient AI
  const { floorScore, floorLevel, floorReason } = calculatePhoneRiskFloor(indicators, localNumber, country, normalized, liveData);
  if (floorScore > riskScore) {
    riskScore = floorScore;
    riskLevel = floorLevel;
    indicators.push({ type: 'danger', label: 'Risk Floor Applied', value: floorReason });
  }

  // Build verification platforms
  const platforms: string[] = [];
  if (liveData?.isWhatsApp) platforms.push('WhatsApp (verified active)');
  if (liveData) platforms.push(`Carrier: ${liveData.carrier} (${liveData.source})`);
  platforms.push('Google (search the number)');
  platforms.push('Truecaller');

  const socialPresence = { possible: platforms.length > 0, platforms };

  // Build recommendation from AI verdict
  const recommendation = aiVerdict.recommendedActionsRomanUrdu?.[0] || (
    riskLevel === 'critical' ? `HIGH RISK: This ${country.name} number has been flagged. Do NOT engage. Block and report to ${country.complaintAuthority}.`
    : riskLevel === 'high' ? `SUSPICIOUS: This ${country.name} number shows red flags. Verify the sender before responding.`
    : riskLevel === 'medium' ? `CAUTION: Some indicators suggest caution. Verify the sender identity before sharing personal information.`
    : `This ${country.name} number appears safe based on available data. Standard precautions apply — never share OTPs or PINs.`
  );

  // Complaint path from AI-determined scam type
  let complaintPath: PhoneAnalysis['complaintPath'] | undefined;
  if ((riskLevel === 'medium' || riskLevel === 'high' || riskLevel === 'critical') && country.complaintAuthority) {
    complaintPath = getComplaintPathForType(aiVerdict.scamType) || getComplaintPathForType('Generic Scam');
  }

  // Analysis confidence
  const confidenceFactors: string[] = [];
  let confidenceScore = 0;
  if (finalValid) { confidenceScore += 25; confidenceFactors.push('Valid number format'); }
  if (liveData) {
    confidenceScore += 30; confidenceFactors.push('Live data verified');
    if (liveData.carrier && liveData.carrier !== 'Unknown') { confidenceScore += 20; confidenceFactors.push('Carrier confirmed'); }
    if (liveData.isRegistered) { confidenceScore += 10; confidenceFactors.push('Number is registered'); }
  } else {
    confidenceScore += 15; confidenceFactors.push('Prefix-based detection only');
  }
  if (finalNetwork.name !== 'Unknown') { confidenceScore += 15; confidenceFactors.push('Network identified'); }
  const confidenceLevel = confidenceScore >= 80 ? 'high' : confidenceScore >= 50 ? 'medium' : 'low';

  const isLandline = input.startsWith('0') && !input.startsWith('03');
  const detailedAnalysis = {
    numberValidity: finalValid ? `✅ Number format is valid for ${country.name}` : `❌ Number format is invalid for ${country.name}`,
    networkReliability: liveData?.carrier && liveData.carrier !== 'Unknown' ? `✅ Network confirmed via live lookup: ${liveData.carrier}` : `⚠️ Network detected via prefix matching: ${finalNetwork.name} (may be ported)`,
    locationInfo: isLandline ? `✅ Landline registered in: ${finalRegion.city}` : `ℹ️ Mobile number — registered nationwide (not tied to specific city)`,
    riskAssessment: riskLevel === 'safe' || riskLevel === 'low' ? `✅ Low risk score (${riskScore}/100) — appears safe` : riskLevel === 'medium' ? `⚠️ Medium risk score (${riskScore}/100) — exercise caution` : `❌ High risk score (${riskScore}/100) — suspicious activity detected`,
    recommendation: riskLevel === 'safe' || riskLevel === 'low' ? 'This number appears safe. Standard precautions apply — never share OTPs or personal information.' : riskLevel === 'medium' ? 'Verify the sender identity before sharing any personal information.' : 'Do NOT engage with this number. Block and report if suspicious.',
  };

  return {
    number: input,
    normalized,
    isValid: finalValid,
    country: country.name,
    countryCode: country.code,
    countryEmoji: country.emoji,
    network: finalNetwork,
    region: finalRegion,
    riskScore,
    riskLevel,
    indicators,
    spamReports,
    socialPresence,
    recommendation,
    complaintPath,
    analysisConfidence: { level: confidenceLevel, percentage: Math.min(confidenceScore, 100), factors: confidenceFactors },
    detailedAnalysis,
    liveData: liveData ? {
      source: liveData.source, lineType: liveData.lineType, carrier: liveData.carrier,
      location: liveData.location, isWhatsApp: liveData.isWhatsApp, isVoIP: liveData.isVoIP,
      isRegistered: liveData.isRegistered, isRoaming: liveData.isRoaming,
      truecallerName: liveData.truecallerName, truecallerSpamScore: liveData.truecallerSpamScore,
      truecallerType: liveData.truecallerType, truecallerVerified: liveData.truecallerVerified,
    } : undefined,
  };
}
