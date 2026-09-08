const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const scholarships = await p.scholarship.findMany({
    select: { id: true, name: true, eligibilityCriteria: true, sourceName: true, deadline: true },
  });
  
  const unmatched = scholarships.filter(s => 
    !s.eligibilityCriteria || !s.sourceName
  );
  
  console.log(`=== UNMATCHED SCHOLARSHIPS (${unmatched.length}) ===\n`);
  for (const s of unmatched) {
    console.log(`  "${s.name}"`);
  }
  
  console.log(`\n=== ALREADY MATCHED (${scholarships.length - unmatched.length}) ===\n`);
  const matched = scholarships.filter(s => s.eligibilityCriteria && s.sourceName);
  for (const s of matched) {
    console.log(`  ✓ "${s.name}"`);
  }

  // Also check which have no deadline
  const noDeadline = scholarships.filter(s => !s.deadline);
  console.log(`\n=== NO DEADLINE (${noDeadline.length}) ===\n`);
  for (const s of noDeadline) {
    console.log(`  "${s.name}"`);
  }
}

main().finally(() => p.$disconnect());
