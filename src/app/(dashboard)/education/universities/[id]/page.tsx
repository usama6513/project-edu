'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import DepartmentChat from '@/components/department-chat/DepartmentChat';

interface Course {
  id: string;
  name: string;
  degree: string;
  department: string | null;
  duration: string | null;
  language: string | null;
  tuitionFee: number | null;
  currency: string | null;
  description: string | null;
}

interface AdmissionRequirement {
  id: string;
  requirementType: string;
  requirementValue: string;
  deadline: string | null;
  notes: string | null;
}

interface Ranking {
  provider: string;
  year: number;
  position: number;
  category: string | null;
}

interface Campus {
  id: string;
  name: string;
  city: string | null;
  address: string | null;
  isMain: boolean;
  phone: string | null;
  email: string | null;
  website: string | null;
  description: string | null;
  facilities: string | null;
  programs: string | null;
  admissionContact: string | null;
}

interface Department {
  id: string;
  name: string;
  head: string | null;
  description: string | null;
  totalCourses: number;
}

interface UniversityDetail {
  id: string;
  name: string;
  country: string;
  city: string | null;
  type: string;
  description: string | null;
  website: string | null;
  foundedYear: number | null;
  verificationStatus: string;
  courses: Course[];
  rankings: Ranking[];
  admissionRequirements: AdmissionRequirement[];
  campuses: Campus[];
  departments: Department[];
  // AI Knowledge Fields
  admissionProcess: string | null;
  admissionDates: string | null;
  feeRange: string | null;
  closingMerit: string | null;
  entryTestDetails: string | null;
  examSystem: string | null;
  scholarshipsOffered: string | null;
  supplyPolicy: string | null;
  isOpenMerit: boolean | null;
}

const TYPE_COLORS: Record<string, string> = {
  university: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  college: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  school: 'bg-green-500/10 text-green-400 border-green-500/20',
};

const DEGREE_LABELS: Record<string, string> = {
  bachelor: 'Bachelor',
  master: 'Master',
  intermediate: 'Intermediate',
  secondary: 'Secondary',
  'higher-secondary': 'Higher Secondary',
  phd: 'PhD',
  certificate: 'Certificate',
  diploma: 'Diploma',
};

type TabKey = 'courses' | 'admissions' | 'admission-info' | 'rankings' | 'campuses';

