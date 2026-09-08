import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_sIdUA94RKqzc@ep-tiny-bar-axkuh1yf.c-4.us-east-2.aws.neon.tech/neondb');
async function q(text: string) {
  const strings = [text] as any;
  strings.raw = [text];
  return sql(strings);
}

async function main() {
  // Check University of Chitral
  const chitral = await q(`SELECT id, name, type, sector, city, country, admission_process, admission_dates, fee_range, closing_merit, entry_test_details, exam_system, scholarships_offered, supply_policy, is_open_merit FROM universities WHERE name ILIKE '%Chitral%'`);
  console.log('=== University of Chitral ===');
  if (chitral.length === 0) { console.log('NOT FOUND'); return; }
  for (const u of chitral) {
    console.log(`  Name: ${u.name}`);
    console.log(`  Type: ${u.type}`);
    console.log(`  Sector: ${u.sector}`);
    console.log(`  City: ${u.city}`);
    console.log(`  admission_process: ${u.admission_process || 'NULL'}`);
    console.log(`  admission_dates: ${u.admission_dates || 'NULL'}`);
    console.log(`  fee_range: ${u.fee_range || 'NULL'}`);
    console.log(`  closing_merit: ${u.closing_merit || 'NULL'}`);
    console.log(`  entry_test_details: ${u.entry_test_details || 'NULL'}`);
    console.log(`  exam_system: ${u.exam_system || 'NULL'}`);
    console.log(`  scholarships_offered: ${u.scholarships_offered || 'NULL'}`);
    console.log(`  supply_policy: ${u.supply_policy || 'NULL'}`);
    console.log(`  is_open_merit: ${u.is_open_merit}`);
  }

  // Check courses
  const courses = await q(`SELECT COUNT(*) as c FROM courses WHERE university_id = '${chitral[0].id}'`);
  console.log(`\n  Programs: ${courses[0].c}`);

  // Check campuses
  const campuses = await q(`SELECT COUNT(*) as c FROM campuses WHERE university_id = '${chitral[0].id}'`);
  console.log(`  Campuses: ${campuses[0].c}`);

  // Check admission_requirements
  const admReqs = await q(`SELECT COUNT(*) as c FROM admission_requirements WHERE university_id = '${chitral[0].id}'`);
  console.log(`  Admission Requirements: ${admReqs[0].c}`);

  // Also check: how many unis have admission_requirements in the whole DB?
  const totalAdmReqs = await q(`SELECT COUNT(DISTINCT university_id) as c FROM admission_requirements`);
  console.log(`\n  Total universities with admission_requirements: ${totalAdmReqs[0].c}`);
}

main().catch(e => console.log('FATAL:', e.message));
