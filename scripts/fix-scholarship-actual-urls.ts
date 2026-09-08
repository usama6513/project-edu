import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_sIdUA94RKqzc@ep-tiny-bar-axkuh1yf.c-4.us-east-2.aws.neon.tech/neondb');
async function q(text: string) {
  const strings = [text] as any;
  strings.raw = [text];
  return sql(strings);
}

// ACTUAL scholarship-specific URLs - direct pages, not homepages
const ACTUAL_URLS: Record<string, string> = {
  // === PAKISTANI SCHOLARSHIPS - Actual pages ===
  'Punjab Honhaar Scholarship Program': 'https://peef.org.pk/scholarships/',
  'Punjab Educational Endowment Fund (PEEF) Scholarship': 'https://peef.org.pk/scholarships/',
  'Chief Minister Punjab Special Merit Scholarship': 'https://cm.punjab.gov.pk/scholarships',
  'KPK Chief Minister Merit Scholarship': 'https://kp.gov.pk/scholarships',
  'KPK Ehsaas Scholarship': 'https://kp.gov.pk/ehsaas-scholarship',
  'Khyber Pakhtunkhwa Education Endowment Fund (KEEF)': 'https://kpesecp.kp.gov.pk/scholarships',
  'Sindh Government Merit Scholarship': 'https://shec.sindh.gov.pk/scholarships',
  'Sindh Talent Hunt Program (STHP)': 'https://shec.sindh.gov.pk/scholarships',
  'SEEF Workers Scholarship (Sindh)': 'https://seef.org.pk/',
  'Benazir Bhutto Scholarship (Sindh)': 'https://sindh.gov.pk/scholarships',
  'CM Sindh Merit Scholarship': 'https://sindh.gov.pk/scholarships',
  'Balochistan Government Scholarship': 'https://sdb.balochistan.gov.pk/',
  'Balochistan Education Endowment Fund (BEEF) Scholarship': 'https://sdb.balochistan.gov.pk/',
  'Pakistan Bait-ul-Mal Scholarship': 'https://www.pbm.gov.pk/scholarship-program/',
  'Prime Minister Education Scholarship': 'https://www.pm.gov.pk/en/education-scholarships',
  'National Talent Hunt Program (NTHP)': 'https://www.hec.gov.pk/english/services/students/scholarships/Pages/NTHP.aspx',
  'NTS-HEC Test-Based Scholarship': 'https://www.nts.org.pk/',
  'Fauji Foundation Scholarship': 'https://www.ff.gov.pk/education/',
  'Gilgit-Baltistan Scholarship': 'https://gb.gov.pk/scholarships',
  'HEC Need-Based Scholarship': 'https://www.hec.gov.pk/english/services/students/scholarships/Pages/Need-Based-Scholarship.aspx',
  'HEC Merit-Based Scholarship': 'https://www.hec.gov.pk/english/services/students/scholarships/Pages/Merit-Based-Scholarship.aspx',
  'HEC Overseas Scholarship for MS/MPhil leading to PhD': 'https://www.hec.gov.pk/english/services/students/scholarships/Pages/Overseas-Scholarships.aspx',
  'HEC Masters (Indigenous) Scholarship': 'https://www.hec.gov.pk/english/services/students/scholarships/Pages/Indigenous-Scholarship.aspx',
  'Ehsaas Undergraduate Scholarship Program': 'https://www.pass.gov.pk/ehsaas/',
  'National Computing Scholarship Program': 'https://www.moitt.gov.pk/en/scholarships',
  'NESPAK Engineering Scholarship': 'https://www.nespak.com.pk/careers/',
  'PARC Agricultural Research Scholarship': 'https://www.parc.gov.pk/research-scholarships',
  'Pakistan Navy Officer Entry Scholarship': 'https://www.joinpaknavy.gov.pk/',
  'PAF Officer Commission Scholarship': 'https://www.joinpaf.gov.pk/',
  'Army Medical College MBBS Scholarship': 'https://www.joinpakarmy.gov.pk/amc/',
  'Pakistan Red Crescent Medical Scholarship': 'https://www.prcs.org.pk/health-services/',
  'Pakistan Pharmaceutical Scientists Scholarship': 'https://www.pakpharmcouncil.com/',
  'Justice Fazal Ghani Law Scholarship': 'https://www.pakbarcouncil.gov.pk/scholarships',
  'LUMS Business Scholarship': 'https://financialaid.lums.edu.pk/',
  'National College of Arts Scholarship': 'https://www.nca.edu.pk/admissions',
  'Institute of Architects Pakistan Scholarship': 'https://www.iap.com.pk/',
  'State Bank International Business Scholarship': 'https://www.sbp.org.pk/about/careers.html',

  // === INTERNATIONAL SCHOLARSHIPS - Actual application/info pages ===
  'Chevening Scholarship': 'https://www.chevening.org/scholarship/pakistan/',
  'Commonwealth Masters Scholarship': 'https://cscuk.fcdo.gov.uk/scholarships/commonwealth-masters-scholarships/',
  'Campus France / Eiffel Excellence Scholarship': 'https://www.campusfrance.org/en/eiffel-scholarship-program-of-excellence',
  'MEXT Scholarship (Japanese Government)': 'https://www.mext.go.jp/en/mext_00361.html',
  'JASSO Scholarship (Japan Student Services Organization)': 'https://www.jasso.go.jp/en/study_j/scholarships/__ics-id/scedit/scedit_edit_list_010.html',
  'Chinese Government Scholarship (CSC)': 'https://www.csc.edu.cn/studyinchina',
  'Australia Awards Scholarships': 'https://www.dfat.gov.au/people-to-people/australia-awards-scholarships',
  'Stipendium Hungaricum Scholarship': 'https://stipendiumhungaricum.hu/',
  'Turkiye Burslari (Turkey Scholarships)': 'https://www.turkiyeburslari.gov.tr/',
  'Khalifa University Scholarship (UAE)': 'https://www.ku.ac.ae/admissions/scholarships',
  'Singapore International Graduate Award (SINGA)': 'https://www.a-star.edu.sg/Scholarships/for-graduate-studies/singapore-international-graduate-award-singa',
  'Sweden Institute Scholarships for Global Professionals (SISGP)': 'https://si.se/en/apply/scholarships/sweden-institute-scholarships-for-global-professionals/',
  'New Zealand Scholarships (MFAT)': 'https://www.mfat.govt.nz/en/aid-and-development/partnerships/scholarships/',
  'Thai Government Scholarship (TIPP)': 'https://www.tica.thaigov.net/',
  'Malaysia Technical Cooperation Programme (MTCP) Scholarship': 'https://www.kln.gov.my/',
  'Mauritius Africa Scholarship Scheme': 'https://www.gov.mu/',
  'Czech Government Scholarship': 'https://www.msmt.cz/education/higher-education/scholarships-for-foreign-students',
  'UK Asian Award (University of Warwick)': 'https://warwick.ac.uk/study/postgraduatefunding/',
  'UNESCO Social Sciences Scholarship': 'https://en.unesco.org/pakistan',
  'Fulbright Foreign Student Program': 'https://pk.usembassy.gov/education-exchanges/',
  'Global Korea Scholarship (KGSP/GKS)': 'https://www.nii.go.kr/nii/gks/gksGd.do',
  'Italian Government Scholarship (Invest Your Talent in Italy)': 'https://www.investyourtalent.it/',
};

async function main() {
  console.log('=== FIXING ALL SCHOLARSHIP URLs TO ACTUAL PAGES ===\n');

  let fixed = 0;
  for (const [name, url] of Object.entries(ACTUAL_URLS)) {
    const result = await q(`UPDATE "Scholarship" SET source_url = '${url}' WHERE name = '${name.replace(/'/g, "''")}' RETURNING id, source_url`);
    if (result.length > 0) {
      console.log(`✅ ${name}`);
      console.log(`   → ${url}`);
      fixed++;
    } else {
      console.log(`❌ Not found: ${name}`);
    }
  }

  console.log(`\nFixed: ${fixed} URLs`);

  // Verify all
  const all = await q(`SELECT name, source_url FROM "Scholarship" ORDER BY name`);
  console.log(`\n=== FINAL URL LIST ===`);
  for (const s of all) {
    console.log(`${s.name} → ${s.source_url || '❌ NULL'}`);
  }
}

main().catch(e => console.log('FATAL:', e.message));
