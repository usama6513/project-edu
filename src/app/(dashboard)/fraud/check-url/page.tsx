'use client';

import { useState, useCallback } from 'react';

interface DomainInfo {
  domain: string;
  https: boolean;
  redirects: boolean;
  redirectUrl?: string;
  registrar?: string;
  creationDate?: string;
}

interface Indicator {
  severity: string;
  description: string;
}

interface ContentAnalysis {
  pageTitle?: string;
  metaDescription?: string;
  hasLoginForm: boolean;
  hasPasswordFields: boolean;
  hasCreditCardFields: boolean;
  detectedBrands: string[];
  topicCategory: string;
  isParkedDomain: boolean;
  isEmptyPage: boolean;
  suspiciousScripts: number;
  externalLinks: number;
  contentSnippet?: string;
  language?: string;
}

interface ScanResult {
  riskLevel: string;
  riskScore: number;
  domainInfo?: DomainInfo;
  indicators: Indicator[];
  analysis: string;
  analysisUrdu?: string;
  analysisRomanUrdu?: string;
  actions?: string[];
  realWorldContext?: string;
  pageExists?: boolean;
  sslIssuer?: string;
  responseTime?: number;
  contentAnalysis?: ContentAnalysis;
  complaintPath?: {
    scamType: string;
    scamTypeUrdu: string;
    scamTypeRomanUrdu?: string;
    immediateActions: string[];
    immediateActionsUrdu?: string[];
    immediateActionsRomanUrdu?: string[];
    complaintContacts: { name: string; nameUrdu?: string; nameRomanUrdu?: string; phone: string; website: string; address?: string; addressUrdu?: string; addressRomanUrdu?: string; hours?: string; hoursUrdu?: string; hoursRomanUrdu?: string }[];
    requiredDocuments: string[];
    requiredDocumentsUrdu?: string[];
    requiredDocumentsRomanUrdu?: string[];
    onlineComplaintUrl: string;
    timeframe: string;
    timeframeUrdu?: string;
    timeframeRomanUrdu?: string;
    additionalTips: string[];
    additionalTipsUrdu?: string[];
    additionalTipsRomanUrdu?: string[];
    evidenceChecklist?: string[];
    evidenceChecklistUrdu?: string[];
    evidenceChecklistRomanUrdu?: string[];
    stepByStepGuide?: string[];
    stepByStepGuideUrdu?: string[];
    stepByStepGuideRomanUrdu?: string[];
  };
  ussdAnalysis?: {
    code: string;
    risk: string;
    category: string;
    description: string;
    descriptionUrdu: string;
    whatItDoes: string;
    whatItDoesUrdu: string;
    riskLevel: string;
    recommendation: string;
    recommendationUrdu: string;
  }[];
}

