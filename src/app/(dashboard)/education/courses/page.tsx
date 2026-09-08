'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

interface Course {
  id: string;
  name: string;
  degree: string;
  department: string | null;
  duration: string | null;
  language: string | null;
  description: string | null;
  university: { id: string; name: string; country: string; city: string | null };
}

interface UniItem {
  id: string;
  name: string;
  city: string | null;
  _count: { courses: number };
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const PROGRAM_LABELS: Record<string, string> = {
  intermediate: 'Intermediate / FSc / ICS',
  bachelor: 'BS / Bachelor',
  master: 'MS / Master',
  phd: 'PhD',
  diploma: 'Diploma',
  certificate: 'Certificate',
  associate: 'Associate Degree / ADP',
};

const DEGREE_COLORS: Record<string, string> = {
  bachelor: 'bg-blue-500/10 text-blue-400',
  master: 'bg-purple-500/10 text-purple-400',
  phd: 'bg-red-500/10 text-red-400',
  intermediate: 'bg-green-500/10 text-green-400',
  diploma: 'bg-yellow-500/10 text-yellow-400',
  certificate: 'bg-white/5 text-gray-300',
  associate: 'bg-teal-500/10 text-teal-400',
};

export default function CoursesPage() {
  const [countries, setCountries] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [universities, setUniversities] = useState<UniItem[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [programs, setPrograms] = useState<string[]>([]);

  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [universityId, setUniversityId] = useState('');
  const [department, setDepartment] = useState('');
  const [program, setProgram] = useState('');

  const [courses, setCourses] = useState<Course[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingUnis, setLoadingUnis] = useState(false);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [loadingProgs, setLoadingProgs] = useState(false);

  // Step 1: Load countries
  useEffect(() => {
    apiClient.get<{ data: { countries: string[] } }>('/api/education/universities/countries')
      .then((res) => setCountries(res.data.countries))
      .catch(() => setCountries([]));
  }, []);

  // Step 2: Country → load cities
  useEffect(() => {
    if (!country) { setCities([]); return; }
    setLoadingCities(true);
    setCity(''); setUniversityId(''); setDepartment(''); setProgram('');
    apiClient.get<{ data: { cities: string[] } }>(`/api/education/universities/cities?country=${encodeURIComponent(country)}`)
      .then((res) => setCities(res.data.cities))
      .catch(() => setCities([]))
      .finally(() => setLoadingCities(false));
  }, [country]);

  // Step 3: City → load universities
  useEffect(() => {
    if (!country) { setUniversities([]); return; }
    setLoadingUnis(true);
    setUniversityId(''); setDepartment(''); setProgram('');
    const params = new URLSearchParams({ country });
    if (city) params.set('city', city);
    apiClient.get<{ data: { universities: UniItem[] } }>(`/api/education/universities/list?${params}`)
      .then((res) => setUniversities(res.data.universities))
      .catch(() => setUniversities([]))
      .finally(() => setLoadingUnis(false));
  }, [country, city]);

  // Step 4: University → load departments
  useEffect(() => {
    if (!country) { setDepartments([]); return; }
    setLoadingDepts(true);
    setDepartment(''); setProgram('');
    const params = new URLSearchParams({ country });
    if (city) params.set('city', city);
    if (universityId) params.set('universityId', universityId);
    apiClient.get<{ data: { departments: string[] } }>(`/api/education/universities/departments?${params}`)
      .then((res) => setDepartments(res.data.departments))
      .catch(() => setDepartments([]))
      .finally(() => setLoadingDepts(false));
  }, [country, city, universityId]);

  // Step 5: Department → load programs
  useEffect(() => {
    if (!country) { setPrograms([]); return; }
    setLoadingProgs(true);
    setProgram('');
    const params = new URLSearchParams({ country });
    if (city) params.set('city', city);
    if (universityId) params.set('universityId', universityId);
    if (department) params.set('department', department);
    apiClient.get<{ data: { programs: string[] } }>(`/api/education/universities/programs?${params}`)
      .then((res) => setPrograms(res.data.programs))
      .catch(() => setPrograms([]))
      .finally(() => setLoadingProgs(false));
  }, [country, city, universityId, department]);

  // Fetch courses
  const fetchCourses = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (country) params.set('country', country);
      if (city) params.set('city', city);
      if (universityId) {
        // Fetch directly from university detail
        const res = await apiClient.get<{ data: { university: { courses: Course[]; name: string; city: string | null } } }>(`/api/education/universities/${universityId}`);
        let filtered = (res.data.university.courses || []).map((c) => ({
          ...c,
          university: { id: universityId, name: res.data.university.name, city: res.data.university.city, country: country },
        }));
        if (department) filtered = filtered.filter((c) => c.department === department);
        if (program) filtered = filtered.filter((c) => c.degree === program);
        setCourses(filtered.slice((page - 1) * 20, page * 20));
        setPagination({ total: filtered.length, page, limit: 20, totalPages: Math.ceil(filtered.length / 20) });
        return;
      }
      if (department) params.set('field', department);
      if (program) params.set('level', program);
      const res = await apiClient.get<{ data: { courses: Course[]; pagination: Pagination } }>(`/api/education/courses?${params}`);
      setCourses(res.data.courses);
      setPagination(res.data.pagination);
    } catch {
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [country, city, universityId, department, program]);

  useEffect(() => { fetchCourses(1); }, [fetchCourses]);

  const activeFilters = [country, city, universityId ? universities.find((u) => u.id === universityId)?.name : '', department, program ? (PROGRAM_LABELS[program] || program) : ''].filter(Boolean);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <Link href="/education" className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 mb-3">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Education Center
        </Link>
        <h1 className="text-2xl font-bold gradient-text">Find a Course</h1>
        <p className="text-cyan-400 mt-1">Search courses from universities worldwide</p>
      </div>

      {/* 5-Step Cascading Filters */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2 text-sm text-violet-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
          <span className="font-medium">Filter by:</span>
          <span className="text-cyan-400">Country → City → University → Department → Program</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* 1. Country */}
          <div>
            <label className="block text-xs font-semibold text-cyan-400 mb-1">1. Country</label>
            <select value={country} onChange={(e) => setCountry(e.target.value)} className="input-field text-sm">
              <option value="">All Countries</option>
              {countries.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* 2. City */}
          <div>
            <label className="block text-xs font-semibold text-cyan-400 mb-1">2. City</label>
            <select value={city} onChange={(e) => setCity(e.target.value)} className="input-field text-sm" disabled={!country || loadingCities}>
              <option value="">{loadingCities ? 'Loading...' : country ? 'All Cities' : '—'}</option>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* 3. University */}
          <div>
            <label className="block text-xs font-semibold text-cyan-400 mb-1">3. University</label>
            <select value={universityId} onChange={(e) => setUniversityId(e.target.value)} className="input-field text-sm" disabled={!country || loadingUnis}>
              <option value="">{loadingUnis ? 'Loading...' : country ? 'All Universities' : '—'}</option>
              {universities.map((u) => <option key={u.id} value={u.id}>{u.name} ({u._count.courses})</option>)}
            </select>
          </div>

