import { neon } from '@neondatabase/serverless';
const sql = neon('postgresql://neondb_owner:npg_sIdUA94RKqzc@ep-tiny-bar-axkuh1yf.c-4.us-east-2.aws.neon.tech/neondb');
async function q(text: string) { const s = [text] as any; s.raw = [text]; return sql(s); }

async function main() {
  console.log('=== ADDING CYBER SECURITY TO UET LAHORE ===\n');
  
  const uniId = 'uni-pk-007'; // UET Lahore
  
  // Check if dept exists
  const existingDept = await q(`SELECT id FROM departments WHERE university_id = '${uniId}' AND name = 'Department of Cyber Security'`);
  let deptId: string;
  
  if (existingDept.length === 0) {
    deptId = crypto.randomUUID();
    await q(`INSERT INTO departments (id, university_id, name, total_courses, created_at) VALUES ('${deptId}', '${uniId}', 'Department of Cyber Security', 1, NOW())`);
    console.log(`  📁 Created "Department of Cyber Security" at UET Lahore`);
  } else {
    deptId = existingDept[0].id;
    console.log(`  📂 Dept already exists`);
  }

  // Add BS Cyber Security
  const existing = await q(`SELECT id FROM courses WHERE university_id = '${uniId}' AND name = 'BS Cyber Security'`);
  if (existing.length === 0) {
    await q(`INSERT INTO courses (id, university_id, name, degree, department, duration, created_at, updated_at) VALUES ('${crypto.randomUUID()}', '${uniId}', 'BS Cyber Security', 'bachelor', 'Department of Cyber Security', '4 years', NOW(), NOW())`);
    console.log(`  + Added "BS Cyber Security" [bachelor]`);
  }

  // Also add to Sir Syed University and Mehran University
  const extras = [
    { id: 'uni-pk-050', name: 'Sir Syed University of Engineering & Technology', city: 'Karachi' },
    { id: 'uni-pk-117', name: 'Mehran University of Engineering and Technology', city: 'Jamshoro' },
    { id: 'uni-pk-095', name: 'University of Engineering and Technology Taxila', city: 'Taxila' },
    { id: 'uni-pk-137', name: 'University of Engineering and Technology Peshawar', city: 'Peshawar' },
  ];

  for (const uni of extras) {
    const dept = await q(`SELECT id FROM departments WHERE university_id = '${uni.id}' AND name = 'Department of Cyber Security'`);
    let dId: string;
    if (dept.length === 0) {
      dId = crypto.randomUUID();
      await q(`INSERT INTO departments (id, university_id, name, total_courses, created_at) VALUES ('${dId}', '${uni.id}', 'Department of Cyber Security', 1, NOW())`);
      console.log(`  📁 Created dept at ${uni.name}`);
    } else {
      dId = dept[0].id;
    }
    
    const ex = await q(`SELECT id FROM courses WHERE university_id = '${uni.id}' AND name = 'BS Cyber Security'`);
    if (ex.length === 0) {
      await q(`INSERT INTO courses (id, university_id, name, degree, department, duration, created_at, updated_at) VALUES ('${crypto.randomUUID()}', '${uni.id}', 'BS Cyber Security', 'bachelor', 'Department of Cyber Security', '4 years', NOW(), NOW())`);
      console.log(`  + Added "BS Cyber Security" at ${uni.name}`);
    }
  }

  console.log('\nDone!');
}

main().catch(e => console.log('FATAL:', e.message));
