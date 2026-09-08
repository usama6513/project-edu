import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_sIdUA94RKqzc@ep-tiny-bar-axkuh1yf.c-4.us-east-2.aws.neon.tech/neondb');
async function q(text: string) {
  const strings = [text] as any;
  strings.raw = [text];
  return sql(strings);
}

const REMAINING: Record<string, string[]> = {
  'Fauji Foundation Scholarship': ['Bachelor', 'Master'],
  'Gilgit-Baltistan Scholarship': ['Bachelor', 'Master'],
  'HEC Need-Based Scholarship': ['Bachelor', 'Master', 'PhD'],
  'HEC Merit-Based Scholarship': ['Bachelor', 'Master', 'PhD'],
  'HEC Overseas Scholarship for MS/MPhil leading to PhD': ['Master', 'PhD'],
  'HEC Masters (Indigenous) Scholarship': ['Master'],
  'Ehsaas Undergraduate Scholarship Program': ['Bachelor'],
  'Fulbright Foreign Student Program': ['Master', 'PhD'],
  'Global Korea Scholarship (KGSP/GKS)': ['Bachelor', 'Master', 'PhD'],
  'Italian Government Scholarship (Invest Your Talent in Italy)': ['Master'],
  'MEXT Scholarship (Japanese Government)': ['Bachelor', 'Master', 'PhD'],
  'JASSO Scholarship (Japan Student Services Organization)': ['Bachelor', 'Master'],
  'Chinese Government Scholarship (CSC)': ['Bachelor', 'Master', 'PhD'],
  'Commonwealth Masters Scholarship': ['Master', 'PhD'],
  'Campus France / Eiffel Excellence Scholarship': ['Master', 'PhD'],
  'Turkiye Burslari (Turkey Scholarships)': ['Bachelor', 'Master', 'PhD'],
  'Khalifa University Scholarship (UAE)': ['Bachelor', 'Master', 'PhD'],
  'Singapore International Graduate Award (SINGA)': ['PhD'],
  'New Zealand Scholarships (MFAT)': ['Bachelor', 'Master'],
  'Thai Government Scholarship (TIPP)': ['Master', 'PhD'],
  'UK Asian Award (University of Warwick)': ['Master', 'PhD'],
};

async function main() {
  console.log('=== ADDING REMAINING DEGREE REQUIREMENTS ===\n');

  let added = 0;
  for (const [name, levels] of Object.entries(REMAINING)) {
    const found = await q(`SELECT id FROM "Scholarship" WHERE name = '${name.replace(/'/g, "''")}'`);
    if (found.length === 0) {
      console.log(`  ❌ Not found: ${name}`);
      continue;
    }
    const sid = found[0].id;

    const existing = await q(`SELECT COUNT(*) as c FROM scholarship_requirements WHERE scholarship_id = '${sid}' AND requirement_type = 'degree_level'`);
    if (parseInt(existing[0].c) > 0) {
      console.log(`  ⏭️ Already has: ${name}`);
      continue;
    }

    for (const level of levels) {
      await q(`INSERT INTO scholarship_requirements (id, scholarship_id, requirement_type, requirement_value, is_required, created_at) VALUES (gen_random_uuid()::text, '${sid}', 'degree_level', '${level}', false, NOW())`);
      added++;
    }
    console.log(`  ✅ ${name} → ${levels.join(', ')}`);
  }

  // Final stats
  const total = await q(`SELECT COUNT(*) as c FROM scholarship_requirements WHERE requirement_type = 'degree_level'`);
  console.log(`\nTotal degree_level requirements: ${total[0].c}`);

  const allDegrees = await q(`SELECT DISTINCT requirement_value, COUNT(*) as c FROM scholarship_requirements WHERE requirement_type = 'degree_level' GROUP BY requirement_value ORDER BY c DESC`);
  console.log('\nAll degree levels:');
  for (const d of allDegrees) console.log(`  "${d.requirement_value}" → ${d.c} scholarships`);

  // Filter tests
  for (const level of ['Bachelor', 'Master', 'PhD', 'MBA', 'Diploma']) {
    const r = await q(`SELECT COUNT(*) as c FROM "Scholarship" WHERE EXISTS (SELECT 1 FROM scholarship_requirements WHERE scholarship_requirements.scholarship_id = "Scholarship".id AND requirement_type = 'degree_level' AND requirement_value = '${level}')`);
    console.log(`\nFilter "${level}": ${r[0].c} scholarships`);
  }

  // Test combined filter
  const combined = await q(`
    SELECT COUNT(*) as c FROM "Scholarship"
    WHERE category = 'local' AND country LIKE '%Pakistan%'
    AND EXISTS (SELECT 1 FROM scholarship_requirements WHERE scholarship_requirements.scholarship_id = "Scholarship".id AND requirement_type = 'degree_level' AND requirement_value = 'Bachelor')
  `);
  console.log(`\nCombined (local + Pakistan + Bachelor): ${combined[0].c}`);
}

main().catch(e => console.log('FATAL:', e.message));