export default function CheckUrlPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [analysisLang, setAnalysisLang] = useState<'en' | 'ur' | 'roman'>('en');

  const getRiskColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'safe': return 'bg-green-500/10 text-green-400';
      case 'low': return 'bg-yellow-500/10 text-yellow-400';
      case 'medium': return 'bg-yellow-500/10 text-yellow-400';
      case 'high': return 'bg-orange-500/10 text-orange-400';
      case 'critical': return 'bg-red-500/10 text-red-400';
      default: return 'bg-white/5 text-gray-200';
    }
  };

  const getScoreBarColor = (score: number) => {
    if (score <= 25) return 'bg-green-500';
    if (score <= 50) return 'bg-yellow-500';
    if (score <= 75) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'low': return 'bg-yellow-400';
      case 'medium': return 'bg-orange-400';
      case 'high': return 'bg-red-500';
      case 'critical': return 'bg-red-700';
      default: return 'bg-gray-400';
    }
  };

  const handleScan = useCallback(async () => {
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Not authenticated. Please log in.');
        return;
      }

      let inputUrl = url.trim();
      if (!/^https?:\/\//i.test(inputUrl)) {
        inputUrl = 'https://' + inputUrl;
      }

      const res = await fetch('/api/fraud/scan/url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url: inputUrl }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Scan failed');
      }

      const data = await res.json();
      const payload = data.data ?? data;
      const explanationObj = payload.explanation && typeof payload.explanation === 'object' ? payload.explanation : null;
      setResult({
        riskLevel: payload.riskLevel,
        riskScore: typeof payload.riskScore === 'number' ? payload.riskScore : 0,
        domainInfo: payload.domain
          ? {
              domain: payload.domain,
              https: Boolean(payload.isHttps),
              redirects: Boolean(payload.hasRedirect),
              redirectUrl: payload.redirectUrl,
            }
          : undefined,
        indicators: Array.isArray(payload.indicators) ? payload.indicators : [],
        analysis: typeof payload.analysis === 'string' ? payload.analysis : (explanationObj?.explanation || ''),
        analysisUrdu: explanationObj?.explanationUrdu || undefined,
        analysisRomanUrdu: explanationObj?.explanationRomanUrdu || undefined,
        actions: explanationObj?.recommendedActions || [],
        realWorldContext: explanationObj?.realWorldContext || undefined,
        pageExists: payload.pageExists,
        sslIssuer: payload.sslIssuer,
        responseTime: payload.responseTime,
        contentAnalysis: payload.contentAnalysis || undefined,
        complaintPath: explanationObj?.complaintPath || undefined,
        ussdAnalysis: Array.isArray(explanationObj?.ussdAnalysis) ? explanationObj.ussdAnalysis : undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan URL');
    } finally {
      setLoading(false);
    }
  }, [url]);

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <a href="/fraud" className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 mb-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Fraud Center
        </a>
        <h1 className="text-2xl font-bold text-gray-100">Check URL</h1>
        <p className="text-gray-500 mt-1">Paste a URL to check if it is safe or potentially malicious</p>
      </div>

      <div className="card space-y-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-300 mb-1">
            Paste URL to check
          </label>
          <input
            id="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/suspicious-page"
            className="input-field"
          />
        </div>

        <button
          onClick={handleScan}
          disabled={!url.trim() || loading}
          className="btn-primary w-full"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Scanning...
            </span>
          ) : (
            'Check URL'
          )}
        </button>
      </div>

      {error && (
        <div className="card bg-red-500/10 border border-red-500/30">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {result && (
        <div className="space-y-4 animate-slide-up">
          {/* CRITICAL/HIGH RISK WARNING BANNER */}
          {(result.riskLevel === 'critical' || result.riskLevel === 'high') && (
            <div className={`rounded-2xl p-5 border-2 ${
              result.riskLevel === 'critical'
                ? 'bg-red-500/15 border-red-500/50'
                : 'bg-orange-500/15 border-orange-500/50'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{result.riskLevel === 'critical' ? '\u26D4' : '\u26A0\uFE0F'}</span>
                <div>
                  <h2 className={`text-xl font-bold ${result.riskLevel === 'critical' ? 'text-red-300' : 'text-orange-300'}`}>
                    {result.riskLevel === 'critical' ? 'DANGEROUS — Do NOT Open This URL' : 'HIGH RISK — Very Likely Unsafe'}
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    {result.riskLevel === 'critical'
                      ? 'This URL shows strong signs of fraud or phishing. Opening it could lead to identity theft, financial loss, or malware infection.'
                      : 'This URL has multiple suspicious indicators. Avoid clicking or entering any personal information.'}
                  </p>
                </div>
              </div>
              <div className="bg-black/20 rounded-xl p-4">
                <h3 className="text-sm font-bold text-white mb-2">{'\u{1F6E1}\uFE0F Immediate Protection Steps:'}</h3>
                <ol className="space-y-2">
                  <li className="flex items-start gap-2 text-sm text-gray-200">
                    <span className="text-red-400 font-bold mt-0.5">1.</span>
                    <span><strong>Do NOT click</strong> the link or open it in any browser</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-200">
                    <span className="text-red-400 font-bold mt-0.5">2.</span>
                    <span><strong>Do NOT enter</strong> any personal info, passwords, OTP, or card details</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-200">
                    <span className="text-red-400 font-bold mt-0.5">3.</span>
                    <span><strong>Block the sender</strong> on all platforms (WhatsApp, SMS, email)</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-200">
                    <span className="text-red-400 font-bold mt-0.5">4.</span>
                    <span><strong>Screenshot everything</strong> — messages, numbers, URLs for evidence</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-200">
                    <span className="text-red-400 font-bold mt-0.5">5.</span>
                    <span><strong>Report immediately</strong> — use the complaint section below to file a report</span>
                  </li>
                </ol>
              </div>
            </div>
          )}

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-100">Scan Result</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(result.riskLevel)}`}>
                {result.riskLevel?.toUpperCase()}
              </span>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-gray-400 mb-1">
                <span>Risk Score</span>
                <span className="font-medium">{result.riskScore}/100</span>
              </div>
              <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${getScoreBarColor(result.riskScore)}`}
                  style={{ width: `${result.riskScore}%` }}
                />
              </div>
            </div>

            {result.domainInfo && (
              <div className="bg-white/5 rounded-lg p-4 mb-4">
                <h3 className="text-sm font-semibold text-gray-100 mb-2">Domain Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Domain</span>
                    <p className="font-medium text-gray-100 truncate">{result.domainInfo.domain}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">HTTPS</span>
                    <p className="font-medium text-gray-100">
                      {result.domainInfo.https ? '✅ Secured' : '❌ Not Secured'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Redirects</span>
                    <p className="font-medium text-gray-100">
                      {result.domainInfo.redirects ? `Yes → ${result.domainInfo.redirectUrl || 'Unknown'}` : 'No'}
                    </p>
                  </div>
                  {result.pageExists !== undefined && (
                    <div>
                      <span className="text-gray-500">Page Exists</span>
                      <p className="font-medium text-gray-100">
                        {result.pageExists ? '✅ Yes — Page is live' : '❌ Server unreachable — domain may not exist'}
                      </p>
                    </div>
                  )}
                  {result.sslIssuer && (
                    <div>
                      <span className="text-gray-500">SSL Issuer</span>
                      <p className="font-medium text-gray-100 truncate">{result.sslIssuer}</p>
                    </div>
                  )}
                  {result.responseTime !== undefined && (
                    <div>
                      <span className="text-gray-500">Response Time</span>
                      <p className="font-medium text-gray-100">{result.responseTime}ms</p>
                    </div>
                  )}
                  {result.domainInfo.registrar && (
                    <div>
                      <span className="text-gray-500">Registrar</span>
                      <p className="font-medium text-gray-100">{result.domainInfo.registrar}</p>
                    </div>
                  )}
                  {result.domainInfo.creationDate && (
                    <div>
                      <span className="text-gray-500">Created</span>
                      <p className="font-medium text-gray-100">{result.domainInfo.creationDate}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CONTENT ANALYSIS SECTION */}
            {result.contentAnalysis && (
              <div className="bg-white/5 rounded-lg p-4 mb-4">
                <h3 className="text-sm font-semibold text-gray-100 mb-3">🔍 Page Content Analysis</h3>
                
                {/* Page Title & Topic */}
                <div className="grid grid-cols-1 gap-3 mb-4">
                  {result.contentAnalysis.pageTitle && (
                    <div>
                      <span className="text-gray-500 text-xs">Page Title</span>
                      <p className="text-sm font-medium text-gray-100 truncate">{result.contentAnalysis.pageTitle}</p>
                    </div>
                  )}
                  {result.contentAnalysis.topicCategory !== 'general' && result.contentAnalysis.topicCategory !== 'unknown' && (
                    <div>
                      <span className="text-gray-500 text-xs">Content Category</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full text-xs font-medium capitalize">
                          {result.contentAnalysis.topicCategory.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  )}
                  {result.contentAnalysis.language && (
                    <div>
                      <span className="text-gray-500 text-xs">Language</span>
                      <p className="text-sm text-gray-300 uppercase">{result.contentAnalysis.language}</p>
                    </div>
                  )}
                </div>

                {/* Security Warnings */}
                {(result.contentAnalysis.hasLoginForm || result.contentAnalysis.hasPasswordFields || result.contentAnalysis.hasCreditCardFields) && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
                    <h4 className="text-xs font-bold text-red-300 mb-2">⚠️ Data Collection Detected</h4>
                    <div className="space-y-1">
                      {result.contentAnalysis.hasLoginForm && (
                        <p className="text-xs text-red-200">• Login form detected on page</p>
                      )}
                      {result.contentAnalysis.hasPasswordFields && (
                        <p className="text-xs text-red-200">• Password input fields found</p>
                      )}
                      {result.contentAnalysis.hasCreditCardFields && (
                        <p className="text-xs text-red-200">• Credit card data collection fields detected</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Detected Brands */}
                {result.contentAnalysis.detectedBrands.length > 0 && (
                  <div className="mb-4">
                    <span className="text-gray-500 text-xs">Brands Mentioned in Content</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {result.contentAnalysis.detectedBrands.slice(0, 10).map((brand, i) => (
                        <span key={i} className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs capitalize">
                          {brand}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Technical Indicators */}
                <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                  <div>
                    <span className="text-gray-500">Suspicious Scripts</span>
                    <p className={`font-medium ${result.contentAnalysis.suspiciousScripts > 3 ? 'text-red-400' : 'text-gray-300'}`}>
                      {result.contentAnalysis.suspiciousScripts} detected
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">External Links</span>
                    <p className={`font-medium ${result.contentAnalysis.externalLinks > 20 ? 'text-orange-400' : 'text-gray-300'}`}>
                      {result.contentAnalysis.externalLinks} links
                    </p>
                  </div>
                  {result.contentAnalysis.isParkedDomain && (
                    <div>
                      <span className="text-gray-500">Parked Domain</span>
                      <p className="font-medium text-yellow-400">Yes — Domain is parked/for sale</p>
                    </div>
                  )}
                  {result.contentAnalysis.isEmptyPage && (
                    <div>
                      <span className="text-gray-500">Empty Page</span>
                      <p className="font-medium text-yellow-400">Yes — Very little content</p>
                    </div>
                  )}
                </div>

                {/* Content Snippet */}
                {result.contentAnalysis.contentSnippet && (
                  <div className="bg-black/20 rounded-lg p-3">
                    <span className="text-gray-500 text-xs">Page Content Preview</span>
                    <p className="text-xs text-gray-300 mt-1 line-clamp-3">{result.contentAnalysis.contentSnippet}</p>
                  </div>
                )}
              </div>
            )}

            {result.indicators && result.indicators.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-100 mb-2">Indicators Found</h3>
                <div className="space-y-2">
                  {result.indicators.map((ind, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${getSeverityColor(ind.severity)}`} />
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase">{ind.severity}</span>
                        <p className="text-sm text-gray-300">{ind.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.analysis && (
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-100">AI Analysis</h3>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setAnalysisLang('en')}
                      className={`text-xs px-2 py-0.5 rounded transition-colors ${analysisLang === 'en' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                      English
                    </button>
                    {result.analysisUrdu && (
                      <button
                        onClick={() => setAnalysisLang('ur')}
                        className={`text-xs px-2 py-0.5 rounded transition-colors ${analysisLang === 'ur' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
                      >
                        اردو
                      </button>
                    )}
                    {result.analysisRomanUrdu && (
                      <button
                        onClick={() => setAnalysisLang('roman')}
                        className={`text-xs px-2 py-0.5 rounded transition-colors ${analysisLang === 'roman' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
                      >
                        Roman Urdu
                      </button>
                    )}
                  </div>
                </div>
                <p className={`text-sm text-gray-400 whitespace-pre-wrap ${analysisLang === 'ur' ? 'font-nastaliq text-right leading-7' : ''}`}>
                  {analysisLang === 'en' && result.analysis}
                  {analysisLang === 'ur' && result.analysisUrdu}
                  {analysisLang === 'roman' && result.analysisRomanUrdu}
                </p>
              </div>
            )}

            {result.actions && result.actions.length > 0 && (
              <div className="mt-3">
                <h3 className="text-sm font-semibold text-gray-100 mb-2">Recommended Actions</h3>
                <ol className="list-decimal list-inside space-y-1">
                  {result.actions.map((action, i) => (
                    <li key={i} className="text-sm text-gray-300">{action}</li>
                  ))}
                </ol>
              </div>
            )}

            {result.realWorldContext && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mt-3">
                <h3 className="text-sm font-semibold text-blue-300 mb-1">Real-World Context</h3>
                <p className="text-sm text-gray-300 whitespace-pre-wrap">{result.realWorldContext}</p>
              </div>
            )}

            {result.complaintPath && result.riskScore > 30 && (
              <div className="mt-4 space-y-4">
                <div className="bg-amber-500/15 border border-amber-500/30 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-amber-300 mb-1">
                    📋 Complaint Guide: {result.complaintPath.scamType}
                  </h3>
                  <p className="text-xs text-amber-300 mb-1">اردو: {result.complaintPath.scamTypeUrdu}</p>
                  {result.complaintPath.scamTypeRomanUrdu && (
                    <p className="text-xs text-amber-300/80 mb-3 italic">Roman Urdu: {result.complaintPath.scamTypeRomanUrdu}</p>
                  )}

                  {result.complaintPath.stepByStepGuide && result.complaintPath.stepByStepGuide.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs font-semibold text-green-300 mb-2">📝 Step-by-Step Complaint Guide:</h4>
                      <ol className="list-decimal list-inside space-y-1">
                        {result.complaintPath.stepByStepGuide.map((step, i) => (
                          <li key={i} className="text-xs text-gray-300">{step}</li>
                        ))}
                      </ol>
                      {result.complaintPath.stepByStepGuideRomanUrdu && result.complaintPath.stepByStepGuideRomanUrdu.length > 0 && (
                        <div className="mt-2 bg-green-500/5 border border-green-500/20 rounded-lg p-2">
                          <p className="text-xs font-semibold text-green-300 mb-1">Roman Urdu:</p>
                          <ol className="list-decimal list-inside space-y-0.5">
                            {result.complaintPath.stepByStepGuideRomanUrdu.map((step, i) => (
                              <li key={i} className="text-xs text-gray-200">{step}</li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mb-3">
                    <h4 className="text-xs font-semibold text-amber-300 mb-1">⚡ Immediate Actions:</h4>
                    <ol className="list-decimal list-inside space-y-1">
                      {result.complaintPath.immediateActions.map((action, i) => (
                        <li key={i} className="text-xs text-gray-300">{action}</li>
                      ))}
                    </ol>
                    {result.complaintPath.immediateActionsRomanUrdu && result.complaintPath.immediateActionsRomanUrdu.length > 0 && (
                      <div className="mt-2 bg-amber-500/5 border border-amber-500/10 rounded-lg p-2">
                        <p className="text-xs font-semibold text-amber-300 mb-1">Roman Urdu:</p>
                        <ol className="list-decimal list-inside space-y-0.5">
                          {result.complaintPath.immediateActionsRomanUrdu.map((action, i) => (
                            <li key={i} className="text-xs text-gray-200">{action}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <h4 className="text-xs font-semibold text-amber-300 mb-1">🏛️ Where to Complain / شکایت کہاں کریں:</h4>
                    <div className="space-y-2">
                      {result.complaintPath.complaintContacts.map((contact, i) => (
                        <div key={i} className="bg-white/5 rounded-lg p-3 border border-amber-500/20">
                          <p className="text-xs font-semibold text-gray-100">{contact.name}</p>
                          {contact.nameUrdu && <p className="text-xs text-gray-300" dir="rtl">{contact.nameUrdu}</p>}
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                            <p className="text-xs text-gray-400">📞 <span className="text-white font-medium">{contact.phone}</span></p>
                            {contact.website && contact.website.startsWith('http') ? (
                              <a href={contact.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 hover:underline">
                                🌐 {contact.website.replace('https://', '').replace(/\/$/, '')} ↗
                              </a>
                            ) : contact.website ? (
                              <span className="text-xs text-gray-400">🌐 {contact.website}</span>
                            ) : null}
                          </div>
                          {contact.address && <p className="text-xs text-gray-500 mt-1">📍 {contact.address}</p>}
                          {contact.hours && <p className="text-xs text-gray-500 mt-0.5">⏰ {contact.hours}</p>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {result.complaintPath.evidenceChecklist && result.complaintPath.evidenceChecklist.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-xs font-semibold text-cyan-300 mb-2">🔐 Evidence Checklist / ثبوت کی فہرست:</h4>
                      <ul className="space-y-1">
                        {result.complaintPath.evidenceChecklist.map((item, i) => (
                          <li key={i} className="text-xs text-gray-300 flex items-start gap-1">
                            <span className="mt-0.5 text-cyan-400">☐</span> {item}
                          </li>
                        ))}
                      </ul>
                      {result.complaintPath.evidenceChecklistRomanUrdu && result.complaintPath.evidenceChecklistRomanUrdu.length > 0 && (
                        <div className="mt-2 bg-cyan-500/5 border border-cyan-500/10 rounded-lg p-2">
                          <p className="text-xs font-semibold text-cyan-300 mb-1">Roman Urdu:</p>
                          <ul className="space-y-0.5">
                            {result.complaintPath.evidenceChecklistRomanUrdu.map((item, i) => (
                              <li key={i} className="text-xs text-gray-200 flex items-start gap-1">
                                <span className="mt-0.5 text-cyan-300">☐</span> {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mb-3">
                    <h4 className="text-xs font-semibold text-amber-300 mb-1">📄 Required Documents / ضروری دستاویزات:</h4>
                    <ul className="space-y-1">
                      {result.complaintPath.requiredDocuments.map((doc, i) => (
                        <li key={i} className="text-xs text-gray-300 flex items-start gap-1">
                          <span className="mt-0.5">•</span> {doc}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 mb-3">
                    <p className="text-xs font-semibold text-amber-300">⏱ Timeframe: {result.complaintPath.timeframe}</p>
                    {result.complaintPath.timeframeRomanUrdu && (
                      <p className="text-xs text-amber-300/80 mt-1 italic">Roman Urdu: {result.complaintPath.timeframeRomanUrdu}</p>
                    )}
                  </div>

                  <div className="mb-3">
                    <h4 className="text-xs font-semibold text-amber-300 mb-1">💡 Tips:</h4>
                    <ul className="space-y-1">
                      {result.complaintPath.additionalTips.map((tip, i) => (
                        <li key={i} className="text-xs text-gray-300 flex items-start gap-1">
                          <span className="text-green-400 mt-0.5">✓</span> {tip}
                        </li>
                      ))}
                    </ul>
                    {result.complaintPath.additionalTipsRomanUrdu && result.complaintPath.additionalTipsRomanUrdu.length > 0 && (
                      <div className="mt-2 bg-amber-500/5 border border-amber-500/10 rounded-lg p-2">
                        <p className="text-xs font-semibold text-amber-300 mb-1">Roman Urdu:</p>
                        <ul className="space-y-0.5">
                          {result.complaintPath.additionalTipsRomanUrdu.map((tip, i) => (
                            <li key={i} className="text-xs text-gray-200 flex items-start gap-1">
                              <span className="text-green-300 mt-0.5">✓</span> {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <a
                    href={result.complaintPath.onlineComplaintUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block w-full text-center bg-amber-500 text-black text-xs font-semibold py-2.5 px-4 rounded-lg hover:bg-amber-400 transition-colors"
                  >
                    File Complaint Online / آن لائن شکایت درج کریں →
                  </a>
                </div>
              </div>
            )}

            {result.ussdAnalysis && result.ussdAnalysis.length > 0 && result.ussdAnalysis.some((u) => u.risk !== 'safe') && (
              <div className="mt-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-100">USSD Code Analysis</h3>
                {result.ussdAnalysis.filter((u) => u.risk !== 'safe').map((ussd, i) => {
                  const colorMap: Record<string, { bg: string; border: string; badge: string; badgeText: string }> = {
                    critical: { bg: 'bg-red-500/10', border: 'border-red-500/30', badge: 'bg-red-500/20', badgeText: 'text-red-300' },
                    dangerous: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', badge: 'bg-orange-500/20', badgeText: 'text-orange-300' },
                    warning: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', badge: 'bg-yellow-500/20', badgeText: 'text-yellow-300' },
                  };
                  const c = colorMap[ussd.risk] || colorMap.warning;
                  return (
                    <div key={i} className={`${c.bg} border ${c.border} rounded-lg p-3`}>
                      <div className="flex items-center justify-between mb-2">
                        <code className="text-sm font-bold text-gray-100 bg-white/5 px-2 py-0.5 rounded">{ussd.code}</code>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.badge} ${c.badgeText} uppercase`}>
                          {ussd.risk}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-gray-200 mb-1">{ussd.category}: {ussd.description}</p>
                      <p className="text-xs text-gray-300 mb-2">{ussd.whatItDoes}</p>
                      <div className={`${c.badge} rounded px-2 py-1 mb-1`}>
                        <p className="text-xs font-semibold text-gray-100">{ussd.riskLevel}</p>
                      </div>
                      <p className="text-xs text-gray-300"><span className="font-semibold">Action:</span> {ussd.recommendation}</p>
                      <p className="text-xs text-gray-500 mt-1" dir="rtl">{ussd.descriptionUrdu}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            {feedbackGiven ? (
              <p className="text-sm text-gray-500">Thank you for your feedback</p>
            ) : (
              <button
                onClick={() => setFeedbackGiven(true)}
                className="btn-secondary text-sm"
              >
                Report this as incorrect
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
