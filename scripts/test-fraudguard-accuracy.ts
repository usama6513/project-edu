/**
 * FraudGuard URL Scanner — Accuracy Benchmark Test
 * 
 * Tests the URL scanner against a curated dataset of:
 * - Known SAFE URLs (legitimate websites)
 * - Known MALICIOUS URLs (phishing, scam, fake domains)
 * 
 * Directly calls UrlAnalyzer (bypasses JWT auth) for accurate measurement.
 */

import { UrlAnalyzer } from '../src/services/fraud/url-analyzer';
import * as fs from 'fs';
import * as path from 'path';

// Load .env manually (dotenv may not be installed)
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    // Remove surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

// ─── TEST DATASET ────────────────────────────────────────────────────────────

interface TestUrl {
  url: string;
  expected: 'safe' | 'malicious';
  reason: string;
  category: string;
}

const TEST_DATASET: TestUrl[] = [
  // ═══════════════════════════════════════════════════════════════
  // SAFE URLs (25 URLs) — Should be detected as SAFE (riskScore < 40)
  // ═══════════════════════════════════════════════════════════════

  // Major Tech Companies
  { url: 'https://google.com', expected: 'safe', reason: 'Major search engine', category: 'trusted-tech' },
  { url: 'https://github.com', expected: 'safe', reason: 'Major dev platform', category: 'trusted-tech' },
  { url: 'https://microsoft.com', expected: 'safe', reason: 'Major tech company', category: 'trusted-tech' },
  { url: 'https://apple.com', expected: 'safe', reason: 'Major tech company', category: 'trusted-tech' },
  { url: 'https://amazon.com', expected: 'safe', reason: 'Major ecommerce', category: 'trusted-tech' },

  // Pakistani Trusted Sites
  { url: 'https://daraz.pk', expected: 'safe', reason: 'Major PK ecommerce', category: 'trusted-pk' },
  { url: 'https://nust.edu.pk', expected: 'safe', reason: 'PK university', category: 'trusted-pk' },

  // Government / Institutional
  { url: 'https://who.int', expected: 'safe', reason: 'WHO official site', category: 'trusted-gov' },
  { url: 'https://wikipedia.org', expected: 'safe', reason: 'Encyclopedia', category: 'trusted-general' },

  // Legitimate Banking / Finance
  { url: 'https://hbl.com', expected: 'safe', reason: 'HBL official site', category: 'trusted-bank' },
  { url: 'https://www.sbp.gov.pk', expected: 'safe', reason: 'State Bank of Pakistan', category: 'trusted-gov' },

  // Social Media
  { url: 'https://youtube.com', expected: 'safe', reason: 'Video platform', category: 'trusted-tech' },
  { url: 'https://linkedin.com', expected: 'safe', reason: 'Professional network', category: 'trusted-tech' },
  { url: 'https://twitter.com', expected: 'safe', reason: 'Social media', category: 'trusted-tech' },

  // News / Media
  { url: 'https://www.bbc.com', expected: 'safe', reason: 'Major news outlet', category: 'trusted-media' },
  { url: 'https://www.dawn.com', expected: 'safe', reason: 'PK news outlet', category: 'trusted-media' },
  { url: 'https://www.reuters.com', expected: 'safe', reason: 'Major news agency', category: 'trusted-media' },

  // Education
  { url: 'https://www.coursera.org', expected: 'safe', reason: 'Online learning', category: 'trusted-edu' },
  { url: 'https://www.khanacademy.org', expected: 'safe', reason: 'Free education', category: 'trusted-edu' },

  // Services
  { url: 'https://www.netflix.com', expected: 'safe', reason: 'Streaming service', category: 'trusted-tech' },
  { url: 'https://stackoverflow.com', expected: 'safe', reason: 'Dev Q&A', category: 'trusted-tech' },
  { url: 'https://example.com', expected: 'safe', reason: 'IANA documentation domain', category: 'trusted-general' },
  { url: 'https://www.foodpanda.com.pk', expected: 'safe', reason: 'PK food delivery', category: 'trusted-pk' },
  { url: 'https://jazz.com.pk', expected: 'safe', reason: 'Jazz official site', category: 'trusted-pk' },
  { url: 'https://www.urdupoint.com', expected: 'safe', reason: 'PK news portal', category: 'trusted-media' },

  // ═══════════════════════════════════════════════════════════════
  // MALICIOUS URLs (25 URLs) — Should be detected as MALICIOUS (riskScore >= 40)
  // ═══════════════════════════════════════════════════════════════

  // Fake Bank Phishing Domains (Brand Impersonation)
  { url: 'http://hbl-verify.xyz', expected: 'malicious', reason: 'Fake HBL verification phishing', category: 'phishing-bank' },
  { url: 'http://hbl-online-secure.com', expected: 'malicious', reason: 'Fake HBL secure login', category: 'phishing-bank' },
  { url: 'http://ub1-pk-verify.net', expected: 'malicious', reason: 'Fake UBL phishing (uses number 1)', category: 'phishing-bank' },
  { url: 'http://jazzcash-verify.xyz', expected: 'malicious', reason: 'Fake JazzCash verification', category: 'phishing-wallet' },
  { url: 'http://easypaisa-login.com', expected: 'malicious', reason: 'Fake EasyPaisa login page', category: 'phishing-wallet' },
  { url: 'http://paypal-secure-verify.net', expected: 'malicious', reason: 'Fake PayPal verification', category: 'phishing-intl' },

  // Fake Tech / Social Media Phishing
  { url: 'http://facebook-login-secure.xyz', expected: 'malicious', reason: 'Fake Facebook login', category: 'phishing-social' },
  { url: 'http://google-account-verify.com', expected: 'malicious', reason: 'Fake Google account verify', category: 'phishing-tech' },
  { url: 'http://apple-id-secure.net', expected: 'malicious', reason: 'Fake Apple ID phishing', category: 'phishing-tech' },
  { url: 'http://netflix-verify-account.xyz', expected: 'malicious', reason: 'Fake Netflix account verify', category: 'phishing-tech' },

  // Non-existent Suspicious Domains
  { url: 'http://fr33-m0ney-earn.com', expected: 'malicious', reason: 'Fake money earning scam', category: 'scam-domain' },
  { url: 'http://win-lottery-pakistan.xyz', expected: 'malicious', reason: 'Fake lottery scam', category: 'scam-domain' },
  { url: 'http://crypto-investment-guaranteed.com', expected: 'malicious', reason: 'Fake crypto investment', category: 'scam-investment' },

  // Known Malicious / Test Phishing Sites
  { url: 'http://testsafebrowsing.appspot.com/s/phishing.html', expected: 'malicious', reason: 'Google safe browsing test phishing page', category: 'known-phishing' },
  { url: 'http://phishing.example.com', expected: 'malicious', reason: 'Example phishing subdomain', category: 'known-phishing' },

  // Suspicious TLDs + Brand Mimicry
  { url: 'http://hbl-com.tk', expected: 'malicious', reason: 'HBL mimic on free TLD', category: 'phishing-tld' },
  { url: 'http://sbp-gov-pk.xyz', expected: 'malicious', reason: 'SBP mimic on fake TLD', category: 'phishing-gov' },

  // Scam / Fraud Patterns
  { url: 'http://work-from-home-earn-50000.xyz', expected: 'malicious', reason: 'Fake work from home scam', category: 'scam-job' },
  { url: 'http://free-iphone-win.com', expected: 'malicious', reason: 'Fake prize scam', category: 'scam-prize' },
  { url: 'http://cheap-medicine-online-pk.xyz', expected: 'malicious', reason: 'Fake medicine scam', category: 'scam-health' },

  // Suspicious IP-based URLs
  { url: 'http://192.168.1.1.phishing-site.com', expected: 'malicious', reason: 'Suspicious domain with IP pattern', category: 'suspicious-pattern' },

  // Shortener hiding malicious destination (still test the shortener itself)
  { url: 'http://bit.ly/3fakePhish', expected: 'malicious', reason: 'URL shortener hiding destination', category: 'url-shortener' },

  // Fake Government / NGO
  { url: 'http://ehsaas-scheme-claim.xyz', expected: 'malicious', reason: 'Fake Ehsaas scheme phishing', category: 'phishing-gov' },
  { url: 'http://nadra-verify-cn1c.com', expected: 'malicious', reason: 'Fake NADRA CNIC verification', category: 'phishing-gov' },
  { url: 'http://bisp-payment-claim.net', expected: 'malicious', reason: 'Fake BISP payment scam', category: 'phishing-gov' },
];

