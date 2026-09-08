import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_sIdUA94RKqzc@ep-tiny-bar-axkuh1yf.c-4.us-east-2.aws.neon.tech/neondb');
async function q(text: string) {
  const strings = [text] as any;
  strings.raw = [text];
  return sql(strings);
}

async function main() {
  // Check specific major universities
  const searches = [
    'University of the Punjab',
    'University of Karachi', 
    'Lahore University of Management',
    'National University of Sciences',
    'COMSATS',
    'NED University',
    'UET Lahore',
    'Quaid-i-Azam',
    'Allama Iqbal Open',
    'Virtual University',
    'Bahria University',
    'Air University',
    'Ghulam Ishaq',
    'SZABIST',
  ];
  
  console.log('=== MAJOR UNI DEPARTMENTS & PROGRAMS ===\n');
  for (const name of searches) {
    const unis = await q(`SELECT id, name, city FROM universities WHERE country = 'Pakistan' AND name ILIKE '%${name}%' LIMIT 1`);
    if (unis.length === 0) { console.log(`  ⚠ "${name}" NOT FOUND`); continue; }
    const u = unis[0];
    const depts = await q(`SELECT name FROM departments WHERE university_id = '${u.id}' ORDER BY name`);
    const courses = await q(`SELECT name, degree, department FROM courses WHERE university_id = '${u.id}' ORDER BY name`);
    console.log(`\n  📍 ${u.name} (${u.city})`);
    console.log(`  Departments (${depts.length}): ${depts.map((d: any) => d.name).join(', ')}`);
    console.log(`  Courses (${courses.length}):`);
    for (const c of courses) {
      console.log(`    - ${c.name} [${c.degree}] → dept: ${c.department || 'NULL'}`);
    }
  }

  // Check internship deadlines
  console.log('\n=== INTERNSHIP DEADLINES ===');
  const internships = await q(`SELECT title, organization, deadline FROM internships ORDER BY title`);
  for (const i of internships) {
    console.log(`  "${i.title}" at ${i.organization} — deadline: ${i.deadline || 'NULL'}`);
  }
}

main().catch(e => console.log('FATAL:', e.message));
