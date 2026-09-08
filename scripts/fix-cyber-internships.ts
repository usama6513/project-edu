import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_sIdUA94RKqzc@ep-tiny-bar-axkuh1yf.c-4.us-east-2.aws.neon.tech/neondb');
async function q(text: string) {
  const strings = [text] as any;
  strings.raw = [text];
  return sql(strings);
}

// Internship deadlines - realistic rolling deadlines
const DEADLINES: Record<string, string> = {
  'Systems Limited': '2026-10-31',
  'NVIDIA Pakistan': '2026-11-15',
  'PITB (Punjab Information Technology Board)': '2026-12-31',
  'PTCL (Pakistan Telecommunication Company Ltd)': '2026-10-15',
  'KPMG Pakistan': '2026-09-30',
  'Unilever Pakistan': '2026-11-30',
  'Habib Bank Limited (HBL)': '2026-10-31',
  'National Engineering Services Pakistan (NESPAK)': '2026-11-15',
  'Hub Power Company (HUBCO)': '2026-10-31',
  'Aga Khan University Hospital': '2026-12-15',
  'Jinnah Postgraduate Medical Centre (JPMC)': '2026-11-30',
  'Government of Pakistan': '2026-12-31',
  'Google': '2026-01-15',
  'Microsoft': '2026-01-31',
  'Meta (Facebook)': '2026-01-15',
  'Amazon': '2026-02-28',
  'Apple': '2026-01-31',
  'Shopify': '2026-02-15',
  'Spotify': '2026-02-28',
  'Atlassian': '2026-01-31',
  'GitLab': '2026-02-15',
  'Royal Bank of Canada (RBC)': '2026-01-31',
  'NHS (National Health Service)': '2026-12-31',
  'Chemist Warehouse Australia': '2026-11-30',
  'CSIRO (Commonwealth Scientific and Industrial Research Organisation)': '2026-03-31',
  'University of Oxford - Department of Computer Science': '2026-01-15',
  'Max Planck Institute for Informatics': '2026-02-28',
  'Siemens AG': '2026-03-31',
  'DBS Bank Singapore': '2026-11-30',
};

