import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_sIdUA94RKqzc@ep-tiny-bar-axkuh1yf.c-4.us-east-2.aws.neon.tech/neondb');
async function q(text: string) {
  const strings = [text] as any;
  strings.raw = [text];
  return sql(strings);
}

// Map scholarship names to degree levels they support
const DEGREE_MAP: Record<string, string[]> = {
  // Medical
  'Army Medical College MBBS Scholarship': ['Bachelor'],
  'Pakistan Red Crescent Medical Scholarship': ['Bachelor'],
  'Pakistan Pharmaceutical Scientists Scholarship': ['Bachelor', 'PhD'],
  'PARC Agricultural Research Scholarship': ['Bachelor', 'Master', 'PhD'],
  'NESPAK Engineering Scholarship': ['Bachelor', 'Master'],

  // Law
  'Justice Fazal Ghani Law Scholarship': ['Bachelor'],

  // Business/IT
  'State Bank International Business Scholarship': ['Master', 'PhD'],
  'LUMS Business Scholarship': ['Bachelor', 'Master', 'MBA'],
  'National Computing Scholarship Program': ['Bachelor', 'Master'],

  // Arts
  'National College of Arts Scholarship': ['Bachelor', 'Master'],
  'Institute of Architects Pakistan Scholarship': ['Bachelor'],

  // General Pakistani scholarships (most support all levels)
  'Punjab Honhaar Scholarship Program': ['Bachelor', 'Master', 'PhD'],
  'Punjab Educational Endowment Fund (PEEF) Scholarship': ['Bachelor', 'Master', 'PhD'],
  'Chief Minister Punjab Special Merit Scholarship': ['Bachelor', 'Master'],
  'KPK Chief Minister Merit Scholarship': ['Bachelor', 'Master', 'PhD'],
  'KPK Ehsaas Scholarship': ['Bachelor', 'Master'],
  'Khyber Pakhtunkhwa Education Endowment Fund (KEEF)': ['Bachelor', 'Master', 'PhD'],
  'Sindh Government Merit Scholarship': ['Bachelor', 'Master', 'PhD'],
  'Sindh Talent Hunt Program (STHP)': ['Bachelor', 'Master'],
  'SEEF Workers Scholarship (Sindh)': ['Bachelor', 'Master', 'Diploma'],
  'Benazir Bhutto Scholarship (Sindh)': ['Bachelor', 'Master'],
  'CM Sindh Merit Scholarship': ['Bachelor', 'Master'],
  'Balochistan Government Scholarship': ['Bachelor', 'Master', 'PhD'],
  'Balochistan Education Endowment Fund (BEEF) Scholarship': ['Bachelor', 'Master'],
  'Pakistan Bait-ul-Mal Scholarship': ['Bachelor', 'Master', 'PhD'],
  'Prime Minister Education Scholarship': ['Bachelor', 'Master', 'PhD'],
  'National Talent Hunt Program (NTHP)': ['Bachelor'],
  'NTS-HEC Test-Based Scholarship': ['Bachelor', 'Master', 'PhD'],
  'Pakistan Navy Officer Entry Scholarship': ['Bachelor'],
  'PAF Officer Commission Scholarship': ['Bachelor'],

  // International scholarships
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
};

async function main() {
  console.log('=== ADDING DEGREE REQUIREMENTS TO SCHOLARSHIPS ===\n');

  // Get all scholarships
  const scholarships = await q(`SELECT id, name FROM "Scholarship"`);
  console.log(`Total scholarships: ${scholarships.length}`);

  let added = 0;
  let skipped = 0;

  for (const s of scholarships) {
    const levels = DEGREE_MAP[s.name];
    if (!levels || levels.length === 0) {
      console.log(`  ⚠️ No mapping for: ${s.name}`);
      skipped++;
      continue;
    }

    // Check if requirements already exist
    const existing = await q(`SELECT COUNT(*) as c FROM scholarship_requirements WHERE scholarship_id = '${s.id}' AND requirement_type = 'degree_level'`);
    if (parseInt(existing[0].c) > 0) {
      console.log(`  ⏭️ ${s.name} already has degree requirements`);
      continue;
    }

    // Insert degree_level requirements
    for (const level of levels) {
      await q(`INSERT INTO scholarship_requirements (id, scholarship_id, requirement_type, requirement_value, is_required, created_at) VALUES (gen_random_uuid()::text, '${s.id}', 'degree_level', '${level}', false, NOW())`);
      added++;
    }
    console.log(`  ✅ ${s.name} → ${levels.join(', ')}`);
  }

  // Verify
  const finalCount = await q(`SELECT COUNT(*) as c FROM scholarship_requirements WHERE requirement_type = 'degree_level'`);
  console.log(`\n=== SUMMARY ===`);
  console.log(`Added ${added} degree_level requirements`);
  console.log(`Skipped ${skipped} scholarships (no mapping)`);
  console.log(`Total degree_level requirements now: ${finalCount[0].c}`);

  // Test the filter query
  const testBachelor = await q(`
    SELECT COUNT(*) as c FROM "Scholarship"
    WHERE category = 'local'
    AND country LIKE '%Pakistan%'
    AND EXISTS (
      SELECT 1 FROM scholarship_requirements
      WHERE scholarship_requirements.scholarship_id = "Scholarship".id
      AND requirement_type = 'degree_level' AND requirement_value LIKE '%Bachelor%'
    )
  `);
  console.log(`\nFilter test (local + Pakistan + Bachelor): ${testBachelor[0].c}`);

  const testMaster = await q(`
    SELECT COUNT(*) as c FROM "Scholarship"
    WHERE category = 'local'
    AND country LIKE '%Pakistan%'
    AND EXISTS (
      SELECT 1 FROM scholarship_requirements
      WHERE scholarship_requirements.scholarship_id = "Scholarship".id
      AND requirement_type = 'degree_level' AND requirement_value LIKE '%Master%'
    )
  `);
  console.log(`Filter test (local + Pakistan + Master): ${testMaster[0].c}`);

  const testPhD = await q(`
    SELECT COUNT(*) as c FROM "Scholarship"
    WHERE category = 'local'
    AND country LIKE '%Pakistan%'
    AND EXISTS (
      SELECT 1 FROM scholarship_requirements
      WHERE scholarship_requirements.scholarship_id = "Scholarship".id
      AND requirement_type = 'degree_level' AND requirement_value LIKE '%PhD%'
    )
  `);
  console.log(`Filter test (local + Pakistan + PhD): ${testPhD[0].c}`);

  // Show all unique degree values
  const allDegrees = await q(`SELECT DISTINCT requirement_value, COUNT(*) as c FROM scholarship_requirements WHERE requirement_type = 'degree_level' GROUP BY requirement_value ORDER BY c DESC`);
  console.log('\nAll degree levels in DB:');
  for (const d of allDegrees) console.log(`  "${d.requirement_value}" → ${d.c} scholarships`);
}

main().catch(e => console.log('FATAL:', e.message));
