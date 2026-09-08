const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

// Real university data: departments with actual programs offered
const UNI_DATA: Record<string, { depts: { name: string; programs: { name: string; degree: string; duration: string }[] }[] }> = {
  'University of the Punjab': { depts: [
    { name: 'Faculty of Arts & English', programs: [
      { name: 'BA English', degree: 'bachelor', duration: '2 years' }, { name: 'MA English', degree: 'master', duration: '2 years' },
      { name: 'BA Urdu', degree: 'bachelor', duration: '2 years' }, { name: 'MA Urdu', degree: 'master', duration: '2 years' },
      { name: 'BA History', degree: 'bachelor', duration: '2 years' }, { name: 'MA History', degree: 'master', duration: '2 years' },
      { name: 'BA Political Science', degree: 'bachelor', duration: '2 years' }, { name: 'MA Political Science', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Faculty of Islamic & Oriental Learning', programs: [
      { name: 'BA Islamic Studies', degree: 'bachelor', duration: '2 years' }, { name: 'MA Islamic Studies', degree: 'master', duration: '2 years' },
      { name: 'BA Arabic', degree: 'bachelor', duration: '2 years' }, { name: 'MA Arabic', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Faculty of Social Sciences', programs: [
      { name: 'BA Economics', degree: 'bachelor', duration: '2 years' }, { name: 'MA Economics', degree: 'master', duration: '2 years' },
      { name: 'BA Psychology', degree: 'bachelor', duration: '2 years' }, { name: 'MA Psychology', degree: 'master', duration: '2 years' },
      { name: 'BA Sociology', degree: 'bachelor', duration: '2 years' },
    ]},
    { name: 'Faculty of Biological Sciences', programs: [
      { name: 'BS Botany', degree: 'bachelor', duration: '4 years' }, { name: 'BS Zoology', degree: 'bachelor', duration: '4 years' },
      { name: 'BS Biochemistry', degree: 'bachelor', duration: '4 years' }, { name: 'BS Microbiology', degree: 'bachelor', duration: '4 years' },
      { name: 'BS Genetics', degree: 'bachelor', duration: '4 years' },
    ]},
    { name: 'Faculty of Physical Sciences', programs: [
      { name: 'BS Physics', degree: 'bachelor', duration: '4 years' }, { name: 'BS Chemistry', degree: 'bachelor', duration: '4 years' },
      { name: 'BS Mathematics', degree: 'bachelor', duration: '4 years' }, { name: 'BS Statistics', degree: 'bachelor', duration: '4 years' },
      { name: 'BS Computer Science', degree: 'bachelor', duration: '4 years' }, { name: 'BS Information Technology', degree: 'bachelor', duration: '4 years' },
    ]},
    { name: 'Punjab University Law College', programs: [
      { name: 'LLB 3 Years', degree: 'bachelor', duration: '3 years' }, { name: 'LLB (Hons) 5 Years', degree: 'bachelor', duration: '5 years' },
      { name: 'LLM', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Punjab University Institute of Education', programs: [
      { name: 'BEd', degree: 'bachelor', duration: '2 years' }, { name: 'MEd', degree: 'master', duration: '2 years' },
    ]},
  ]},
  'University of Karachi': { depts: [
    { name: 'Faculty of Science', programs: [
      { name: 'BS Physics', degree: 'bachelor', duration: '4 years' }, { name: 'BS Chemistry', degree: 'bachelor', duration: '4 years' },
      { name: 'BS Mathematics', degree: 'bachelor', duration: '4 years' }, { name: 'BS Statistics', degree: 'bachelor', duration: '4 years' },
      { name: 'BS Computer Science', degree: 'bachelor', duration: '4 years' }, { name: 'BS Software Engineering', degree: 'bachelor', duration: '4 years' },
      { name: 'BS Biochemistry', degree: 'bachelor', duration: '4 years' }, { name: 'BS Microbiology', degree: 'bachelor', duration: '4 years' },
      { name: 'BS Botany', degree: 'bachelor', duration: '4 years' }, { name: 'BS Zoology', degree: 'bachelor', duration: '4 years' },
      { name: 'BS Geology', degree: 'bachelor', duration: '4 years' },
    ]},
    { name: 'Faculty of Arts', programs: [
      { name: 'BA English', degree: 'bachelor', duration: '2 years' }, { name: 'MA English', degree: 'master', duration: '2 years' },
      { name: 'BA Urdu', degree: 'bachelor', duration: '2 years' }, { name: 'MA Urdu', degree: 'master', duration: '2 years' },
      { name: 'BA Islamic Studies', degree: 'bachelor', duration: '2 years' },
    ]},
    { name: 'Faculty of Social Sciences', programs: [
      { name: 'BA Economics', degree: 'bachelor', duration: '2 years' }, { name: 'MA Economics', degree: 'master', duration: '2 years' },
      { name: 'BA Political Science', degree: 'bachelor', duration: '2 years' }, { name: 'BA Psychology', degree: 'bachelor', duration: '2 years' },
      { name: 'BA Sociology', degree: 'bachelor', duration: '2 years' },
    ]},
    { name: 'Faculty of Pharmacy', programs: [
      { name: 'Pharm-D', degree: 'bachelor', duration: '5 years' }, { name: 'MS Pharmacology', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Faculty of Management & Administrative Sciences', programs: [
      { name: 'BBA', degree: 'bachelor', duration: '4 years' }, { name: 'MBA', degree: 'master', duration: '2 years' },
      { name: 'BCom', degree: 'bachelor', duration: '2 years' }, { name: 'MCom', degree: 'master', duration: '2 years' },
    ]},
  ]},
  'LUMS': { depts: [
    { name: 'Syed Babar Ali School of Science and Engineering', programs: [
      { name: 'BS Computer Science', degree: 'bachelor', duration: '4 years' }, { name: 'BS Electrical Engineering', degree: 'bachelor', duration: '4 years' },
      { name: 'BS Mathematics', degree: 'bachelor', duration: '4 years' }, { name: 'BS Physics', degree: 'bachelor', duration: '4 years' },
      { name: 'BS Chemistry', degree: 'bachelor', duration: '4 years' },
    ]},
    { name: 'Suleman Dawood School of Business', programs: [
      { name: 'BBA', degree: 'bachelor', duration: '4 years' }, { name: 'MBA', degree: 'master', duration: '2 years' },
      { name: 'MS Business Analytics', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Shaikh Ahmad Hassan School of Law', programs: [
      { name: 'LLB (Hons) 5 Years', degree: 'bachelor', duration: '5 years' }, { name: 'LLM', degree: 'master', duration: '1 year' },
    ]},
    { name: 'Mushtaq Ahmad Gurmani School of Humanities & Social Sciences', programs: [
      { name: 'BA Economics', degree: 'bachelor', duration: '4 years' }, { name: 'BA Political Science', degree: 'bachelor', duration: '4 years' },
      { name: 'BA Psychology', degree: 'bachelor', duration: '4 years' }, { name: 'BA History', degree: 'bachelor', duration: '4 years' },
    ]},
    { name: 'Abdullah School of Education', programs: [
      { name: 'BS Education', degree: 'bachelor', duration: '4 years' }, { name: 'MS Education', degree: 'master', duration: '2 years' },
    ]},
  ]},
  'NUST': { depts: [
    { name: 'School of Electrical Engineering and Computer Science (SEECS)', programs: [
      { name: 'BS Electrical Engineering', degree: 'bachelor', duration: '4 years' }, { name: 'BS Computer Engineering', degree: 'bachelor', duration: '4 years' },
      { name: 'BS Software Engineering', degree: 'bachelor', duration: '4 years' }, { name: 'BS Computer Science', degree: 'bachelor', duration: '4 years' },
      { name: 'MS Computer Science', degree: 'master', duration: '2 years' }, { name: 'PhD Computer Science', degree: 'phd', duration: '5 years' },
    ]},
    { name: 'Military College of Electrical & Mechanical Engineering (MCEME)', programs: [
      { name: 'BS Electrical Engineering', degree: 'bachelor', duration: '4 years' }, { name: 'BS Mechanical Engineering', degree: 'bachelor', duration: '4 years' },
    ]},
    { name: 'College of Aeronautical Engineering (CAE)', programs: [
      { name: 'BS Aeronautical Engineering', degree: 'bachelor', duration: '4 years' }, { name: 'MS Aeronautical Engineering', degree: 'master', duration: '2 years' },
    ]},
    { name: 'NUST Business School (NBS)', programs: [
      { name: 'BBA', degree: 'bachelor', duration: '4 years' }, { name: 'MBA', degree: 'master', duration: '2 years' },
      { name: 'MS Data Science', degree: 'master', duration: '2 years' },
    ]},
    { name: 'School of Civil and Environmental Engineering (SCEE)', programs: [
      { name: 'BS Civil Engineering', degree: 'bachelor', duration: '4 years' }, { name: 'MS Structural Engineering', degree: 'master', duration: '2 years' },
    ]},
    { name: 'School of Mechanical and Manufacturing Engineering (SMME)', programs: [
      { name: 'BS Mechanical Engineering', degree: 'bachelor', duration: '4 years' }, { name: 'BS Mechatronics Engineering', degree: 'bachelor', duration: '4 years' },
    ]},
    { name: 'School of Natural Sciences (SNS)', programs: [
      { name: 'BS Mathematics', degree: 'bachelor', duration: '4 years' }, { name: 'BS Physics', degree: 'bachelor', duration: '4 years' },
    ]},
  ]},
  'FAST-NUCES': { depts: [
    { name: 'Department of Computer Science', programs: [
      { name: 'BS Computer Science', degree: 'bachelor', duration: '4 years' }, { name: 'MS Computer Science', degree: 'master', duration: '2 years' },
      { name: 'PhD Computer Science', degree: 'phd', duration: '5 years' },
    ]},
    { name: 'Department of Software Engineering', programs: [
      { name: 'BS Software Engineering', degree: 'bachelor', duration: '4 years' }, { name: 'MS Software Engineering', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Department of Electrical Engineering', programs: [
      { name: 'BS Electrical Engineering', degree: 'bachelor', duration: '4 years' }, { name: 'MS Electrical Engineering', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Department of Artificial Intelligence & Data Science', programs: [
      { name: 'BS Artificial Intelligence', degree: 'bachelor', duration: '4 years' }, { name: 'BS Data Science', degree: 'bachelor', duration: '4 years' },
    ]},
    { name: 'Department of Management Sciences', programs: [
      { name: 'BBA', degree: 'bachelor', duration: '4 years' }, { name: 'MBA', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Department of Mathematics', programs: [
      { name: 'BS Mathematics', degree: 'bachelor', duration: '4 years' }, { name: 'MS Mathematics', degree: 'master', duration: '2 years' },
    ]},
  ]},
  'UET Lahore': { depts: [
    { name: 'Department of Electrical Engineering', programs: [
      { name: 'BSc Electrical Engineering', degree: 'bachelor', duration: '4 years' }, { name: 'MSc Electrical Engineering', degree: 'master', duration: '2 years' },
      { name: 'PhD Electrical Engineering', degree: 'phd', duration: '5 years' },
    ]},
    { name: 'Department of Mechanical Engineering', programs: [
      { name: 'BSc Mechanical Engineering', degree: 'bachelor', duration: '4 years' }, { name: 'MSc Mechanical Engineering', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Department of Civil Engineering', programs: [
      { name: 'BSc Civil Engineering', degree: 'bachelor', duration: '4 years' }, { name: 'MSc Civil Engineering', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Department of Computer Science and Engineering', programs: [
      { name: 'BS Computer Science and Engineering', degree: 'bachelor', duration: '4 years' }, { name: 'MS Computer Science', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Department of Chemical Engineering', programs: [
      { name: 'BSc Chemical Engineering', degree: 'bachelor', duration: '4 years' }, { name: 'MSc Chemical Engineering', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Department of Architecture', programs: [
      { name: 'BSc Architecture', degree: 'bachelor', duration: '4 years' }, { name: 'MSc Architecture', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Department of Metallurgy and Materials Engineering', programs: [
      { name: 'BSc Metallurgy and Materials Engineering', degree: 'bachelor', duration: '4 years' },
    ]},
    { name: 'Department of Mining Engineering', programs: [
      { name: 'BSc Mining Engineering', degree: 'bachelor', duration: '4 years' },
    ]},
  ]},
  'COMSATS University Islamabad': { depts: [
    { name: 'Department of Computer Science', programs: [
      { name: 'BS Computer Science', degree: 'bachelor', duration: '4 years' }, { name: 'MS Computer Science', degree: 'master', duration: '2 years' },
      { name: 'PhD Computer Science', degree: 'phd', duration: '5 years' },
    ]},
    { name: 'Department of Electrical Engineering', programs: [
      { name: 'BS Electrical Engineering', degree: 'bachelor', duration: '4 years' }, { name: 'MS Electrical Engineering', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Department of Management Sciences', programs: [
      { name: 'BBA', degree: 'bachelor', duration: '4 years' }, { name: 'MBA', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Department of Mathematics', programs: [
      { name: 'BS Mathematics', degree: 'bachelor', duration: '4 years' }, { name: 'MS Mathematics', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Department of Physics', programs: [
      { name: 'BS Physics', degree: 'bachelor', duration: '4 years' }, { name: 'MS Physics', degree: 'master', duration: '2 years' },
    ]},
  ]},
  'GIKI': { depts: [
    { name: 'Faculty of Engineering Sciences', programs: [
      { name: 'BS Electrical Engineering', degree: 'bachelor', duration: '4 years' }, { name: 'BS Mechanical Engineering', degree: 'bachelor', duration: '4 years' },
      { name: 'BS Chemical Engineering', degree: 'bachelor', duration: '4 years' }, { name: 'BS Civil Engineering', degree: 'bachelor', duration: '4 years' },
      { name: 'BS Computer Science and Engineering', degree: 'bachelor', duration: '4 years' },
    ]},
    { name: 'Faculty of Science', programs: [
      { name: 'BS Physics', degree: 'bachelor', duration: '4 years' }, { name: 'BS Chemistry', degree: 'bachelor', duration: '4 years' },
      { name: 'BS Mathematics', degree: 'bachelor', duration: '4 years' },
    ]},
    { name: 'Faculty of Management Sciences', programs: [
      { name: 'BBA', degree: 'bachelor', duration: '4 years' }, { name: 'MBA', degree: 'master', duration: '2 years' },
    ]},
  ]},
  'Quaid-i-Azam University': { depts: [
    { name: 'Faculty of Biological Sciences', programs: [
      { name: 'BS Bioinformatics', degree: 'bachelor', duration: '4 years' }, { name: 'BS Biotechnology', degree: 'bachelor', duration: '4 years' },
      { name: 'BS Microbiology', degree: 'bachelor', duration: '4 years' }, { name: 'PhD Biological Sciences', degree: 'phd', duration: '5 years' },
    ]},
    { name: 'Faculty of Physical Sciences', programs: [
      { name: 'BS Physics', degree: 'bachelor', duration: '4 years' }, { name: 'BS Chemistry', degree: 'bachelor', duration: '4 years' },
      { name: 'BS Mathematics', degree: 'bachelor', duration: '4 years' }, { name: 'BS Earth Sciences', degree: 'bachelor', duration: '4 years' },
    ]},
    { name: 'Faculty of Social Sciences', programs: [
      { name: 'BA Economics', degree: 'bachelor', duration: '2 years' }, { name: 'BA Political Science', degree: 'bachelor', duration: '2 years' },
      { name: 'BA Psychology', degree: 'bachelor', duration: '2 years' }, { name: 'BA International Relations', degree: 'bachelor', duration: '2 years' },
    ]},
    { name: 'Faculty of Computing', programs: [
      { name: 'BS Computer Science', degree: 'bachelor', duration: '4 years' }, { name: 'MS Computer Science', degree: 'master', duration: '2 years' },
      { name: 'PhD Computer Science', degree: 'phd', duration: '5 years' },
    ]},
  ]},
  'Air University': { depts: [
    { name: 'Faculty of Engineering', programs: [
      { name: 'BS Aerospace Engineering', degree: 'bachelor', duration: '4 years' }, { name: 'BS Avionics Engineering', degree: 'bachelor', duration: '4 years' },
      { name: 'BS Electrical Engineering', degree: 'bachelor', duration: '4 years' }, { name: 'BS Mechanical Engineering', degree: 'bachelor', duration: '4 years' },
      { name: 'BS Software Engineering', degree: 'bachelor', duration: '4 years' }, { name: 'BS Computer Engineering', degree: 'bachelor', duration: '4 years' },
    ]},
    { name: 'Faculty of Computing & AI', programs: [
      { name: 'BS Computer Science', degree: 'bachelor', duration: '4 years' }, { name: 'BS Artificial Intelligence', degree: 'bachelor', duration: '4 years' },
      { name: 'MS Computer Science', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Faculty of Management Sciences', programs: [
      { name: 'BBA', degree: 'bachelor', duration: '4 years' }, { name: 'MBA', degree: 'master', duration: '2 years' },
    ]},
  ]},
  'Bahria University': { depts: [
    { name: 'Faculty of Engineering', programs: [
      { name: 'BS Electrical Engineering', degree: 'bachelor', duration: '4 years' }, { name: 'BS Mechanical Engineering', degree: 'bachelor', duration: '4 years' },
      { name: 'BS Civil Engineering', degree: 'bachelor', duration: '4 years' }, { name: 'BS Computer Engineering', degree: 'bachelor', duration: '4 years' },
    ]},
    { name: 'Faculty of Computing', programs: [
      { name: 'BS Computer Science', degree: 'bachelor', duration: '4 years' }, { name: 'BS Software Engineering', degree: 'bachelor', duration: '4 years' },
      { name: 'BS Information Technology', degree: 'bachelor', duration: '4 years' },
    ]},
    { name: 'Faculty of Management & Social Sciences', programs: [
      { name: 'BBA', degree: 'bachelor', duration: '4 years' }, { name: 'MBA', degree: 'master', duration: '2 years' },
      { name: 'BS International Relations', degree: 'bachelor', duration: '4 years' }, { name: 'BS Psychology', degree: 'bachelor', duration: '4 years' },
    ]},
    { name: 'Faculty of Health & Biosciences', programs: [
      { name: 'BS Biotechnology', degree: 'bachelor', duration: '4 years' }, { name: 'BS Environmental Science', degree: 'bachelor', duration: '4 years' },
    ]},
  ]},
  'IBA Karachi': { depts: [
    { name: 'Department of Computer Science', programs: [
      { name: 'BS Computer Science', degree: 'bachelor', duration: '4 years' }, { name: 'MS Computer Science', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Department of Business Administration', programs: [
      { name: 'BBA', degree: 'bachelor', duration: '4 years' }, { name: 'MBA', degree: 'master', duration: '2 years' },
      { name: 'Executive MBA', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Department of Economics & Social Sciences', programs: [
      { name: 'BS Economics', degree: 'bachelor', duration: '4 years' }, { name: 'BA Social Sciences', degree: 'bachelor', duration: '4 years' },
    ]},
    { name: 'Department of Media Studies', programs: [
      { name: 'BS Media Studies', degree: 'bachelor', duration: '4 years' },
    ]},
    { name: 'Department of Mathematics', programs: [
      { name: 'BS Mathematics', degree: 'bachelor', duration: '4 years' },
    ]},
  ]},
  'NED University': { depts: [
    { name: 'Department of Electrical Engineering', programs: [
      { name: 'BE Electrical Engineering', degree: 'bachelor', duration: '4 years' }, { name: 'ME Electrical Engineering', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Department of Electronics Engineering', programs: [
      { name: 'BE Electronics Engineering', degree: 'bachelor', duration: '4 years' },
    ]},
    { name: 'Department of Mechanical Engineering', programs: [
      { name: 'BE Mechanical Engineering', degree: 'bachelor', duration: '4 years' }, { name: 'ME Mechanical Engineering', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Department of Civil Engineering', programs: [
      { name: 'BE Civil Engineering', degree: 'bachelor', duration: '4 years' }, { name: 'ME Structural Engineering', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Department of Computer Science and IT', programs: [
      { name: 'BE Computer Engineering', degree: 'bachelor', duration: '4 years' }, { name: 'BS Information Technology', degree: 'bachelor', duration: '4 years' },
    ]},
    { name: 'Department of Architecture', programs: [
      { name: 'BArch', degree: 'bachelor', duration: '4 years' },
    ]},
    { name: 'Department of Chemical Engineering', programs: [
      { name: 'BE Chemical Engineering', degree: 'bachelor', duration: '4 years' },
    ]},
  ]},
  'SZABIST': { depts: [
    { name: 'Department of Computer Science', programs: [
      { name: 'BS Computer Science', degree: 'bachelor', duration: '4 years' }, { name: 'MS Computer Science', degree: 'master', duration: '2 years' },
      { name: 'PhD Computer Science', degree: 'phd', duration: '5 years' },
    ]},
    { name: 'Department of Business Administration', programs: [
      { name: 'BBA', degree: 'bachelor', duration: '4 years' }, { name: 'MBA', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Department of Media Studies', programs: [
      { name: 'BS Media Studies', degree: 'bachelor', duration: '4 years' },
    ]},
    { name: 'Department of Law', programs: [
      { name: 'LLB (Hons) 5 Years', degree: 'bachelor', duration: '5 years' },
    ]},
  ]},
  'IIUI': { depts: [
    { name: 'Faculty of Computing', programs: [
      { name: 'BS Computer Science', degree: 'bachelor', duration: '4 years' }, { name: 'BS Software Engineering', degree: 'bachelor', duration: '4 years' },
      { name: 'MS Computer Science', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Faculty of Engineering', programs: [
      { name: 'BS Electrical Engineering', degree: 'bachelor', duration: '4 years' }, { name: 'BS Mechanical Engineering', degree: 'bachelor', duration: '4 years' },
    ]},
    { name: 'Faculty of Social Sciences', programs: [
      { name: 'BA Economics', degree: 'bachelor', duration: '2 years' }, { name: 'BA Political Science', degree: 'bachelor', duration: '2 years' },
      { name: 'BA English', degree: 'bachelor', duration: '2 years' },
    ]},
    { name: 'Faculty of Management Sciences', programs: [
      { name: 'BBA', degree: 'bachelor', duration: '4 years' }, { name: 'MBA', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Faculty of Islamic Studies', programs: [
      { name: 'BA Islamic Studies', degree: 'bachelor', duration: '2 years' }, { name: 'MA Islamic Studies', degree: 'master', duration: '2 years' },
    ]},
  ]},
  'University of Peshawar': { depts: [
    { name: 'Department of Computer Science and IT', programs: [
      { name: 'BS Computer Science', degree: 'bachelor', duration: '4 years' }, { name: 'MS Computer Science', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Department of Economics', programs: [
      { name: 'BA Economics', degree: 'bachelor', duration: '2 years' }, { name: 'MA Economics', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Department of English', programs: [
      { name: 'BA English', degree: 'bachelor', duration: '2 years' }, { name: 'MA English', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Department of Pashto', programs: [
      { name: 'BA Pashto', degree: 'bachelor', duration: '2 years' }, { name: 'MA Pashto', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Department of Pharmacy', programs: [
      { name: 'Pharm-D', degree: 'bachelor', duration: '5 years' },
    ]},
    { name: 'Department of Law', programs: [
      { name: 'LLB (Hons) 5 Years', degree: 'bachelor', duration: '5 years' }, { name: 'LLM', degree: 'master', duration: '2 years' },
    ]},
  ]},
  'University of Sindh Jamshoro': { depts: [
    { name: 'Faculty of Natural Sciences', programs: [
      { name: 'BS Physics', degree: 'bachelor', duration: '4 years' }, { name: 'BS Chemistry', degree: 'bachelor', duration: '4 years' },
      { name: 'BS Mathematics', degree: 'bachelor', duration: '4 years' }, { name: 'BS Computer Science', degree: 'bachelor', duration: '4 years' },
    ]},
    { name: 'Faculty of Arts', programs: [
      { name: 'BA Political Science', degree: 'bachelor', duration: '2 years' }, { name: 'BA English', degree: 'bachelor', duration: '2 years' },
      { name: 'BA Sindhi', degree: 'bachelor', duration: '2 years' },
    ]},
    { name: 'Faculty of Social Sciences', programs: [
      { name: 'BA Economics', degree: 'bachelor', duration: '2 years' }, { name: 'BA Education', degree: 'bachelor', duration: '2 years' },
    ]},
    { name: 'Faculty of Pharmacy', programs: [
      { name: 'Pharm-D', degree: 'bachelor', duration: '5 years' },
    ]},
  ]},
  'University of Agriculture Faisalabad': { depts: [
    { name: 'Faculty of Agriculture', programs: [
      { name: 'BSc Agriculture (Hons)', degree: 'bachelor', duration: '4 years' }, { name: 'MSc Agriculture', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Faculty of Animal Husbandry', programs: [
      { name: 'BS Animal Sciences', degree: 'bachelor', duration: '4 years' }, { name: 'DVM', degree: 'bachelor', duration: '5 years' },
    ]},
    { name: 'Faculty of Food Science & Technology', programs: [
      { name: 'BS Food Science & Technology', degree: 'bachelor', duration: '4 years' },
    ]},
    { name: 'Faculty of Agricultural Engineering', programs: [
      { name: 'BS Agricultural Engineering', degree: 'bachelor', duration: '4 years' },
    ]},
  ]},
  'University of Veterinary and Animal Sciences': { depts: [
    { name: 'Faculty of Veterinary Science', programs: [
      { name: 'DVM', degree: 'bachelor', duration: '5 years' }, { name: 'MVSc', degree: 'master', duration: '2 years' },
      { name: 'PhD Veterinary Science', degree: 'phd', duration: '5 years' },
    ]},
    { name: 'Faculty of Animal Production', programs: [
      { name: 'BS Animal Production', degree: 'bachelor', duration: '4 years' },
    ]},
    { name: 'Faculty of Life Sciences', programs: [
      { name: 'BS Biotechnology', degree: 'bachelor', duration: '4 years' }, { name: 'BS Food Science', degree: 'bachelor', duration: '4 years' },
    ]},
  ]},
  'University of Engineering and Technology Lahore': { depts: [
    { name: 'Department of Computer Science and Engineering', programs: [
      { name: 'BS Computer Science and Engineering', degree: 'bachelor', duration: '4 years' }, { name: 'MS Computer Science', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Department of Electrical Engineering', programs: [
      { name: 'BSc Electrical Engineering', degree: 'bachelor', duration: '4 years' }, { name: 'MSc Power Engineering', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Department of Mechanical Engineering', programs: [
      { name: 'BSc Mechanical Engineering', degree: 'bachelor', duration: '4 years' }, { name: 'MSc Thermal Engineering', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Department of Civil Engineering', programs: [
      { name: 'BSc Civil Engineering', degree: 'bachelor', duration: '4 years' }, { name: 'MSc Structural Engineering', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Department of Architecture', programs: [
      { name: 'BSc Architectural Engineering', degree: 'bachelor', duration: '4 years' },
    ]},
    { name: 'Department of Chemical Engineering', programs: [
      { name: 'BSc Chemical Engineering', degree: 'bachelor', duration: '4 years' },
    ]},
  ]},
  'Government College University Lahore': { depts: [
    { name: 'Department of Computer Science', programs: [
      { name: 'BS Computer Science', degree: 'bachelor', duration: '4 years' }, { name: 'MS Computer Science', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Department of Physics', programs: [
      { name: 'BS Physics', degree: 'bachelor', duration: '4 years' }, { name: 'MS Physics', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Department of Chemistry', programs: [
      { name: 'BS Chemistry', degree: 'bachelor', duration: '4 years' }, { name: 'MS Chemistry', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Department of Mathematics', programs: [
      { name: 'BS Mathematics', degree: 'bachelor', duration: '4 years' }, { name: 'MS Mathematics', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Department of English', programs: [
      { name: 'BA English', degree: 'bachelor', duration: '2 years' }, { name: 'MA English', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Department of Biological Sciences', programs: [
      { name: 'BS Biology', degree: 'bachelor', duration: '4 years' }, { name: 'BS Botany', degree: 'bachelor', duration: '4 years' }, { name: 'BS Zoology', degree: 'bachelor', duration: '4 years' },
    ]},
  ]},
  'Forman Christian College (A Chartered University)': { depts: [
    { name: 'Department of Computer Science', programs: [
      { name: 'BS Computer Science', degree: 'bachelor', duration: '4 years' }, { name: 'BS Information Technology', degree: 'bachelor', duration: '4 years' },
    ]},
    { name: 'Department of Business Administration', programs: [
      { name: 'BBA', degree: 'bachelor', duration: '4 years' }, { name: 'MBA', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Department of Biological Sciences', programs: [
      { name: 'BS Biology', degree: 'bachelor', duration: '4 years' }, { name: 'BS Biotechnology', degree: 'bachelor', duration: '4 years' },
    ]},
    { name: 'Department of Chemistry', programs: [
      { name: 'BS Chemistry', degree: 'bachelor', duration: '4 years' },
    ]},
    { name: 'Department of English', programs: [
      { name: 'BA English', degree: 'bachelor', duration: '2 years' }, { name: 'MA English', degree: 'master', duration: '2 years' },
    ]},
  ]},
  'University of Central Punjab': { depts: [
    { name: 'Faculty of Computing', programs: [
      { name: 'BS Computer Science', degree: 'bachelor', duration: '4 years' }, { name: 'BS Software Engineering', degree: 'bachelor', duration: '4 years' },
    ]},
    { name: 'Faculty of Engineering', programs: [
      { name: 'BS Electrical Engineering', degree: 'bachelor', duration: '4 years' },
    ]},
    { name: 'Faculty of Management Studies', programs: [
      { name: 'BBA', degree: 'bachelor', duration: '4 years' }, { name: 'MBA', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Faculty of Arts & Social Sciences', programs: [
      { name: 'BA Psychology', degree: 'bachelor', duration: '2 years' }, { name: 'BA English', degree: 'bachelor', duration: '2 years' },
    ]},
  ]},
  'The University of Lahore': { depts: [
    { name: 'Faculty of Computing', programs: [
      { name: 'BS Computer Science', degree: 'bachelor', duration: '4 years' }, { name: 'BS Software Engineering', degree: 'bachelor', duration: '4 years' },
      { name: 'BS Information Technology', degree: 'bachelor', duration: '4 years' },
    ]},
    { name: 'Faculty of Engineering', programs: [
      { name: 'BS Electrical Engineering', degree: 'bachelor', duration: '4 years' }, { name: 'BS Mechanical Engineering', degree: 'bachelor', duration: '4 years' },
      { name: 'BS Civil Engineering', degree: 'bachelor', duration: '4 years' },
    ]},
    { name: 'Faculty of Management Studies', programs: [
      { name: 'BBA', degree: 'bachelor', duration: '4 years' }, { name: 'MBA', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Lahore Law College', programs: [
      { name: 'LLB 3 Years', degree: 'bachelor', duration: '3 years' }, { name: 'LLB (Hons) 5 Years', degree: 'bachelor', duration: '5 years' },
      { name: 'LLM', degree: 'master', duration: '2 years' },
    ]},
  ]},
  'Virtual University of Pakistan': { depts: [
    { name: 'Faculty of Computer Science', programs: [
      { name: 'BS Computer Science', degree: 'bachelor', duration: '4 years' }, { name: 'BS Software Engineering', degree: 'bachelor', duration: '4 years' },
      { name: 'BS Information Technology', degree: 'bachelor', duration: '4 years' }, { name: 'BS Data Science', degree: 'bachelor', duration: '4 years' },
    ]},
    { name: 'Faculty of Management', programs: [
      { name: 'BBA', degree: 'bachelor', duration: '4 years' }, { name: 'MBA', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Faculty of Arts & Social Sciences', programs: [
      { name: 'BA English', degree: 'bachelor', duration: '2 years' }, { name: 'BA Economics', degree: 'bachelor', duration: '2 years' },
    ]},
  ]},
  'Allama Iqbal Open University': { depts: [
    { name: 'Faculty of Education', programs: [
      { name: 'BEd', degree: 'bachelor', duration: '2 years' }, { name: 'MEd', degree: 'master', duration: '2 years' },
      { name: 'MA Education', degree: 'master', duration: '2 years' }, { name: 'PhD Education', degree: 'phd', duration: '5 years' },
    ]},
    { name: 'Faculty of Arts', programs: [
      { name: 'BA English', degree: 'bachelor', duration: '2 years' }, { name: 'BA Urdu', degree: 'bachelor', duration: '2 years' },
      { name: 'BA Islamic Studies', degree: 'bachelor', duration: '2 years' },
    ]},
    { name: 'Faculty of Social Sciences', programs: [
      { name: 'BA Economics', degree: 'bachelor', duration: '2 years' }, { name: 'BA Political Science', degree: 'bachelor', duration: '2 years' },
    ]},
  ]},
  'Sindh Madressatul Islam University': { depts: [
    { name: 'Faculty of Management Sciences', programs: [
      { name: 'BBA', degree: 'bachelor', duration: '4 years' }, { name: 'MBA', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Faculty of Commerce', programs: [
      { name: 'BCom', degree: 'bachelor', duration: '2 years' }, { name: 'MCom', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Faculty of Computer Science', programs: [
      { name: 'BS Computer Science', degree: 'bachelor', duration: '4 years' }, { name: 'BS Information Technology', degree: 'bachelor', duration: '4 years' },
    ]},
    { name: 'Faculty of Arts', programs: [
      { name: 'BA English', degree: 'bachelor', duration: '2 years' },
    ]},
  ]},
  'Sukkur IBA University': { depts: [
    { name: 'Department of Computer Science', programs: [
      { name: 'BS Computer Science', degree: 'bachelor', duration: '4 years' }, { name: 'MS Computer Science', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Department of Management Sciences', programs: [
      { name: 'BBA', degree: 'bachelor', duration: '4 years' }, { name: 'MBA', degree: 'master', duration: '2 years' },
    ]},
    { name: 'Department of Electrical Engineering', programs: [
      { name: 'BS Electrical Engineering', degree: 'bachelor', duration: '4 years' },
    ]},
  ]},
};

async function main() {
  console.log('=== REPLACING TEMPLATE DATA WITH REAL UNIVERSITY PROGRAMS ===\n');
  let totalUpdated = 0;

  for (const [uniName, data] of Object.entries(UNI_DATA)) {
    // Find university by name
    const uni = await p.university.findFirst({ where: { name: { contains: uniName } } });
    if (!uni) {
      console.log(`  SKIP: "${uniName}" not found`);
      continue;
    }

    // Delete existing courses and departments
    const delCourses = await p.course.deleteMany({ where: { universityId: uni.id } });
    const delDepts = await p.department.deleteMany({ where: { universityId: uni.id } });

    // Create new departments and courses
    let courseCount = 0;
    for (const dept of data.depts) {
      await p.department.create({
        data: {
          universityId: uni.id,
          name: dept.name,
          description: `${dept.name} at ${uni.name}`,
          totalCourses: dept.programs.length,
        },
      });

      for (const prog of dept.programs) {
        await p.course.create({
          data: {
            universityId: uni.id,
            name: prog.name,
            degree: prog.degree,
            department: dept.name,
            duration: prog.duration,
            language: 'English',
            description: `${prog.name} at ${uni.name}. Duration: ${prog.duration}.`,
            verificationStatus: 'verified',
          },
        });
        courseCount++;
      }
    }

    totalUpdated += courseCount;
    console.log(`  ✓ ${uni.name} — ${data.depts.length} depts, ${courseCount} courses (replaced ${delCourses.count})`);
  }

  // Final stats
  const [finalUnis, finalCourses, finalDepts] = await Promise.all([
    p.university.count(),
    p.course.count(),
    p.department.count(),
  ]);
  console.log(`\n=== FINAL STATS ===`);
  console.log(`Universities: ${finalUnis}`);
  console.log(`Courses: ${finalCourses}`);
  console.log(`Departments: ${finalDepts}`);
  console.log(`Total courses updated: ${totalUpdated}`);
}

main().finally(() => p.$disconnect());
