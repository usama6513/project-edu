const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  console.log('=== AUDITING SCHOLARSHIPS, CM PROGRAMS & GOVERNMENT SCHEMES ===\n');

  // === SCHOLARSHIPS ===
  const scholarships = await p.scholarship.findMany();
  console.log(`=== SCHOLARSHIPS (${scholarships.length} total) ===`);
  
  const schFields: Record<string, { empty: number; total: number }> = {};
  const schKeys = ['name','provider','country','category','amount','currency','amountFrequency','deadline','description','eligibilityCriteria','applicationProcess','documentsRequired','contactInfo','sourceUrl','sourceName'];
  for (const k of schKeys) schFields[k] = { empty: 0, total: scholarships.length };
  
  for (const s of scholarships) {
    for (const k of schKeys) {
      const val = (s as any)[k];
      if (val === null || val === undefined || val === '' || val === 0) schFields[k].empty++;
    }
  }
  
  console.log('Field completeness:');
  for (const [k, v] of Object.entries(schFields)) {
    const pct = Math.round(((v.total - v.empty) / v.total) * 100);
    const status = pct < 50 ? '❌' : pct < 80 ? '⚠️' : '✅';
    console.log(`  ${status} ${k}: ${v.total - v.empty}/${v.total} (${pct}%)`);
  }

  // Show individual scholarships with most empty fields
  console.log('\nScholarships with most empty fields:');
  for (const s of scholarships) {
    const emptyFields = schKeys.filter(k => {
      const val = (s as any)[k];
      return val === null || val === undefined || val === '' || val === 0;
    });
    if (emptyFields.length > 5) {
      console.log(`  "${s.name}" — ${emptyFields.length} empty: ${emptyFields.join(', ')}`);
    }
  }

  // === CM PROGRAMS ===
  const cmPrograms = await p.cMProgram.findMany();
  console.log(`\n=== CM PROGRAMS (${cmPrograms.length} total) ===`);
  
  const cmKeys = ['name','province','category','description','eligibility','benefits','howToApply','deadline','officialUrl','targetAudience','status'];
  const cmFields: Record<string, { empty: number; total: number }> = {};
  for (const k of cmKeys) cmFields[k] = { empty: 0, total: cmPrograms.length };
  
  for (const c of cmPrograms) {
    for (const k of cmKeys) {
      const val = (c as any)[k];
      if (val === null || val === undefined || val === '') cmFields[k].empty++;
    }
  }
  
  console.log('Field completeness:');
  for (const [k, v] of Object.entries(cmFields)) {
    const pct = Math.round(((v.total - v.empty) / v.total) * 100);
    const status = pct < 50 ? '❌' : pct < 80 ? '⚠️' : '✅';
    console.log(`  ${status} ${k}: ${v.total - v.empty}/${v.total} (${pct}%)`);
  }

  // Show individual CM programs with empty fields
  console.log('\nCM Programs with empty fields:');
  for (const c of cmPrograms) {
    const emptyFields = cmKeys.filter(k => {
      const val = (c as any)[k];
      return val === null || val === undefined || val === '';
    });
    if (emptyFields.length > 0) {
      console.log(`  "${c.name}" (${c.province}) — ${emptyFields.length} empty: ${emptyFields.join(', ')}`);
    }
  }

  // === GOVERNMENT SCHEMES ===
  const schemes = await p.governmentScheme.findMany();
  console.log(`\n=== GOVERNMENT SCHEMES (${schemes.length} total) ===`);
  
  const gsKeys = ['name','provider','category','description','eligibilityCriteria','applicationProcess','deadline','amount','currency','website','province','targetAudience','status','sourceUrl','sourceName'];
  const gsFields: Record<string, { empty: number; total: number }> = {};
  for (const k of gsKeys) gsFields[k] = { empty: 0, total: schemes.length };
  
  for (const s of schemes) {
    for (const k of gsKeys) {
      const val = (s as any)[k];
      if (val === null || val === undefined || val === '' || val === 0) gsFields[k].empty++;
    }
  }
  
  console.log('Field completeness:');
  for (const [k, v] of Object.entries(gsFields)) {
    const pct = Math.round(((v.total - v.empty) / v.total) * 100);
    const status = pct < 50 ? '❌' : pct < 80 ? '⚠️' : '✅';
    console.log(`  ${status} ${k}: ${v.total - v.empty}/${v.total} (${pct}%)`);
  }

  // Show individual schemes with empty fields
  console.log('\nSchemes with empty fields:');
  for (const s of schemes) {
    const emptyFields = gsKeys.filter(k => {
      const val = (s as any)[k];
      return val === null || val === undefined || val === '' || val === 0;
    });
    if (emptyFields.length > 0) {
      console.log(`  "${s.name}" — ${emptyFields.length} empty: ${emptyFields.join(', ')}`);
    }
  }
}

main().finally(() => p.$disconnect());
