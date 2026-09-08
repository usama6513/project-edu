const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function tryConnect(retries: number, delay: number): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Attempt ${i + 1}/${retries}...`);
      await p.internship.count();
      console.log('Connected!');
      return true;
    } catch (e: any) {
      console.log(`  Failed: ${e.message.split('\n')[0]}`);
      if (i < retries - 1) {
        console.log(`  Waiting ${delay}s...`);
        await new Promise(r => setTimeout(r, delay * 1000));
      }
    }
  }
  return false;
}

async function main() {
  const ok = await tryConnect(6, 15); // 6 attempts, 15s apart = ~90s total
  if (!ok) {
    console.log('Could not connect to database after all retries.');
    process.exit(1);
  }
  
  // Now run the audit
  console.log('\n=== COMPREHENSIVE AUDIT ===\n');

  // 1. INTERNSHIPS
  const internships = await p.internship.findMany();
  console.log(`=== INTERNSHIPS (${internships.length} total) ===`);
  const intKeys = ['title','company','location','type','description','requirements','stipend','duration','deadline','applyUrl','contactEmail','category','status'];
  for (const k of intKeys) {
    const empty = internships.filter((i: any) => { const v = (i as any)[k]; return v === null || v === undefined || v === '' || v === 0; }).length;
    const pct = Math.round(((internships.length - empty) / internships.length) * 100);
    const s = pct < 50 ? '❌' : pct < 80 ? '⚠️' : '✅';
    console.log(`  ${s} ${k}: ${internships.length - empty}/${internships.length} (${pct}%)`);
  }
  console.log('\nSample internships:');
  for (const i of internships.slice(0, 10)) {
    console.log(`  "${i.title}" at ${i.company} (${i.location})`);
  }

  // 2. CYBERSECURITY CHECK
  console.log('\n=== CYBERSECURITY & ETHICAL HACKING ===');
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
    console.log(`Found ${cyberCourses.length} cybersecurity courses:`);
    for (const c of cyberCourses) {
      console.log(`  "${c.name}" [${c.degree}] at ${c.university.name} (${c.university.city})`);
    }
  } else {
    console.log('❌ NO cybersecurity/ethical hacking programs in database!');
  }

  // 3. UNIVERSITY DEPARTMENTS CHECK
  console.log('\n=== MAJOR UNI DEPARTMENTS CHECK ===');
  const unis = await p.university.findMany({
    where: { country: 'Pakistan' },
    orderBy: { name: 'asc' },
    take: 5,
    include: {
      departments: { orderBy: { name: 'asc' } },
      courses: { select: { name: true, department: true, degree: true }, take: 10, orderBy: { name: 'asc' } },
    },
  });
  for (const u of unis) {
    console.log(`\n  📍 ${u.name} (${u.city})`);
    console.log(`  Depts (${u.departments.length}): ${u.departments.map(d => d.name).join(', ')}`);
    console.log(`  Sample courses: ${u.courses.slice(0, 5).map(c => c.name).join(', ')}`);
  }

  // 4. SCHOLARSHIP NAMES
  console.log('\n=== PAKISTAN SCHOLARSHIPS ===');
  const pkSch = await p.scholarship.findMany({
    where: { country: 'Pakistan' },
    select: { name: true, provider: true },
    orderBy: { name: 'asc' },
  });
  for (const s of pkSch) {
    console.log(`  "${s.name}" — ${s.provider}`);
  }
}

main().catch(e => console.log('FATAL:', e.message)).finally(() => p.$disconnect());
