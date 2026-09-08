import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_sIdUA94RKqzc@ep-tiny-bar-axkuh1yf.c-4.us-east-2.aws.neon.tech/neondb');
async function q(text: string) {
  const strings = [text] as any;
  strings.raw = [text];
  return sql(strings);
}

async function main() {
  console.log('=== REMOVING FAKE SCHOLARSHIP DEADLINES ===\n');
  console.log('These deadlines were set by data-fill scripts and are NOT real official dates.\n');

  // First, audit: show all scholarships with deadlines
  const withDeadlines = await q(`SELECT id, name, provider, deadline FROM "Scholarship" WHERE deadline IS NOT NULL ORDER BY deadline`);
  console.log(`Found ${withDeadlines.length} scholarships with deadlines:\n`);
  for (const s of withDeadlines) {
    const d = new Date(s.deadline);
    console.log(`  - "${s.name}" (${s.provider}) → ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`);
  }

  // NULL out ALL deadlines - these were all set by our scripts, not official sources
  console.log('\n--- Setting all deadlines to NULL ---\n');
  const result = await q(`UPDATE "Scholarship" SET deadline = NULL WHERE deadline IS NOT NULL`);
  console.log(`  Updated: ${result.length || 'all'} scholarships → deadline = NULL`);

  // Verify
  const remaining = await q(`SELECT COUNT(*) as count FROM "Scholarship" WHERE deadline IS NOT NULL`);
  console.log(`\n  Remaining with deadlines: ${remaining[0].count}`);
  console.log('\nDone. "Upcoming Scholarship Deadlines" section will now show "No upcoming deadlines" until real dates are added.');
}

main().catch(e => console.log('FATAL:', e.message));
