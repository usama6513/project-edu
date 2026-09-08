import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_sIdUA94RKqzc@ep-tiny-bar-axkuh1yf.c-4.us-east-2.aws.neon.tech/neondb');
async function q(text: string) {
  const strings = [text] as any;
  strings.raw = [text];
  return sql(strings);
}

async function main() {
  // Check all scholarship links
  const scholarships = await q(`SELECT id, name, provider, country, source_url FROM "Scholarship" ORDER BY name`);
  console.log(`Total scholarships: ${scholarships.length}\n`);

  let nullSourceUrl = 0;
  let hasSourceUrl = 0;

  console.log('=== ALL SCHOLARSHIP LINKS ===\n');
  for (const s of scholarships) {
    if (s.source_url) hasSourceUrl++; else nullSourceUrl++;

    console.log(`📌 ${s.name}`);
    console.log(`   Provider: ${s.provider}`);
    console.log(`   source_url: ${s.source_url || '❌ NULL'}`);
    console.log('');
  }

  console.log('\n=== SUMMARY ===');
  console.log(`With source_url: ${hasSourceUrl}/${scholarships.length}`);
  console.log(`Null source_url: ${nullSourceUrl}`);
}

main().catch(e => console.log('FATAL:', e.message));
