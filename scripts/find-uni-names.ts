const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  // Find the actual names of skipped universities
  const searches = ['LUMS', 'NUST', 'UET', 'GIKI', 'IBA', 'IIUI', 'International Islamic'];
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
