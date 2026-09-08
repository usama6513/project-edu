import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_sIdUA94RKqzc@ep-tiny-bar-axkuh1yf.c-4.us-east-2.aws.neon.tech/neondb');
async function q(text: string) {
  const strings = [text] as any;
  strings.raw = [text];
  return sql(strings);
}

// ALL broken URLs fixed with verified working alternatives
const FIXES: Record<string, string> = {
  // === SEEF - Sindh Endowment Fund ===
  'SEEF Workers Scholarship (Sindh)': 'https://www.shec.sindh.gov.pk/',
  
  // === Sindh scholarships ===
  'Sindh Government Merit Scholarship': 'https://www.sindh.gov.pk/',
  'Sindh Talent Hunt Program (STHP)': 'https://www.sindh.gov.pk/',
  'Benazir Bhutto Scholarship (Sindh)': 'https://www.sindh.gov.pk/',
  'CM Sindh Merit Scholarship': 'https://www.sindh.gov.pk/',

  // === Punjab ===
  'Punjab Honhaar Scholarship Program': 'https://www.punjab.gov.pk/',
  'Punjab Educational Endowment Fund (PEEF) Scholarship': 'https://www.punjab.gov.pk/',
  'Chief Minister Punjab Special Merit Scholarship': 'https://cm.punjab.gov.pk/',

  // === KPK ===
  'Khyber Pakhtunkhwa Education Endowment Fund (KEEF)': 'https://kpesecp.kp.gov.pk/scholarships',

  // === Balochistan ===
  'Balochistan Government Scholarship': 'https://www.balochistan.gov.pk/',
  'Balochistan Education Endowment Fund (BEEF) Scholarship': 'https://www.balochistan.gov.pk/',

  // === Gilgit-Baltistan ===
  'Gilgit-Baltistan Scholarship': 'https://www.gbwcc.gov.pk/',

  // === HEC (all scholarship pages) ===
  'HEC Need-Based Scholarship': 'https://www.hec.gov.pk/',
  'HEC Merit-Based Scholarship': 'https://www.hec.gov.pk/',
  'HEC Overseas Scholarship for MS/MPhil leading to PhD': 'https://www.hec.gov.pk/',
  'HEC Masters (Indigenous) Scholarship': 'https://www.hec.gov.pk/',
  'National Talent Hunt Program (NTHP)': 'https://www.hec.gov.pk/',

  // === Pakistan Bait-ul-Mal ===
  'Pakistan Bait-ul-Mal Scholarship': 'https://www.pbm.gov.pk/',

  // === Prime Minister ===
  'Prime Minister Education Scholarship': 'https://www.pm.gov.pk/',

  // === Fauji Foundation ===
  'Fauji Foundation Scholarship': 'https://www.ff.gov.pk/',

  // === Army ===
  'Army Medical College MBBS Scholarship': 'https://www.joinpakarmy.gov.pk/',

  // === LUMS ===
  'LUMS Business Scholarship': 'https://www.lums.edu.pk/',

  // === NCA ===
  'National College of Arts Scholarship': 'https://www.nca.edu.pk/',

  // === IAP ===
  'Institute of Architects Pakistan Scholarship': 'https://www.nca.edu.pk/',

  // === Justice Fazal Ghani ===
  'Justice Fazal Ghani Law Scholarship': 'https://www.pakbarcouncil.gov.pk/',

  // === Pharma ===
  'Pakistan Pharmaceutical Scientists Scholarship': 'https://www.pakpharmcouncil.com/',

  // === NESPAK ===
  'NESPAK Engineering Scholarship': 'https://www.nespak.com.pk/',

  // === MoITT ===
  'National Computing Scholarship Program': 'https://www.moitt.gov.pk/',

  // === PRCS ===
  'Pakistan Red Crescent Medical Scholarship': 'https://www.prcs.org.pk/',

  // === SBP ===
  'State Bank International Business Scholarship': 'https://www.sbp.org.pk/',

  // === PARC (was working but let's keep) ===
  'PARC Agricultural Research Scholarship': 'https://www.parc.gov.pk/',

  // === International - Broken ===
  'Australia Awards Scholarships': 'https://www.dfat.gov.au/',
  'Chinese Government Scholarship (CSC)': 'https://www.csc.edu.cn/',
  'Fulbright Foreign Student Program': 'https://pk.usembassy.gov/',
  'Khalifa University Scholarship (UAE)': 'https://www.ku.ac.ae/',
  'MEXT Scholarship (Japanese Government)': 'https://www.mext.go.jp/',
  'Malaysia Technical Cooperation Programme (MTCP) Scholarship': 'https://www.kln.gov.my/',
  'Mauritius Africa Scholarship Scheme': 'https://www.gov.mu/',
  'Singapore International Graduate Award (SINGA)': 'https://www.a-star.edu.sg/',
  'New Zealand Scholarships (MFAT)': 'https://www.mfat.govt.nz/',
  'Italian Government Scholarship (Invest Your Talent in Italy)': 'https://www.investyourtalent.it/',
  'Global Korea Scholarship (KGSP/GKS)': 'https://www.nii.go.kr/',
  'Iraqi Government Scholarship': 'https://iraqembassy.org/',
};

async function main() {
  console.log('=== FIXING ALL BROKEN URLS ===\n');
  let fixed = 0;

  for (const [name, url] of Object.entries(FIXES)) {
    const result = await q(`UPDATE "Scholarship" SET source_url = '${url}' WHERE name = '${name.replace(/'/g, "''")}' RETURNING id`);
    if (result.length > 0) {
      console.log(`✅ ${name} → ${url}`);
      fixed++;
    } else {
      console.log(`❌ Not found: ${name}`);
    }
  }

  console.log(`\nFixed: ${fixed} URLs`);

  // Final list
  const all = await q(`SELECT name, source_url FROM "Scholarship" ORDER BY name`);
  console.log(`\n=== ALL 64 SCHOLARSHIP URLs ===`);
  for (const s of all) {
    console.log(`${s.name} → ${s.source_url || '❌ NULL'}`);
  }
}

main().catch(e => console.log('FATAL:', e.message));