function buildUniversitySystemMessage(uni: UniversityDetail): string {
  const lines: string[] = [];
  const name = uni.name;
  const location = [uni.city, uni.country].filter(Boolean).join(', ');
  lines.push(`You are an EXCLUSIVE AI advisor for ${name}, located in ${location}.`);
  lines.push('');
  lines.push(`You are an EXCLUSIVE AI advisor for ${name} in ${location}. Answer ONLY what is asked — be direct, concise, and smart. Use user's language (English/Urdu/Roman Urdu).`);
  lines.push('');
  lines.push('INTELLIGENCE RULES:');
  lines.push('1. DATABASE FIRST — Use the data below as PRIMARY source for departments, programs, courses, fees, campuses.');
  lines.push('2. TRAINING KNOWLEDGE — For merit percentages, closing percentages, entry test details, semester fee structure, annual fee increase, admission requirements — if NOT in database, use your TRAINING KNOWLEDGE confidently. NEVER say "check the website" or "I don\'t have this data".');
  lines.push('3. BE SMART — Give exact, specific answers. If asked about closing merit, give the percentage. If asked about entry test, name the test and subjects. If asked about fee increase, give the typical percentage.');
  lines.push('4. NO FILLER — Answer ONLY the question. No extra tips, no unnecessary context, no filler words.');
  lines.push('5. FORMATTING — Use bullet points with **bold labels**. NEVER use tables or pipe (|) format.');
  lines.push('');

  lines.push(`# ${name.toUpperCase()} — COMPLETE KNOWLEDGE BASE`);
  lines.push('');
  lines.push('## TYPICAL PAKISTANI UNIVERSITY DATA (Use when database is missing):');
  lines.push('- **Merit Percentages**: Government unis 75-85%, Private unis 60-75%, Medical colleges 85-92%');
  lines.push('- **Fee Structure**: Semester-based (2 semesters/year) or Annual. Typical increase: 5-15% per year');
  lines.push('- **Admission Timeline**: Fall (Aug-Oct), Spring (Jan-Mar). Merit lists: 1st, 2nd, 3rd');
  lines.push('- **Open Merit**: Usually 3rd merit list or after admission deadline passes');
  lines.push('');
  lines.push('## ENTRY TESTS — SPECIFIC UNIVERSITY DATA (Use training knowledge for these):');
  lines.push('### NUST (Entry Test: ENE - Entrance Examination)');
  lines.push('- **MCQs**: 200 total | **Subjects**: Mathematics (60), Physics (40), Chemistry (30), English (40), IQ (30)');
  lines.push('- **Passing Criteria**: 60% (120/200) | **Duration**: 150 minutes | **Merit Weight**: Entry test 25%, Merit 75%');
  lines.push('');
  lines.push('### FAST-NUCES (Entry Test: FAST Admission Test)');
  lines.push('- **MCQs**: 120 total | **Subjects**: Mathematics (40), Physics/CS (30), English (30), IQ (20)');
  lines.push('- **Passing Criteria**: 50% (60/120) | **Duration**: 120 minutes');
  lines.push('');
  lines.push('### IBA Karachi (Entry Test: IBA Admission Test / SAT)');
  lines.push('- Accepts SAT scores (min 1200/1600) OR IBA\'s own entry test');
  lines.push('- **Own Test MCQs**: 100 | **Subjects**: English (40), Math (40), Analytical (20) | **Passing**: 50%');
  lines.push('');
  lines.push('### COMSATS (Entry Test: NTS / COMSATS Assessment Test)');
  lines.push('- **MCQs**: 100 | **Subjects**: Subject-specific + English + IQ | **Passing Criteria**: 50%');
  lines.push('');
  lines.push('### GIKI (Entry Test: GIKI Admission Test)');
  lines.push('- **MCQs**: 150 | **Subjects**: Mathematics (50), Physics/CS (50), English (50) | **Passing Criteria**: ~60%');
  lines.push('');
  lines.push('### LUMS (Entry Test: LGS / SAT)');
  lines.push('- Accepts SAT (min 1200/1600) OR LUMS Graduate Assessment Test (LGS)');
  lines.push('- **LGS MCQs**: 100 | **Subjects**: English (40), Math (30), Analytical (30) | **Passing**: 60%');
  lines.push('');
  lines.push('### UET Lahore (Entry Test: ECAT)');
  lines.push('- **MCQs**: 100 | **Subjects**: Mathematics (30), Physics (30), Chemistry/Drawing (20), English (20)');
  lines.push('- **Passing Criteria**: 50% (50/100) | **Merit**: Entry test 30%, FSc/A-levels 70%');
  lines.push('');
  lines.push('### Medical (MDCAT — Required for MBBS/BDS)');
  lines.push('- **MCQs**: 200 | **Subjects**: Biology (68), Chemistry (54), Physics (54), English (14), Logical Reasoning (10)');
  lines.push('- **Passing Criteria**: 65% (130/200) for eligibility | **Competitive Merit**: 85-90%');
  lines.push('');
  lines.push('### Engineering (ECAT — Punjab Universities)');
  lines.push('- **MCQs**: 100 | **Subjects**: Mathematics (30), Physics (30), Chemistry (20), English (20)');
  lines.push('- **Passing Criteria**: 50% (50/100)');
  lines.push('');
  lines.push('### Graduate (NTS GAT — General/Subject)');
  lines.push('- **MCQs**: 100 | **Subjects**: Verbal (30), Quantitative (30), Analytical (20), GK (20)');
  lines.push('- **Passing Criteria**: 50-60% depending on university');
  lines.push('');

  lines.push(`Location: ${location || 'Not specified'}`);
  lines.push(`Type: ${uni.type}`);
  if (uni.foundedYear) lines.push(`Founded: ${uni.foundedYear}`);
  if (uni.website) lines.push(`Website: ${uni.website}`);
  if (uni.description) lines.push(`About: ${uni.description.substring(0, 150)}`);
  if (uni.rankings && uni.rankings.length > 0) {
    const latest = uni.rankings.reduce((a, b) => a.year > b.year ? a : b);
    lines.push(`Latest Ranking: #${latest.position} (${latest.provider} ${latest.year}${latest.category ? ', ' + latest.category : ''})`);
  }
  lines.push('');

  const deptCount = uni.departments?.length || 0;
  const courseCount = uni.courses?.length || 0;
  lines.push(`Stats: ${deptCount} departments, ${courseCount} programs, ${uni.campuses?.length || 0} campuses`);
  lines.push('');

  if (uni.departments && uni.departments.length > 0) {
    lines.push(`## DEPARTMENTS (${deptCount})`);
    for (const dept of uni.departments) {
      const headInfo = dept.head ? ` [Head: ${dept.head}]` : '';
      lines.push(`- ${dept.name}${headInfo} — ${dept.totalCourses} programs`);
    }
    lines.push('');
  }

  if (uni.courses && uni.courses.length > 0) {
    // --- FEE SYSTEM ANALYSIS ---
    const feesWithValues = uni.courses.filter(c => c.tuitionFee && c.tuitionFee > 0);
    if (feesWithValues.length > 0) {
      lines.push('## FEE SYSTEM');
      const durations = new Set(uni.courses.map(c => c.duration).filter(Boolean));
      const hasSemesterDurations = [...durations].some(d => /semester|semi.*annual/i.test(d || ''));
      const hasYearlyDurations = [...durations].some(d => /year|annual/i.test(d || ''));
      if (hasSemesterDurations && !hasYearlyDurations) {
        lines.push('- Fee System: SEMESTER-based (fees charged per semester)');
      } else if (hasYearlyDurations && !hasSemesterDurations) {
        lines.push('- Fee System: YEARLY/ANNUAL (fees charged per year)');
      } else {
        lines.push('- Fee System: ANNUAL (fees are typically charged per year unless specified otherwise)');
      }
      // Show fee range
      const fees = feesWithValues.map(c => Number(c.tuitionFee));
      const minFee = Math.min(...fees);
      const maxFee = Math.max(...fees);
      const curr = feesWithValues[0].currency || 'PKR';
      if (minFee === maxFee) {
        lines.push(`- Tuition Fee: ${curr} ${minFee.toLocaleString()}/year`);
      } else {
        lines.push(`- Tuition Fee Range: ${curr} ${minFee.toLocaleString()} — ${curr} ${maxFee.toLocaleString()}/year`);
      }
      lines.push('- Note: Annual fee increase is typically 5-15% depending on the university policy.');
      lines.push('');
    }

    const byDegree: Record<string, typeof uni.courses> = {};
    for (const c of uni.courses) {
      const key = c.degree || 'other';
      if (!byDegree[key]) byDegree[key] = [];
      byDegree[key].push(c);
    }
    const degreeOrder = ['phd', 'master', 'bachelor', 'bachelor_of_medicine', 'bachelor_of_engineering', 'bachelor_of_law', 'bachelor_of_education', 'bachelor_of_commerce', 'diploma', 'certificate', 'intermediate', 'secondary'];
    const sortedDegrees = Object.keys(byDegree).sort((a, b) => {
      const ai = degreeOrder.indexOf(a);
      const bi = degreeOrder.indexOf(b);
      return (ai === -1 ? 100 : ai) - (bi === -1 ? 100 : bi);
    });

    lines.push('## PROGRAMS BY LEVEL');
    for (const deg of sortedDegrees) {
      const courses = byDegree[deg];
      const label = DEGREE_LABELS[deg] || deg.charAt(0).toUpperCase() + deg.slice(1);
      lines.push(`### ${label} (${courses.length})`);
      const MAX_DISPLAY = 15;
      for (const c of courses.slice(0, MAX_DISPLAY)) {
        const parts = [c.name];
        if (c.department) parts.push(c.department);
        if (c.duration) parts.push(c.duration);
        if (c.tuitionFee) parts.push(`${c.currency || ''} ${Number(c.tuitionFee).toLocaleString()}/yr`);
        lines.push(`- ${parts.join(' | ')}`);
      }
      if (courses.length > MAX_DISPLAY) {
        lines.push(`- ...and ${courses.length - MAX_DISPLAY} more ${label} programs`);
      }
    }
    lines.push('');
  }

  if (uni.admissionRequirements && uni.admissionRequirements.length > 0) {
    lines.push('## ADMISSIONS');
    const reqTypes = [...new Set(uni.admissionRequirements.map(r => r.requirementType))];
    for (const reqType of reqTypes) {
      const reqs = uni.admissionRequirements.filter(r => r.requirementType === reqType);
      for (const r of reqs) {
        let line = `- ${reqType}: ${r.requirementValue}`;
        if (r.deadline) line += ` (Deadline: ${r.deadline})`;
        lines.push(line);
      }
    }
    lines.push('');
  }

  if (uni.rankings && uni.rankings.length > 0) {
    lines.push('## RANKINGS');
    for (const r of uni.rankings.sort((a, b) => b.year - a.year).slice(0, 10)) {
      lines.push(`- ${r.provider} ${r.year}: #${r.position}${r.category ? ` (${r.category})` : ''}`);
    }
    lines.push('');
  }

  if (uni.campuses && uni.campuses.length > 0) {
    lines.push(`## CAMPUSES (${uni.campuses.length})`);
    for (const c of uni.campuses) {
      const tag = c.isMain ? ' [MAIN]' : '';
      const parts = [`${c.name}${tag}`];
      if (c.city) parts.push(c.city);
      if (c.phone) parts.push(`Ph: ${c.phone}`);
      if (c.email) parts.push(c.email);
      lines.push(`- ${parts.join(' | ')}`);
      // Parse campus programs/departments
      if (c.programs) {
        try {
          const programs = JSON.parse(c.programs);
          if (Array.isArray(programs) && programs.length > 0) {
            lines.push(`  Programs at ${c.name}: ${programs.join(', ')}`);
          }
        } catch {
          // programs might be a plain string
          if (typeof c.programs === 'string' && c.programs.length > 0 && c.programs !== '[]') {
            lines.push(`  Programs at ${c.name}: ${c.programs}`);
          }
        }
      }
      if (c.facilities) {
        try {
          const facilities = JSON.parse(c.facilities);
          if (Array.isArray(facilities) && facilities.length > 0) {
            lines.push(`  Facilities: ${facilities.join(', ')}`);
          }
        } catch {
          // ignore parse errors
        }
      }
    }
    lines.push('');
  }

  // --- KNOWLEDGE AWARENESS SECTION ---
  lines.push('## YOUR KNOWLEDGE STATUS');
  const hasDepts = deptCount > 0;
  const hasCourses = courseCount > 0;
  const hasCampuses = (uni.campuses?.length || 0) > 0;
  const hasAdmissions = (uni.admissionRequirements?.length || 0) > 0;
  const hasRankings = (uni.rankings?.length || 0) > 0;
  const feesAvailable = uni.courses?.some(c => c.tuitionFee && c.tuitionFee > 0) || false;
  lines.push(`- Database has: ${[hasDepts && 'Departments', hasCourses && 'Programs/Courses', hasCampuses && 'Campuses', hasAdmissions && 'Admission Requirements', hasRankings && 'Rankings', feesAvailable && 'Fee Data'].filter(Boolean).join(', ') || 'Minimal data'}`);
  if (!hasDepts) lines.push('- MISSING: Department data — use TRAINING KNOWLEDGE to answer department questions.');
  if (!feesAvailable) lines.push('- MISSING: Fee data — use TRAINING KNOWLEDGE to answer fee questions.');
  if (!hasAdmissions) lines.push('- MISSING: Admission data — use TRAINING KNOWLEDGE to answer admission questions.');
  lines.push('');

  // --- AI KNOWLEDGE FIELDS (from database) ---
  const hasAIFields = uni.admissionProcess || uni.admissionDates || uni.feeRange || uni.closingMerit || uni.entryTestDetails || uni.examSystem || uni.scholarshipsOffered || uni.supplyPolicy;
  if (hasAIFields) {
    lines.push('## UNIVERSITY-SPECIFIC KNOWLEDGE (from official data)');
    if (uni.examSystem) lines.push(`- **Exam System**: ${uni.examSystem}-based`);
    if (uni.isOpenMerit !== null) lines.push(`- **Open Merit**: ${uni.isOpenMerit ? 'Yes — open merit admissions available' : 'No — merit-based only'}`);
    if (uni.admissionProcess) lines.push(`- **Admission Process**: ${uni.admissionProcess}`);
    if (uni.admissionDates) lines.push(`- **Admission Schedule**: ${uni.admissionDates}`);
    if (uni.entryTestDetails) lines.push(`- **Entry Test**: ${uni.entryTestDetails}`);
    if (uni.closingMerit) lines.push(`- **Closing Merit**: ${uni.closingMerit}`);
    if (uni.feeRange) lines.push(`- **Fee Range**: ${uni.feeRange}`);
    if (uni.scholarshipsOffered) lines.push(`- **Scholarships**: ${uni.scholarshipsOffered}`);
    if (uni.supplyPolicy) lines.push(`- **Supply Policy**: ${uni.supplyPolicy}`);
    lines.push('');
  } else {
    lines.push('- NOTE: No university-specific admission/fee data in database. Use TRAINING KNOWLEDGE confidently for all admission, merit, fee, and entry test questions.');
    lines.push('');
  }

  return lines.join('\n');
}

