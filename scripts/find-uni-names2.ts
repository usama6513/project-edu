const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const searches = ['Lahore University', 'National University of Sciences', 'Ghulam Ishaq', 'Institute of Business Administration', 'UET Lahore', 'University of Engineering'];
  for (const s of searches) {
    const found = await p.university.findMany({
      where: { name: { contains: s, mode: 'insensitive' } },
      select: { id: true, name: true, city: true },
    });
    if (found.length > 0) {
      for (const u of found) console.log(`  "${s}" → "${u.name}" (${u.city}) [${u.id}]`);
    } else {
      console.log(`  "${s}" → NOT FOUND`);
    }
  }
}
main().finally(() => p.$disconnect());
