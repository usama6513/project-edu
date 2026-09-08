import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_sIdUA94RKqzc@ep-tiny-bar-axkuh1yf.c-4.us-east-2.aws.neon.tech/neondb');
async function q(text: string) {
  const strings = [text] as any;
  strings.raw = [text];
  return sql(strings);
}

const PROGRAM_MAP: Record<string, string[]> = {
  'Army Medical College MBBS Scholarship': ['MBBS', 'BDS', 'Nursing'],
  'Pakistan Red Crescent Medical Scholarship': ['MBBS', 'BDS', 'Nursing'],
  'Pakistan Pharmaceutical Scientists Scholarship': ['Pharm.D', 'M.Phil Pharmacy'],
  'PARC Agricultural Research Scholarship': ['BSc Agriculture', 'MSc Agriculture'],
  'NESPAK Engineering Scholarship': ['BE/BSc Engineering', 'ME/MSc Engineering'],
  'Justice Fazal Ghani Law Scholarship': ['LLB'],
  'State Bank International Business Scholarship': ['MBA'],
  'LUMS Business Scholarship': ['BBA', 'MBA'],
  'National Computing Scholarship Program': ['BS Computer Science', 'BS IT', 'MS Computer Science'],
  'National College of Arts Scholarship': ['BFA', 'MFA'],
  'Institute of Architects Pakistan Scholarship': ['B.Arch', 'M.Arch'],
  'Punjab Honhaar Scholarship Program': ['Intermediate', 'MBBS', 'BE/BSc Engineering', 'BBA', 'LLB'],
  'Punjab Educational Endowment Fund (PEEF) Scholarship': ['Intermediate', 'MBBS', 'BE/BSc Engineering'],
  'Chief Minister Punjab Special Merit Scholarship': ['MBBS', 'BE/BSc Engineering'],
  'KPK Chief Minister Merit Scholarship': ['Intermediate', 'MBBS'],
  'KPK Ehsaas Scholarship': ['MBBS', 'BE/BSc Engineering'],
  'Khyber Pakhtunkhwa Education Endowment Fund (KEEF)': ['Intermediate'],
  'Sindh Government Merit Scholarship': ['Intermediate', 'MBBS', 'BE/BSc Engineering'],
  'Sindh Talent Hunt Program (STHP)': ['MBBS', 'BE/BSc Engineering'],
  'Benazir Bhutto Scholarship (Sindh)': ['MBBS'],
  'CM Sindh Merit Scholarship': ['MBBS', 'BE/BSc Engineering'],
  'Balochistan Government Scholarship': ['Intermediate', 'MBBS'],
  'Balochistan Education Endowment Fund (BEEF) Scholarship': ['Intermediate'],
  'Pakistan Bait-ul-Mal Scholarship': ['Intermediate', 'MBBS', 'BE/BSc Engineering', 'BBA', 'LLB'],
  'Prime Minister Education Scholarship': ['Intermediate', 'MBBS', 'BE/BSc Engineering', 'BBA'],
  'National Talent Hunt Program (NTHP)': ['MBBS', 'BE/BSc Engineering', 'BBA'],
  'NTS-HEC Test-Based Scholarship': ['MBBS', 'BE/BSc Engineering'],
  'Pakistan Navy Officer Entry Scholarship': ['MBBS', 'BE/BSc Engineering', 'Diploma'],
  'PAF Officer Commission Scholarship': ['BE/BSc Engineering', 'Diploma'],
  'Fauji Foundation Scholarship': ['Intermediate', 'Diploma'],
  'Gilgit-Baltistan Scholarship': ['Intermediate'],
  'HEC Need-Based Scholarship': ['MBBS', 'BE/BSc Engineering'],
  'HEC Merit-Based Scholarship': ['MBBS', 'BE/BSc Engineering'],
  'Ehsaas Undergraduate Scholarship Program': ['Intermediate'],
};

async function main() {
  console.log('=== ADDING PROGRAM TYPES ===\n');
  let added = 0;

  for (const [name, programs] of Object.entries(PROGRAM_MAP)) {
    const found = await q(`SELECT id FROM "Scholarship" WHERE name = '${name.replace(/'/g, "''")}'`);
    if (found.length === 0) { console.log(`❌ ${name}`); continue; }
    const sid = found[0].id;

    for (const prog of programs) {
      const exists = await q(`SELECT COUNT(*) as c FROM scholarship_requirements WHERE scholarship_id = '${sid}' AND requirement_type = 'program_type' AND requirement_value = '${prog}'`);
      if (parseInt(exists[0].c) > 0) continue;
      await q(`INSERT INTO scholarship_requirements (id, scholarship_id, requirement_type, requirement_value, is_required, created_at) VALUES (gen_random_uuid()::text, '${sid}', 'program_type', '${prog}', false, NOW())`);
      added++;
    }
    console.log(`✅ ${name}`);
  }

  console.log(`\nProgram types added: ${added}`);

  // Stats
  const all = await q(`SELECT DISTINCT requirement_value, COUNT(*) as c FROM scholarship_requirements WHERE requirement_type = 'program_type' GROUP BY requirement_value ORDER BY c DESC`);
  console.log('\nAll program types:');
  for (const p of all) console.log(`  "${p.requirement_value}" → ${p.c}`);
}

main().catch(e => console.log('FATAL:', e.message));
