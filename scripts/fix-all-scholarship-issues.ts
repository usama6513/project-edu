import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_sIdUA94RKqzc@ep-tiny-bar-axkuh1yf.c-4.us-east-2.aws.neon.tech/neondb');
async function q(text: string) {
  const strings = [text] as any;
  strings.raw = [text];
  return sql(strings);
}

async function main() {
  console.log('=== FIXING BROKEN URLS ===\n');

  // Fix SEEF URL - Sindh Endowment Fund is under Sindh government
  const seefFix = await q(`UPDATE "Scholarship" SET source_url = 'https://sindh.gov.pk/' WHERE name LIKE '%SEEF%' RETURNING name, source_url`);
  console.log(`SEEF fix: ${seefFix.length > 0 ? seefFix[0].name + ' → ' + seefFix[0].source_url : 'not found'}`);

  // Fix other potentially broken URLs
  const urlFixes: Record<string, string> = {
    'Balochistan Education Endowment Fund (BEEF) Scholarship': 'https://sdb.balochistan.gov.pk/',
    'Khyber Pakhtunkhwa Education Endowment Fund (KEEF)': 'https://kpesecp.kp.gov.pk/',
    'Punjab Educational Endowment Fund (PEEF) Scholarship': 'https://peef.org.pk/',
    'Punjab Honhaar Scholarship Program': 'https://peef.org.pk/',
    'Pakistan Bait-ul-Mal Scholarship': 'https://www.pbm.gov.pk/',
    'NTS-HEC Test-Based Scholarship': 'https://www.nts.org.pk/',
    'National Talent Hunt Program (NTHP)': 'https://www.hec.gov.pk/',
    'Sindh Government Merit Scholarship': 'https://shec.sindh.gov.pk/',
    'Sindh Talent Hunt Program (STHP)': 'https://shec.sindh.gov.pk/',
    'SEEF Workers Scholarship (Sindh)': 'https://sindh.gov.pk/',
    'Benazir Bhutto Scholarship (Sindh)': 'https://sindh.gov.pk/',
    'CM Sindh Merit Scholarship': 'https://sindh.gov.pk/',
    'Balochistan Government Scholarship': 'https://sdb.balochistan.gov.pk/',
    'KPK Chief Minister Merit Scholarship': 'https://cm.kp.gov.pk/',
    'KPK Ehsaas Scholarship': 'https://kp.gov.pk/',
    'Chief Minister Punjab Special Merit Scholarship': 'https://cm.punjab.gov.pk/',
    'Prime Minister Education Scholarship': 'https://www.pm.gov.pk/',
    'Fauji Foundation Scholarship': 'https://www.ff.gov.pk/',
    'Gilgit-Baltistan Scholarship': 'https://gb.gov.pk/',
    'HEC Need-Based Scholarship': 'https://www.hec.gov.pk/',
    'HEC Merit-Based Scholarship': 'https://www.hec.gov.pk/',
    'HEC Overseas Scholarship for MS/MPhil leading to PhD': 'https://www.hec.gov.pk/',
    'HEC Masters (Indigenous) Scholarship': 'https://www.hec.gov.pk/',
    'Ehsaas Undergraduate Scholarship Program': 'https://www.pass.gov.pk/',
    'National Computing Scholarship Program': 'https://www.moitt.gov.pk/',
    'NESPAK Engineering Scholarship': 'https://www.nespak.com.pk/',
    'PARC Agricultural Research Scholarship': 'https://www.parc.gov.pk/',
    'Pakistan Navy Officer Entry Scholarship': 'https://www.joinpaknavy.gov.pk/',
    'PAF Officer Commission Scholarship': 'https://www.joinpaf.gov.pk/',
    'Army Medical College MBBS Scholarship': 'https://www.joinpakarmy.gov.pk/',
    'Pakistan Red Crescent Medical Scholarship': 'https://www.prcs.org.pk/',
    'Pakistan Pharmaceutical Scientists Scholarship': 'https://www.pakpharmcouncil.com/',
    'Justice Fazal Ghani Law Scholarship': 'https://www.pakbarcouncil.gov.pk/',
    'LUMS Business Scholarship': 'https://www.lums.edu.pk/',
    'National College of Arts Scholarship': 'https://www.nca.edu.pk/',
    'Institute of Architects Pakistan Scholarship': 'https://www.iap.com.pk/',
    'State Bank International Business Scholarship': 'https://www.sbp.org.pk/',
    'Chevening Scholarship': 'https://www.chevening.org/scholarship/pakistan/',
    'Commonwealth Masters Scholarship': 'https://cscuk.fcdo.gov.uk/scholarships/',
    'Campus France / Eiffel Excellence Scholarship': 'https://www.campusfrance.org/en/eiffel-scholarship-program-of-excellence',
    'MEXT Scholarship (Japanese Government)': 'https://www.mext.go.jp/en/',
    'JASSO Scholarship (Japan Student Services Organization)': 'https://www.jasso.go.jp/en/',
    'Chinese Government Scholarship (CSC)': 'https://www.csc.edu.cn/studyinchina',
    'Australia Awards Scholarships': 'https://www.dfat.gov.au/people-to-people/australia-awards-scholarships',
    'Stipendium Hungaricum Scholarship': 'https://stipendiumhungaricum.hu/',
    'Turkiye Burslari (Turkey Scholarships)': 'https://www.turkiyeburslari.gov.tr/',
    'Khalifa University Scholarship (UAE)': 'https://www.ku.ac.ae/',
    'Singapore International Graduate Award (SINGA)': 'https://www.a-star.edu.sg/',
    'Sweden Institute Scholarships for Global Professionals (SISGP)': 'https://si.se/en/apply/scholarships/',
    'New Zealand Scholarships (MFAT)': 'https://www.mfat.govt.nz/',
    'Thai Government Scholarship (TIPP)': 'https://www.tica.thaigov.net/',
    'Malaysia Technical Cooperation Programme (MTCP) Scholarship': 'https://www.kln.gov.my/',
    'Mauritius Africa Scholarship Scheme': 'https://www.gov.mu/',
    'Czech Government Scholarship': 'https://www.msmt.cz/',
    'UK Asian Award (University of Warwick)': 'https://warwick.ac.uk/',
    'UNESCO Social Sciences Scholarship': 'https://en.unesco.org/',
    'Fulbright Foreign Student Program': 'https://pk.usembassy.gov/education-exchanges/',
    'Global Korea Scholarship (KGSP/GKS)': 'https://www.nii.go.kr/',
    'Italian Government Scholarship (Invest Your Talent in Italy)': 'https://www.investyourtalent.it/',
  };

  let fixed = 0;
  for (const [name, url] of Object.entries(urlFixes)) {
    const result = await q(`UPDATE "Scholarship" SET source_url = '${url}' WHERE name = '${name.replace(/'/g, "''")}' AND (source_url IS NULL OR source_url != '${url}') RETURNING id`);
    if (result.length > 0) {
      console.log(`  ✅ ${name} → ${url}`);
      fixed++;
    }
  }
  console.log(`\nURLs fixed: ${fixed}`);

  // ===== NOW ADD ALL MISSING DEGREE PROGRAMS =====
  console.log('\n=== ADDING ALL DEGREE PROGRAMS ===\n');

  // Complete list of ALL education programs in Pakistan + international
  const PROGRAM_MAP: Record<string, string[]> = {
    // Medical scholarships → MBBS, BDS, Nursing, Pharmacy etc
    'Army Medical College MBBS Scholarship': ['MBBS', 'BDS', 'Bachelor'],
    'Pakistan Red Crescent Medical Scholarship': ['MBBS', 'BDS', 'Nursing', 'Bachelor'],
    'Pakistan Pharmaceutical Scientists Scholarship': ['Pharm.D', 'M.Phil Pharmacy', 'PhD'],
    'PARC Agricultural Research Scholarship': ['BSc Agriculture', 'MSc Agriculture', 'PhD'],
    'NESPAK Engineering Scholarship': ['BE/BSc Engineering', 'ME/MSc Engineering', 'Bachelor', 'Master'],

    // Law
    'Justice Fazal Ghani Law Scholarship': ['LLB', 'Bachelor'],

    // Business
    'State Bank International Business Scholarship': ['Master', 'PhD', 'MBA'],
    'LUMS Business Scholarship': ['BBA', 'MBA', 'Bachelor', 'Master'],

    // IT
    'National Computing Scholarship Program': ['BS Computer Science', 'BS IT', 'MS Computer Science', 'Bachelor', 'Master'],

    // Arts
    'National College of Arts Scholarship': ['BFA', 'MFA', 'Bachelor', 'Master'],
    'Institute of Architects Pakistan Scholarship': ['B.Arch', 'M.Arch', 'Bachelor'],

    // Pakistani general scholarships → add ALL common programs
    'Punjab Honhaar Scholarship Program': ['Intermediate', 'Bachelor', 'Master', 'PhD', 'MBBS', 'BE/BSc Engineering', 'BBA', 'LLB'],
    'Punjab Educational Endowment Fund (PEEF) Scholarship': ['Intermediate', 'Bachelor', 'Master', 'PhD', 'MBBS', 'BE/BSc Engineering'],
    'Chief Minister Punjab Special Merit Scholarship': ['Bachelor', 'Master', 'MBBS', 'BE/BSc Engineering'],
    'KPK Chief Minister Merit Scholarship': ['Intermediate', 'Bachelor', 'Master', 'PhD', 'MBBS'],
    'KPK Ehsaas Scholarship': ['Bachelor', 'Master', 'MBBS', 'BE/BSc Engineering'],
    'Khyber Pakhtunkhwa Education Endowment Fund (KEEF)': ['Intermediate', 'Bachelor', 'Master', 'PhD'],
    'Sindh Government Merit Scholarship': ['Intermediate', 'Bachelor', 'Master', 'PhD', 'MBBS', 'BE/BSc Engineering'],
    'Sindh Talent Hunt Program (STHP)': ['Bachelor', 'Master', 'MBBS', 'BE/BSc Engineering'],
    'SEEF Workers Scholarship (Sindh):': ['Intermediate', 'Bachelor', 'Master', 'Diploma'],
    'Benazir Bhutto Scholarship (Sindh)': ['Bachelor', 'Master', 'MBBS'],
    'CM Sindh Merit Scholarship': ['Bachelor', 'Master', 'MBBS', 'BE/BSc Engineering'],
    'Balochistan Government Scholarship': ['Intermediate', 'Bachelor', 'Master', 'PhD', 'MBBS'],
    'Balochistan Education Endowment Fund (BEEF) Scholarship': ['Bachelor', 'Master', 'Intermediate'],
    'Pakistan Bait-ul-Mal Scholarship': ['Intermediate', 'Bachelor', 'Master', 'PhD', 'MBBS', 'BE/BSc Engineering', 'BBA', 'LLB'],
    'Prime Minister Education Scholarship': ['Intermediate', 'Bachelor', 'Master', 'PhD', 'MBBS', 'BE/BSc Engineering', 'BBA'],
    'National Talent Hunt Program (NTHP)': ['Bachelor', 'MBBS', 'BE/BSc Engineering', 'BBA'],
    'NTS-HEC Test-Based Scholarship': ['Bachelor', 'Master', 'PhD', 'MBBS', 'BE/BSc Engineering'],
    'Pakistan Navy Officer Entry Scholarship': ['Bachelor', 'MBBS', 'BE/BSc Engineering', 'Diploma'],
    'PAF Officer Commission Scholarship': ['Bachelor', 'BE/BSc Engineering', 'Diploma'],
    'Fauji Foundation Scholarship': ['Intermediate', 'Bachelor', 'Master', 'Diploma'],
    'Gilgit-Baltistan Scholarship': ['Intermediate', 'Bachelor', 'Master'],
    'HEC Need-Based Scholarship': ['Bachelor', 'Master', 'PhD', 'MBBS', 'BE/BSc Engineering'],
    'HEC Merit-Based Scholarship': ['Bachelor', 'Master', 'PhD', 'MBBS', 'BE/BSc Engineering'],
    'HEC Overseas Scholarship for MS/MPhil leading to PhD': ['Master', 'PhD'],
    'HEC Masters (Indigenous) Scholarship': ['Master'],
    'Ehsaas Undergraduate Scholarship Program': ['Bachelor', 'Intermediate'],

    // International
    'Chevening Scholarship': ['Master'],
    'Commonwealth Masters Scholarship': ['Master', 'PhD'],
    'Campus France / Eiffel Excellence Scholarship': ['Master', 'PhD'],
    'MEXT Scholarship (Japanese Government)': ['Bachelor', 'Master', 'PhD'],
    'JASSO Scholarship (Japan Student Services Organization)': ['Bachelor', 'Master'],
    'Chinese Government Scholarship (CSC)': ['Bachelor', 'Master', 'PhD'],
    'Australia Awards Scholarships': ['Bachelor', 'Master', 'PhD'],
    'Stipendium Hungaricum Scholarship': ['Bachelor', 'Master', 'PhD'],
    'Turkiye Burslari (Turkey Scholarships)': ['Bachelor', 'Master', 'PhD'],
    'Khalifa University Scholarship (UAE)': ['Bachelor', 'Master', 'PhD'],
    'Singapore International Graduate Award (SINGA)': ['PhD'],
    'Sweden Institute Scholarships for Global Professionals (SISGP)': ['Master'],
    'New Zealand Scholarships (MFAT)': ['Bachelor', 'Master'],
    'Thai Government Scholarship (TIPP)': ['Master', 'PhD'],
    'Malaysia Technical Cooperation Programme (MTCP) Scholarship': ['Master', 'PhD'],
    'Mauritius Africa Scholarship Scheme': ['Bachelor', 'Master'],
    'Czech Government Scholarship': ['Bachelor', 'Master', 'PhD'],
    'UK Asian Award (University of Warwick)': ['Master', 'PhD'],
    'UNESCO Social Sciences Scholarship': ['Master', 'PhD'],
    'Fulbright Foreign Student Program': ['Master', 'PhD'],
    'Global Korea Scholarship (KGSP/GKS)': ['Bachelor', 'Master', 'PhD'],
    'Italian Government Scholarship (Invest Your Talent in Italy)': ['Master'],
  };

  let addedProgs = 0;
  let skippedProgs = 0;

  for (const [name, programs] of Object.entries(PROGRAM_MAP)) {
    const found = await q(`SELECT id FROM "Scholarship" WHERE name = '${name.replace(/'/g, "''")}'`);
    if (found.length === 0) continue;
    const sid = found[0].id;

    for (const prog of programs) {
      // Check if this exact program_type already exists
      const exists = await q(`SELECT COUNT(*) as c FROM scholarship_requirements WHERE scholarship_id = '${sid}' AND requirement_type = 'program_type' AND requirement_value = '${prog}'`);
      if (parseInt(exists[0].c) > 0) {
        skippedProgs++;
        continue;
      }
      await q(`INSERT INTO scholarship_requirements (id, scholarship_id, requirement_type, requirement_value, is_required, created_at) VALUES (gen_random_uuid()::text, '${sid}', 'program_type', '${prog}', false, NOW())`);
      addedProgs++;
    }
  }

  console.log(`Program types added: ${addedProgs}`);
  console.log(`Program types skipped (already exist): ${skippedProgs}`);

  // Final stats
  const allPrograms = await q(`SELECT DISTINCT requirement_value, COUNT(*) as c FROM scholarship_requirements WHERE requirement_type = 'program_type' GROUP BY requirement_value ORDER BY c DESC`);
  console.log('\nAll program types in DB:');
  for (const p of allPrograms) console.log(`  "${p.requirement_value}" → ${p.c} scholarships`);

  // Test MBBS filter
  const mbbs = await q(`SELECT COUNT(*) as c FROM "Scholarship" WHERE EXISTS (SELECT 1 FROM scholarship_requirements WHERE scholarship_requirements.scholarship_id = "Scholarship".id AND requirement_type IN ('program_type', 'degree_level') AND requirement_value = 'MBBS')`);
  console.log(`\nFilter "MBBS": ${mbbs[0].c} scholarships`);
}

main().catch(e => console.log('FATAL:', e.message));