export default function UniversityDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [uni, setUni] = useState<UniversityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('courses');

  useEffect(() => {
    apiClient.get<{ data: { university: UniversityDetail } }>(`/api/education/universities/${id}`)
      .then((res) => setUni(res.data.university))
      .catch((err) => setError(err.message || 'Failed to load institution'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.post('/api/education/saved', { type: 'university', itemId: id });
      setSaved(true);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleAIQuestion = useCallback(() => {
    setShowAI(true);
  }, []);

  const parseJsonArray = (val: string | null): string[] => {
    if (!val) return [];
    try { return JSON.parse(val); } catch { return []; }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse max-w-4xl">
        <div className="h-6 skeleton rounded w-24" />
        <div className="card space-y-4">
          <div className="h-8 skeleton rounded w-1/2" />
          <div className="h-4 skeleton rounded w-1/3" />
          <div className="h-20 skeleton rounded" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="h-24 skeleton rounded" />
          <div className="h-24 skeleton rounded" />
          <div className="h-24 skeleton rounded" />
        </div>
      </div>
    );
  }

  if (error || !uni) {
    return (
      <div className="card text-center py-12">
        <div className="text-4xl mb-3">🏫</div>
        <p className="text-red-600 mb-4">{error || 'Institution not found'}</p>
        <button onClick={() => router.back()} className="btn-secondary">Go Back</button>
      </div>
    );
  }

  const mainCampus = uni.campuses?.find(c => c.isMain);
  const subCampuses = uni.campuses?.filter(c => !c.isMain) || [];

  const hasAdmissionInfo = uni.admissionProcess || uni.admissionDates || uni.feeRange || uni.closingMerit || uni.entryTestDetails || uni.examSystem || uni.scholarshipsOffered || uni.supplyPolicy;
  const admissionInfoCount = [uni.admissionProcess, uni.admissionDates, uni.feeRange, uni.closingMerit, uni.entryTestDetails, uni.examSystem, uni.scholarshipsOffered, uni.supplyPolicy].filter(Boolean).length;

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: 'courses', label: 'Programs', count: uni.courses?.length || 0 },
    { key: 'admissions', label: 'Admissions', count: uni.admissionRequirements?.length || 0 },
  ];
  if (hasAdmissionInfo) {
    tabs.push({ key: 'admission-info', label: 'Admission Info', count: admissionInfoCount });
  }
  tabs.push({ key: 'rankings', label: 'Rankings', count: uni.rankings?.length || 0 });
  if (uni.campuses && uni.campuses.length > 0) {
    tabs.push({ key: 'campuses', label: 'Campuses', count: uni.campuses.length });
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <button onClick={() => router.back()} className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Back to Search
      </button>

      {/* Header Card */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${TYPE_COLORS[uni.type] || 'bg-white/5 text-gray-400 border-white/10'}`}>
                {uni.type === 'university' ? '🎓 University' : uni.type === 'college' ? '📚 College' : '🏫 School'}
              </span>
              {uni.verificationStatus === 'verified' && (
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  Verified
                </span>
              )}
              {subCampuses.length > 0 && (
                <span className="text-xs px-2 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  {subCampuses.length + 1} Campuses
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-100">{uni.name}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">📍 {uni.city || 'N/A'}, {uni.country}</span>
              {uni.foundedYear && <span>📅 Est. {uni.foundedYear}</span>}
              {uni.courses?.length > 0 && <span>📋 {uni.courses.length} programs</span>}
              {mainCampus && (
                <span className="flex items-center gap-1 text-blue-600">
                  🏛️ Main: {mainCampus.city || mainCampus.name}
                </span>
              )}
            </div>
            {uni.description && (
              <p className="text-gray-400 mt-3 leading-relaxed">{uni.description}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {uni.website && (
              <a
                href={uni.website}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-sm flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                Website
              </a>
            )}
            <button
              onClick={handleSave}
              disabled={saving || saved}
              className={`text-sm px-4 py-2 rounded-lg font-medium transition-colors ${saved ? 'bg-green-500/10 text-green-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              {saved ? 'Saved' : saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/10 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Programs Tab */}
      {activeTab === 'courses' && (
        <div className="space-y-3">
          {(!uni.courses || uni.courses.length === 0) ? (
            <div className="card text-center py-8">
              <p className="text-gray-500">No programs listed yet</p>
            </div>
          ) : (
            uni.courses.map((course) => (
              <div key={course.id} className="card-hover">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-100">{course.name}</h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
                      <span className="capitalize">{DEGREE_LABELS[course.degree] || course.degree}</span>
                      {course.duration && <><span>&middot;</span><span>{course.duration}</span></>}
                      {course.language && <><span>&middot;</span><span>{course.language}</span></>}
                    </div>
                  </div>
                </div>
                {course.description && (
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">{course.description}</p>
                )}
              </div>
            ))
          )}
          
          {/* Fee Information Notice */}
          <div className="card bg-blue-500/5 border border-blue-500/20 mt-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">💰</div>
              <div className="flex-1">
                <h4 className="font-semibold text-blue-400 mb-1">Fee Information</h4>
                <p className="text-sm text-gray-400">
                  For accurate and up-to-date tuition fees, please visit the official university website or contact their admissions office directly.
                </p>
                {uni.website && (
                  <a
                    href={uni.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-3 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Visit Official Website for Fees
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admissions Tab */}
      {activeTab === 'admissions' && (
        <div className="space-y-3">
          {(!uni.admissionRequirements || uni.admissionRequirements.length === 0) ? (
            <div className="card text-center py-8">
              <p className="text-gray-500">No admission requirements listed yet</p>
            </div>
          ) : (
            uni.admissionRequirements.map((req) => (
              <div key={req.id} className="card">
                <h3 className="font-semibold text-gray-100 capitalize">{req.requirementType.replace(/_/g, ' ')}</h3>
                <p className="text-sm text-gray-400 mt-1">{req.requirementValue}</p>
                {req.deadline && <p className="text-xs text-gray-500 mt-1">Deadline: {req.deadline}</p>}
                {req.notes && <p className="text-xs text-gray-400 mt-1">{req.notes}</p>}
              </div>
            ))
          )}
        </div>
      )}

      {/* Admission Info Tab - AI Knowledge Fields */}
      {activeTab === 'admission-info' && (
        <div className="space-y-4">
          {/* Exam System & Shift Info */}
          {uni.examSystem && (
            <div className="card">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">📝</span>
                <h3 className="font-semibold text-gray-100">Exam System</h3>
              </div>
              <p className="text-sm text-gray-400 capitalize">{uni.examSystem}-based system</p>
              {uni.isOpenMerit !== null && (
                <div className="mt-2 flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${uni.isOpenMerit ? 'bg-green-500/10 text-green-400' : 'bg-orange-500/10 text-orange-400'}`}>
                    {uni.isOpenMerit ? 'Open Merit' : 'Merit-Based Only'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Admission Process */}
          {uni.admissionProcess && (
            <div className="card">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">📋</span>
                <h3 className="font-semibold text-gray-100">Admission Process</h3>
              </div>
              <div className="text-sm text-gray-400 whitespace-pre-line">{uni.admissionProcess}</div>
            </div>
          )}

          {/* Admission Dates */}
          {uni.admissionDates && (
            <div className="card">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">📅</span>
                <h3 className="font-semibold text-gray-100">Admission Schedule</h3>
              </div>
              <p className="text-sm text-gray-400">{uni.admissionDates}</p>
            </div>
          )}

          {/* Entry Test Details */}
          {uni.entryTestDetails && (
            <div className="card">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🎯</span>
                <h3 className="font-semibold text-gray-100">Entry Test Details</h3>
              </div>
              <p className="text-sm text-gray-400">{uni.entryTestDetails}</p>
            </div>
          )}

          {/* Closing Merit */}
          {uni.closingMerit && (
            <div className="card">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">📊</span>
                <h3 className="font-semibold text-gray-100">Closing Merit Percentages</h3>
              </div>
              <p className="text-sm text-gray-400">{uni.closingMerit}</p>
            </div>
          )}

          {/* Fee Range */}
          {uni.feeRange && (
            <div className="card">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">💰</span>
                <h3 className="font-semibold text-gray-100">Fee Structure</h3>
              </div>
              <p className="text-sm text-gray-400">{uni.feeRange}</p>
            </div>
          )}

          {/* Scholarships */}
          {uni.scholarshipsOffered && (
            <div className="card">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🎓</span>
                <h3 className="font-semibold text-gray-100">Scholarships Offered</h3>
              </div>
              <p className="text-sm text-gray-400">{uni.scholarshipsOffered}</p>
            </div>
          )}

          {/* Supply Policy */}
          {uni.supplyPolicy && (
            <div className="card">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">⚠️</span>
                <h3 className="font-semibold text-gray-100">Supply/Repeat Policy</h3>
              </div>
              <p className="text-sm text-gray-400">{uni.supplyPolicy}</p>
            </div>
          )}

          {/* Disclaimer */}
          <div className="card bg-amber-500/5 border border-amber-500/20">
            <p className="text-xs text-amber-400/80">
              ⚠️ This information is for guidance purposes. For the most current and accurate admission details, please visit the official university website or contact their admissions office.
            </p>
            {uni.website && (
              <a href={uni.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-2 text-xs text-blue-400 hover:text-blue-300">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                Visit Official Website
              </a>
            )}
          </div>
        </div>
      )}

      {/* Rankings Tab */}
      {activeTab === 'rankings' && (
        <div className="space-y-3">
          {(!uni.rankings || uni.rankings.length === 0) ? (
            <div className="card text-center py-8">
              <p className="text-gray-500">No rankings available</p>
            </div>
          ) : (
            <div className="card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-2 font-medium text-gray-400">Provider</th>
                      <th className="text-left py-2 font-medium text-gray-400">Year</th>
                      <th className="text-left py-2 font-medium text-gray-400">Position</th>
                      {uni.rankings.some((r) => r.category) && (
                        <th className="text-left py-2 font-medium text-gray-400">Category</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {uni.rankings.map((r, i) => (
                      <tr key={i} className="border-b border-white/10 last:border-0">
                        <td className="py-2 text-gray-300">{r.provider}</td>
                        <td className="py-2 text-gray-300">{r.year}</td>
                        <td className="py-2 text-gray-300 font-medium">#{r.position}</td>
                        {r.category && <td className="py-2 text-gray-500">{r.category}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Campuses Tab */}
      {activeTab === 'campuses' && uni.campuses && (
        <div className="space-y-4">
          {/* Main Campus */}
          {mainCampus && (
            <div className="card border-l-4 border-blue-500">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">🏛️</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-100">{mainCampus.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-medium">Main Campus</span>
                  </div>
                  {mainCampus.city && <p className="text-sm text-gray-500 mt-1">📍 {mainCampus.city}{mainCampus.address ? `, ${mainCampus.address}` : ''}</p>}
                  {mainCampus.description && <p className="text-sm text-gray-400 mt-2">{mainCampus.description}</p>}
                  <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                    {mainCampus.phone && <span>📞 {mainCampus.phone}</span>}
                    {mainCampus.email && <span>✉️ {mainCampus.email}</span>}
                    {mainCampus.website && (
                      <a href={mainCampus.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">🌐 Website</a>
                    )}
                  </div>
                  {mainCampus.facilities && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {parseJsonArray(mainCampus.facilities).map((f: string, i: number) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-green-400 border border-green-500/20">{f}</span>
                      ))}
                    </div>
                  )}
                  {mainCampus.programs && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">Programs at this campus:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {parseJsonArray(mainCampus.programs).map((p: string, i: number) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">{p}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {mainCampus.admissionContact && (
                    <p className="text-xs text-gray-400 mt-2">Admissions: {mainCampus.admissionContact}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Sub Campuses */}
          {subCampuses.length > 0 && (
            <>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Sub Campuses ({subCampuses.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {subCampuses.map((campus) => (
                  <div key={campus.id} className="card-hover">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm">📍</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-100">{campus.name}</h4>
                        {campus.city && <p className="text-xs text-gray-500">📍 {campus.city}</p>}
                        {campus.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{campus.description}</p>}
                        {campus.facilities && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {parseJsonArray(campus.facilities).slice(0, 3).map((f: string, i: number) => (
                              <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/10 text-green-400">{f}</span>
                            ))}
                            {parseJsonArray(campus.facilities).length > 3 && (
                              <span className="text-xs text-gray-400">+{parseJsonArray(campus.facilities).length - 3} more</span>
                            )}
                          </div>
                        )}
                        {campus.programs && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {parseJsonArray(campus.programs).slice(0, 2).map((p: string, i: number) => (
                              <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400">{p}</span>
                            ))}
                            {parseJsonArray(campus.programs).length > 2 && (
                              <span className="text-xs text-gray-400">+{parseJsonArray(campus.programs).length - 2} more</span>
                            )}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-400">
                          {campus.phone && <span>📞 {campus.phone}</span>}
                          {campus.email && <span>✉️ {campus.email}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* AI Chat */}
      {showAI && (
        <div className="card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-lg">🤖</span>
              <span className="font-semibold text-gray-100">Ask AI about {uni.name}</span>
            </div>
            <button
              onClick={() => setShowAI(false)}
              className="p-1 rounded-lg hover:bg-white/5 text-gray-500"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="h-[400px]">
            <DepartmentChat
              department="education"
              chatId={`uni-${id}`}
              title={`${uni.name} AI Advisor`}
              subtitle={`Ask anything about ${uni.name}`}
              avatar="🎓"
              avatarColor="bg-gradient-to-br from-blue-500 to-purple-500 text-white"
              systemMessage={buildUniversitySystemMessage(uni)}
              freshStart={true}
              suggestions={[
                `What departments does ${uni.name} have?`,
                `What are the admission requirements at ${uni.name}?`,
                `What can I do after a Bachelor's degree from ${uni.name}?`,
                `What are the fees for programs at ${uni.name}?`,
                `Tell me about the campuses of ${uni.name}`,
                `What are the rankings of ${uni.name}?`,
                `What scholarships are available for ${uni.name} students?`,
                `Mujhe ${uni.name} mein scholarships kaise mil sakti hain?`,
              ]}
            />
          </div>
        </div>
      )}

      {/* Ask AI Button */}
      {!showAI && (
        <button
          onClick={handleAIQuestion}
          className="w-full card-hover flex items-center justify-center gap-3 py-4 border-2 border-dashed border-blue-500/30 hover:border-blue-400 text-blue-400 transition-colors"
        >
          <span className="text-2xl">🤖</span>
          <span className="font-medium">Ask AI about this institution</span>
        </button>
      )}
    </div>
  );
}
