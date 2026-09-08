import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_sIdUA94RKqzc@ep-tiny-bar-axkuh1yf.c-4.us-east-2.aws.neon.tech/neondb');
async function q(text: string) {
  const strings = [text] as any;
  strings.raw = [text];
  return sql(strings);
}

async function main() {
  // 1. All universities in Chitral city
  const chitralUnis = await q(`SELECT id, name, type, sector, admission_process IS NOT NULL as has_ai FROM universities WHERE city ILIKE '%chitral%' AND country = 'Pakistan'`);
  console.log('=== UNIVERSITIES IN CHITRAL ===');
  console.log(`Total: ${chitralUnis.length}`);
  for (const u of chitralUnis) {
    console.log(`  - ${u.name} (${u.type}, ${u.sector}) ${u.has_ai ? '✅ AI data' : '❌ No AI data'}`);
  }

  // 2. Overall stats: how many Pakistani unis have AI data vs not
  const stats = await q(`SELECT
    COUNT(*) as total,
    COUNT(CASE WHEN admission_process IS NOT NULL THEN 1 END) as has_ai_data,
    COUNT(CASE WHEN admission_process IS NULL THEN 1 END) as no_ai_data
    FROM universities WHERE country = 'Pakistan'`);
  console.log('\n=== PAKISTANI UNIVERSITIES OVERALL ===');
  console.log(`  Total: ${stats[0].total}`);
  console.log(`  With AI admission data: ${stats[0].has_ai_data}`);
  console.log(`  Without AI admission data: ${stats[0].no_ai_data}`);

  // 3. How many have campuses
  const campusStats = await q(`SELECT COUNT(DISTINCT university_id) as c FROM campuses WHERE university_id IN (SELECT id FROM universities WHERE country = 'Pakistan')`);
  console.log(`  With campus data: ${campusStats[0].c}`);

  // 4. How many have departments
  const deptStats = await q(`SELECT COUNT(DISTINCT university_id) as c FROM departments WHERE university_id IN (SELECT id FROM universities WHERE country = 'Pakistan')`);
  console.log(`  With department data: ${deptStats[0].c}`);

  // 5. Check if any university has "evening" in programs
  const evening = await q(`SELECT COUNT(*) as c FROM courses WHERE university_id IN (SELECT id FROM universities WHERE country = 'Pakistan') AND (name ILIKE '%evening%' OR description ILIKE '%evening%')`);
  console.log(`  Courses with "evening" in name/desc: ${evening[0].c}`);
}

main().catch(e => console.log('FATAL:', e.message));
