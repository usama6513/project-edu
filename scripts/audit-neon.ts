import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_sIdUA94RKqzc@ep-tiny-bar-axkuh1yf.c-4.us-east-2.aws.neon.tech/neondb');

async function q(text: string) {
  const strings = [text] as any;
  strings.raw = [text];
  return sql(strings);
}

async function main() {
  console.log('Connecting via Neon HTTP driver...\n');

  // 1. INTERNSHIPS AUDIT
  const intCount = await q(`SELECT count(*) FROM internships`);
  const total = parseInt(intCount[0].count);
  console.log(`=== INTERNSHIPS (${total} total) ===`);
  
  const intFields = ['title','organization','country','city','type','field','paidType','stipendAmount','duration','mode','eligibility','requirements','documentsRequired','benefits','application_url','deadline','description'];
  for (const f of intFields) {
    const isDate = f === 'deadline';
    const condition = isDate ? `WHERE "${f}" IS NOT NULL` : `WHERE "${f}" IS NOT NULL AND "${f}" != ''`;
    const res = await q(`SELECT count(*) FROM internships ${condition}`);
    const filled = parseInt(res[0].count);
    const pct = Math.round((filled / total) * 100);
    const s = pct < 50 ? '❌' : pct < 80 ? '⚠️' : '✅';
    console.log(`  ${s} ${f}: ${filled}/${total} (${pct}%)`);
  }
  
  const samples = await q(`SELECT title, organization, country, city, type, field, "paidType", "stipendAmount", application_url FROM internships LIMIT 15`);
  console.log('\nSample internships:');
  for (const s of samples) {
    console.log(`  "${s.title}" at ${s.organization} (${s.city}, ${s.country}) — ${s.type}/${s.field}, ${s.paidType}, stipend: ${s.stipendAmount || 'N/A'}, url: ${s.application_url || 'N/A'}`);
  }

  // 2. CYBERSECURITY CHECK
  console.log('\n=== CYBERSECURITY & ETHICAL HACKING ===');
  const cyber = await q(`SELECT c.name, c.degree, c.department, u.name as uni_name, u.city FROM courses c JOIN universities u ON c.university_id = u.id WHERE LOWER(c.name) LIKE '%cyber%' OR LOWER(c.name) LIKE '%ethical%' OR LOWER(c.name) LIKE '%hacking%' OR LOWER(c.name) LIKE '%information security%' OR LOWER(c.name) LIKE '%network security%' OR LOWER(c.name) LIKE '%digital forensics%'`);
  if (cyber.length > 0) {
    console.log(`Found ${cyber.length} cybersecurity courses:`);
    for (const c of cyber) {
      console.log(`  "${c.name}" [${c.degree}] at ${c.uni_name} (${c.city}) — dept: ${c.department || 'NULL'}`);
    }
  } else {
    console.log('❌ NO cybersecurity/ethical hacking programs found!');
  }

  // 3. MAJOR UNI DEPARTMENTS
  console.log('\n=== MAJOR UNI DEPARTMENTS & PROGRAMS ===');
  const majorUnis = await q(`SELECT id, name, city FROM universities WHERE country = 'Pakistan' AND (name ILIKE '%Punjab%' OR name ILIKE '%Karachi%' OR name ILIKE '%LUMS%' OR name ILIKE '%NUST%' OR name ILIKE '%FAST%') ORDER BY name LIMIT 5`);
  for (const u of majorUnis) {
    const depts = await q(`SELECT name FROM departments WHERE university_id = '${u.id}' ORDER BY name`);
    const courses = await q(`SELECT name, degree, department FROM courses WHERE university_id = '${u.id}' ORDER BY name`);
    console.log(`\n  📍 ${u.name} (${u.city})`);
    console.log(`  Departments (${depts.length}): ${depts.map((d: any) => d.name).join(', ')}`);
    console.log(`  Courses (${courses.length}):`);
    for (const c of courses) {
      console.log(`    - ${c.name} [${c.degree}] → dept: ${c.department || 'NULL'}`);
    }
  }

  // 4. PAKISTAN SCHOLARSHIPS
  console.log('\n=== PAKISTAN SCHOLARSHIPS (local) ===');
  const pkSch = await q(`SELECT name, provider FROM "Scholarship" WHERE country = 'Pakistan' ORDER BY name`);
  for (const s of pkSch) {
    console.log(`  "${s.name}" — ${s.provider}`);
  }
  
  console.log('\n=== INTERNATIONAL SCHOLARSHIPS ===');
  const intSch = await q(`SELECT name, provider, country FROM "Scholarship" WHERE country != 'Pakistan' ORDER BY country, name`);
  for (const s of intSch) {
    console.log(`  ${s.country}: "${s.name}" — ${s.provider}`);
  }
}

main().catch(e => console.log('FATAL:', e.message));
