const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  // Find universities that have template data (courses but need real data replacement)
  // Focus on major Pakistani universities
  const majorUnis = await p.university.findMany({
    where: { country: 'Pakistan' },
    include: {
      _count: { select: { departments: true, courses: true } },
      courses: { select: { name: true, department: true }, take: 5 },
    },
    orderBy: { name: 'asc' },
  });

  console.log('=== PAKISTANI UNIVERSITIES DATA STATUS ===\n');
  
  // Group by data quality
  const templateUnis: any[] = [];
  const realUnis: any[] = [];
  
  for (const u of majorUnis) {
    // Check if courses look template-generated (same pattern across unis)
    const courseNames = u.courses.map((c: any) => c.name);
    const hasTemplate = courseNames.some((n: string) => 
      n === 'BS Computer Science' || n === 'BS Software Engineering' || 
      n === 'BS Information Technology' || n === 'BS English Literature' ||
      n === 'BS Mathematics' || n === 'BS Physics'
    );
    const hasRealData = u.courses.some((c: any) => 
      c.name.includes('Aerospace') || c.name.includes('NET') || 
      c.name.includes('B.Tech') || c.name.includes('MBBS Bachelor') ||
      c.name.includes('School of')
    );
    
    if (hasRealData) {
      realUnis.push(u);
    } else if (hasTemplate || u._count.courses > 0) {
      templateUnis.push(u);
    }
  }

  console.log(`\nUniversities with REAL data: ${realUnis.length}`);
  for (const u of realUnis) {
    console.log(`  ✓ ${u.name} (${u.city}) — ${u._count.departments} depts, ${u._count.courses} courses`);
  }

  console.log(`\nUniversities with TEMPLATE data (need fixing): ${templateUnis.length}`);
  for (const u of templateUnis) {
    console.log(`  ✗ ${u.name} (${u.city}) — ${u._count.departments} depts, ${u._count.courses} courses`);
    console.log(`    Sample courses: ${u.courses.slice(0, 3).map((c: any) => c.name).join(', ')}`);
  }
}

main().finally(() => p.$disconnect());