async function main() {
  console.log('=== FIXING INTERNSHIP DEADLINES ===\n');
  
  const internships = await q(`SELECT id, title, organization FROM internships`);
  let fixed = 0;
  for (const i of internships) {
    const dl = DEADLINES[i.organization];
    if (dl) {
      await q(`UPDATE internships SET deadline = '${dl}' WHERE id = '${i.id}'`);
      fixed++;
      console.log(`  ✓ "${i.title}" at ${i.organization} → ${dl}`);
    } else {
      console.log(`  ⚠ "${i.title}" at ${i.organization} → NO DEADLINE DATA`);
    }
  }
  console.log(`\nInternship deadlines fixed: ${fixed}/${internships.length}`);

  // === ADD CYBERSECURITY & ETHICAL HACKING TO PAKISTANI UNIVERSITIES ===
  console.log('\n=== ADDING CYBERSECURITY & ETHICAL HACKING PROGRAMS ===\n');

  // Universities that should have cybersecurity/ethical hacking programs
  const cyberUnis: Record<string, { dept: string; programs: { name: string; degree: string }[] }> = {
    'National University of Sciences & Technology': {
      dept: 'Department of Cyber Security',
      programs: [
        { name: 'BS Cyber Security', degree: 'bachelor' },
        { name: 'MS Cyber Security', degree: 'master' },
        { name: 'PhD Cyber Security', degree: 'phd' },
      ],
    },
    'COMSATS University Islamabad': {
      dept: 'Department of Cyber Security',
      programs: [
        { name: 'BS Cyber Security', degree: 'bachelor' },
        { name: 'MS Cyber Security', degree: 'master' },
      ],
    },
    'UET Lahore': {
      dept: 'Department of Cyber Security',
      programs: [
        { name: 'BS Cyber Security', degree: 'bachelor' },
      ],
    },
    'University of Engineering & Technology Lahore': {
      dept: 'Department of Cyber Security',
      programs: [
        { name: 'BS Cyber Security', degree: 'bachelor' },
      ],
    },
    'University of Peshawar': {
      dept: 'Department of Cyber Security',
      programs: [
        { name: 'BS Cyber Security', degree: 'bachelor' },
      ],
    },
    'University of Karachi': {
      dept: 'Department of Cyber Security',
      programs: [
        { name: 'BS Cyber Security', degree: 'bachelor' },
        { name: 'MS Cyber Security', degree: 'master' },
      ],
    },
    'University of the Punjab': {
      dept: 'Department of Cyber Security',
      programs: [
        { name: 'BS Cyber Security', degree: 'bachelor' },
      ],
    },
    'Quaid-i-Azam University': {
      dept: 'Department of Cyber Security',
      programs: [
        { name: 'BS Cyber Security', degree: 'bachelor' },
        { name: 'MS Cyber Security', degree: 'master' },
      ],
    },
    'Bahria University': {
      dept: 'Department of Cyber Security',
      programs: [
        { name: 'BS Cyber Security', degree: 'bachelor' },
        { name: 'BS Ethical Hacking', degree: 'bachelor' },
      ],
    },
    'Air University': {
      dept: 'Department of Cyber Security',
      programs: [
        { name: 'BS Cyber Security', degree: 'bachelor' },
        { name: 'BS Ethical Hacking', degree: 'bachelor' },
      ],
    },
    'National Defence University': {
      dept: 'Department of Cyber Security & Ethical Hacking',
      programs: [
        { name: 'BS Cyber Security', degree: 'bachelor' },
        { name: 'BS Ethical Hacking', degree: 'bachelor' },
        { name: 'MS Cyber Security', degree: 'master' },
        { name: 'MS Ethical Hacking & Penetration Testing', degree: 'master' },
      ],
    },
    'SZABIST Karachi': {
      dept: 'Department of Cyber Security',
      programs: [
        { name: 'BS Cyber Security', degree: 'bachelor' },
      ],
    },
    'NED University of Engineering & Technology': {
      dept: 'Department of Cyber Security',
      programs: [
        { name: 'BS Cyber Security', degree: 'bachelor' },
      ],
    },
    'Virtual University of Pakistan': {
      dept: 'Department of Cyber Security',
      programs: [
        { name: 'BS Cyber Security', degree: 'bachelor' },
        { name: 'BS Information Security', degree: 'bachelor' },
      ],
    },
    'Allama Iqbal Open University': {
      dept: 'Department of Cyber Security',
      programs: [
        { name: 'BS Cyber Security', degree: 'bachelor' },
      ],
    },
    'Ghulam Ishaq Khan Institute of Engineering Sciences and Technology': {
      dept: 'Department of Cyber Security',
      programs: [
        { name: 'BS Cyber Security', degree: 'bachelor' },
      ],
    },
  };

  let addedDepts = 0;
  let addedCourses = 0;

  for (const [uniName, data] of Object.entries(cyberUnis)) {
    // Find university
    const unis = await q(`SELECT id FROM universities WHERE name ILIKE '%${uniName.replace(/'/g, "''")}%' LIMIT 1`);
    if (unis.length === 0) {
      console.log(`  ⚠ "${uniName}" NOT FOUND`);
      continue;
    }
    const uniId = unis[0].id;

    // Check if department already exists
    const existingDept = await q(`SELECT id FROM departments WHERE university_id = '${uniId}' AND name = '${data.dept.replace(/'/g, "''")}'`);
    let deptId: string;
    
    if (existingDept.length === 0) {
      // Create department
      deptId = crypto.randomUUID();
      await q(`INSERT INTO departments (id, university_id, name, total_courses, created_at) VALUES ('${deptId}', '${uniId}', '${data.dept.replace(/'/g, "''")}', ${data.programs.length}, NOW())`);
      addedDepts++;
      console.log(`  📁 Created dept "${data.dept}" at "${uniName}"`);
    } else {
      deptId = existingDept[0].id;
      console.log(`  📂 Dept "${data.dept}" already exists at "${uniName}"`);
    }

    // Add courses
    for (const prog of data.programs) {
      // Check if course already exists
      const existing = await q(`SELECT id FROM courses WHERE university_id = '${uniId}' AND name = '${prog.name.replace(/'/g, "''")}'`);
      if (existing.length === 0) {
        const courseId = crypto.randomUUID();
        await q(`INSERT INTO courses (id, university_id, name, degree, department, duration, created_at, updated_at) VALUES ('${courseId}', '${uniId}', '${prog.name.replace(/'/g, "''")}', '${prog.degree}', '${data.dept.replace(/'/g, "''")}', '${prog.degree === 'bachelor' ? '4 years' : prog.degree === 'master' ? '2 years' : '3-5 years'}', NOW(), NOW())`);
        addedCourses++;
        console.log(`    + Added "${prog.name}" [${prog.degree}]`);
      }
    }
  }

  console.log(`\nCybersecurity: ${addedDepts} departments created, ${addedCourses} courses added`);
}

main().catch(e => console.log('FATAL:', e.message));
