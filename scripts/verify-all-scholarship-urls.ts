import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_sIdUA94RKqzc@ep-tiny-bar-axkuh1yf.c-4.us-east-2.aws.neon.tech/neondb');
async function q(text: string) {
  const strings = [text] as any;
  strings.raw = [text];
  return sql(strings);
}

async function checkUrl(url: string): Promise<{ ok: boolean; status: number }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { 
      method: 'HEAD', 
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    clearTimeout(timeout);
    return { ok: res.ok || res.status < 400, status: res.status };
  } catch {
    return { ok: false, status: 0 };
  }
}

async function main() {
  const scholarships = await q(`SELECT name, source_url FROM "Scholarship" WHERE source_url IS NOT NULL ORDER BY name`);
  console.log(`Checking ${scholarships.length} URLs...\n`);

  const broken: { name: string; url: string; status: number }[] = [];

  for (const s of scholarships) {
    const result = await checkUrl(s.source_url);
    const icon = result.ok ? '✅' : '❌';
    console.log(`${icon} [${result.status}] ${s.name}`);
    console.log(`   ${s.source_url}`);
    if (!result.ok) {
      broken.push({ name: s.name, url: s.source_url, status: result.status });
    }
  }

  console.log(`\n=== BROKEN URLs: ${broken.length} ===`);
  for (const b of broken) {
    console.log(`  ❌ ${b.name} → ${b.url} (status: ${b.status})`);
  }
}

main().catch(e => console.log('FATAL:', e.message));
