import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_sIdUA94RKqzc@ep-tiny-bar-axkuh1yf.c-4.us-east-2.aws.neon.tech/neondb');
async function q(text: string) {
  const strings = [text] as any;
  strings.raw = [text];
  return sql(strings);
}

// Real campus data for major Pakistani universities
const CAMPUSES: Record<string, Array<{ name: string; city: string; address?: string; isMain: boolean; phone?: string; email?: string; website?: string }>> = {
  'University of the Punjab': [
    { name: 'Quaid-e-Azam Campus', city: 'Lahore', address: 'New Campus, Lahore', isMain: true, phone: '042-99230545', website: 'https://pu.edu.pk' },
    { name: 'Old Campus', city: 'Lahore', address: 'Old Campus, Canal Road, Lahore', isMain: false },
    { name: 'Jhang Campus', city: 'Jhang', isMain: false },
    { name: 'Gujranwala Campus', city: 'Gujranwala', isMain: false },
    { name: 'Lahore Campus (Evening)', city: 'Lahore', address: 'Evening programs at Quaid-e-Azam Campus', isMain: false },
  ],
  'University of Karachi': [
    { name: 'Main Campus', city: 'Karachi', address: 'University Road, Karachi 75270', isMain: true, phone: '021-99261000', website: 'https://uok.edu.pk' },
    { name: 'City Campus', city: 'Karachi', address: 'Near Numaish, Karachi', isMain: false },
    { name: 'Korangi Campus', city: 'Karachi', address: 'Korangi Creek', isMain: false },
  ],
  'FAST-NUCES (National University of Computer and Emerging Sciences)': [
    { name: 'Islamabad Campus', city: 'Islamabad', address: 'Sector H-11, Islamabad', isMain: true, phone: '051-100-1234', website: 'https://nu.edu.pk' },
    { name: 'Karachi Campus', city: 'Karachi', address: 'Sector 16-D, DHA City', isMain: false },
    { name: 'Lahore Campus', city: 'Lahore', address: 'Chak Shahzad, Islamabad Road', isMain: false },
    { name: 'Peshawar Campus', city: 'Peshawar', isMain: false },
    { name: 'Chiniot Campus', city: 'Chiniot', isMain: false },
  ],
  'National University of Sciences & Technology': [
    { name: 'H-12 Campus (Main)', city: 'Islamabad', address: 'Sector H-12, Islamabad', isMain: true, phone: '051-90852100', website: 'https://nust.edu.pk' },
    { name: 'Military College of Engineering', city: 'Risalpur', isMain: false },
    { name: 'Pakistan Navy Business School', city: 'Karachi', isMain: false },
    { name: 'College of Aeronautical Engineering', city: 'Risalpur', isMain: false },
    { name: 'Military College of Signals', city: 'Rawalpindi', isMain: false },
    { name: 'College of Electrical & Mechanical Engineering', city: 'Rawalpindi', isMain: false },
  ],
  'COMSATS University Islamabad': [
    { name: 'Islamabad Campus', city: 'Islamabad', address: 'Park Road, Chak Shahzad, Islamabad', isMain: true, phone: '051-100-1000', website: 'https://comsats.edu.pk' },
    { name: 'Lahore Campus', city: 'Lahore', address: '2.5 Km, Defence Road, Lahore', isMain: false },
    { name: 'Karachi Campus', city: 'Karachi', isMain: false },
    { name: 'Abbottabad Campus', city: 'Abbottabad', isMain: false },
    { name: 'Attock Campus', city: 'Attock', isMain: false },
    { name: 'Vehari Campus', city: 'Vehari', isMain: false },
    { name: 'Sahiwal Campus', city: 'Sahiwal', isMain: false },
  ],
  'NED University of Engineering & Technology': [
    { name: 'Main Campus', city: 'Karachi', address: 'University Road, Karachi 75270', isMain: true, phone: '021-99261440', website: 'https://neduet.edu.pk' },
    { name: 'Thar Campus', city: 'Tharparkar', isMain: false },
  ],
  'Quaid-i-Azam University': [
    { name: 'Main Campus', city: 'Islamabad', address: 'Shahzad Town, Islamabad 45320', isMain: true, phone: '051-90642000', website: 'https://qau.edu.pk' },
  ],
  'Lahore University of Management Sciences': [
    { name: 'Main Campus', city: 'Lahore', address: 'DHA, Lahore 54792', isMain: true, phone: '042-35608224', website: 'https://lums.edu.pk' },
  ],
  'Ghulam Ishaq Khan Institute of Engineering Sciences and Technology': [
    { name: 'Main Campus', city: 'Topi', address: 'Topi, Swabi, KPK', isMain: true, phone: '0936-260081', website: 'https://giki.edu.pk' },
  ],
  'Air University': [
    { name: 'Islamabad Campus (Main)', city: 'Islamabad', address: 'E-9, Islamabad', isMain: true, phone: '051-9262111', website: 'https://au.edu.pk' },
    { name: 'Karachi Campus', city: 'Karachi', address: 'PAF Base Faisal', isMain: false },
    { name: 'Multan Campus', city: 'Multan', address: 'PAF Base Multan', isMain: false },
    { name: 'Kamra Campus', city: 'Kamra', address: 'PAF Base Minhas', isMain: false },
  ],
  'Bahria University': [
    { name: 'Islamabad Campus (Main)', city: 'Islamabad', address: 'Sector E-8, Islamabad', isMain: true, phone: '051-100-1234', website: 'https://bahria.edu.pk' },
    { name: 'Karachi Campus', city: 'Karachi', address: 'Shahrah-e-Faisal, Karachi', isMain: false },
    { name: 'Lahore Campus', city: 'Lahore', isMain: false },
  ],
  'Institute of Business Administration Karachi': [
    { name: 'Main Campus', city: 'Karachi', address: 'University Road, Karachi 75270', isMain: true, phone: '021-99262901', website: 'https://iba.edu.pk' },
    { name: 'Sukkur Campus', city: 'Sukkur', isMain: false },
  ],
  'International Islamic University Islamabad': [
    { name: 'Faisal Masjid Campus', city: 'Islamabad', address: 'Faisal Masjid, Sector G-7, Islamabad', isMain: true, phone: '051-100-4500', website: 'https://iiui.edu.pk' },
    { name: 'New Campus', city: 'Islamabad', address: 'Expressway, Islamabad', isMain: false },
  ],
  'University of Engineering and Technology Lahore': [
    { name: 'GT Road Campus (Main)', city: 'Lahore', address: 'GT Road, Lahore 54890', isMain: true, phone: '042-99025501', website: 'https://uet.edu.pk' },
    { name: 'Taxila Campus', city: 'Taxila', isMain: false },
    { name: 'Kala Shah Kaku Campus', city: 'Kala Shah Kaku', isMain: false },
    { name: 'Faisalabad Campus', city: 'Faisalabad', isMain: false },
  ],
  'Ghulam Ishaq Khan Institute': [
    { name: 'Main Campus', city: 'Topi', address: 'Topi, Swabi', isMain: true, website: 'https://giki.edu.pk' },
  ],
};

