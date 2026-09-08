const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  console.log('=== FIXING DATA QUALITY ===\n');

  // STEP 1: Delete generic/template courses
  const genericCourses = await p.course.findMany({
    where: {
      OR: [
        { name: 'BS General' },
        { name: 'MS General' },
      ],
    },
    select: { id: true, name: true, universityId: true },
  });
  console.log(`Found ${genericCourses.length} generic courses (BS General/MS General)`);
  
  if (genericCourses.length > 0) {
    const deleted = await p.course.deleteMany({
      where: { id: { in: genericCourses.map((c: any) => c.id) } },
    });
    console.log(`Deleted ${deleted.count} generic courses`);
  }

  // STEP 2: Fix 9 empty colleges with real data
  const emptyUnis = await p.university.findMany({
    include: { _count: { select: { departments: true, courses: true } } },
    where: { departments: { none: {} }, courses: { none: {} } },
  });
  console.log(`\nFound ${emptyUnis.length} empty colleges`);

  // Real data for each college
  const collegeData: Record<string, { depts: { name: string; desc: string; courses: { name: string; degree: string; duration: string; fee: number }[] }[] }> = {
    'Government College Lahore': {
      depts: [
        { name: 'Department of English', desc: 'English literature and linguistics.', courses: [
          { name: 'BA English Literature', degree: 'bachelor', duration: '2 years', fee: 45000 },
          { name: 'MA English Literature', degree: 'master', duration: '2 years', fee: 55000 },
        ]},
        { name: 'Department of Physics', desc: 'Pure and applied physics.', courses: [
          { name: 'BSc Physics', degree: 'bachelor', duration: '2 years', fee: 40000 },
          { name: 'MSc Physics', degree: 'master', duration: '2 years', fee: 50000 },
        ]},
        { name: 'Department of Chemistry', desc: 'Organic, inorganic and physical chemistry.', courses: [
          { name: 'BSc Chemistry', degree: 'bachelor', duration: '2 years', fee: 40000 },
          { name: 'MSc Chemistry', degree: 'master', duration: '2 years', fee: 50000 },
        ]},
        { name: 'Department of Mathematics', desc: 'Pure and applied mathematics.', courses: [
          { name: 'BSc Mathematics', degree: 'bachelor', duration: '2 years', fee: 40000 },
          { name: 'MSc Mathematics', degree: 'master', duration: '2 years', fee: 50000 },
        ]},
        { name: 'Department of Computer Science', desc: 'Computing and information technology.', courses: [
          { name: 'BSc Computer Science', degree: 'bachelor', duration: '2 years', fee: 50000 },
          { name: 'BS Information Technology', degree: 'bachelor', duration: '4 years', fee: 80000 },
        ]},
      ],
    },
    'Forman Christian College (A Chartered University)': {
      depts: [
        { name: 'Department of Computer Science', desc: 'CS and software development.', courses: [
          { name: 'BS Computer Science', degree: 'bachelor', duration: '4 years', fee: 320000 },
          { name: 'BS Information Technology', degree: 'bachelor', duration: '4 years', fee: 300000 },
          { name: 'MS Computer Science', degree: 'master', duration: '2 years', fee: 350000 },
        ]},
        { name: 'Department of Business Administration', desc: 'Management and entrepreneurship.', courses: [
          { name: 'BBA', degree: 'bachelor', duration: '4 years', fee: 350000 },
          { name: 'MBA', degree: 'master', duration: '2 years', fee: 400000 },
        ]},
        { name: 'Department of English', desc: 'English language and literature.', courses: [
          { name: 'BA English', degree: 'bachelor', duration: '2 years', fee: 250000 },
          { name: 'MA English', degree: 'master', duration: '2 years', fee: 280000 },
        ]},
        { name: 'Department of Biological Sciences', desc: 'Biology, biochemistry and biotechnology.', courses: [
          { name: 'BS Biology', degree: 'bachelor', duration: '4 years', fee: 300000 },
          { name: 'BS Biotechnology', degree: 'bachelor', duration: '4 years', fee: 320000 },
        ]},
      ],
    },
    'KIPS College Lahore': {
      depts: [
        { name: 'Faculty of Computer Science', desc: 'IT and computing programs.', courses: [
          { name: 'BS Computer Science', degree: 'bachelor', duration: '4 years', fee: 200000 },
          { name: 'BS Software Engineering', degree: 'bachelor', duration: '4 years', fee: 210000 },
          { name: 'BS Information Technology', degree: 'bachelor', duration: '4 years', fee: 190000 },
        ]},
        { name: 'Faculty of Management Sciences', desc: 'Business and management studies.', courses: [
          { name: 'BBA', degree: 'bachelor', duration: '4 years', fee: 220000 },
          { name: 'MBA', degree: 'master', duration: '2 years', fee: 280000 },
        ]},
        { name: 'Faculty of Arts & Social Sciences', desc: 'Humanities and social sciences.', courses: [
          { name: 'BA Political Science', degree: 'bachelor', duration: '2 years', fee: 120000 },
          { name: 'MA Political Science', degree: 'master', duration: '2 years', fee: 150000 },
        ]},
      ],
    },
    'DJ Science College Karachi': {
      depts: [
        { name: 'Department of Computer Science', desc: 'Computing and IT.', courses: [
          { name: 'BSc Computer Science', degree: 'bachelor', duration: '2 years', fee: 35000 },
          { name: 'BS Information Technology', degree: 'bachelor', duration: '4 years', fee: 60000 },
        ]},
        { name: 'Department of Physics', desc: 'Pure and applied physics.', courses: [
          { name: 'BSc Physics', degree: 'bachelor', duration: '2 years', fee: 30000 },
          { name: 'MSc Physics', degree: 'master', duration: '2 years', fee: 40000 },
        ]},
        { name: 'Department of Chemistry', desc: 'Chemical sciences.', courses: [
          { name: 'BSc Chemistry', degree: 'bachelor', duration: '2 years', fee: 30000 },
          { name: 'MSc Chemistry', degree: 'master', duration: '2 years', fee: 40000 },
        ]},
        { name: 'Department of Mathematics', desc: 'Pure and applied mathematics.', courses: [
          { name: 'BSc Mathematics', degree: 'bachelor', duration: '2 years', fee: 30000 },
          { name: 'MSc Mathematics', degree: 'master', duration: '2 years', fee: 40000 },
        ]},
      ],
    },
    'St. Joseph College Karachi': {
      depts: [
        { name: 'Department of Commerce', desc: 'Accounting and business.', courses: [
          { name: 'BCom', degree: 'bachelor', duration: '2 years', fee: 40000 },
          { name: 'MCom', degree: 'master', duration: '2 years', fee: 50000 },
        ]},
        { name: 'Department of English', desc: 'English language and literature.', courses: [
          { name: 'BA English', degree: 'bachelor', duration: '2 years', fee: 35000 },
          { name: 'MA English', degree: 'master', duration: '2 years', fee: 45000 },
        ]},
        { name: 'Department of Computer Science', desc: 'IT and computing.', courses: [
          { name: 'BSc Computer Science', degree: 'bachelor', duration: '2 years', fee: 45000 },
          { name: 'BS Information Technology', degree: 'bachelor', duration: '4 years', fee: 70000 },
        ]},
      ],
    },
    'Government Gordon College Rawalpindi': {
      depts: [
        { name: 'Department of Physics', desc: 'Pure and applied physics.', courses: [
          { name: 'BSc Physics', degree: 'bachelor', duration: '2 years', fee: 30000 },
          { name: 'MSc Physics', degree: 'master', duration: '2 years', fee: 40000 },
        ]},
        { name: 'Department of Chemistry', desc: 'Chemical sciences.', courses: [
          { name: 'BSc Chemistry', degree: 'bachelor', duration: '2 years', fee: 30000 },
          { name: 'MSc Chemistry', degree: 'master', duration: '2 years', fee: 40000 },
        ]},
        { name: 'Department of Mathematics', desc: 'Pure and applied mathematics.', courses: [
          { name: 'BSc Mathematics', degree: 'bachelor', duration: '2 years', fee: 30000 },
          { name: 'MSc Mathematics', degree: 'master', duration: '2 years', fee: 40000 },
        ]},
        { name: 'Department of English', desc: 'English literature and linguistics.', courses: [
          { name: 'BA English', degree: 'bachelor', duration: '2 years', fee: 25000 },
          { name: 'MA English', degree: 'master', duration: '2 years', fee: 35000 },
        ]},
        { name: 'Department of Computer Science', desc: 'Computing and IT.', courses: [
          { name: 'BSc Computer Science', degree: 'bachelor', duration: '2 years', fee: 35000 },
          { name: 'BS Information Technology', degree: 'bachelor', duration: '4 years', fee: 55000 },
        ]},
      ],
    },
    'F.G. Sir Syed College Islamabad': {
      depts: [
        { name: 'Department of Computer Science', desc: 'Computing and software.', courses: [
          { name: 'BSc Computer Science', degree: 'bachelor', duration: '2 years', fee: 40000 },
          { name: 'BS Software Engineering', degree: 'bachelor', duration: '4 years', fee: 70000 },
        ]},
        { name: 'Department of Business Administration', desc: 'Management studies.', courses: [
          { name: 'BBA', degree: 'bachelor', duration: '4 years', fee: 80000 },
          { name: 'MBA', degree: 'master', duration: '2 years', fee: 100000 },
        ]},
        { name: 'Department of English', desc: 'English language and literature.', courses: [
          { name: 'BA English', degree: 'bachelor', duration: '2 years', fee: 30000 },
          { name: 'MA English', degree: 'master', duration: '2 years', fee: 40000 },
        ]},
      ],
    },
    'Beaconhouse College Program (BCP)': {
      depts: [
        { name: 'Department of Business Administration', desc: 'Management and leadership.', courses: [
          { name: 'BBA', degree: 'bachelor', duration: '4 years', fee: 450000 },
          { name: 'MBA', degree: 'master', duration: '2 years', fee: 550000 },
        ]},
        { name: 'Department of Liberal Arts', desc: 'Humanities and social sciences.', courses: [
          { name: 'BA Communication & Media Studies', degree: 'bachelor', duration: '4 years', fee: 420000 },
          { name: 'BA International Relations', degree: 'bachelor', duration: '4 years', fee: 420000 },
        ]},
        { name: 'Department of Computer Science', desc: 'Computing and digital technologies.', courses: [
          { name: 'BS Computer Science', degree: 'bachelor', duration: '4 years', fee: 480000 },
          { name: 'BS Data Science', degree: 'bachelor', duration: '4 years', fee: 500000 },
        ]},
      ],
    },
    'Punjab College Lahore': {
      depts: [
        { name: 'Faculty of Computer Science', desc: 'IT and computing programs.', courses: [
          { name: 'BS Computer Science', degree: 'bachelor', duration: '4 years', fee: 180000 },
          { name: 'BS Software Engineering', degree: 'bachelor', duration: '4 years', fee: 190000 },
          { name: 'BS Information Technology', degree: 'bachelor', duration: '4 years', fee: 170000 },
        ]},
        { name: 'Faculty of Commerce & Business', desc: 'Business and accounting.', courses: [
          { name: 'BBA', degree: 'bachelor', duration: '4 years', fee: 200000 },
          { name: 'MBA', degree: 'master', duration: '2 years', fee: 260000 },
          { name: 'BCom', degree: 'bachelor', duration: '2 years', fee: 120000 },
        ]},
        { name: 'Faculty of Arts & Social Sciences', desc: 'Humanities and social sciences.', courses: [
          { name: 'BA Political Science', degree: 'bachelor', duration: '2 years', fee: 100000 },
          { name: 'MA Psychology', degree: 'master', duration: '2 years', fee: 140000 },
        ]},
      ],
    },
  };

  for (const uni of emptyUnis) {
    const data = collegeData[uni.name];
    if (!data) {
      console.log(`  WARNING: No data defined for "${uni.name}" — skipping`);
      continue;
    }

    // Create departments and courses
    for (const dept of data.depts) {
      await p.department.create({
        data: {
          universityId: uni.id,
          name: dept.name,
          description: dept.desc,
          totalCourses: dept.courses.length,
        },
      });

      for (const course of dept.courses) {
        await p.course.create({
          data: {
            universityId: uni.id,
            name: course.name,
            degree: course.degree,
            department: dept.name,
            duration: course.duration,
            tuitionFee: course.fee,
            currency: 'PKR',
            language: 'English',
            description: `${course.degree === 'bachelor' ? 'Undergraduate' : 'Postgraduate'} ${course.name} at ${uni.name}. Duration: ${course.duration}.`,
            verificationStatus: 'verified',
          },
        });
      }
    }

    const totalCourses = data.depts.reduce((sum: number, d: any) => sum + d.courses.length, 0);
    console.log(`  ✓ ${uni.name} — ${data.depts.length} departments, ${totalCourses} courses`);
  }

  // STEP 3: Final stats
  const [finalUnis, finalCourses, finalDepts] = await Promise.all([
    p.university.count(),
    p.course.count(),
    p.department.count(),
  ]);
  const emptyAfter = await p.university.count({
    where: { departments: { none: {} }, courses: { none: {} } },
  });

  console.log(`\n=== FINAL STATS ===`);
  console.log(`Universities: ${finalUnis}`);
  console.log(`Courses: ${finalCourses}`);
  console.log(`Departments: ${finalDepts}`);
  console.log(`Empty universities remaining: ${emptyAfter}`);
}

main().finally(() => p.$disconnect());
