const { PrismaClient } = require('@prisma/client');
// Use direct connection instead of pooler
const p = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_sIdUA94RKqzc@ep-tiny-bar-axkuh1yf.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require'
    }
  }
});
async function main() {
  console.log('Waking up DB (direct connection)...');
  const c1 = await p.internship.count();
  console.log('DB awake! Internships:', c1);
  const c2 = await p.course.count();
  console.log('Courses:', c2);
}
main().catch(e => console.log('ERR:', e.message)).finally(() => p.$disconnect());
