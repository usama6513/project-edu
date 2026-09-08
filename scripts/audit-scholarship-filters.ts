import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_sIdUA94RKqzc@ep-tiny-bar-axkuh1yf.c-4.us-east-2.aws.neon.tech/neondb');
async function q(text: string) {
  const strings = [text] as any;
  strings.raw = [text];
  return sql(strings);
}

async function main() {
  // 1. Check how many scholarships have requirements at all
  const totalScholarships = await q(`SELECT COUNT(*) as c FROM "Scholarship"`);
  console.log(`Total scholarships: ${totalScholarships[0].c}`);

  const withReqs = await q(`SELECT COUNT(DISTINCT scholarship_id) as c FROM scholarship_requirements`);
  console.log(`Scholarships with requirements: ${withReqs[0].c}`);

  // 2. Check what requirement types and values exist
  const reqTypes = await q(`SELECT requirement_type, COUNT(*) as c FROM scholarship_requirements GROUP BY requirement_type ORDER BY c DESC`);
  console.log('\nRequirement types:');
  for (const r of reqTypes) console.log(`  ${r.requirement_type}: ${r.c}`);

  // 3. Check degree_level values specifically
  const degreeVals = await q(`SELECT requirement_value, COUNT(*) as c FROM scholarship_requirements WHERE requirement_type = 'degree_level' GROUP BY requirement_value ORDER BY c DESC`);
  console.log('\nDegree level values:');
  for (const d of degreeVals) console.log(`  "${d.requirement_value}": ${d.c}`);

  // 4. Check program_type values
  const programVals = await q(`SELECT requirement_value, COUNT(*) as c FROM scholarship_requirements WHERE requirement_type = 'program_type' GROUP BY requirement_value ORDER BY c DESC`);
  console.log('\nProgram type values:');
  for (const p of programVals) console.log(`  "${p.requirement_value}": ${p.c}`);

  // 5. Test the exact query the API runs for category=local + country=Pakistan + degreeLevel=Bachelor
  const testQuery = await q(`
    SELECT COUNT(*) as c FROM "Scholarship"
    WHERE category = 'local'
    AND country LIKE '%Pakistan%'
    AND EXISTS (
      SELECT 1 FROM scholarship_requirements
      WHERE scholarship_requirements.scholarship_id = "Scholarship".id
      AND (
        (requirement_type = 'degree_level' AND requirement_value LIKE '%Bachelor%')
        OR (requirement_type = 'program_type' AND requirement_value LIKE '%Bachelor%')
      )
    )
  `);
  console.log(`\nFilter test (local + Pakistan + Bachelor): ${testQuery[0].c}`);

  // 6. Test without degree filter
  const testNoDegree = await q(`SELECT COUNT(*) as c FROM "Scholarship" WHERE category = 'local' AND country LIKE '%Pakistan%'`);
  console.log(`Filter test (local + Pakistan, no degree): ${testNoDegree[0].c}`);

  // 7. Sample some scholarships with their requirements
  const sample = await q(`
    SELECT s.id, s.name, s.category, s.country,
           array_agg(sr.requirement_type || ':' || sr.requirement_value) as reqs
    FROM "Scholarship" s
    LEFT JOIN scholarship_requirements sr ON sr.scholarship_id = s.id
    WHERE s.category = 'local' AND s.country = 'Pakistan'
    GROUP BY s.id, s.name, s.category, s.country
    LIMIT 10
  `);
  console.log('\nSample local Pakistani scholarships:');
  for (const s of sample) {
    console.log(`  ${s.name} → reqs: ${s.reqs[0] || 'NONE'}`);
  }
}

main().catch(e => console.log('FATAL:', e.message));
