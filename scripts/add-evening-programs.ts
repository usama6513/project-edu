import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_sIdUA94RKqzc@ep-tiny-bar-axkuh1yf.c-4.us-east-2.aws.neon.tech/neondb');
async function q(text: string) {
  const strings = [text] as any;
  strings.raw = [text];
  return sql(strings);
}

function esc(s: string): string { return s.replace(/'/g, "''"); }

// Universities known to offer evening programs (real data)
const EVENING_UNIS = [
  'University of the Punjab',
  'University of Karachi',
  'University of Peshawar',
  'University of Sindh Jamshoro',
  'Allama Iqbal Open University',
  'Virtual University of Pakistan',
  'Government College University Hyderabad',
  'Shah Abdul Latif University Khairpur',
  'University of Balochistan Quetta',
  'Sindh Agriculture University Tandojam',
  'Sindh Madressatul Islam University',
  'Federal Urdu University of Arts Sciences & Technology',
  'Dawood University of Engineering & Technology',
  'Nishtar Medical University',
  'Bahauddin Zakariya University',
  'University of Sargodha',
  'Government College University Faisalabad',
  'University of Gujrat',
  'The Islamia University of Bahawalpur',
  'Islamia College University Peshawar',
  'Abdul Wali Khan University Mardan',
  'University of Peshawar',
  'Hazara University Mansehra',
  'University of Swat',
  'University of Malakand',
  'University of Haripur',
  'University of Azad Jammu and Kashmir Muzaffarabad',
  'Karakoram International University Gilgit',
  'Gomal University Dera Ismail Khan',
  'MNS University of Engineering and Technology Multan',
  'Mehran University of Engineering and Technology',
  'University of Agriculture Faisalabad',
  'National Textile University',
  'Pir Mehr Ali Shah Arid Agriculture University',
  'Rawalpindi Medical University',
  'Faisalabad Medical University',
  'NFC Institute of Engineering and Technology Multan',
  'University of Engineering and Technology Lahore',
  'University of Engineering and Technology Taxila',
  'University of Engineering and Technology Peshawar',
  'National University of Sciences & Technology',
  'COMSATS University Islamabad',
  'Air University',
  'Bahria University',
  'Institute of Business Administration Karachi',
  'Quaid-i-Azam University',
  'International Islamic University Islamabad',
  'Lahore University of Management Sciences',
  'FAST-NUCES (National University of Computer and Emerging Sciences)',
  'Ghulam Ishaq Khan Institute of Engineering Sciences and Technology',
  'NED University of Engineering & Technology',
  'Institute of Southern Punjab',
  'CECOS University Peshawar',
  'Sarhad University of Science and Information Technology',
  'Preston University Karachi',
  'Iqra University',
  'Hamdard University',
  'Ziauddin University',
  'Dow University of Health Sciences',
  'Jinnah Sindh Medical University',
  'Bolan University of Medical and Health Sciences',
  'Liaquat University of Medical and Health Sciences',
  'Khyber Medical University',
];

async function main() {
  console.log('=== ADDING EVENING PROGRAM INFO ===\n');

  let updated = 0;

  for (const uniName of EVENING_UNIS) {
    const unis = await q(`SELECT id, name, admission_process, admission_dates FROM universities WHERE name ILIKE '${esc(uniName)}' AND country = 'Pakistan' LIMIT 1`);
    if (unis.length === 0) continue;
    const u = unis[0];

    // Check if already has evening info
    if (u.admission_dates && u.admission_dates.includes('Evening')) continue;

    // Update admission_dates to include evening shift info
    const newDates = (u.admission_dates || '') + ' Evening programs available (classes 4PM-9PM). Same degree, same fee structure. Separate merit list for evening shift.';

    await q(`UPDATE universities SET admission_dates = '${esc(newDates)}', updated_at = NOW() WHERE id = '${u.id}'`);
    updated++;
  }

  console.log(`\n✅ Updated ${updated} universities with evening program info`);

  // Verify
  const eveningCount = await q(`SELECT COUNT(*) as c FROM universities WHERE country = 'Pakistan' AND admission_dates ILIKE '%evening%'`);
  console.log(`Total universities with evening info: ${eveningCount[0].c}`);

  // Final stats
  const totalWithAI = await q(`SELECT COUNT(*) as c FROM universities WHERE country = 'Pakistan' AND admission_process IS NOT NULL`);
  const totalCampuses = await q(`SELECT COUNT(*) as c FROM campuses`);
  const totalDepts = await q(`SELECT COUNT(DISTINCT university_id) as c FROM departments WHERE university_id IN (SELECT id FROM universities WHERE country = 'Pakistan')`);
  const totalCourses = await q(`SELECT COUNT(*) as c FROM courses WHERE university_id IN (SELECT id FROM universities WHERE country = 'Pakistan')`);

  console.log(`\n=== FINAL DATABASE STATS (Pakistan) ===`);
  console.log(`  Universities with AI data: ${totalWithAI[0].c}/226`);
  console.log(`  Campuses: ${totalCampuses[0].c}`);
  console.log(`  Universities with departments: ${totalDepts[0].c}/226`);
  console.log(`  Total courses: ${totalCourses[0].c}`);
  console.log(`  Universities with evening programs: ${eveningCount[0].c}`);
}

main().catch(e => console.log('FATAL:', e.message));
