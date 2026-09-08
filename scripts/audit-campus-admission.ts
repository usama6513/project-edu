import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_sIdUA94RKqzc@ep-tiny-bar-axkuh1yf.c-4.us-east-2.aws.neon.tech/neondb');
async function q(text: string) {
  const strings = [text] as any;
  strings.raw = [text];
  return sql(strings);
}

async function main() {
  console.log('=== CAMPUS & ADMISSION AUDIT ===\n');

  // Total stats
  const totalUnis = await q(`SELECT COUNT(*) as c FROM universities WHERE country = 'Pakistan'`);
  const withCampuses = await q(`SELECT COUNT(DISTINCT university_id) as c FROM campuses`);
  const withAdmReq = await q(`SELECT COUNT(DISTINCT university_id) as c FROM admission_requirements`);
  const totalCampuses = await q(`SELECT COUNT(*) as c FROM campuses`);
  const totalAdmReqs = await q(`SELECT COUNT(*) as c FROM admission_requirements`);

  console.log(`Pakistani Universities: ${totalUnis[0].c}`);
  console.log(`Universities with campuses: ${withCampuses[0].c}`);
  console.log(`Total campuses: ${totalCampuses[0].c}`);
  console.log(`Universities with admission_requirements: ${withAdmReq[0].c}`);
  console.log(`Total admission_requirements: ${totalAdmReqs[0].c}`);

  // Check major universities
  const searches = [
    'University of the Punjab',
    'University of Karachi',
    'FAST-NUCES',
    'National University of Sciences',
    'COMSATS',
    'NED University',
    'Quaid-i-Azam',
    'Lahore University of Management',
    'Ghulam Ishaq Khan',
    'Air University',
    'Bahria University',
  ];

  console.log('\n=== MAJOR UNI DETAILS ===\n');
  for (const name of searches) {
    const unis = await q(`SELECT id, name FROM universities WHERE country = 'Pakistan' AND name ILIKE '%${name}%' LIMIT 1`);
    if (unis.length === 0) { console.log(`  ⚠ "${name}" NOT FOUND`); continue; }
    const u = unis[0];
    const campuses = await q(`SELECT name, city, is_main FROM campuses WHERE university_id = '${u.id}' ORDER BY is_main DESC`);
    const admReqs = await q(`SELECT requirement_type, requirement_value FROM admission_requirements WHERE university_id = '${u.id}'`);
    const courses = await q(`SELECT COUNT(*) as c FROM courses WHERE university_id = '${u.id}'`);
    console.log(`  📍 ${u.name}`);
    console.log(`     Programs: ${courses[0].c} | Campuses: ${campuses.length} | Admission Reqs: ${admReqs.length}`);
    if (campuses.length > 0) {
      for (const c of campuses) {
        console.log(`       🏛️ ${c.name} (${c.city}) ${c.is_main ? '[MAIN]' : ''}`);
      }
    }
    if (admReqs.length > 0) {
      for (const a of admReqs.slice(0, 3)) {
        console.log(`       📋 ${a.requirement_type}: ${a.requirement_value?.substring(0, 60)}`);
      }
    }
    console.log('');
  }

  // Check AI knowledge fields
  console.log('\n=== AI KNOWLEDGE FIELDS (admission_process, admission_dates, fee_range) ===\n');
  const aiFields = await q(`SELECT name, admission_process, admission_dates, fee_range, closing_merit, exam_system FROM universities WHERE country = 'Pakistan' AND (admission_process IS NOT NULL OR admission_dates IS NOT NULL OR fee_range IS NOT NULL) LIMIT 10`);
  console.log(`Universities with AI knowledge fields: ${aiFields.length}`);
  for (const u of aiFields) {
    console.log(`  📍 ${u.name}`);
    if (u.admission_process) console.log(`     admission_process: ${u.admission_process.substring(0, 80)}...`);
    if (u.admission_dates) console.log(`     admission_dates: ${u.admission_dates}`);
    if (u.fee_range) console.log(`     fee_range: ${u.fee_range}`);
    if (u.closing_merit) console.log(`     closing_merit: ${u.closing_merit?.substring(0, 80)}...`);
    if (u.exam_system) console.log(`     exam_system: ${u.exam_system}`);
    console.log('');
  }

  // Count how many have each field
  const fieldCounts = await q(`SELECT
    COUNT(CASE WHEN admission_process IS NOT NULL THEN 1 END) as has_admission_process,
    COUNT(CASE WHEN admission_dates IS NOT NULL THEN 1 END) as has_admission_dates,
    COUNT(CASE WHEN fee_range IS NOT NULL THEN 1 END) as has_fee_range,
    COUNT(CASE WHEN closing_merit IS NOT NULL THEN 1 END) as has_closing_merit,
    COUNT(CASE WHEN entry_test_details IS NOT NULL THEN 1 END) as has_entry_test,
    COUNT(CASE WHEN exam_system IS NOT NULL THEN 1 END) as has_exam_system,
    COUNT(CASE WHEN scholarships_offered IS NOT NULL THEN 1 END) as has_scholarships,
    COUNT(CASE WHEN supply_policy IS NOT NULL THEN 1 END) as has_supply_policy,
    COUNT(CASE WHEN is_open_merit IS NOT NULL THEN 1 END) as has_open_merit
    FROM universities WHERE country = 'Pakistan'`);
  console.log('\n=== AI FIELD COVERAGE (Pakistani Unis) ===');
  const fc = fieldCounts[0];
  console.log(`  admission_process: ${fc.has_admission_process}`);
  console.log(`  admission_dates:   ${fc.has_admission_dates}`);
  console.log(`  fee_range:         ${fc.has_fee_range}`);
  console.log(`  closing_merit:     ${fc.has_closing_merit}`);
  console.log(`  entry_test_details:${fc.has_entry_test}`);
  console.log(`  exam_system:       ${fc.has_exam_system}`);
  console.log(`  scholarships:      ${fc.has_scholarships}`);
  console.log(`  supply_policy:     ${fc.has_supply_policy}`);
  console.log(`  is_open_merit:     ${fc.has_open_merit}`);
}

main().catch(e => console.log('FATAL:', e.message));
