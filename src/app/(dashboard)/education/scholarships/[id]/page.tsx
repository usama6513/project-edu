'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { VerificationBadge } from '@/components/ui/verification-badge';

interface ScholarshipDetail {
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
  sourceName: string | null;
  verificationStatus: string;
  requirements: { id: string; requirementType: string; requirementValue: string }[];
}

export default function ScholarshipDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [scholarship, setScholarship] = useState<ScholarshipDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiClient.get<{ data: { scholarship: ScholarshipDetail } }>(`/api/education/scholarships/${id}`)
      .then((res) => setScholarship(res.data.scholarship))
      .catch((err) => setError(err.message || 'Failed to load scholarship'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.post('/api/education/saved', { type: 'scholarship', itemId: id });
      setSaved(true);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 skeleton rounded w-1/3" />
        <div className="h-4 skeleton rounded w-2/3" />
        <div className="h-48 skeleton rounded" />
      </div>
    );
  }

  if (error || !scholarship) {
    return (
      <div className="card text-center py-12">
        <p className="text-red-600 mb-4">{error || 'Scholarship not found'}</p>
        <button onClick={() => router.back()} className="btn-secondary">Go Back</button>
      </div>
    );
  }

  const daysLeft = scholarship.deadline
    ? Math.ceil((new Date(scholarship.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const urgent = daysLeft !== null && daysLeft <= 14;

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <button onClick={() => router.back()} className="text-sm text-primary-600 hover:text-primary-700">&larr; Back</button>

      <div className="card">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-100">{scholarship.name}</h1>
            <p className="text-gray-400 mt-1">{scholarship.provider}</p>
            <p className="text-sm text-gray-500">{scholarship.country}</p>
          </div>
          <VerificationBadge status={scholarship.verificationStatus === 'verified' ? 'verified' : 'unverified'} compact />
        </div>
        {scholarship.amount && scholarship.currency && (
          <p className="text-lg font-semibold text-secondary-700 mt-3">
            {scholarship.currency} {Number(scholarship.amount).toLocaleString()}
            {scholarship.amountFrequency === 'annual' ? '/year' : scholarship.amountFrequency === 'monthly' ? '/month' : scholarship.amountFrequency === 'one_time' ? ' (one-time)' : ''}
          </p>
        )}
        {scholarship.requirements?.filter(r => r.requirementType === 'degree_level' || r.requirementType === 'program_type').length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {scholarship.requirements.filter(r => r.requirementType === 'degree_level' || r.requirementType === 'program_type').map((r) => (
              <span key={r.id} className="text-xs bg-primary-500/10 text-primary-400 px-2 py-0.5 rounded-full">{r.requirementValue}</span>
            ))}
          </div>
        )}
        {scholarship.description && (
          <p className="text-sm text-gray-400 mt-4 whitespace-pre-line">{scholarship.description}</p>
        )}
      </div>

      {scholarship.deadline && (
        <div className={`card ${urgent ? 'border-red-300 bg-red-500/10' : ''}`}>
          <h2 className="font-semibold text-gray-100 mb-2">Application Deadline</h2>
          <p className="text-sm text-gray-300">{new Date(scholarship.deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          {daysLeft !== null && (
            <p className={`text-sm font-medium mt-1 ${urgent ? 'text-red-600' : 'text-green-600'}`}>
              {daysLeft <= 0 ? 'This application deadline has passed' : urgent ? `Only ${daysLeft} days left — apply soon!` : `${daysLeft} days remaining to submit your application`}
            </p>
          )}
          {daysLeft !== null && daysLeft > 90 && (
            <p className="text-xs text-amber-600 mt-2">⚠ This is an estimated deadline based on previous years. Please verify the exact deadline with the scholarship provider.</p>
          )}
        </div>
      )}

      {scholarship.eligibilityCriteria && (
        <div className="card">
          <h2 className="font-semibold text-gray-100 mb-3">Eligibility Criteria</h2>
          <p className="text-sm text-gray-400 whitespace-pre-line">{scholarship.eligibilityCriteria}</p>
        </div>
      )}

      {scholarship.applicationProcess && (
        <div className="card">
          <h2 className="font-semibold text-gray-100 mb-3">Application Process</h2>
          <p className="text-sm text-gray-400 whitespace-pre-line">{scholarship.applicationProcess}</p>
        </div>
      )}

      {scholarship.documentsRequired && (
        <div className="card">
          <h2 className="font-semibold text-gray-100 mb-3">Documents Required</h2>
          <p className="text-sm text-gray-400 whitespace-pre-line">{scholarship.documentsRequired}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button onClick={handleSave} disabled={saving || saved} className="btn-primary">
          {saved ? 'Saved ✓' : saving ? 'Saving...' : 'Save Scholarship'}
        </button>
        {scholarship.sourceUrl && (
          <a
            href={scholarship.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
          >
            Apply Now &rarr;
          </a>
        )}
      </div>
    </div>
  );
}
