'use client';

import { useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

interface RecUni {
  id: string;
  name: string;
  country: string;
  city: string | null;
  type: string;
  sector: string | null;
  ranking: number | null;
  matchScore: number;
  matchReasons: string[];
  courses: { name: string; degree: string; department: string | null; tuitionFee: number | null; currency: string | null; description: string | null }[];
  departments: { name: string; totalCourses: number }[];
}

interface RecCourse {
  id: string;
  name: string;
  degree: string;
  department: string | null;
  tuitionFee: number | null;
  currency: string | null;
  universityName: string;
  universityCountry: string;
  matchScore: number;
  matchReasons: string[];
}

interface RecScholarship {
  id: string;
  name: string;
  provider: string;
  country: string | null;
  amount: number | null;
  currency: string | null;
  deadline: string | null;
  matchStrength: string;
  matchReasons: string[];
}

interface RecResult {
  universities: RecUni[];
  courses: RecCourse[];
  scholarships: RecScholarship[];
  aiSummary?: string;
}

const FIELDS = [
  'Computer Science', 'Engineering', 'Medicine', 'Business', 'Law',
  'Education', 'Arts', 'Science', 'Social Sciences', 'Agriculture',
  'Architecture', 'Design', 'Nursing', 'Pharmacy', 'Economics',
  'Psychology', 'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'Accounting', 'Finance', 'Marketing', 'Management', 'Data Science',
  'Artificial Intelligence', 'Information Technology', 'Software Engineering',
  'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering',
  'Chemical Engineering', 'Biotechnology', 'Environmental Science',
  'Political Science', 'Sociology', 'History', 'English', 'Urdu',
  'Islamic Studies', 'Journalism', 'Mass Communication', 'International Relations',
  'Public Administration', 'Business Administration', 'Human Resources',
  'Supply Chain Management', 'Actuarial Science', 'Statistics',
];

const DEGREES = [
  { value: 'intermediate', label: 'Intermediate / FSc / ICS / FA' },
  { value: 'bachelor', label: 'Bachelor / BS / BA / BSc / BCom' },
  { value: 'mbbs', label: 'MBBS — Medicine & Surgery' },
  { value: 'bds', label: 'BDS — Dental Surgery' },
  { value: 'pharm-d', label: 'Pharm-D — Pharmacy' },
  { value: 'llb', label: 'LLB — Law' },
  { value: 'dpt', label: 'DPT — Physical Therapy' },
  { value: 'barch', label: 'BArch — Architecture' },
  { value: 'bba', label: 'BBA — Business Administration' },
  { value: 'master', label: 'Master / MS / MA / MSc / MBA / MPhil' },
  { value: 'llm', label: 'LLM — Master of Laws' },
  { value: 'fcps', label: 'FCPS / MCPS — Medical Specialization' },
  { value: 'phd', label: 'PhD / Doctorate' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'associate', label: 'Associate Degree / ADP' },
  { value: 'postdoc', label: 'Postdoctoral' },
];

const COUNTRIES = [
  { name: 'Pakistan', currency: 'PKR', symbol: 'Rs' },
  { name: 'United States', currency: 'USD', symbol: '$' },
  { name: 'United Kingdom', currency: 'GBP', symbol: '\u00a3' },
  { name: 'Canada', currency: 'CAD', symbol: 'CA$' },
  { name: 'Australia', currency: 'AUD', symbol: 'A$' },
  { name: 'Germany', currency: 'EUR', symbol: '\u20ac' },
  { name: 'Turkey', currency: 'TRY', symbol: '\u20ba' },
  { name: 'Saudi Arabia', currency: 'SAR', symbol: 'SR' },
  { name: 'UAE', currency: 'AED', symbol: 'AED' },
  { name: 'Malaysia', currency: 'MYR', symbol: 'RM' },
  { name: 'China', currency: 'CNY', symbol: '\u00a5' },
  { name: 'Japan', currency: 'JPY', symbol: '\u00a5' },
  { name: 'South Korea', currency: 'KRW', symbol: 'KRW' },
  { name: 'Netherlands', currency: 'EUR', symbol: '\u20ac' },
  { name: 'Sweden', currency: 'SEK', symbol: 'kr' },
];

const STRENGTH_COLORS: Record<string, string> = {
  strong: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  possible: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  needs_verification: 'bg-slate-500/5 text-slate-400 border-slate-500/10',
  not_eligible: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const DEG_COLORS: Record<string, string> = {
  bachelor: 'bg-blue-500/10 text-blue-400',
  master: 'bg-violet-500/10 text-violet-400',
  phd: 'bg-rose-500/10 text-rose-400',
  diploma: 'bg-amber-500/10 text-amber-400',
  certificate: 'bg-slate-500/5 text-slate-300',
  intermediate: 'bg-emerald-500/10 text-emerald-400',
};

function scoreColor(s: number) {
  if (s >= 80) return 'text-emerald-400';
  if (s >= 60) return 'text-blue-400';
  if (s >= 40) return 'text-amber-400';
  return 'text-slate-500';
}

function scoreBg(s: number) {
  if (s >= 80) return 'bg-emerald-500';
  if (s >= 60) return 'bg-blue-500';
  if (s >= 40) return 'bg-amber-500';
  return 'bg-slate-500';
}

function renderAiSummary(text: string) {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <br key={i} />;
    const isHeading = trimmed.startsWith('**') && trimmed.endsWith('**');
    if (isHeading) {
      const headingText = trimmed.slice(2, -2);
      return (
        <p key={i} className="font-semibold text-white mt-3 mb-1 text-sm">
          {headingText}
        </p>
      );
    }
    const isBullet = trimmed.startsWith('- ');
    if (isBullet) {
      const content = trimmed.slice(2);
      return (
        <p key={i} className="text-sm text-slate-300 ml-3 flex gap-2 my-0.5">
          <span className="text-blue-400 font-bold flex-shrink-0">&rsaquo;</span>
          <span>{renderBoldText(content)}</span>
        </p>
      );
    }
    return (
      <p key={i} className="text-sm text-slate-300 my-0.5">
        {renderBoldText(trimmed)}
      </p>
    );
  });
}

