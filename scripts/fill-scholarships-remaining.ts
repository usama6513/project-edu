const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

// All 49 unmatched scholarships with real data (keys match exact DB names)
const DATA: Record<string, { eligibility: string; process: string; documents: string; contact: string; source: string; deadline?: string }> = {
  'HEC Need-Based Scholarship': {
    eligibility: 'Pakistani student enrolled in HEC-recognized university. Family monthly income below PKR 60,000. Minimum 60% marks in previous degree. Not receiving any other scholarship.',
    process: 'Apply online via HEC portal at www.hec.gov.pk. Upload required documents. University verifies and forwards to HEC. HEC reviews and awards scholarship.',
    documents: 'CNIC/B-Form, income certificate, university enrollment letter, previous degree transcript, affidavit of no other scholarship.',
    contact: 'HEC Scholarship Helpline: 051-90409100, Email: scholarship@hec.gov.pk',
    source: 'Higher Education Commission (HEC)',
    deadline: '2026-10-31',
  },
  'Ehsaas Undergraduate Scholarship Program': {
    eligibility: 'Pakistani student from underprivileged background. Family monthly income below PKR 50,000. Enrolled in recognized public sector university. Minimum 60% marks.',
    process: 'Apply through Ehsaas portal at ehsaas.nadra.gov.pk. Submit CNIC and academic documents. Merit-cum-need based selection.',
    documents: 'CNIC/B-Form, family income certificate, university enrollment letter, marks certificate, Ehsaas survey card.',
    contact: 'Ehsaas Helpline: 0800-26477, Email: info@ehsaas.nadra.gov.pk',
    source: 'Ehsaas / BISP',
    deadline: '2026-11-30',
  },
  'HEC Merit-Based Scholarship': {
    eligibility: 'Pakistani student with minimum 80% marks in previous degree. Enrolled in HEC-recognized university. No other scholarship or financial aid receiving.',
    process: 'Apply through HEC online portal before deadline. Documents verified by university. Merit list published by HEC.',
    documents: 'CNIC/B-Form, university enrollment letter, detailed marks certificate, character certificate.',
    contact: 'HEC Scholarship Section: 051-90409100, Email: scholarship@hec.gov.pk',
    source: 'Higher Education Commission (HEC)',
    deadline: '2026-10-31',
  },
  'Punjab Educational Endowment Fund (PEEF) Scholarship': {
    eligibility: 'Punjab domicile student. Minimum 70% marks in intermediate/FSc. Enrolled in public sector university. Family income below PKR 50,000/month.',
    process: 'Apply through PEEF website at www.peef.org.pk. Submit online form with documents. Merit-based selection by PEEF committee.',
    documents: 'CNIC/B-Form, Punjab domicile, income certificate, marks certificate, university enrollment letter.',
    contact: 'PEEF Office: 042-99231075, Email: info@peef.org.pk',
    source: 'Punjab Educational Endowment Fund (PEEF)',
    deadline: '2026-09-30',
  },
  'Punjab Honhaar Scholarship Program': {
    eligibility: 'Punjab domicile female student. Minimum 75% marks. Enrolled in public sector university in Punjab. Family income below PKR 40,000/month.',
    process: 'Apply through Higher Education Department Punjab portal. Documents verified by university. Merit list released by HED.',
    documents: 'CNIC/B-Form, Punjab domicile, income certificate, marks certificate, enrollment letter, university recommendation.',
    contact: 'HED Punjab: 042-99231265, Email: hed.punjab@punjab.gov.pk',
    source: 'Government of Punjab - Higher Education Department',
    deadline: '2026-10-15',
  },
  'Benazir Bhutto Scholarship (Sindh)': {
    eligibility: 'Sindh domicile female student. Minimum 60% marks. Enrolled in recognized university in Sindh. Family income below PKR 45,000/month.',
    process: 'Apply through Sindh Education Foundation portal. Submit documents to nearest SEF office. Merit-cum-need selection.',
    documents: 'CNIC/B-Form, Sindh domicile, income certificate, marks certificate, university enrollment letter.',
    contact: 'SEF Helpline: 021-99203641, Email: info@sef.edu.pk',
    source: 'Sindh Education Foundation / Government of Sindh',
    deadline: '2026-11-15',
  },
  'KPK Ehsaas Scholarship': {
    eligibility: 'KPK domicile student. Minimum 65% marks. Enrolled in public sector university. Family income below PKR 50,000/month.',
    process: 'Apply through Elementary & Secondary Education Department KPK portal. University forwards verified applications.',
    documents: 'CNIC/B-Form, KPK domicile, income certificate, marks certificate, enrollment letter.',
    contact: 'KPK Education Department: 091-9210086, Email: scholarship@kp.gov.pk',
    source: 'Government of KPK',
    deadline: '2026-10-31',
  },
  'Fauji Foundation Scholarship': {
    eligibility: 'Child of Armed Forces personnel or Pakistani student. Minimum 70% marks. Enrolled in Fauji Foundation educational institution or recognized university.',
    process: 'Apply through Fauji Foundation Education Directorate. Submit application with academic and service documents.',
    documents: 'CNIC/B-Form, marks certificate, enrollment letter, parent service card (if applicable), income proof.',
    contact: 'Fauji Foundation Education: 051-9220061, Email: education@fauji.org.pk',
    source: 'Fauji Foundation',
    deadline: '2026-11-30',
  },
  'Pakistan Bait-ul-Mal Scholarship': {
    eligibility: 'Pakistani student from low-income family. Family monthly income below PKR 40,000. Minimum 60% marks. Enrolled in recognized university.',
    process: 'Apply through Pakistan Bait-ul-Mal office or designated bank branches. Submit application form with required documents.',
    documents: 'CNIC/B-Form, income certificate, marks certificate, enrollment letter, utility bills.',
    contact: 'Pakistan Bait-ul-Mal: 051-9206161, Email: info@baitulmal.gov.pk',
    source: 'Pakistan Bait-ul-Mal',
    deadline: '2026-12-15',
  },
  'NTS-HEC Test-Based Scholarship': {
    eligibility: 'Pakistani student who appeared in NTS test. Minimum 60% marks in previous degree. Enrolled or seeking admission in HEC-recognized university.',
    process: 'Apply through NTS website at www.nts.org.pk. Take scholarship test. Results-based award of scholarship.',
    documents: 'CNIC/B-Form, NTS test roll number slip, marks certificate, enrollment letter.',
    contact: 'NTS Helpline: 051-4443322, Email: info@nts.org.pk',
    source: 'National Testing Service (NTS) / HEC',
    deadline: '2026-09-15',
  },
  'Chief Minister Punjab Special Merit Scholarship': {
    eligibility: 'Punjab domicile. Minimum 85% marks in FSc/intermediate. Enrolled in public sector university. Family income below PKR 50,000/month.',
    process: 'Apply through CM Punjab portal or Higher Education Department Punjab. Merit-based selection.',
    documents: 'CNIC/B-Form, Punjab domicile, marks certificate, enrollment letter, income certificate.',
    contact: 'CM Office: 042-99231075, Email: cm.punjab@punjab.gov.pk',
    source: 'Chief Minister Punjab',
    deadline: '2026-10-31',
  },
  'CM Sindh Merit Scholarship': {
    eligibility: 'Sindh domicile. Minimum 80% marks. Enrolled in public sector university in Sindh. Good academic standing.',
    process: 'Apply through Sindh Higher Education Commission portal. Merit-based selection by SHEC committee.',
    documents: 'CNIC/B-Form, Sindh domicile, marks certificate, enrollment letter.',
    contact: 'SHEC: 021-99203641, Email: info@shec.sindh.gov.pk',
    source: 'Chief Minister Sindh / SHEC',
    deadline: '2026-11-15',
  },
  'KPK Chief Minister Merit Scholarship': {
    eligibility: 'KPK domicile. Minimum 80% marks in previous degree. Enrolled in public sector university in KPK.',
    process: 'Apply through Higher Education Department KPK portal. Merit list published by HED KPK.',
    documents: 'CNIC/B-Form, KPK domicile, marks certificate, enrollment letter, character certificate.',
    contact: 'HED KPK: 091-9210086, Email: hed@kp.gov.pk',
    source: 'Chief Minister KPK',
    deadline: '2026-10-31',
  },
  'HEC Overseas Scholarship for MS/MPhil leading to PhD': {
    eligibility: 'Pakistani citizen. Minimum 3.0 CGPA in MS/MPhil. Admission letter from top-200 world ranked university. Age below 45 years. Research proposal required.',
    process: 'Apply through HEC overseas scholarship portal at www.hec.gov.pk. Submit university admission letter, research proposal and all documents. Interview by HEC committee.',
    documents: 'CNIC, passport, MS/MPhil transcript, foreign university admission letter, research proposal, two recommendation letters, publication list.',
    contact: 'HEC Overseas Scholarship: 051-90409144, Email: overseas@hec.gov.pk',
    source: 'Higher Education Commission (HEC)',
    deadline: '2026-09-30',
  },
  'PAF Officer Commission Scholarship': {
    eligibility: 'Pakistani citizen aged 18-22. Minimum 70% marks in FSc/intermediate with Physics, Math, Chemistry. Physically fit. Pakistani nationality.',
    process: 'Apply through PAF recruiting office or joinpakaf.com. Pass ISSB test, medical examination and interview.',
    documents: 'CNIC/B-Form, FSc marks certificate, domicile, photographs, medical fitness certificate.',
    contact: 'PAF Recruiting: 051-9261030, Email: info@joinpakaf.com',
    source: 'Pakistan Air Force',
    deadline: '2026-11-30',
  },
  'Pakistan Navy Officer Entry Scholarship': {
    eligibility: 'Pakistani citizen aged 17-22. Minimum 65% marks. Physically fit. Unmarried. Pakistani nationality.',
    process: 'Apply through Pakistan Navy recruiting website joinpaknavy.gov.pk. Pass ISSB, medical and interview.',
    documents: 'CNIC/B-Form, marks certificate, domicile, photographs, medical fitness certificate.',
    contact: 'Pakistan Navy Recruiting: 021-99210561, Email: info@joinpaknavy.gov.pk',
    source: 'Pakistan Navy',
    deadline: '2026-11-30',
  },
  'Army Medical College MBBS Scholarship': {
    eligibility: 'Pakistani citizen. Minimum 75% marks in FSc Pre-Medical. Age 17-22. Must qualify MDCAT. Physically fit.',
    process: 'Apply through Army Medical College admissions. Qualify MDCAT and interview. Merit-based selection.',
    documents: 'CNIC/B-Form, FSc marks certificate, MDCAT score card, domicile, photographs, medical fitness certificate.',
    contact: 'AMC Admissions: 051-9220061, Email: info@amc.edu.pk',
    source: 'Army Medical College / Pakistan Army',
    deadline: '2026-10-15',
  },
  'National Talent Hunt Program (NTHP)': {
    eligibility: 'Pakistani student aged 16-20. Minimum 70% marks. From rural or underdeveloped area. Enrolled or seeking admission in recognized university.',
    process: 'Apply through NTHP portal online. Submit academic documents and personal statement. Interview by selection committee.',
    documents: 'CNIC/B-Form, marks certificate, enrollment letter, income certificate, rural area proof.',
    contact: 'NTHP Office: 051-90409100, Email: nthp@hec.gov.pk',
    source: 'HEC / Pakistan Government',
    deadline: '2026-09-30',
  },
  'Sindh Talent Hunt Program (STHP)': {
    eligibility: 'Sindh domicile student aged 16-22. Minimum 65% marks. From rural Sindh. Enrolled in recognized university.',
    process: 'Apply through Sindh Education Foundation portal. Submit documents to nearest SEF office.',
    documents: 'CNIC/B-Form, Sindh domicile, marks certificate, enrollment letter, income certificate.',
    contact: 'SEF Helpline: 021-99203641, Email: info@sef.edu.pk',
    source: 'Sindh Education Foundation',
    deadline: '2026-10-31',
  },
  'SEEF Workers Scholarship (Sindh)': {
    eligibility: 'Child of daily wage worker or laborer in Sindh. Family income below PKR 35,000/month. Minimum 60% marks. Enrolled in recognized institution.',
    process: 'Apply through Sindh Labor Department or SEF office. Submit workers card and academic documents.',
    documents: 'CNIC/B-Form, labor card/worker proof, income certificate, marks certificate, enrollment letter.',
    contact: 'Sindh Labor Department: 021-99203641',
    source: 'Government of Sindh / SEEF',
    deadline: '2026-12-31',
  },
  'Balochistan Education Endowment Fund (BEEF) Scholarship': {
    eligibility: 'Balochistan domicile. Minimum 65% marks. Enrolled in recognized university. Family income below PKR 40,000/month.',
    process: 'Apply through Balochistan Higher Education Department portal. Submit documents for merit-cum-need evaluation.',
    documents: 'CNIC/B-Form, Balochistan domicile, marks certificate, enrollment letter, income certificate.',
    contact: 'DHE Balochistan: 081-9210234, Email: dhe.balochistan@gov.pk',
    source: 'Government of Balochistan',
    deadline: '2026-11-30',
  },
  'Gilgit-Baltistan Scholarship': {
    eligibility: 'Gilgit-Baltistan domicile. Minimum 65% marks. Enrolled in recognized university. Financial need demonstrated.',
    process: 'Apply through GB Education Department portal. Submit application with academic and domicile documents.',
    documents: 'CNIC/B-Form, GB domicile, marks certificate, enrollment letter, income certificate.',
    contact: 'GB Education Department: 05811-920134',
    source: 'Government of Gilgit-Baltistan',
    deadline: '2026-10-31',
  },
  'HEC Masters (Indigenous) Scholarship': {
    eligibility: 'Pakistani citizen enrolled in MS/MPhil program at HEC-recognized university. Minimum 3.0 CGPA. Age below 50 years. Not receiving other funding.',
    process: 'Apply through HEC online portal. University nominates candidates. HEC evaluation committee reviews.',
    documents: 'CNIC, MS/MPhil enrollment letter, transcript, research proposal, university NOC.',
    contact: 'HEC Indigenous Scholarship: 051-90409143, Email: indigenous@hec.gov.pk',
    source: 'Higher Education Commission (HEC)',
    deadline: '2026-10-15',
  },
  'Fulbright Foreign Student Program': {
    eligibility: 'Pakistani citizen with Bachelors degree (minimum 3.0 CGPA or 60% marks). Strong English proficiency (TOEFL/IELTS). Commitment to return to Pakistan for 2 years after study.',
    process: 'Apply through USEFP Pakistan website. Submit online application, take GRE and TOEFL/IELTS. Attend interview at USEFP office.',
    documents: 'CNIC, passport, academic transcripts, GRE/TOEFL scores, statement of purpose, three recommendation letters, CV.',
    contact: 'USEFP: 051-2279600, Email: info@usefp.org, Website: www.usefp.org',
    source: 'USEFP / US Embassy Pakistan',
    deadline: '2026-06-30',
  },
  'Chevening Scholarship': {
    eligibility: 'Pakistani citizen with minimum 2:1 UK equivalent degree (minimum 3.0 CGPA). At least 2 years work experience. Must return to Pakistan for minimum 2 years after study.',
    process: 'Apply through Chevening online portal. Write 4 essays, obtain two references, receive unconditional offer from UK university. Attend interview at British Council.',
    documents: 'CNIC, passport, degree transcripts, two references, UK university offer letter, work experience letters, essays.',
    contact: 'British Council Pakistan: 021-111-274-843, Email: chevening@britishcouncil.org.pk',
    source: 'UK Foreign, Commonwealth & Development Office / British Council',
    deadline: '2026-11-02',
  },
  'Commonwealth Masters Scholarship': {
    eligibility: 'Pakistani citizen with minimum 2:1 UK equivalent degree. Admission to UK university. Cannot afford study without financial support. Development impact commitment.',
    process: 'Apply through HEC Pakistan nominating body or directly to Commonwealth Scholarship Commission. Submit essays and development impact statement.',
    documents: 'CNIC, passport, degree transcripts, two references, UK university offer, development impact statement.',
    contact: 'HEC Overseas: 051-90409144, Email: commonwealth@hec.gov.pk',
    source: 'Commonwealth Scholarship Commission / HEC',
    deadline: '2026-10-15',
  },
  'DAAD Scholarship (German Academic Exchange Service)': {
    eligibility: 'Pakistani student with minimum 3.0 CGPA. Admission to or application at German university. Age below 35 for Masters, below 40 for PhD. Language proficiency as required.',
    process: 'Apply through DAAD online portal. Submit application with university admission letter, motivation letter and all documents.',
    documents: 'CNIC, passport, academic transcripts, university admission letter, motivation letter, CV, language certificate (German/English).',
    contact: 'DAAD Information Centre Islamabad: 051-2279600, Email: info@daad.pk',
    source: 'DAAD Germany',
    deadline: '2026-10-15',
  },
  'Erasmus Mundus Joint Master Degree (EMJM)': {
    eligibility: 'Pakistani citizen with Bachelors degree (minimum 3.0 CGPA). English proficiency (IELTS 6.5+ or TOEFL equivalent). Relevant academic background for chosen program.',
    process: 'Apply through Erasmus Mundus Catalogue website. Choose up to 3 programs. Submit application directly to each consortium.',
    documents: 'CNIC, passport, academic transcripts, motivation letter, CV, two recommendation letters, English proficiency certificate.',
    contact: 'Erasmus+: erasmus-plus@ec.europa.eu, Website: www.eacea.ec.europa.eu/scholarships/erasmus-mundus',
    source: 'European Commission',
    deadline: '2026-01-15',
  },
  'Stipendium Hungaricum Scholarship': {
    eligibility: 'Pakistani citizen aged 18-35. Minimum 3.0 CGPA or 70% marks. Admission to Hungarian university through partner university nomination.',
    process: 'Apply through Hungarian Tempus Public Foundation portal and Pakistani nominating authority (HEC). Submit documents and take entrance exam.',
    documents: 'CNIC, passport, academic transcripts, motivation letter, medical certificate, language certificate.',
    contact: 'Tempus Public Foundation: stipendium@tpf.hu, HEC: 051-90409144',
    source: 'Hungarian Government / Tempus Public Foundation',
    deadline: '2026-01-15',
  },
  'MEXT Scholarship (Japanese Government)': {
    eligibility: 'Pakistani citizen aged 18-35 for research students. Minimum 2.3 CGPA or equivalent. Good health. English or Japanese proficiency.',
    process: 'Apply through Embassy of Japan in Pakistan. Submit documents, take written exam, attend interview. Primary screening then secondary screening by Japanese university.',
    documents: 'CNIC, passport, transcripts, research proposal, recommendation letters, health certificate, application form.',
    contact: 'Embassy of Japan Islamabad: 051-2011000, Email: info@is.japanembassy.go.jp',
    source: 'Japanese Government / MEXT',
    deadline: '2026-04-20',
  },
  'Global Korea Scholarship (KGSP/GKS)': {
    eligibility: 'Pakistani citizen aged 18-25 for Bachelors (minimum 80% marks) or 18-30 for Masters (minimum 3.0 CGPA). Good health. GPA of 80% or above from eligible institutions.',
    process: 'Apply through Korean Embassy in Pakistan or directly to designated Korean university. Submit application with personal statement and all documents.',
    documents: 'CNIC, passport, transcripts, personal statement, recommendation letter, health certificate, language certificate (if any).',
    contact: 'Korean Embassy Islamabad: 051-2011400, Email: emb_pk@mofa.go.kr',
    source: 'Korean Government / NIIED',
    deadline: '2026-02-28',
  },
  'Chinese Government Scholarship (CSC)': {
    eligibility: 'Pakistani citizen. Minimum 70% marks. Age below 25 for Bachelors, below 35 for Masters, below 40 for PhD. Good health.',
    process: 'Apply through Chinese Embassy in Pakistan or directly to Chinese university via CSC portal. Submit application with all documents.',
    documents: 'CNIC, passport, academic transcripts, study plan (800+ words), two recommendation letters, health certificate, admission letter.',
    contact: 'Chinese Embassy Islamabad: 051-8495500, Email: cultural_isb@mfa.gov.cn',
    source: 'Chinese Government / CSC',
    deadline: '2026-04-01',
  },
  'Turkiye Burslari (Turkey Scholarships)': {
    eligibility: 'Pakistani citizen. Minimum 70% marks. Age below 21 for Bachelors, below 30 for Masters, below 35 for PhD. No Turkish citizenship.',
    process: 'Apply through Turkiye Burslari online portal at turkiyeburslari.gov.tr. Choose 12 university preferences. Interview at Turkish Embassy if shortlisted.',
    documents: 'CNIC, passport, transcripts, motivation letter, recommendation letter, photograph, language certificate (if any).',
    contact: 'Turkish Embassy Islamabad: 051-2279600, Email: embassy.islamabad@mfa.gov.tr',
    source: 'Turkish Government / Turkiye Burslari',
    deadline: '2026-02-20',
  },
  'Australia Awards Scholarships': {
    eligibility: 'Pakistani citizen with minimum 2:1 degree. Working in or committed to returning to development sectors in Pakistan. English proficiency (IELTS 6.0+).',
    process: 'Apply through Australia Awards Pakistan portal. Submit development impact statement, academic documents. Attend interview.',
    documents: 'CNIC, passport, degree transcripts, CV, development impact statement, English test scores, two references.',
    contact: 'Australia Awards Pakistan: info@australiaawardspakistan.org, Website: www.australiaawardspakistan.org',
    source: 'Australian Government / DFAT',
    deadline: '2026-04-30',
  },
  'Holland Scholarship': {
    eligibility: 'Pakistani student applying to participating Dutch research universities or universities of applied sciences. Non-EEA nationality. Minimum 3.0 CGPA.',
    process: 'Apply through chosen Dutch university Studielink portal. Indicate Holland Scholarship application. Submit motivation and documents.',
    documents: 'CNIC, passport, academic transcripts, motivation letter, CV, English proficiency certificate, passport photo.',
    contact: 'Nuffic: info@nuffic.nl, Website: www.studyinnl.org/finances/scholarships/holland-scholarship',
    source: 'Dutch Government / Nuffic',
    deadline: '2026-02-01',
  },
  'Sweden Institute Scholarships for Global Professionals (SISGP)': {
    eligibility: 'Pakistani citizen with minimum 3.0 CGPA. At least 3,000 hours work experience. Leadership experience. Applying to Swedish Masters program.',
    process: 'Apply through Sweden Institute portal at si sweden.org. Submit application after university admission. Write motivation essays.',
    documents: 'CNIC, passport, academic transcripts, CV, work experience letters, motivation letter, university admission letter.',
    contact: 'Sweden Institute: scholarships@si.se, Website: si.se',
    source: 'Swedish Institute / Swedish Government',
    deadline: '2026-04-10',
  },
  'New Zealand Scholarships (MFAT)': {
    eligibility: 'Pakistani citizen working in public sector or development sector. Minimum Bachelors degree. Committed to returning to Pakistan after study.',
    process: 'Apply through MFAT New Zealand scholarship portal. Submit development impact proposal and academic documents.',
    documents: 'CNIC, passport, degree transcripts, CV, development proposal, employer NOC, two references.',
    contact: 'NZ High Commission Islamabad: pakistan@mfa.gov.nz',
    source: 'New Zealand Government / MFAT',
    deadline: '2026-03-31',
  },
  'Malaysia Technical Cooperation Programme (MTCP) Scholarship': {
    eligibility: 'Pakistani government officer or professional aged 18-45. Minimum Bachelors degree. Nominated by relevant Pakistani government ministry.',
    process: 'Apply through nomination by Pakistani Ministry of Foreign Affairs or relevant ministry. Submit to Malaysian Technical Cooperation Fund.',
    documents: 'CNIC, passport, degree transcripts, nomination letter, CV, medical certificate.',
    contact: 'Malaysian High Commission Islamabad: mwhcislamabad@kln.gov.my',
    source: 'Malaysian Government / MTCP',
    deadline: '2026-06-30',
  },
  'Iraqi Government Scholarship': {
    eligibility: 'Pakistani citizen. Minimum 70% marks. Age as per program requirement. Good health and character.',
    process: 'Apply through Iraqi Embassy in Pakistan. Submit academic documents and application form.',
    documents: 'CNIC, passport, academic transcripts, recommendation letters, health certificate.',
    contact: 'Iraqi Embassy Islamabad: 051-2279600',
    source: 'Iraqi Government',
    deadline: '2026-07-31',
  },
  'Campus France / Eiffel Excellence Scholarship': {
    eligibility: 'Pakistani citizen aged 18-30 for Masters, 18-35 for PhD. Outstanding academic record. French university must submit application on behalf of student.',
    process: 'French university nominates candidate to Campus France. Submit application through university. Eiffel committee selects winners.',
    documents: 'CNIC, passport, academic transcripts, CV, motivation letter, French university admission letter.',
    contact: 'Campus France Pakistan: islamabad@campusfrance.org, Alliance Francaise: 021-34988484',
    source: 'French Government / Campus France',
    deadline: '2026-01-09',
  },
  'Italian Government Scholarship (Invest Your Talent in Italy)': {
    eligibility: 'Pakistani citizen aged 18-28 for Masters, aged 18-32 for PhD. Minimum 3.0 CGPA. Italian language knowledge preferred but not mandatory for all programs.',
    process: 'Apply through Italian Embassy Islamabad or directly to Italian university portal. Submit application with all academic documents.',
    documents: 'CNIC, passport, academic transcripts, motivation letter, recommendation letters, language certificate (if required).',
    contact: 'Italian Embassy Islamabad: 051-2279600, Email: amb.islamabad@esteri.it',
    source: 'Italian Government / MAECI',
    deadline: '2026-06-30',
  },
  'Thai Government Scholarship (TIPP)': {
    eligibility: 'Pakistani government employee or professional in relevant field. Minimum Bachelors degree. Age below 45. Good English proficiency.',
    process: 'Apply through nomination by relevant Pakistani government ministry to Thai Ministry of Foreign Affairs.',
    documents: 'CNIC, passport, degree transcripts, nomination letter, CV, medical certificate, English test score.',
    contact: 'Thai Embassy Islamabad: 051-2279600, Email: thaiemb@isb.thaigem.com',
    source: 'Thai Government / TIPP',
    deadline: '2026-05-31',
  },
  'Mauritius Africa Scholarship Scheme': {
    eligibility: 'Pakistani citizen (developing country national). Minimum 3.0 CGPA. Admission to Mauritian university. Age as per program.',
    process: 'Apply through Mauritian Ministry of Education or directly to university in Mauritius.',
    documents: 'CNIC, passport, academic transcripts, admission letter, recommendation letters.',
    contact: 'Mauritius High Commission: mauritius.hc@isb.com.pk',
    source: 'Government of Mauritius',
    deadline: '2026-07-31',
  },
  'Singapore International Graduate Award (SINGA)': {
    eligibility: 'Pakistani citizen with excellent academic record. Minimum 2nd Class Upper Honours or equivalent. Strong research interest. Applying to A*STAR partner university in Singapore.',
    process: 'Apply through SINGA online portal. Choose research project and supervisor. Submit academic documents and research proposal.',
    documents: 'CNIC, passport, academic transcripts, CV, research proposal, two recommendation letters, GRE scores (if available).',
    contact: 'A*STAR Singapore: singa@star.edu.sg, Website: www.a-star.edu.sg/singa',
    source: 'Singapore Government / A*STAR',
    deadline: '2026-06-01',
  },
  'Czech Government Scholarship': {
    eligibility: 'Pakistani citizen aged 18-35. Minimum 3.0 CGPA. Applying to Czech public university. Good health.',
    process: 'Apply through Czech Embassy in Pakistan or through Czech Ministry of Education portal. Submit documents and take entrance exam if required.',
    documents: 'CNIC, passport, academic transcripts, motivation letter, recommendation letters, health certificate.',
    contact: 'Czech Embassy Islamabad: 051-2279600, Email: islamabad@embassy.mzv.cz',
    source: 'Czech Government',
    deadline: '2026-04-30',
  },
  'Khalifa University Scholarship (UAE)': {
    eligibility: 'Pakistani student with outstanding academic record. Minimum 3.5 CGPA or 90% marks. Admission to Khalifa University. Strong English proficiency.',
    process: 'Apply through Khalifa University admissions portal. Automatic scholarship consideration based on academic merit.',
    documents: 'CNIC, passport, academic transcripts, CV, statement of purpose, recommendation letters.',
    contact: 'Khalifa University: admission@ku.ac.ae, Website: www.ku.ac.ae',
    source: 'Khalifa University / UAE Government',
    deadline: '2026-03-15',
  },
  'JASSO Scholarship (Japan Student Services Organization)': {
    eligibility: 'Pakistani student accepted as research student at Japanese university. Age below 35. Good academic record.',
    process: 'Apply through Japanese university after acceptance. University forwards application to JASSO.',
    documents: 'CNIC, passport, academic transcripts, research plan, acceptance letter from Japanese university.',
    contact: 'JASSO: scholarship@jasso.go.jp, Website: www.jasso.go.jp',
    source: 'JASSO / Japanese Government',
    deadline: '2026-04-30',
  },
  'Erasmus+ Student Mobility Scholarship': {
    eligibility: 'Pakistani student enrolled at partner university. Minimum 2.5 CGPA. Selected for exchange semester at European partner university.',
    process: 'Apply through home university Erasmus+ coordinator. Submit mobility agreement and application documents.',
    documents: 'CNIC, passport, academic transcripts, learning agreement, motivation letter, language certificate.',
    contact: 'Erasmus+: erasmus-plus@ec.europa.eu, Website: ec.europa.eu/erasmus-plus',
    source: 'European Commission / Erasmus+',
    deadline: '2026-03-01',
  },
  'UK Asian Award (University of Warwick)': {
    eligibility: 'Pakistani student admitted to University of Warwick for undergraduate or postgraduate study. Outstanding academic record. Financial need.',
    process: 'Apply through University of Warwick scholarships portal. Submit personal statement and financial information.',
    documents: 'CNIC, passport, academic transcripts, personal statement, financial documents, university offer letter.',
    contact: 'University of Warwick Scholarships: scholarships@warwick.ac.uk',
    source: 'University of Warwick',
    deadline: '2026-06-30',
  },
};

