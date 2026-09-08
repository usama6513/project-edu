import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_sIdUA94RKqzc@ep-tiny-bar-axkuh1yf.c-4.us-east-2.aws.neon.tech/neondb');
async function q(text: string) {
  const strings = [text] as any;
  strings.raw = [text];
  return sql(strings);
}

async function main() {
  const totalCampuses = await q(`SELECT COUNT(*) as c FROM campuses`);
  const unisWithCampuses = await q(`SELECT COUNT(DISTINCT university_id) as c FROM campuses`);
  console.log(`Total campuses: ${totalCampuses[0].c}`);
  console.log(`Universities with campuses: ${unisWithCampuses[0].c}`);

  // Show top 5
  const top = await q(`SELECT u.name, COUNT(c.id) as campus_count FROM universities u JOIN campuses c ON u.id = c.university_id WHERE u.country = 'Pakistan' GROUP BY u.name ORDER BY campus_count DESC LIMIT 5`);
  console.log('\nTop 5 by campus count:');
  for (const u of top) console.log(`  ${u.name}: ${u.campus_count} campuses`);

  // Show FAST as example
  const fast = await q(`SELECT name, city, is_main FROM campuses WHERE university_id = (SELECT id FROM universities WHERE name ILIKE '%FAST%') ORDER BY is_main DESC`);
  console.log('\nFAST-NUCES campuses:');
  for (const c of fast) console.log(`  ${c.is_main ? '🏛️' : '  '} ${c.name} (${c.city})`);

  // Check AI data for PU
  const pu = await q(`SELECT admission_process, admission_dates, fee_range, exam_system, is_open_merit FROM universities WHERE name ILIKE '%Punjab%' AND country = 'Pakistan' LIMIT 1`);
  if (pu.length > 0) {
    console.log('\nPU AI data:');
    console.log(`  admission_process: ${pu[0].admission_process?.substring(0, 60)}...`);
    console.log(`  admission_dates: ${pu[0].admission_dates}`);
    console.log(`  fee_range: ${pu[0].fee_range}`);
    console.log(`  exam_system: ${pu[0].exam_system}`);
    console.log(`  is_open_merit: ${pu[0].is_open_merit}`);
  }
}

main().catch(e => console.log('FATAL:', e.message));
