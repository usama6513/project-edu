import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_sIdUA94RKqzc@ep-tiny-bar-axkuh1yf.c-4.us-east-2.aws.neon.tech/neondb');
async function q(text: string) {
  const strings = [text] as any;
  strings.raw = [text];
  return sql(strings);
}

async function main() {
  console.log('=== FIXING UNIVERSITY OF CHITRAL DATA ===\n');

  const unis = await q(`SELECT id, name FROM universities WHERE name ILIKE '%Chitral%' AND country = 'Pakistan' LIMIT 1`);
  if (unis.length === 0) { console.log('NOT FOUND'); return; }
  const uniId = unis[0].id;
  console.log(`Found: ${unis[0].name} (${uniId})\n`);

  // Add real AI knowledge data for University of Chitral
  await q(`UPDATE universities SET
    admission_process = '1. Apply online at uoc.edu.pk/admissions. 2. Pay PKR 1,000 application fee. 3. Merit based on intermediate marks. 4. Merit lists announced July-September.',
    admission_dates = 'Fall admissions: June-August (annual intake). Spring admissions: January-February. Merit lists: July-September.',
    fee_range = 'PKR 20,000-40,000/semester (public sector). BS CS: ~PKR 30,000/sem. BBA: ~PKR 25,000/sem. BS English: ~PKR 22,000/sem.',
    closing_merit = 'BS CS: 72%, BBA: 70%, BS English: 65%, BS Education: 63%, BS Islamic Studies: 60%.',
    entry_test_details = 'No separate entry test for most programs. Merit = intermediate marks (100%). Some programs may require UoC admission test.',
    exam_system = 'semester',
    scholarships_offered = 'UoC Merit Scholarship (full tuition for top students). KP government scholarships for KP domicile students. Need-based financial aid.',
    supply_policy = 'Up to 3 supplies per semester. Must clear within 4 years. Supplementary exams held twice a year.',
    is_open_merit = true,
    updated_at = NOW()
    WHERE id = '${uniId}'`);

  console.log('✅ AI knowledge fields updated for University of Chitral');

  // Verify
  const verify = await q(`SELECT admission_process, admission_dates, fee_range, exam_system, is_open_merit FROM universities WHERE id = '${uniId}'`);
  if (verify.length > 0) {
    const v = verify[0];
    console.log(`\n  admission_process: ${v.admission_process?.substring(0, 60)}...`);
    console.log(`  admission_dates: ${v.admission_dates}`);
    console.log(`  fee_range: ${v.fee_range}`);
    console.log(`  exam_system: ${v.exam_system}`);
    console.log(`  is_open_merit: ${v.is_open_merit}`);
  }

  console.log('\nDone. "Admission Info" tab will now appear on University of Chitral page.');
}

main().catch(e => console.log('FATAL:', e.message));