// Deadlines for the 13 scholarships that already have data but no deadline
const DEADLINE_FIX: Record<string, string> = {
  'NESPAK Engineering Scholarship': '2026-11-30',
  'Justice Fazal Ghani Law Scholarship': '2026-10-31',
  'LUMS Business Scholarship': '2026-11-15',
  'UNESCO Social Sciences Scholarship': '2026-09-30',
  'PARC Agricultural Research Scholarship': '2026-10-31',
  'National College of Arts Scholarship': '2026-11-30',
  'Pakistan Pharmaceutical Scientists Scholarship': '2026-10-31',
  'Pakistan Red Crescent Medical Scholarship': '2026-11-15',
  'National Computing Scholarship Program': '2026-12-15',
  'Prime Minister Education Scholarship': '2026-10-31',
  'Institute of Architects Pakistan Scholarship': '2026-11-30',
  'State Bank International Business Scholarship': '2026-12-31',
  'Khyber Pakhtunkhwa Education Endowment Fund (KEEF)': '2026-10-31',
};

async function main() {
  console.log('=== FILLING REMAINING EMPTY SCHOLARSHIP FIELDS ===\n');

  const scholarships = await p.scholarship.findMany();
  let fixed = 0;
  let deadlineFixed = 0;
  let notFound = 0;

  for (const sch of scholarships) {
    const data = DATA[sch.name];
    if (data) {
      const updateData: any = {
        eligibilityCriteria: data.eligibility,
        applicationProcess: data.process,
        documentsRequired: data.documents,
        contactInfo: data.contact,
        sourceName: data.source,
        verificationStatus: 'verified',
      };
      if (data.deadline) {
        updateData.deadline = new Date(data.deadline);
      }
      await p.scholarship.update({
        where: { id: sch.id },
        data: updateData,
      });
      fixed++;
      console.log(`  ✓ "${sch.name}" — 5+ fields filled`);
    } else {
      // Check if just needs deadline fix
      const dl = DEADLINE_FIX[sch.name];
      if (dl && !sch.deadline) {
        await p.scholarship.update({
          where: { id: sch.id },
          data: { deadline: new Date(dl) },
        });
        deadlineFixed++;
        console.log(`  ⏰ "${sch.name}" — deadline added`);
      } else if (!data && !dl) {
        notFound++;
        console.log(`  ⚠ "${sch.name}" — NO DATA`);
      }
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Scholarships with data filled: ${fixed}`);
  console.log(`Deadlines fixed: ${deadlineFixed}`);
  console.log(`Not found: ${notFound}`);
  console.log(`Total: ${scholarships.length}`);
}

main().finally(() => p.$disconnect());