function renderBoldText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function getCurrency(name: string) {
  const c = COUNTRIES.find((x) => x.name === name);
  return c ? { code: c.currency, symbol: c.symbol } : { code: 'USD', symbol: '$' };
}

function StrengthBadge({ strength }: { strength: string }) {
  const label = strength === 'strong' ? 'Strong Match' : strength === 'possible' ? 'Possible' : strength === 'not_eligible' ? 'Not Eligible' : 'Verify';
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${STRENGTH_COLORS[strength] || 'bg-white/5 text-gray-400'}`}>
      {label}
    </span>
  );
}

function ScoreDisplay({ score }: { score: number }) {
  return (
    <div className="ml-4 text-right flex-shrink-0">
      <div className={`text-xl font-bold tabular-nums ${scoreColor(score)}`}>{score}%</div>
      <div className="w-14 h-1 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${scoreBg(score)}`} style={{ width: `${score}%` }} />
      </div>
      <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-medium">match</p>
    </div>
  );
}

export default function RecommendationsPage() {
  const [field, setField] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [degreeLevel, setDegreeLevel] = useState('');
  const [budget, setBudget] = useState('');
  const [careerGoal, setCareerGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RecResult | null>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'universities' | 'courses' | 'scholarships'>('universities');

  const cur = getCurrency(country);

  const handleSearch = async () => {
    if (!field && !country && !city && !degreeLevel && !budget && !careerGoal) {
      setError('Please fill in at least one field');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await apiClient.post<{ data: RecResult }>('/api/education/recommendations', {
        field: field || undefined,
        country: country || undefined,
        city: city || undefined,
        degreeLevel: degreeLevel || undefined,
        budget: budget ? Number(budget) : undefined,
        currency: cur.code,
        careerGoal: careerGoal || undefined,
      });
      setResult(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get recommendations');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { key: 'universities' as const, label: 'Universities', count: result?.universities.length ?? 0 },
    { key: 'courses' as const, label: 'Courses', count: result?.courses.length ?? 0 },
    { key: 'scholarships' as const, label: 'Scholarships', count: result?.scholarships.length ?? 0 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <Link href="/education" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-3 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" /></svg>
          Back to Education
        </Link>
        <h1 className="text-xl font-bold text-white">AI Recommendations</h1>
        <p className="text-sm text-slate-500 mt-1">Get personalized university, course, and scholarship recommendations</p>
      </div>

      <div className="card">
        <h2 className="text-base font-semibold text-white mb-4">Your Preferences</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Field of Study</label>
            <select value={field} onChange={(e) => setField(e.target.value)} className="input-field text-sm">
              <option value="">Any field</option>
              {FIELDS.map((f) => (<option key={f} value={f}>{f}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Country</label>
            <select value={country} onChange={(e) => { setCountry(e.target.value); setCity(''); }} className="input-field text-sm">
              <option value="">Any country</option>
              {COUNTRIES.map((c) => (<option key={c.name} value={c.name}>{c.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">City</label>
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder={country ? `e.g. ${country === 'Pakistan' ? 'Lahore, Karachi' : 'London, Berlin'}` : 'Any city'} className="input-field text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Degree Level</label>
            <select value={degreeLevel} onChange={(e) => setDegreeLevel(e.target.value)} className="input-field text-sm">
              <option value="">Any level</option>
              {DEGREES.map((d) => (<option key={d.value} value={d.value}>{d.label}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Max Budget ({cur.code}/year)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">{cur.symbol}</span>
              <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder={country === 'Pakistan' ? 'e.g. 500000' : 'e.g. 15000'} className="input-field text-sm pl-8" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Career Goal</label>
            <input type="text" value={careerGoal} onChange={(e) => setCareerGoal(e.target.value)} placeholder="e.g. Software Engineer, Doctor" className="input-field text-sm" />
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        <button onClick={handleSearch} disabled={loading} className="btn-primary mt-4 text-sm">
          {loading ? 'Finding matches...' : 'Get Recommendations'}
        </button>
      </div>

      {result && (
        <>
          {result.aiSummary && (
            <div className="rounded-xl border border-blue-500/15 bg-blue-950/20 p-5">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white mb-2 text-sm">AI Insights</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">{renderAiSummary(result.aiSummary)}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-0.5 border-b border-slate-800">
            {tabs.map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-md ${activeTab === tab.key ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-800 text-slate-500'}`}>{tab.count}</span>
                )}
              </button>
            ))}
          </div>

          {activeTab === 'universities' && (
            <div className="space-y-4">
              {result.universities.length === 0 ? (
                <div className="card text-center py-8"><p className="text-gray-500">No matching universities found. Try broadening your search.</p></div>
              ) : result.universities.map((uni) => (
                <Link key={uni.id} href={`/education/universities/${uni.id}`} className="card-hover block">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-100">{uni.name}</h3>
                        {uni.ranking && <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full">#{uni.ranking}</span>}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{uni.city && `${uni.city}, `}{uni.country}{uni.sector && ` \u00b7 ${uni.sector}`}</p>
                      {uni.matchReasons.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {uni.matchReasons.map((r, i) => (<span key={i} className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full">{r}</span>))}
                        </div>
                      )}
                      {uni.courses.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {uni.courses.slice(0, 4).map((c, i) => (
                            <span key={i} className={`text-xs px-2 py-0.5 rounded-full ${DEG_COLORS[c.degree] || 'bg-white/5 text-gray-400'}`}>
                              {typeof c === 'string' ? c : (c.name || 'Unknown Course')}
                            </span>
                          ))}
                          {uni.courses.length > 4 && <span className="text-xs text-gray-400">+{uni.courses.length - 4} more</span>}
                        </div>
                      )}
                    </div>
                    <ScoreDisplay score={uni.matchScore} />
                  </div>
                </Link>
              ))}
            </div>
          )}

          {activeTab === 'courses' && (
            <div className="space-y-4">
              {result.courses.length === 0 ? (
                <div className="card text-center py-8"><p className="text-gray-500">No matching courses found. Try broadening your search.</p></div>
              ) : result.courses.map((c) => (
                <div key={c.id} className="card-hover">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-100">{typeof c.name === 'string' ? c.name : 'Unknown Course'}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${DEG_COLORS[c.degree] || 'bg-white/5 text-gray-400'}`}>{typeof c.degree === 'string' ? c.degree : 'Unknown'}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{c.universityName} · {c.universityCountry}</p>
                      {c.matchReasons.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {c.matchReasons.map((r, i) => (<span key={i} className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full">{typeof r === 'string' ? r : JSON.stringify(r)}</span>))}
                        </div>
                      )}
                    </div>
                    <ScoreDisplay score={c.matchScore} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'scholarships' && (
            <div className="space-y-4">
              {result.scholarships.length === 0 ? (
                <div className="card text-center py-8"><p className="text-gray-500">No matching scholarships found. Try broadening your search.</p></div>
              ) : result.scholarships.map((s) => (
                <div key={s.id} className="card-hover">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-100">{s.name}</h3>
                        <StrengthBadge strength={s.matchStrength} />
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{s.provider} \u00b7 {s.country}</p>
                      {s.amount && <p className="text-sm text-gray-400 mt-1">Amount: {s.currency || 'USD'} {s.amount.toLocaleString()}</p>}
                      {s.deadline && <p className="text-sm text-gray-500 mt-1">Deadline: {new Date(s.deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>}
                      {s.matchReasons.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {s.matchReasons.map((r, i) => (<span key={i} className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full">{r}</span>))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {!result && !loading && (
        <div className="card text-center py-12">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-white mt-4">Find Your Perfect Match</h3>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">Tell us your preferences above and our AI will find the best universities, courses, and scholarships for you.</p>
        </div>
      )}
    </div>
  );
}
