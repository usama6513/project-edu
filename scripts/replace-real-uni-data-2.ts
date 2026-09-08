const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

// Remaining universities with their ACTUAL database names
const UNI_DATA: Record<string, { depts: { name: string; programs: { name: string; degree: string; duration: string }[] }[] }> = {
  'Lahore University of Management Sciences': { depts: [
    { name: 'Syed Babar Ali School of Science and Engineering', programs: [
      { name: 'BS Computer Science', degree: 'bachelor', duration: '4 years' }, { name: 'BS Electrical Engineering', degree: 'bachelor', duration: '4 years' },
      { name: 'BS Mathematics', degree: 'bachelor', duration: '4 years' }, { name: 'BS Physics', degree: 'bachelor', duration: '4 years' },
      { name: 'BS Chemistry', degree: 'bachelor', duration: '4 years' },
    ]},
    { name: 'Suleman Dawood School of Business', programs: [
      { name: 'BBA', degree: 'bachelor', duration: '4 years' }, { name: 'MBA', degree: 'master', duration: '2 years' },
      { name: 'MS Business Analytics', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Shaikh Ahmad Hassan School of Law', programs: [
      { name: 'LLB (Hons) 5 Years', degree: 'bachelor', duration: '5 years' }, { name: 'LLM', degree: 'master', duration: '1 year' },
    ]},
    { name: 'Mushtaq Ahmad Gurmani School of Humanities & Social Sciences', programs: [
      { name: 'BA Economics', degree: 'bachelor', duration: '4 years' }, { name: 'BA Political Science', degree: 'bachelor', duration: '4 years' },
      { name: 'BA Psychology', degree: 'bachelor', duration: '4 years' }, { name: 'BA History', degree: 'bachelor', duration: '4 years' },
    ]},
    { name: 'Abdullah School of Education', programs: [
      { name: 'BS Education', degree: 'bachelor', duration: '4 years' }, { name: 'MS Education', degree: 'master', duration: '2 years' },
    ]},
  ]},
  'National University of Sciences & Technology': { depts: [
    { name: 'School of Electrical Engineering and Computer Science (SEECS)', programs: [
      { name: 'BS Electrical Engineering', degree: 'bachelor', duration: '4 years' }, { name: 'BS Computer Engineering', degree: 'bachelor', duration: '4 years' },
      { name: 'BS Software Engineering', degree: 'bachelor', duration: '4 years' }, { name: 'BS Computer Science', degree: 'bachelor', duration: '4 years' },
      { name: 'MS Computer Science', degree: 'master', duration: '2 years' }, { name: 'PhD Computer Science', degree: 'phd', duration: '5 years' },
    ]},
    { name: 'College of Aeronautical Engineering (CAE)', programs: [
      { name: 'BS Aeronautical Engineering', degree: 'bachelor', duration: '4 years' },
    ]},
    { name: 'NUST Business School (NBS)', programs: [
      { name: 'BBA', degree: 'bachelor', duration: '4 years' }, { name: 'MBA', degree: 'master', duration: '2 years' },
    ]},
    { name: 'School of Civil and Environmental Engineering (SCEE)', programs: [
      { name: 'BS Civil Engineering', degree: 'bachelor', duration: '4 years' },
    ]},
    { name: 'School of Mechanical and Manufacturing Engineering (SMME)', programs: [
      { name: 'BS Mechanical Engineering', degree: 'bachelor', duration: '4 years' }, { name: 'BS Mechatronics Engineering', degree: 'bachelor', duration: '4 years' },
    ]},
    { name: 'School of Natural Sciences (SNS)', programs: [
      { name: 'BS Mathematics', degree: 'bachelor', duration: '4 years' }, { name: 'BS Physics', degree: 'bachelor', duration: '4 years' },
    ]},
  ]},
  'Ghulam Ishaq Khan Institute of Engineering Sciences and Technology': { depts: [
    { name: 'Faculty of Engineering Sciences', programs: [
      { name: 'BS Electrical Engineering', degree: 'bachelor', duration: '4 years' }, { name: 'BS Mechanical Engineering', degree: 'bachelor', duration: '4 years' },
      { name: 'BS Chemical Engineering', degree: 'bachelor', duration: '4 years' }, { name: 'BS Civil Engineering', degree: 'bachelor', duration: '4 years' },
      { name: 'BS Computer Science and Engineering', degree: 'bachelor', duration: '4 years' },
    ]},
    { name: 'Faculty of Science', programs: [
      { name: 'BS Physics', degree: 'bachelor', duration: '4 years' }, { name: 'BS Chemistry', degree: 'bachelor', duration: '4 years' },
      { name: 'BS Mathematics', degree: 'bachelor', duration: '4 years' },
    ]},
    { name: 'Faculty of Management Sciences', programs: [
      { name: 'BBA', degree: 'bachelor', duration: '4 years' }, { name: 'MBA', degree: 'master', duration: '2 years' },
    ]},
  ]},
  'Institute of Business Administration Karachi': { depts: [
    { name: 'Department of Computer Science', programs: [
      { name: 'BS Computer Science', degree: 'bachelor', duration: '4 years' }, { name: 'MS Computer Science', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Department of Business Administration', programs: [
      { name: 'BBA', degree: 'bachelor', duration: '4 years' }, { name: 'MBA', degree: 'master', duration: '2 years' },
      { name: 'Executive MBA', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Department of Economics & Social Sciences', programs: [
      { name: 'BS Economics', degree: 'bachelor', duration: '4 years' }, { name: 'BA Social Sciences', degree: 'bachelor', duration: '4 years' },
    ]},
    { name: 'Department of Media Studies', programs: [
      { name: 'BS Media Studies', degree: 'bachelor', duration: '4 years' },
    ]},
    { name: 'Department of Mathematics', programs: [
      { name: 'BS Mathematics', degree: 'bachelor', duration: '4 years' },
    ]},
  ]},
  'International Islamic University Islamabad': { depts: [
    { name: 'Faculty of Computing', programs: [
      { name: 'BS Computer Science', degree: 'bachelor', duration: '4 years' }, { name: 'BS Software Engineering', degree: 'bachelor', duration: '4 years' },
      { name: 'MS Computer Science', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Faculty of Engineering', programs: [
      { name: 'BS Electrical Engineering', degree: 'bachelor', duration: '4 years' }, { name: 'BS Mechanical Engineering', degree: 'bachelor', duration: '4 years' },
    ]},
    { name: 'Faculty of Social Sciences', programs: [
      { name: 'BA Economics', degree: 'bachelor', duration: '2 years' }, { name: 'BA Political Science', degree: 'bachelor', duration: '2 years' },
      { name: 'BA English', degree: 'bachelor', duration: '2 years' },
    ]},
    { name: 'Faculty of Management Sciences', programs: [
      { name: 'BBA', degree: 'bachelor', duration: '4 years' }, { name: 'MBA', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Faculty of Islamic Studies', programs: [
      { name: 'BA Islamic Studies', degree: 'bachelor', duration: '2 years' }, { name: 'MA Islamic Studies', degree: 'master', duration: '2 years' },
    ]},
  ]},
  'University of Engineering and Technology Lahore': { depts: [
    { name: 'Department of Computer Science and Engineering', programs: [
      { name: 'BS Computer Science and Engineering', degree: 'bachelor', duration: '4 years' }, { name: 'MS Computer Science', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Department of Electrical Engineering', programs: [
      { name: 'BSc Electrical Engineering', degree: 'bachelor', duration: '4 years' }, { name: 'MSc Power Engineering', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Department of Mechanical Engineering', programs: [
      { name: 'BSc Mechanical Engineering', degree: 'bachelor', duration: '4 years' }, { name: 'MSc Thermal Engineering', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Department of Civil Engineering', programs: [
      { name: 'BSc Civil Engineering', degree: 'bachelor', duration: '4 years' }, { name: 'MSc Structural Engineering', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Department of Architecture', programs: [
      { name: 'BSc Architectural Engineering', degree: 'bachelor', duration: '4 years' },
    ]},
    { name: 'Department of Chemical Engineering', programs: [
      { name: 'BSc Chemical Engineering', degree: 'bachelor', duration: '4 years' },
    ]},
  ]},
  'Government College University Lahore': { depts: [
    { name: 'Department of Computer Science', programs: [
      { name: 'BS Computer Science', degree: 'bachelor', duration: '4 years' }, { name: 'MS Computer Science', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Department of Physics', programs: [
      { name: 'BS Physics', degree: 'bachelor', duration: '4 years' }, { name: 'MS Physics', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Department of Chemistry', programs: [
      { name: 'BS Chemistry', degree: 'bachelor', duration: '4 years' }, { name: 'MS Chemistry', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Department of Mathematics', programs: [
      { name: 'BS Mathematics', degree: 'bachelor', duration: '4 years' }, { name: 'MS Mathematics', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Department of English', programs: [
      { name: 'BA English', degree: 'bachelor', duration: '2 years' }, { name: 'MA English', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Department of Biological Sciences', programs: [
      { name: 'BS Biology', degree: 'bachelor', duration: '4 years' }, { name: 'BS Botany', degree: 'bachelor', duration: '4 years' }, { name: 'BS Zoology', degree: 'bachelor', duration: '4 years' },
    ]},
  ]},
  'Forman Christian College (A Chartered University)': { depts: [
    { name: 'Department of Computer Science', programs: [
      { name: 'BS Computer Science', degree: 'bachelor', duration: '4 years' }, { name: 'BS Information Technology', degree: 'bachelor', duration: '4 years' },
    ]},
    { name: 'Department of Business Administration', programs: [
      { name: 'BBA', degree: 'bachelor', duration: '4 years' }, { name: 'MBA', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Department of Biological Sciences', programs: [
      { name: 'BS Biology', degree: 'bachelor', duration: '4 years' }, { name: 'BS Biotechnology', degree: 'bachelor', duration: '4 years' },
    ]},
    { name: 'Department of Chemistry', programs: [
      { name: 'BS Chemistry', degree: 'bachelor', duration: '4 years' },
    ]},
    { name: 'Department of English', programs: [
      { name: 'BA English', degree: 'bachelor', duration: '2 years' }, { name: 'MA English', degree: 'master', duration: '2 years' },
    ]},
  ]},
  'The University of Lahore': { depts: [
    { name: 'Faculty of Computing', programs: [
      { name: 'BS Computer Science', degree: 'bachelor', duration: '4 years' }, { name: 'BS Software Engineering', degree: 'bachelor', duration: '4 years' },
      { name: 'BS Information Technology', degree: 'bachelor', duration: '4 years' },
    ]},
    { name: 'Faculty of Engineering', programs: [
      { name: 'BS Electrical Engineering', degree: 'bachelor', duration: '4 years' }, { name: 'BS Mechanical Engineering', degree: 'bachelor', duration: '4 years' },
      { name: 'BS Civil Engineering', degree: 'bachelor', duration: '4 years' },
    ]},
    { name: 'Faculty of Management Studies', programs: [
      { name: 'BBA', degree: 'bachelor', duration: '4 years' }, { name: 'MBA', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Lahore Law College', programs: [
      { name: 'LLB 3 Years', degree: 'bachelor', duration: '3 years' }, { name: 'LLB (Hons) 5 Years', degree: 'bachelor', duration: '5 years' }, { name: 'LLM', degree: 'master', duration: '2 years' },
    ]},
  ]},
  'University of Central Punjab': { depts: [
    { name: 'Faculty of Computing', programs: [
      { name: 'BS Computer Science', degree: 'bachelor', duration: '4 years' }, { name: 'BS Software Engineering', degree: 'bachelor', duration: '4 years' },
    ]},
    { name: 'Faculty of Engineering', programs: [
      { name: 'BS Electrical Engineering', degree: 'bachelor', duration: '4 years' },
    ]},
    { name: 'Faculty of Management Studies', programs: [
      { name: 'BBA', degree: 'bachelor', duration: '4 years' }, { name: 'MBA', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Faculty of Arts & Social Sciences', programs: [
      { name: 'BA Psychology', degree: 'bachelor', duration: '2 years' }, { name: 'BA English', degree: 'bachelor', duration: '2 years' },
    ]},
  ]},
  'Virtual University of Pakistan': { depts: [
    { name: 'Faculty of Computer Science', programs: [
      { name: 'BS Computer Science', degree: 'bachelor', duration: '4 years' }, { name: 'BS Software Engineering', degree: 'bachelor', duration: '4 years' },
      { name: 'BS Information Technology', degree: 'bachelor', duration: '4 years' }, { name: 'BS Data Science', degree: 'bachelor', duration: '4 years' },
    ]},
    { name: 'Faculty of Management', programs: [
      { name: 'BBA', degree: 'bachelor', duration: '4 years' }, { name: 'MBA', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Faculty of Arts & Social Sciences', programs: [
      { name: 'BA English', degree: 'bachelor', duration: '2 years' }, { name: 'BA Economics', degree: 'bachelor', duration: '2 years' },
    ]},
  ]},
  'Allama Iqbal Open University': { depts: [
    { name: 'Faculty of Education', programs: [
      { name: 'BEd', degree: 'bachelor', duration: '2 years' }, { name: 'MEd', degree: 'master', duration: '2 years' },
      { name: 'MA Education', degree: 'master', duration: '2 years' }, { name: 'PhD Education', degree: 'phd', duration: '5 years' },
    ]},
    { name: 'Faculty of Arts', programs: [
      { name: 'BA English', degree: 'bachelor', duration: '2 years' }, { name: 'BA Urdu', degree: 'bachelor', duration: '2 years' },
      { name: 'BA Islamic Studies', degree: 'bachelor', duration: '2 years' },
    ]},
    { name: 'Faculty of Social Sciences', programs: [
      { name: 'BA Economics', degree: 'bachelor', duration: '2 years' }, { name: 'BA Political Science', degree: 'bachelor', duration: '2 years' },
    ]},
  ]},
  'Sindh Madressatul Islam University': { depts: [
    { name: 'Faculty of Management Sciences', programs: [
      { name: 'BBA', degree: 'bachelor', duration: '4 years' }, { name: 'MBA', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Faculty of Commerce', programs: [
      { name: 'BCom', degree: 'bachelor', duration: '2 years' }, { name: 'MCom', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Faculty of Computer Science', programs: [
      { name: 'BS Computer Science', degree: 'bachelor', duration: '4 years' }, { name: 'BS Information Technology', degree: 'bachelor', duration: '4 years' },
    ]},
  ]},
};

async function main() {
  console.log('=== PASS 2: FIXING REMAINING UNIVERSITIES ===\n');
  let totalUpdated = 0;

  for (const [uniName, data] of Object.entries(UNI_DATA)) {
    const uni = await p.university.findFirst({ where: { name: { contains: uniName } } });
    if (!uni) { console.log(`  SKIP: "${uniName}" not found`); continue; }

    const delCourses = await p.course.deleteMany({ where: { universityId: uni.id } });
    const delDepts = await p.department.deleteMany({ where: { universityId: uni.id } });

    let courseCount = 0;
    for (const dept of data.depts) {
      await p.department.create({ data: { universityId: uni.id, name: dept.name, description: `${dept.name} at ${uni.name}`, totalCourses: dept.programs.length } });
      for (const prog of dept.programs) {
        await p.course.create({ data: { universityId: uni.id, name: prog.name, degree: prog.degree, department: dept.name, duration: prog.duration, language: 'English', description: `${prog.name} at ${uni.name}. Duration: ${prog.duration}.`, verificationStatus: 'verified' } });
        courseCount++;
      }
    }
    totalUpdated += courseCount;
    console.log(`  ✓ ${uni.name} — ${data.depts.length} depts, ${courseCount} courses`);
  }

  const [finalUnis, finalCourses, finalDepts] = await Promise.all([p.university.count(), p.course.count(), p.department.count()]);
  console.log(`\n=== FINAL STATS ===`);
  console.log(`Universities: ${finalUnis}`);
  console.log(`Courses: ${finalCourses}`);
  console.log(`Departments: ${finalDepts}`);
}

main().finally(() => p.$disconnect());
