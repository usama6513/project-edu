import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_sIdUA94RKqzc@ep-tiny-bar-axkuh1yf.c-4.us-east-2.aws.neon.tech/neondb');
async function q(text: string) {
  const strings = [text] as any;
  strings.raw = [text];
  return sql(strings);
}

async function main() {
  const total = await q(`SELECT COUNT(*) as c FROM "Scholarship"`);
  console.log(`Total scholarships: ${total[0].c}`);

  const categories = await q(`SELECT category, COUNT(*) as c FROM "Scholarship" GROUP BY category ORDER BY c DESC`);
  console.log('\nCategories:');
  for (const c of categories) console.log(`  "${c.category}" → ${c.c}`);

  const countries = await q(`SELECT country, COUNT(*) as c FROM "Scholarship" GROUP BY country ORDER BY c DESC LIMIT 10`);
  console.log('\nTop countries:');
  for (const c of countries) console.log(`  "${c.country}" → ${c.c}`);

  // Test the actual query the frontend sends
  const testLocal = await q(`SELECT COUNT(*) as c FROM "Scholarship" WHERE category = 'local'`);
  console.log(`\nWith category='local': ${testLocal[0].c}`);

  const testPakistan = await q(`SELECT COUNT(*) as c FROM "Scholarship" WHERE country LIKE '%Pakistan%'`);
  console.log(`With country LIKE '%Pakistan%': ${testPakistan[0].c}`);

  const testNoFilter = await q(`SELECT COUNT(*) as c FROM "Scholarship"`);
  console.log(`No filter at all: ${testNoFilter[0].c}`);
}

main().catch(e => console.log('FATAL:', e.message));
