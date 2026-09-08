const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  // 1. Total counts
  const [totalUnis, totalCourses, totalDepts] = await Promise.all([
    p.university.count(),
    p.course.count(),
    p.department.count(),
  ]);
  console.log(`\n=== DATABASE AUDIT ===`);
  console.log(`Universities: ${totalUnis}`);
  console.log(`Courses: ${totalCourses}`);
  console.log(`Departments: ${totalDepts}`);

  // 2. Courses with NULL department
  const nullDeptCourses = await p.course.count({ where: { department: null } });
  console.log(`\nCourses with NULL department: ${nullDeptCourses}`);

  // 3. Generic/template courses
  const genericNames = ['BS General', 'MS General', 'BSc Nursing', 'BA English', 'MA English', 'BA Urdu', 'MA Urdu'];
  for (const name of genericNames) {
    const count = await p.course.count({ where: { name: { contains: name } } });
    if (count > 0) console.log(`  "${name}": ${count} entries`);
  }

  // 4. Universities with 0 departments
  const unisWithNoDepts = await p.university.findMany({
    include: { _count: { select: { departments: true, courses: true } } },
    where: { departments: { none: {} } },
  });
  console.log(`\nUniversities with 0 departments: ${unisWithNoDepts.length}`);
  for (const u of unisWithNoDepts.slice(0, 10)) {
    console.log(`  - ${u.name} (${u.city || 'no city'}) — ${u._count.courses} courses`);
  }
  if (unisWithNoDepts.length > 10) console.log(`  ... and ${unisWithNoDepts.length - 10} more`);

  // 5. Universities with very few courses (< 3)
  const sparseUnis = await p.university.findMany({
    include: { _count: { select: { departments: true, courses: true } } },
    where: { courses: { none: {} } },
  });
  console.log(`\nUniversities with 0 courses: ${sparseUnis.length}`);

  // 6. Non-standard degree values
  const allCourses = await p.course.findMany({ select: { degree: true } });
  const degreeCounts: Record<string, number> = {};
  for (const c of allCourses) degreeCounts[c.degree] = (degreeCounts[c.degree] || 0) + 1;
  console.log(`\n=== DEGREE VALUES ===`);
  const sorted = Object.entries(degreeCounts).sort((a, b) => b[1] - a[1]);
  for (const [deg, count] of sorted) {
    console.log(`  "${deg}": ${count} courses`);
  }

  // 7. Per-university breakdown: how many have real vs template data
  const allUnis = await p.university.findMany({
    include: {
      departments: { select: { name: true } },
      courses: { select: { name: true, degree: true, department: true } },
    },
    orderBy: { name: 'asc' },
  });

  let realData = 0, partialData = 0, templateData = 0, noData = 0;
  const templateUnis = [];
  const noDeptUnis = [];

  for (const u of allUnis) {
    if (u.courses.length === 0 && u.departments.length === 0) {
      noData++;
      continue;
    }
    
    const coursesWithDept = u.courses.filter(c => c.department !== null);
    const genericCourses = u.courses.filter(c => 
      c.name === 'BS General' || c.name === 'MS General' || 
      c.name === 'BSc Nursing' || c.degree === 'bachelor_of_medicine' ||
      c.degree === 'bachelor_of_engineering' || c.degree === 'bachelor_of_education'
    );
    
    if (genericCourses.length > u.courses.length * 0.5) {
      templateData++;
      templateUnis.push({ name: u.name, city: u.city, courses: u.courses.length, generic: genericCourses.length });
    } else if (coursesWithDept.length > u.courses.length * 0.7) {
      realData++;
    } else if (u.courses.length > 0) {
      partialData++;
      if (u.departments.length === 0) noDeptUnis.push({ name: u.name, city: u.city, courses: u.courses.length });
    }
  }

  console.log(`\n=== DATA QUALITY ===`);
  console.log(`Real data (most courses have dept): ${realData}`);
  console.log(`Partial data: ${partialData}`);
  console.log(`Template/generic data: ${templateData}`);
  console.log(`No data (0 courses & 0 depts): ${noData}`);

  if (templateUnis.length > 0) {
    console.log(`\n=== TEMPLATE DATA UNIVERSITIES (first 20) ===`);
    for (const u of templateUnis.slice(0, 20)) {
      console.log(`  ${u.name} (${u.city}) — ${u.courses} courses, ${u.generic} generic`);
    }
  }

  if (noDeptUnis.length > 0) {
    console.log(`\n=== NO DEPARTMENTS BUT HAS COURSES (first 20) ===`);
    for (const u of noDeptUnis.slice(0, 20)) {
      console.log(`  ${u.name} (${u.city}) — ${u.courses} courses`);
    }
  }

  // 8. Country breakdown
  const countries = await p.university.groupBy({
    by: ['country'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  });
  console.log(`\n=== COUNTRIES ===`);
  for (const c of countries) {
    console.log(`  ${c.country}: ${c._count.id} universities`);
  }
}

main().finally(() => p.$disconnect());
