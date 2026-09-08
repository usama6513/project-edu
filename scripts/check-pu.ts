import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_sIdUA94RKqzc@ep-tiny-bar-axkuh1yf.c-4.us-east-2.aws.neon.tech/neondb');
async function q(text: string) {
  const strings = [text] as any;
  strings.raw = [text];
  return sql(strings);
}

async function main() {
  // Find all Punjab matches
  const punjabs = await q(`SELECT id, name, admission_process, admission_dates, fee_range, exam_system, is_open_merit FROM universities WHERE name ILIKE '%punjab%' AND country = 'Pakistan'`);
  console.log(`Found ${punjabs.length} universities matching 'punjab':`);
  for (const p of punjabs) {
    console.log(`\n  ID: ${p.id}`);
    console.log(`  Name: ${p.name}`);
    console.log(`  admission_process: ${p.admission_process?.substring(0, 60) || 'NULL'}`);
    console.log(`  admission_dates: ${p.admission_dates || 'NULL'}`);
    console.log(`  fee_range: ${p.fee_range || 'NULL'}`);
    console.log(`  exam_system: ${p.exam_system || 'NULL'}`);
    console.log(`  is_open_merit: ${p.is_open_merit}`);
  }

  // Also check how many unis have AI data now
  const withAI = await q(`SELECT name FROM universities WHERE country = 'Pakistan' AND admission_process IS NOT NULL LIMIT 20`);
  console.log(`\nUniversities with admission_process: ${withAI.length}`);
  for (const u of withAI) console.log(`  - ${u.name}`);
}

main().catch(e => console.log('FATAL:', e.message));