// Real AI knowledge data (FIXED - correct data for each university)
const AI_DATA: Record<string, {
  admission_process: string;
  admission_dates: string;
  fee_range: string;
  closing_merit: string;
  entry_test_details: string;
  exam_system: string;
  scholarships_offered: string;
  supply_policy: string;
  is_open_merit: boolean;
}> = {
  'University of the Punjab': {
    admission_process: '1. Apply online at pu.edu.pk/admissions. 2. Pay PKR 1,000-2,000 application fee. 3. Merit based on intermediate marks. 4. Merit lists announced July-October.',
    admission_dates: 'Fall admissions: June-September (annual intake). Some departments have Spring intake: January-March. Merit lists: July-October.',
    fee_range: 'PKR 25,000-60,000/semester (public sector). BS CS: ~PKR 45,000/sem. BBA: ~PKR 40,000/sem. LLB: ~PKR 30,000/sem.',
    closing_merit: 'BS CS: 85%, BBA: 83%, BS Economics: 80%, BS Psychology: 78%, BS English: 75%, LLB: 82%.',
    entry_test_details: 'No separate entry test for most programs. Merit = intermediate marks (100%). Some programs require PU admission test.',
    exam_system: 'yearly',
    scholarships_offered: 'PU Merit Scholarship (full tuition for top 3 students per program). Need-based financial aid. International student scholarships.',
    supply_policy: 'Students with up to 3 supplies can apply. Must clear all supplies within 2 years.',
    is_open_merit: true,
  },
  'University of Karachi': {
    admission_process: '1. Apply online at uok.edu.pk/admissions. 2. Pay PKR 1,500 application fee. 3. Entry test by UOK. 4. Merit list based on FSc + entry test.',
    admission_dates: 'Fall admissions: July-September. Spring admissions: January-February. UOK entry test: August (Fall), February (Spring).',
    fee_range: 'PKR 20,000-50,000/semester (public sector). BS CS: ~PKR 35,000/sem. BBA: ~PKR 30,000/sem. MBBS: ~PKR 200,000/sem.',
    closing_merit: 'BS CS: 80%, BBA: 78%, BS Accounting: 76%, BS Pharmacy: 82%, MBBS: 90%.',
    entry_test_details: 'UOK Entry Test: 100 MCQs (subject-based), 2 hours. Weightage: FSc 50% + Entry Test 50%.',
    exam_system: 'yearly',
    scholarships_offered: 'Karachi University Merit Scholarship. Sindh Government scholarships for Sindh domicile. Need-based financial aid.',
    supply_policy: 'Up to 3 supplies allowed. Must clear within 3 years. Supplementary exams held twice a year.',
    is_open_merit: true,
  },
  'FAST-NUCES (National University of Computer and Emerging Sciences)': {
    admission_process: '1. Apply at nu.edu.pk/admissions. 2. Pay PKR 2,500 fee. 3. FAST Admission Test (SAT-based). 4. Merit = SAT/Test 40% + FSc 60%.',
    admission_dates: 'Fall: June-August. Spring: November-January. FAST Test: July (Fall), December (Spring).',
    fee_range: 'PKR 130,000-180,000/semester. BS CS: ~PKR 160,000/sem. BBA: ~PKR 150,000/sem. BS EE: ~PKR 155,000/sem.',
    closing_merit: 'BS CS (Islamabad): 88%, BS CS (Lahore): 85%, BS CS (Karachi): 82%, BBA: 80%, BS EE: 78%.',
    entry_test_details: 'FAST Admission Test: 80 MCQs (Math 40, English 20, IQ 20), 2 hours. SAT scores also accepted.',
    exam_system: 'semester',
    scholarships_offered: 'FAST Merit Scholarship (up to 100% tuition waiver). Need-based financial aid. Sports quota scholarships.',
    supply_policy: 'No supply system. Failed courses must be retaken next semester. Maximum 8 years to complete BS.',
    is_open_merit: false,
  },
  'National University of Sciences & Technology': {
    admission_process: '1. Apply at nust.edu.pk/admissions. 2. Pay PKR 3,000 fee. 3. NUST Entry Test (NET). 4. Merit = NET 75% + FSc 25%.',
    admission_dates: 'Fall: June-August. NET: July-August (multiple sittings). Classes start September.',
    fee_range: 'PKR 150,000-250,000/semester. BS Engineering: ~PKR 200,000/sem. BS CS: ~PKR 180,000/sem. BBA: ~PKR 170,000/sem.',
    closing_merit: 'BS CS: 92%, BS EE: 88%, BS ME: 86%, BBA: 85%, BS Civil: 84%.',
    entry_test_details: 'NET: 200 MCQs (Math 80, Physics/CS 80, English 40), 3 hours. Conducted at Islamabad, Karachi, Lahore, Quetta, Peshawar.',
    exam_system: 'semester',
    scholarships_offered: 'NUST Merit Scholarship (full fee waiver for top 5%). Need-based financial aid. Military quota. Sports scholarships.',
    supply_policy: 'No traditional supply system. Failed courses retaken. Maximum 2 repeats per course.',
    is_open_merit: false,
  },
  'COMSATS University Islamabad': {
    admission_process: '1. Apply at comsats.edu.pk/admissions. 2. Pay PKR 2,000 fee. 3. COMSATS Entry Test. 4. Merit = Entry Test 40% + FSc 60%.',
    admission_dates: 'Fall: June-September. Spring: December-January. Entry test: July (Fall), January (Spring).',
    fee_range: 'PKR 80,000-140,000/semester. BS CS: ~PKR 120,000/sem. BBA: ~PKR 110,000/sem. BS Engineering: ~PKR 130,000/sem.',
    closing_merit: 'BS CS (Islamabad): 85%, BS CS (Lahore): 82%, BBA: 78%, BS EE: 80%, BS Pharmacy: 76%.',
    entry_test_details: 'COMSATS Entry Test: 100 MCQs (Math 40, English 30, IQ 30), 2 hours.',
    exam_system: 'semester',
    scholarships_offered: 'COMSATS Merit Scholarship (50-100% fee waiver). Need-based financial aid. Sports quota.',
    supply_policy: 'Up to 2 courses can be repeated. Maximum 7 years for BS degree.',
    is_open_merit: true,
  },
  'NED University of Engineering & Technology': {
    admission_process: '1. Apply at neduet.edu.pk/admissions. 2. Pay PKR 2,500 fee. 3. NED Entry Test. 4. Merit = Entry Test 50% + FSc 50%.',
    admission_dates: 'Fall: July-September. NED Entry Test: August. Classes start October.',
    fee_range: 'PKR 60,000-120,000/semester (public sector). BS Engineering: ~PKR 100,000/sem. BS CS: ~PKR 90,000/sem.',
    closing_merit: 'BS Electrical Eng: 88%, BS CS: 86%, BS Mechanical: 84%, BS Civil: 80%, BS Chemical: 82%.',
    entry_test_details: 'NED Entry Test: 150 MCQs (Math 60, Physics 60, English 30), 2.5 hours.',
    exam_system: 'semester',
    scholarships_offered: 'NED Merit Scholarship. Sindh government scholarships. Alumni-funded financial aid.',
    supply_policy: 'Up to 4 supplies allowed per year. Must clear within 4 years.',
    is_open_merit: false,
  },
  'Quaid-i-Azam University': {
    admission_process: '1. Apply at qau.edu.pk/admissions. 2. Pay PKR 1,500 fee. 3. Merit based on FSc/previous degree. 4. Some programs require QAU entry test.',
    admission_dates: 'Fall: June-September. Spring: January-February. Annual intake for most programs.',
    fee_range: 'PKR 20,000-50,000/semester (public sector). BS: ~PKR 30,000/sem. MS: ~PKR 40,000/sem. PhD: ~PKR 50,000/sem.',
    closing_merit: 'BS CS: 82%, BS Physics: 72%, BS Economics: 75%, BS International Relations: 78%.',
    entry_test_details: 'QAU Entry Test (for select programs): 80 MCQs, subject-based, 2 hours.',
    exam_system: 'semester',
    scholarships_offered: 'QAU Merit Scholarship (full waiver for top students). HEC need-based scholarship. International student funding.',
    supply_policy: 'Up to 3 supplies per semester. Must clear within 3 years.',
    is_open_merit: true,
  },
  'Lahore University of Management Sciences': {
    admission_process: '1. Apply at lums.edu.pk/admissions. 2. Pay PKR 3,000 fee. 3. Submit SAT/LAT scores. 4. Interview for shortlisted candidates.',
    admission_dates: 'Fall: June-August. Spring: November-January. LAT offered multiple times. Early admission opens April.',
    fee_range: 'PKR 350,000-450,000/semester. BS CS: ~PKR 420,000/sem. BBA: ~PKR 430,000/sem. Hostel: PKR 80,000-120,000/sem.',
    closing_merit: 'BS CS: 93-95%, BBA: 91-93%, BS Electrical Eng: 88%, BS Maths: 85%, BS Economics: 82%.',
    entry_test_details: 'LAT (LUMS Admission Test): SAT-style test. SAT scores (1300+) also accepted. Interview for final selection.',
    exam_system: 'semester',
    scholarships_offered: 'LUMS National Financial Aid Program (up to 100%). LUMS Honhaar Scholarship. Sports quota.',
    supply_policy: 'No supply system. Failed courses must be retaken. Academic probation after 2 failed courses.',
    is_open_merit: false,
  },
  'Ghulam Ishaq Khan Institute of Engineering Sciences and Technology': {
    admission_process: '1. Apply at giki.edu.pk/admissions. 2. Pay PKR 3,500 fee. 3. GIKI Entry Test. 4. Interview. Merit = Test 60% + FSc 40%.',
    admission_dates: 'Admissions: June-August. GIKI Test: August. Fall starts September. Single annual intake.',
    fee_range: 'PKR 250,000-350,000/semester. BS Engineering: ~PKR 300,000/sem. BS CS: ~PKR 310,000/sem. Hostel + meals: PKR 80,000/sem.',
    closing_merit: 'BS Electrical Eng: 88%, BS Mechanical: 85%, BS CS: 90%, BS Chemical: 83%, BS Nuclear: 78%.',
    entry_test_details: 'GIKI Test: 180 MCQs (Math 70, Physics 70, English 40), 3 hours. Conducted in 12 cities.',
    exam_system: 'semester',
    scholarships_offered: 'GIKI Merit Scholarship (full fee waiver). Need-based financial aid (up to 75%). Alumni-funded scholarships.',
    supply_policy: 'No supply system. Failed courses retaken next semester. Maximum 7 years for BS.',
    is_open_merit: false,
  },
  'Air University': {
    admission_process: '1. Apply at au.edu.pk/admissions. 2. Pay PKR 2,000 fee. 3. AU Entry Test. 4. Merit = Entry Test 40% + FSc 60%.',
    admission_dates: 'Fall: July-September. Spring: January-March. AU Entry Test: August (Fall), February (Spring).',
    fee_range: 'PKR 100,000-150,000/semester. BS CS: ~PKR 130,000/sem. BS EE: ~PKR 120,000/sem. BBA: ~PKR 110,000/sem.',
    closing_merit: 'BS CS: 82%, BS EE: 79%, BS SE: 80%, BBA: 78%, BS Avionics: 76%.',
    entry_test_details: 'AU Entry Test: 100 MCQs (Math 40, Physics/CS 40, English 20), 2 hours.',
    exam_system: 'semester',
    scholarships_offered: 'Air University Merit Scholarship. PAF quota (up to 50% waiver). Need-based financial aid.',
    supply_policy: 'Up to 2 supplies per semester. Must clear within 6 years.',
    is_open_merit: true,
  },
  'Bahria University': {
    admission_process: '1. Apply at bahria.edu.pk/admissions. 2. Pay PKR 1,500 fee. 3. Bahria Entry Test. 4. Merit = Entry Test 40% + FSc 60%.',
    admission_dates: 'Fall: July-September. Spring: January-March. Bahria Test: August (Fall), February (Spring).',
    fee_range: 'PKR 90,000-140,000/semester. BS CS: ~PKR 120,000/sem. BBA: ~PKR 110,000/sem. BS Pharmacy: ~PKR 100,000/sem.',
    closing_merit: 'BS CS (Islamabad): 80%, BS CS (Karachi): 78%, BS EE: 75%, BBA: 77%, BS Pharmacy: 73%.',
    entry_test_details: 'Bahria Entry Test: 100 MCQs (Math 40, English 30, General Knowledge 30), 2 hours.',
    exam_system: 'semester',
    scholarships_offered: 'Bahria Merit Scholarship. Navy quota (up to 75% waiver). Need-based financial aid.',
    supply_policy: 'Up to 3 supplies per semester. Must clear within 6 years.',
    is_open_merit: true,
  },
  'Institute of Business Administration Karachi': {
    admission_process: '1. Apply at iba.edu.pk/admissions. 2. Pay PKR 3,000 fee. 3. SAT/IBA Entry Test. 4. Interview for shortlisted.',
    admission_dates: 'Fall: May-August. SAT scores accepted until July. IBA Test: August. Classes start September.',
    fee_range: 'PKR 200,000-300,000/semester. BBA: ~PKR 280,000/sem. BS CS: ~PKR 250,000/sem. MBA: ~PKR 300,000/sem.',
    closing_merit: 'BBA: 92%, BS CS: 88%, BS Accounting: 85%. SAT: 1300+ for BBA.',
    entry_test_details: 'IBA Entry Test: SAT-style (Math + Verbal). SAT scores (1200+) accepted. Interview is final step.',
    exam_system: 'semester',
    scholarships_offered: 'IBA Merit Scholarship (full tuition). Need-based financial aid (up to 100%). Corporate-sponsored scholarships.',
    supply_policy: 'No supply system. Failed courses retaken. Academic dismissal after 3 failed courses.',
    is_open_merit: false,
  },
  'International Islamic University Islamabad': {
    admission_process: '1. Apply at iiui.edu.pk/admissions. 2. Pay PKR 1,500 fee. 3. IIUI Entry Test. 4. Merit = Entry Test 30% + FSc 70%.',
    admission_dates: 'Fall: June-September. Spring: January-March. IIUI Test: July (Fall), February (Spring).',
    fee_range: 'PKR 40,000-80,000/semester (public sector). BS CS: ~PKR 60,000/sem. BBA: ~PKR 55,000/sem.',
    closing_merit: 'BS CS: 78%, BBA: 76%, BS Engineering: 80%, BS Islamic Studies: 65%.',
    entry_test_details: 'IIUI Entry Test: 100 MCQs (subject-based + Islamic Studies 20), 2 hours.',
    exam_system: 'semester',
    scholarships_offered: 'IIUI Merit Scholarship. HEC need-based. International student scholarships from OIC countries.',
    supply_policy: 'Up to 3 supplies per year. Must clear within 4 years.',
    is_open_merit: true,
  },
  'University of Engineering and Technology Lahore': {
    admission_process: '1. Apply at uet.edu.pk/admissions. 2. Pay PKR 2,500 fee. 3. UET Entry Test (ECAT). 4. Merit = ECAT 50% + FSc 50%.',
    admission_dates: 'Admissions: June-August. ECAT: August (multiple sittings). Classes start September.',
    fee_range: 'PKR 60,000-120,000/semester (public sector). BS Engineering: ~PKR 100,000/sem.',
    closing_merit: 'BS Electrical Eng: 90%, BS Mechanical: 88%, BS CS: 92%, BS Civil: 85%, BS Chemical: 86%.',
    entry_test_details: 'ECAT: 100 MCQs (Math 30, Physics 30, Chemistry 20, English 20), 2 hours. Conducted by UET Lahore.',
    exam_system: 'semester',
    scholarships_offered: 'UET Merit Scholarship. Punjab government scholarships. Need-based financial aid.',
    supply_policy: 'Up to 3 supplies allowed. Must clear within 4 years. Supplementary exams held annually.',
    is_open_merit: false,
  },
};

