'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import DepartmentChat from '@/components/department-chat/DepartmentChat';

interface Scholarship {
  id: string;
  name: string;
  provider: string;
  country: string | null;
  category: string | null;
  amount: number | null;
  currency: string | null;
  amountFrequency: string | null;
  deadline: string | null;
  description: string | null;
  eligibilityCriteria: string | null;
  applicationProcess: string | null;
  documentsRequired: string | null;
  contactInfo: string | null;
  sourceUrl: string | null;
  isVerified: boolean;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function ScholarshipsPage() {
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [country, setCountry] = useState('');
  const [degreeLevel, setDegreeLevel] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [showChat, setShowChat] = useState(false);

  const fetchScholarships = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (keyword) params.set('keyword', keyword);
      if (country) params.set('country', country);
      if (degreeLevel) params.set('degreeLevel', degreeLevel);
      if (category) params.set('category', category);
      params.set('page', String(page));
      params.set('limit', '20');
      const res = await apiClient.get<{ data: { scholarships: Scholarship[]; pagination: Pagination } }>(`/api/education/scholarships?${params}`);
      setScholarships(res.data.scholarships);
      setPagination(res.data.pagination);
    } catch {
      setScholarships([]);
    } finally {
      setLoading(false);
    }
  }, [keyword, country, degreeLevel, category, page]);

  useEffect(() => { fetchScholarships(); }, [fetchScholarships]);

  const formatAmount = (amount: number | null, currency: string | null, frequency: string | null) => {
    if (!amount || !currency) return null;
    const freq = frequency || 'monthly';
    if (freq === 'one_time') return `${currency} ${amount.toLocaleString()} (one-time)`;
    if (freq === 'annual') return `${currency} ${amount.toLocaleString()}/year`;
    if (freq === 'total') return `${currency} ${amount.toLocaleString()} (total)`;
    return `${currency} ${amount.toLocaleString()}/month`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <Link href="/education" className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 mb-2 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Back to Education Center
            </Link>
            <h1 className="text-2xl font-bold gradient-text">Find Scholarships</h1>
            <p className="text-gray-400 mt-1">Find scholarships that match your profile</p>
          </div>
          <button
            onClick={() => setShowChat(!showChat)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${showChat ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/25' : 'bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 border border-violet-500/30 hover:border-violet-500/50'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            {showChat ? 'Hide AI Assistant' : 'AI Scholarship Assistant'}
          </button>
        </div>
      </div>

      {showChat && (
        <DepartmentChat
          department="scholarships"
          title="ScholarshipGuru AI"
          subtitle="Complete scholarship expert — national & international"
          avatar="\uD83C\uDF93"
          avatarColor="bg-gradient-to-br from-violet-500 to-purple-600"
          suggestions={[
            'Mujhe konsa scholarship mil sakta hai?',
            'Fulbright ki eligibility kya hai?',
            'List all active scholarships with deadlines',
            'HEC scholarship ka application process batao',
            'International scholarships for BS students',
            'PKR 35,000 income ke liye kaunse scholarships hain?',
          ]}
        />
      )}

      <div className="card space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
          <span className="text-sm font-medium bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">Filter Scholarships</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              placeholder="Search scholarships..."
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
              className="input-field pl-10"
            />
          </div>
          <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="input-field">
            <option value="">All Types</option>
            <option value="local">Pakistan (Local)</option>
            <option value="international">International</option>
          </select>
          <select value={country} onChange={(e) => { setCountry(e.target.value); setPage(1); }} className="input-field">
            <option value="">All Countries</option>
            {['Pakistan', 'United States', 'United Kingdom', 'Germany', 'France', 'Japan', 'South Korea', 'China', 'Turkey', 'Hungary', 'Netherlands', 'Sweden', 'Australia', 'New Zealand', 'Malaysia', 'Italy', 'Thailand', 'Singapore', 'UAE', 'European Union', 'Mauritius', 'Iraq', 'Czech Republic'].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select value={degreeLevel} onChange={(e) => { setDegreeLevel(e.target.value); setPage(1); }} className="input-field">
            <option value="">All Programs</option>
            <optgroup label="Undergraduate">
              <option value="Intermediate">Intermediate (FSc/FA/ICS)</option>
              <option value="Bachelor">Bachelor (BA/BSc/BS)</option>
              <option value="MBBS">MBBS</option>
              <option value="BDS">BDS</option>
              <option value="BBA">BBA</option>
              <option value="LLB">LLB</option>
              <option value="BE/BSc Engineering">Engineering (BE/BSc)</option>
              <option value="Pharm.D">Pharm.D</option>
              <option value="B.Arch">B.Arch</option>
              <option value="BFA">BFA (Fine Arts)</option>
              <option value="BS Computer Science">BS Computer Science</option>
              <option value="BS IT">BS IT</option>
              <option value="BSc Agriculture">BSc Agriculture</option>
              <option value="Nursing">Nursing</option>
              <option value="Diploma">Diploma</option>
            </optgroup>
            <optgroup label="Graduate">
              <option value="Master">Master (MA/MSc/MS)</option>
              <option value="MBA">MBA</option>
              <option value="MFA">MFA</option>
              <option value="M.Arch">M.Arch</option>
              <option value="ME/MSc Engineering">ME/MSc Engineering</option>
              <option value="MS Computer Science">MS Computer Science</option>
              <option value="MSc Agriculture">MSc Agriculture</option>
              <option value="M.Phil Pharmacy">M.Phil Pharmacy</option>
            </optgroup>
            <optgroup label="Doctoral">
              <option value="PhD">PhD</option>
            </optgroup>
          </select>
          <button onClick={() => { setPage(1); fetchScholarships(); }} className="btn-primary flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            Search
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card animate-pulse space-y-3">
              <div className="h-5 skeleton rounded w-3/4" />
              <div className="h-4 skeleton rounded w-1/2" />
              <div className="h-4 skeleton rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : scholarships.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 font-medium">No scholarships found</p>
          <p className="text-sm text-gray-400 mt-1">Try adjusting your search filters</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              <span className="font-bold text-lg gradient-text">{pagination.total}</span>
              <span className="ml-1.5">scholarships found</span>
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scholarships.map((s) => {
              const deadlineDate = s.deadline ? new Date(s.deadline) : null;
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const deadlineDay = deadlineDate ? new Date(deadlineDate.getFullYear(), deadlineDate.getMonth(), deadlineDate.getDate()) : null;
              const daysLeft = deadlineDay ? Math.ceil((deadlineDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;
              const urgent = daysLeft !== null && daysLeft <= 14 && daysLeft > 0;
              const passed = daysLeft !== null && daysLeft <= 0;
              const isLocal = s.category === 'local';
              const amountStr = formatAmount(s.amount, s.currency, s.amountFrequency);

              return (
                <Link key={s.id} href={`/education/scholarships/${s.id}`} className={`card-hover group relative overflow-hidden ${passed ? 'opacity-60' : ''}`}>
                  {/* Top accent bar */}
                  <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${isLocal ? 'from-emerald-500 to-teal-500' : 'from-blue-500 to-indigo-500'}`} />

                  <div className="flex items-start justify-between mt-1">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-100 text-sm leading-tight group-hover:text-blue-400 transition-colors line-clamp-2">{s.name}</h3>
                      <p className="text-xs text-gray-500 mt-1.5 truncate">{s.provider}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-3">
                      {s.isVerified && (
                        <span className="text-emerald-400 flex items-center gap-0.5" title="Verified">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${isLocal ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                        {isLocal ? 'Pakistan' : 'International'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    {s.country && (
                      <span className="inline-flex items-center gap-1 text-xs bg-white/5 text-gray-400 px-2.5 py-1 rounded-lg border border-white/5">
                        <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        {s.country}
                      </span>
                    )}
                    {amountStr && (
                      <span className="inline-flex items-center gap-1 text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-500/20 font-semibold">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {amountStr}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                    {s.sourceUrl && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-violet-400 group-hover:text-violet-300 transition-colors">
                        Visit Website
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      </span>
                    )}
                    <div className="ml-auto">
                      {passed && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-white/5 text-gray-500">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          Deadline passed
                        </span>
                      )}
                      {daysLeft !== null && daysLeft > 0 && (
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${urgent ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          {urgent ? `Only ${daysLeft} days left!` : daysLeft <= 90 ? `${daysLeft} days left` : `${new Date(s.deadline!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-secondary text-sm disabled:opacity-40">Prev</button>
              <span className="text-sm text-gray-400">Page {page} of {pagination.totalPages}</span>
              <button disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)} className="btn-secondary text-sm disabled:opacity-40">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