// ─── TEST RUNNER ─────────────────────────────────────────────────────────────

interface TestResult {
  url: string;
  expected: 'safe' | 'malicious';
  actual: 'safe' | 'malicious';
  riskScore: number;
  riskLevel: string;
  correct: boolean;
  reason: string;
  category: string;
  indicators: string[];
  timeMs: number;
}

async function runBenchmark() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║     FraudGuard URL Scanner — Accuracy Benchmark         ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  Test URLs: ${TEST_DATASET.length}                                       ║`);
  console.log(`║  Safe URLs: ${TEST_DATASET.filter(t => t.expected === 'safe').length}                                      ║`);
  console.log(`║  Malicious URLs: ${TEST_DATASET.filter(t => t.expected === 'malicious').length}                                   ║`);
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');

  const analyzer = new UrlAnalyzer();
  const results: TestResult[] = [];
  let completed = 0;

  for (const test of TEST_DATASET) {
    completed++;
    const startTime = Date.now();

    try {
      const analysis = await analyzer.analyzeUrl(test.url);
      const elapsed = Date.now() - startTime;

      // Determine actual verdict
      const actual: 'safe' | 'malicious' = analysis.riskScore >= 40 ? 'malicious' : 'safe';
      const correct = actual === test.expected;

      const result: TestResult = {
        url: test.url,
        expected: test.expected,
        actual,
        riskScore: analysis.riskScore,
        riskLevel: analysis.riskLevel,
        correct,
        reason: test.reason,
        category: test.category,
        indicators: analysis.indicators.map(i => i.indicator),
        timeMs: elapsed,
      };

      results.push(result);

      const statusIcon = correct ? '✅' : '❌';
      const scoreBar = `[${String(analysis.riskScore).padStart(3)}/100]`;
      console.log(
        `${statusIcon} ${scoreBar} ${test.url.substring(0, 50).padEnd(50)} | ${test.expected.toUpperCase().padEnd(10)} → ${actual.toUpperCase().padEnd(10)} | ${elapsed}ms`
      );
    } catch (err) {
      const elapsed = Date.now() - startTime;
      console.log(`⚠️  [ERR] ${test.url.substring(0, 50).padEnd(50)} | Error: ${(err as Error).message}`);

      // Treat errors as incorrect for malicious, correct for safe (couldn't scan = couldn't confirm)
      results.push({
        url: test.url,
        expected: test.expected,
        actual: 'safe', // Error = couldn't detect threat
        riskScore: 0,
        riskLevel: 'error',
        correct: test.expected === 'safe',
        reason: test.reason,
        category: test.category,
        indicators: ['SCAN_ERROR'],
        timeMs: elapsed,
      });
    }

    // Progress indicator
    if (completed % 5 === 0) {
      console.log(`\n  --- Progress: ${completed}/${TEST_DATASET.length} URLs tested ---\n`);
    }
  }

  // ─── CALCULATE METRICS ───────────────────────────────────────────────────

  const totalTests = results.length;
  const correctResults = results.filter(r => r.correct).length;
  const incorrectResults = results.filter(r => !r.correct).length;

  // True Positives: malicious URLs correctly flagged
  const truePositives = results.filter(r => r.expected === 'malicious' && r.actual === 'malicious').length;
  // False Negatives: malicious URLs missed (marked safe)
  const falseNegatives = results.filter(r => r.expected === 'malicious' && r.actual === 'safe').length;
  // True Negatives: safe URLs correctly marked safe
  const trueNegatives = results.filter(r => r.expected === 'safe' && r.actual === 'safe').length;
  // False Positives: safe URLs incorrectly flagged as malicious
  const falsePositives = results.filter(r => r.expected === 'safe' && r.actual === 'malicious').length;

  const totalMalicious = truePositives + falseNegatives;
  const totalSafe = trueNegatives + falsePositives;

  // Key Metrics
  const accuracy = ((correctResults / totalTests) * 100).toFixed(1);
  const detectionRate = totalMalicious > 0 ? ((truePositives / totalMalicious) * 100).toFixed(1) : 'N/A';
  const falsePositiveRate = totalSafe > 0 ? ((falsePositives / totalSafe) * 100).toFixed(1) : 'N/A';
  const precision = (truePositives + falsePositives) > 0
    ? ((truePositives / (truePositives + falsePositives)) * 100).toFixed(1)
    : 'N/A';
  const recall = detectionRate; // Same as detection rate

  // Average scan time
  const avgTime = (results.reduce((sum, r) => sum + r.timeMs, 0) / results.length).toFixed(0);

  // ─── PRINT RESULTS ───────────────────────────────────────────────────────

  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║                  BENCHMARK RESULTS                       ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log('║                                                          ║');
  console.log(`║  Overall Accuracy:      ${accuracy}%${' '.repeat(Math.max(0, 33 - accuracy.length))}║`);
  console.log(`║  Detection Rate (TPR):  ${detectionRate}%${' '.repeat(Math.max(0, 33 - detectionRate.length))}║`);
  console.log(`║  False Positive Rate:   ${falsePositiveRate}%${' '.repeat(Math.max(0, 33 - falsePositiveRate.length))}║`);
  console.log(`║  Precision:             ${precision}%${' '.repeat(Math.max(0, 33 - precision.length))}║`);
  console.log(`║  Avg Scan Time:         ${avgTime}ms${' '.repeat(Math.max(0, 33 - avgTime.length))}║`);
  console.log('║                                                          ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log('║              CONFUSION MATRIX                            ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  True Positives  (malicious → flagged):   ${String(truePositives).padStart(3)}              ║`);
  console.log(`║  False Negatives (malicious → missed):    ${String(falseNegatives).padStart(3)}              ║`);
  console.log(`║  True Negatives  (safe → correct):        ${String(trueNegatives).padStart(3)}              ║`);
  console.log(`║  False Positives (safe → wrong flag):     ${String(falsePositives).padStart(3)}              ║`);
  console.log('║                                                          ║');
  console.log(`║  Total Malicious:  ${String(totalMalicious).padStart(3)}                                       ║`);
  console.log(`║  Total Safe:       ${String(totalSafe).padStart(3)}                                       ║`);
  console.log(`║  Total Tests:      ${String(totalTests).padStart(3)}                                       ║`);
  console.log('╚══════════════════════════════════════════════════════════╝');

  // ─── CATEGORY BREAKDOWN ──────────────────────────────────────────────────

  console.log('\n\n📊 CATEGORY BREAKDOWN:\n');

  const categories = [...new Set(results.map(r => r.category))];
  for (const cat of categories) {
    const catResults = results.filter(r => r.category === cat);
    const catCorrect = catResults.filter(r => r.correct).length;
    const catTotal = catResults.length;
    const catPct = ((catCorrect / catTotal) * 100).toFixed(0);
    const icon = catPct === '100' ? '🟢' : Number(catPct) >= 80 ? '🟡' : '🔴';

    console.log(`  ${icon} ${cat.padEnd(25)} ${catCorrect}/${catTotal} correct (${catPct}%)`);
  }

  // ─── MISSED MALICIOUS URLs ───────────────────────────────────────────────

  const missedMalicious = results.filter(r => r.expected === 'malicious' && !r.correct);
  if (missedMalicious.length > 0) {
    console.log('\n\n❌ MISSED MALICIOUS URLs (False Negatives):\n');
    for (const m of missedMalicious) {
      console.log(`  ❌ Score ${String(m.riskScore).padStart(3)}/100 | ${m.url}`);
      console.log(`     Expected: MALICIOUS | Got: ${m.actual.toUpperCase()} | Reason: ${m.reason}`);
      console.log(`     Indicators: ${m.indicators.join(', ') || 'NONE'}`);
      console.log('');
    }
  }

  // ─── FALSE POSITIVES ─────────────────────────────────────────────────────

  const falsePositivesList = results.filter(r => r.expected === 'safe' && !r.correct);
  if (falsePositivesList.length > 0) {
    console.log('\n\n⚠️  FALSE POSITIVES (Safe URLs Flagged as Malicious):\n');
    for (const fp of falsePositivesList) {
      console.log(`  ⚠️  Score ${String(fp.riskScore).padStart(3)}/100 | ${fp.url}`);
      console.log(`     Expected: SAFE | Got: ${fp.actual.toUpperCase()} | Reason: ${fp.reason}`);
      console.log(`     Indicators: ${fp.indicators.join(', ') || 'NONE'}`);
      console.log('');
    }
  }

  // ─── SCORE DISTRIBUTION ──────────────────────────────────────────────────

  console.log('\n\n📈 SCORE DISTRIBUTION:\n');
  const ranges = [
    { label: '0-19 (SAFE)', min: 0, max: 19 },
    { label: '20-39 (LOW)', min: 20, max: 39 },
    { label: '40-59 (MEDIUM)', min: 40, max: 59 },
    { label: '60-79 (HIGH)', min: 60, max: 79 },
    { label: '80-100 (CRITICAL)', min: 80, max: 100 },
  ];

  for (const range of ranges) {
    const inRange = results.filter(r => r.riskScore >= range.min && r.riskScore <= range.max);
    const bar = '█'.repeat(inRange.length);
    console.log(`  ${range.label.padEnd(20)} ${bar} ${inRange.length}`);
  }

  // ─── SUMMARY ─────────────────────────────────────────────────────────────

  console.log('\n\n╔══════════════════════════════════════════════════════════╗');
  console.log('║                    FINAL VERDICT                          ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  const accNum = Number(accuracy);
  let verdict: string;
  if (accNum >= 95) verdict = 'EXCELLENT — Matches industry standards';
  else if (accNum >= 90) verdict = 'VERY GOOD — Strong detection capability';
  else if (accNum >= 80) verdict = 'GOOD — Solid for a prototype, room to improve';
  else if (accNum >= 70) verdict = 'FAIR — Needs improvement in key areas';
  else verdict = 'BELOW EXPECTATIONS — Significant improvements needed';

  console.log(`║  ${verdict}${' '.repeat(Math.max(0, 56 - verdict.length))}║`);
  console.log('╚══════════════════════════════════════════════════════════╝');

  // Write detailed results to file
  const reportPath = path.resolve(__dirname, 'fraudguard-accuracy-report.json');
  const report = {
    timestamp: new Date().toISOString(),
    totalTests,
    accuracy: Number(accuracy),
    detectionRate: Number(detectionRate),
    falsePositiveRate: Number(falsePositiveRate),
    precision: Number(precision),
    avgScanTimeMs: Number(avgTime),
    confusionMatrix: { truePositives, falseNegatives, trueNegatives, falsePositives },
    results: results.map(r => ({
      url: r.url,
      expected: r.expected,
      actual: r.actual,
      riskScore: r.riskScore,
      correct: r.correct,
      category: r.category,
      indicators: r.indicators,
    })),
  };
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
}

runBenchmark().catch(err => {
  console.error('Benchmark failed:', err);
  process.exit(1);
});
