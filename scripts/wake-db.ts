const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  console.log('Waking up DB...');
  const c1 = await p.internship.count();
  console.log('DB awake! Internships:', c1);
  const c2 = await p.course.count();
  console.log('Courses:', c2);
}
main().catch(e => console.log('ERR:', e.message)).finally(() => p.$disconnect());
