import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_sIdUA94RKqzc@ep-tiny-bar-axkuh1yf.c-4.us-east-2.aws.neon.tech/neondb');
async function q(text: string) {
  const strings = [text] as any;
  strings.raw = [text];
  return sql(strings);
}

async function main() {
  console.log('=== FIXING SCHOLARSHIP CATEGORIES ===\n');

  // Pakistani scholarships should be category='local'
  const result = await q(`UPDATE "Scholarship" SET category = 'local' WHERE country = 'Pakistan' AND category = 'international'`);
  console.log(`Updated Pakistani scholarships to 'local': ${result.length || 'done'}`);

  // Verify
  const categories = await q(`SELECT category, COUNT(*) as c FROM "Scholarship" GROUP BY category ORDER BY c DESC`);
  console.log('\nCategories after fix:');
  for (const c of categories) console.log(`  "${c.category}" → ${c.c}`);

  // Test the query that was failing
  const testLocal = await q(`SELECT COUNT(*) as c FROM "Scholarship" WHERE category = 'local'`);
  console.log(`\nWith category='local': ${testLocal[0].c} scholarships`);

  const testIntl = await q(`SELECT COUNT(*) as c FROM "Scholarship" WHERE category = 'international'`);
  console.log(`With category='international': ${testIntl[0].c} scholarships`);
}

main().catch(e => console.log('FATAL:', e.message));
