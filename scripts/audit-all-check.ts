const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  console.log('=== COMPREHENSIVE AUDIT ===\n');

  // 1. INTERNSHIPS AUDIT
  const internships = await p.internship.findMany();
  console.log(`=== INTERNSHIPS (${internships.length} total) ===`);
  const intKeys = ['title','company','location','type','description','requirements','stipend','duration','deadline','applyUrl','contactEmail','category','status'];
  const intFields: Record<string, { empty: number; total: number }> = {};
  for (const k of intKeys) intFields[k] = { empty: 0, total: internships.length };
  for (const i of internships) {
    for (const k of intKeys) {
      const val = (i as any)[k];
      if (val === null || val === undefined || val === '' || val === 0) intFields[k].empty++;
    }
  }
  console.log('Field completeness:');
  for (const [k, v] of Object.entries(intFields)) {
    const pct = Math.round(((v.total - v.empty) / v.total) * 100);
    const status = pct < 50 ? '❌' : pct < 80 ? '⚠️' : '✅';
    console.log(`  ${status} ${k}: ${v.total - v.empty}/${v.total} (${pct}%)`);
  }
  console.log('\nSample internships:');
  for (const i of internships.slice(0, 10)) {
    console.log(`  "${i.title}" at ${i.company} (${i.location}) — type: ${i.type}, stipend: ${i.stipend}`);
  }

  // 2. SCHOLARSHIP NAMES CHECK - find local ones with international-sounding names
  const scholarships = await p.scholarship.findMany({
    select: { name: true, provider: true, country: true, category: true },
  });
  console.log(`\n=== SCHOLARSHIP NAMES CHECK ===`);
  console.log('Pakistani scholarships that might have wrong/international names:');
  const pkScholarships = scholarships.filter(s => s.country === 'Pakistan');
  for (const s of pkScholarships) {
    const intlKeywords = ['Fulbright', 'Chevening', 'Commonwealth', 'DAAD', 'Erasmus', 'MEXT', 'Korea', 'Chinese', 'Turkiye', 'Australia', 'Holland', 'Sweden', 'New Zealand', 'Malaysia', 'Iraqi', 'Campus France', 'Italian', 'Thai', 'Mauritius', 'Singapore', 'Czech', 'Khalifa', 'JASSO', 'UK Asian', 'Stipendium'];
    const isIntl = intlKeywords.some(k => s.name.includes(k));
    if (!isIntl) {
      console.log(`  PK: "${s.name}" — provider: ${s.provider}, category: ${s.category}`);
    }
  }
  console.log('\nInternational scholarships in DB:');
  for (const s of scholarships) {
    if (s.country !== 'Pakistan') {
      console.log(`  ${s.country}: "${s.name}" — provider: ${s.provider}`);
    }
  }

  // 3. UNIVERSITY DEPARTMENTS CHECK - sample 5 major universities
  console.log('\n=== UNIVERSITY DEPARTMENTS & PROGRAMS CHECK ===');
  const majorUnis = ['University of the Punjab', 'University of Karachi', 'Lahore University of Management Sciences', 'National University of Sciences & Technology', 'FAST National University'];
  for (const uniName of majorUnis) {
    const uni = await p.university.findFirst({
      where: { name: { contains: uniName, mode: 'insensitive' } },
      include: {
        departments: { orderBy: { name: 'asc' } },
        courses: { select: { name: true, department: true, degree: true }, orderBy: { name: 'asc' } },
      },
    });
    if (uni) {
      console.log(`\n  📍 ${uni.name} (${uni.city})`);
      console.log(`  Departments (${uni.departments.length}):`);
      for (const d of uni.departments) {
        console.log(`    - ${d.name}`);
      }
      console.log(`  Courses (${uni.courses.length}):`);
      for (const c of uni.courses) {
        console.log(`    - ${c.name} [${c.degree}] → dept: ${c.department || 'NULL'}`);
      }
    } else {
      console.log(`\n  ⚠ "${uniName}" NOT FOUND`);
    }
  }

  // 4. CHECK CYBERSECURITY / ETHICAL HACKING PROGRAMS
  console.log('\n=== CYBERSECURITY & ETHICAL HACKING PROGRAMS ===');
  const cyberCourses = await p.course.findMany({
    where: {
      OR: [
        { name: { contains: 'cyber', mode: 'insensitive' } },
        { name: { contains: 'ethical', mode: 'insensitive' } },
        { name: { contains: 'hacking', mode: 'insensitive' } },
        { name: { contains: 'information security', mode: 'insensitive' } },
        { name: { contains: 'network security', mode: 'insensitive' } },
        { name: { contains: 'digital forensics', mode: 'insensitive' } },
      ],
    },
    include: { university: { select: { name: true, city: true } } },
  });
  if (cyberCourses.length > 0) {
    console.log(`Found ${cyberCourses.length} cybersecurity-related courses:`);
    for (const c of cyberCourses) {
      console.log(`  "${c.name}" [${c.degree}] at ${c.university.name} (${c.university.city}) — dept: ${c.department || 'NULL'}`);
    }
  } else {
    console.log('❌ NO cybersecurity or ethical hacking programs found in database!');
  }
}

main().finally(() => p.$disconnect());