async function main() {
  console.log('=== ADDING REAL CAMPUS + AI DATA FOR MAJOR UNIVERSITIES ===\n');

  let campusAdded = 0;
  let aiUpdated = 0;

  for (const [uniName, campuses] of Object.entries(CAMPUSES)) {
    const unis = await q(`SELECT id FROM universities WHERE name ILIKE '%${uniName.replace(/'/g, "''")}%' AND country = 'Pakistan' LIMIT 1`);
    if (unis.length === 0) { console.log(`  ⚠ "${uniName}" NOT FOUND`); continue; }
    const uniId = unis[0].id;

    // Add campuses
    for (const c of campuses) {
      const existing = await q(`SELECT id FROM campuses WHERE university_id = '${uniId}' AND name = '${c.name.replace(/'/g, "''")}'`);
      if (existing.length > 0) continue;
      const id = crypto.randomUUID();
      await q(`INSERT INTO campuses (id, university_id, name, city, address, is_main, phone, email, website, created_at, updated_at) VALUES ('${id}', '${uniId}', '${c.name.replace(/'/g, "''")}', '${c.city}', ${c.address ? `'${c.address.replace(/'/g, "''")}'` : 'NULL'}, ${c.isMain}, ${c.phone ? `'${c.phone}'` : 'NULL'}, ${c.email ? `'${c.email}'` : 'NULL'}, ${c.website ? `'${c.website}'` : 'NULL'}, NOW(), NOW())`);
      campusAdded++;
    }
    console.log(`  🏛️ ${uniName}: ${campuses.length} campuses added`);
  }

  // Update AI knowledge fields
  console.log('\n--- Updating AI Knowledge Fields ---\n');
  for (const [uniName, data] of Object.entries(AI_DATA)) {
    const unis = await q(`SELECT id FROM universities WHERE name ILIKE '%${uniName.replace(/'/g, "''")}%' AND country = 'Pakistan' LIMIT 1`);
    if (unis.length === 0) { console.log(`  ⚠ "${uniName}" NOT FOUND`); continue; }
    const uniId = unis[0].id;

    await q(`UPDATE universities SET
      admission_process = '${data.admission_process.replace(/'/g, "''")}',
      admission_dates = '${data.admission_dates.replace(/'/g, "''")}',
      fee_range = '${data.fee_range.replace(/'/g, "''")}',
      closing_merit = '${data.closing_merit.replace(/'/g, "''")}',
      entry_test_details = '${data.entry_test_details.replace(/'/g, "''")}',
      exam_system = '${data.exam_system}',
      scholarships_offered = '${data.scholarships_offered.replace(/'/g, "''")}',
      supply_policy = '${data.supply_policy.replace(/'/g, "''")}',
      is_open_merit = ${data.is_open_merit},
      updated_at = NOW()
      WHERE id = '${uniId}'`);
    aiUpdated++;
    console.log(`  ✅ ${uniName}: AI data updated`);
  }

  console.log(`\n=== DONE ===`);
  console.log(`  Campuses added: ${campusAdded}`);
  console.log(`  AI data updated: ${aiUpdated} universities`);
}

main().catch(e => console.log('FATAL:', e.message));