          {/* 4. Department */}
          <div>
            <label className="block text-xs font-semibold text-cyan-400 mb-1">4. Department</label>
            <select value={department} onChange={(e) => setDepartment(e.target.value)} className="input-field text-sm" disabled={!country || loadingDepts}>
              <option value="">{loadingDepts ? 'Loading...' : country ? 'All Departments' : '—'}</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* 5. Program */}
          <div>
            <label className="block text-xs font-semibold text-cyan-400 mb-1">5. Program</label>
            <select value={program} onChange={(e) => setProgram(e.target.value)} className="input-field text-sm" disabled={!country || loadingProgs}>
              <option value="">{loadingProgs ? 'Loading...' : country ? 'All Programs' : '—'}</option>
              {programs.map((p) => <option key={p} value={p}>{PROGRAM_LABELS[p] || p}</option>)}
            </select>
          </div>
        </div>

        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-cyan-400">Active:</span>
            {country && <button onClick={() => { setCountry(''); setCity(''); setUniversityId(''); setDepartment(''); setProgram(''); }} className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full hover:bg-blue-500/20">{country} ×</button>}
            {city && <button onClick={() => { setCity(''); setUniversityId(''); setDepartment(''); setProgram(''); }} className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full hover:bg-green-500/20">{city} ×</button>}
            {universityId && <button onClick={() => { setUniversityId(''); setDepartment(''); setProgram(''); }} className="text-xs bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full hover:bg-purple-500/20">{universities.find((u) => u.id === universityId)?.name} ×</button>}
            {department && <button onClick={() => { setDepartment(''); setProgram(''); }} className="text-xs bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded-full hover:bg-orange-500/20">{department} ×</button>}
            {program && <button onClick={() => setProgram('')} className="text-xs bg-pink-500/10 text-pink-400 px-2 py-0.5 rounded-full hover:bg-pink-500/20">{PROGRAM_LABELS[program] || program} ×</button>}
          </div>
        )}
      </div>

      {/* Results */}
      {!country ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">🌍</div>
          <p className="text-lg font-medium text-cyan-400">Select a country to get started</p>
          <p className="text-sm text-violet-400 mt-2">Browse {countries.length} countries with universities in our database</p>
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {countries.map((c) => (
              <button key={c} onClick={() => setCountry(c)}
                className="px-4 py-2 bg-white/[0.03] border border-white/10 rounded-lg text-sm font-medium text-cyan-400 hover:border-blue-400 hover:text-blue-600 transition-colors">
                {c === 'Pakistan' ? '🇵🇰' : c === 'United States' ? '🇺🇸' : c === 'United Kingdom' ? '🇬🇧' : c === 'Germany' ? '🇩🇪' : c === 'Canada' ? '🇨🇦' : c === 'Australia' ? '🇦🇺' : '🌍'} {c}
              </button>
            ))}
          </div>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card animate-pulse space-y-3">
              <div className="h-5 skeleton rounded w-3/4" />
              <div className="h-4 skeleton rounded w-1/2" />
              <div className="h-4 skeleton rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">📚</div>
          <p className="text-cyan-400 font-medium">No courses found</p>
          <p className="text-sm text-violet-400 mt-1">Try adjusting your filters or selecting a different university</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-violet-400">
            <span className="font-semibold text-cyan-400">{pagination.total}</span> courses found
            {city && <span> in <span className="font-medium text-cyan-400">{city}</span></span>}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((c) => (
              <Link key={c.id} href={`/education/universities/${c.university.id}`} className="card-hover">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent hover:text-blue-600 transition-colors">{c.name}</h3>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${DEGREE_COLORS[c.degree] || 'bg-white/5 text-cyan-400'}`}>
                    {PROGRAM_LABELS[c.degree] || c.degree}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-violet-400">
                  <span className="font-medium">{c.university?.name}</span>
                  {c.university?.city && <><span>&middot;</span><span>{c.university.city}</span></>}
                  {c.duration && <><span>&middot;</span><span>{c.duration}</span></>}
                </div>
                {c.description && (
                  <p className="text-xs text-cyan-400 mt-2 line-clamp-2">{c.description}</p>
                )}
              </Link>
            ))}
          </div>
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button disabled={pagination.page <= 1} onClick={() => fetchCourses(pagination.page - 1)} className="btn-secondary text-sm disabled:opacity-40">Prev</button>
              <span className="text-sm text-cyan-400">Page {pagination.page} of {pagination.totalPages}</span>
              <button disabled={pagination.page >= pagination.totalPages} onClick={() => fetchCourses(pagination.page + 1)} className="btn-secondary text-sm disabled:opacity-40">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
