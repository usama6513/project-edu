import { classifyWithAI } from './ai-fraud-classifier';

export interface UrlIndicator {
  indicator: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence?: string;
}

export interface ContentAnalysis {
  pageTitle?: string;
  metaDescription?: string;
  hasLoginForm: boolean;
  hasPasswordFields: boolean;
  hasCreditCardFields: boolean;
  detectedBrands: string[];
  socialMediaBrands: string[];
  topicCategory: string;
  isParkedDomain: boolean;
  isEmptyPage: boolean;
  suspiciousScripts: number;
  externalLinks: number;
  formActionExternal: boolean;
  contentSnippet?: string;
  language?: string;
}

export interface UrlAnalysisResult {
  url: string;
  domain: string;
  subdomain: string;
  tld: string;
  isHttps: boolean;
  hasRedirect: boolean;
  redirectUrl?: string;
  indicators: UrlIndicator[];
  riskScore: number;
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  analysis: string;
  analysisUrdu?: string;
  analysisRomanUrdu?: string;
  contentAnalysis?: ContentAnalysis;
  pageExists: boolean;
  sslIssuer?: string;
  responseTime?: number;
}

const BLOCKED_HOSTNAMES = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '[::1]',
  'metadata.google.internal',
  '169.254.169.254',
];

// Well-known domains that are always safe — skip full analysis, return score=0 instantly.
// This avoids false positives from minor indicators (redirects, SSL checks, etc.) on trusted sites.
const TRUSTED_DOMAINS = [
  // Search engines
  'google.com', 'google.co.uk', 'google.com.pk', 'bing.com', 'duckduckgo.com', 'yahoo.com',
  // Developer platforms
  'github.com', 'gitlab.com', 'bitbucket.org', 'stackoverflow.com', 'stackexchange.com',
  'developer.mozilla.org', 'npmjs.com', 'pypi.org', 'docker.com',
  // Professional / social
  'linkedin.com', 'twitter.com', 'x.com', 'facebook.com', 'instagram.com', 'reddit.com',
  // Tech giants
  'apple.com', 'microsoft.com', 'amazon.com', 'amazon.co.uk', 'netflix.com', 'youtube.com',
  'wikipedia.org', 'wordpress.com', 'medium.com',
  // Pakistan-specific trusted domains
  'paklawsite.com', 'pakistanlawsite.com',
  'nust.edu.pk', 'lums.edu.pk', 'uet.edu.pk', 'pu.edu.pk', 'iub.edu.pk', 'fast.edu.pk',
  'hec.gov.pk', 'sbp.gov.pk', 'fbr.gov.pk', 'nadra.gov.pk', 'psx.com.pk',
  'jazz.com.pk', 'zong4g.com', 'telenor.com.pk', 'ufone.com',
  'hbl.com', 'ubl.com.pk', 'mcbbank.com', 'mezanbank.com', 'alliedbank.com',
  'daraz.pk', 'foodpanda.com.pk', 'careem.com',
  // Government / international orgs
  'gov.pk', 'who.int', 'un.org', 'imf.org', 'worldbank.org',
];

function isTrustedDomain(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^www\./, '');
  return TRUSTED_DOMAINS.some(td => h === td || h.endsWith('.' + td));
}

export class UrlAnalyzer {
  async analyzeUrl(url: string): Promise<UrlAnalysisResult> {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return {
        url,
        domain: '',
        subdomain: '',
        tld: '',
        isHttps: false,
        hasRedirect: false,
        indicators: [
          {
            indicator: 'INVALID_URL',
            severity: 'high',
            description: 'URL is malformed and could not be parsed',
          },
        ],
        riskScore: 40,
        riskLevel: 'high',
        analysis: 'URL could not be parsed as a valid URL',
        pageExists: false,
      };
    }

    const { domain, subdomain, tld } = this.parseUrl(url);
    const isHttps = parsed.protocol === 'https:';
    const hostname = parsed.hostname.toLowerCase();

    // ── TRUSTED DOMAIN FAST-PATH ──
    // Well-known safe domains (google.com, github.com, etc.) get score=0 instantly.
    // Avoids false positives from minor indicators like redirects or SSL checks.
    if (isTrustedDomain(hostname)) {
      return {
        url,
        domain,
        subdomain,
        tld,
        isHttps,
        hasRedirect: false,
        indicators: [],
        riskScore: 0,
        riskLevel: 'safe',
        analysis: `"${hostname}" is a well-known trusted domain. No threats detected.`,
        contentAnalysis: undefined,
        pageExists: true,
        sslIssuer: undefined,
        responseTime: undefined,
      };
    }

    const indicators: UrlIndicator[] = [];

    // NOTE: HTTPS is NOT a safety signal — most phishing sites now use free SSL (Let's Encrypt)
    // HTTPS only means the connection is encrypted, NOT that the site is legitimate
    // We track isHttps for reporting but do NOT adjust risk score based on it

    const shortenerIndicator = this.checkUrlShortener(url);
    if (shortenerIndicator) {
      indicators.push(shortenerIndicator);
    }

    for (const blocked of BLOCKED_HOSTNAMES) {
      if (hostname === blocked || hostname.includes(blocked)) {
        indicators.push({
          indicator: 'BLOCKED_HOST',
          severity: 'critical',
          description: 'URL targets a blocked internal or restricted host',
          evidence: `Hostname "${hostname}" matches blocked entry "${blocked}"`,
        });
      }
    }

    const hasIpPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname);
    if (hasIpPattern) {
      indicators.push({
        indicator: 'IP_ADDRESS_URL',
        severity: 'high',
        description: 'URL uses an IP address instead of a domain name',
        evidence: `IP address: ${hostname}`,
      });
    }

    const port = parsed.port;
    if (port && !['443', '80', ''].includes(port)) {
      indicators.push({
        indicator: 'UNUSUAL_PORT',
        severity: 'medium',
        description: 'URL uses a non-standard port',
        evidence: `Port: ${port}`,
      });
    }

    const pathHasAt = parsed.pathname.includes('@');
    if (pathHasAt) {
      indicators.push({
        indicator: 'OBfuscated_URL',
        severity: 'high',
        description: 'URL contains @ symbol which may be used to obfuscate the actual destination',
        evidence: `Path contains @: ${parsed.pathname}`,
      });
    }

    let hasRedirect = false;
    let redirectUrl: string | undefined;
    try {
      const redirectResult = await this.checkRedirects(url);
      hasRedirect = redirectResult.hasRedirect;
      redirectUrl = redirectResult.redirectUrl;
      if (hasRedirect && redirectUrl) {
        indicators.push({
          indicator: 'URL_REDIRECT',
          severity: 'medium',
          description: 'URL redirects to another location',
          evidence: `Redirects to: ${redirectUrl}`,
        });
      }
    } catch {
      hasRedirect = false;
    }

    try {
      const dnsIndicator = await this.checkDnsResolution(hostname);
      if (dnsIndicator) indicators.push(dnsIndicator);
    } catch { /* skip */ }

    if (isHttps) {
      try {
        const sslIndicator = await this.checkSslCertificate(hostname);
        if (sslIndicator) indicators.push(sslIndicator);
      } catch { /* skip */ }
    }

    try {
      const ageIndicator = await this.checkDomainAge(hostname);
      if (ageIndicator) indicators.push(ageIndicator);
    } catch { /* skip */ }

    // HTTP Reachability Check - verify domain actually responds
    try {
      const reachIndicator = await this.checkHttpReachability(url, hostname);
      if (reachIndicator) indicators.push(reachIndicator);
    } catch { /* skip */ }

    // CONTENT ANALYSIS - Fetch and analyze actual page content
    let contentAnalysis: ContentAnalysis | undefined;
    let pageExists = false;
    let responseTime: number | undefined;
    let sslIssuer: string | undefined;

    try {
      const contentResult = await this.fetchAndAnalyzeContent(url, hostname, domain);
      contentAnalysis = contentResult.contentAnalysis;
      pageExists = contentResult.pageExists;
      responseTime = contentResult.responseTime;
      sslIssuer = contentResult.sslIssuer;

      // Add content-based indicators
      indicators.push(...contentResult.indicators);
    } catch { /* skip */ }

    // THREAT INTELLIGENCE APIs - Check against external threat databases
    // These are optional and require API keys to be configured
    
    // Google Safe Browsing API
    try {
      const gsbIndicator = await this.checkGoogleSafeBrowsing(url);
      if (gsbIndicator) indicators.push(gsbIndicator);
    } catch { /* skip */ }

    // PhishTank API
    try {
      const phishTankIndicator = await this.checkPhishTank(url);
      if (phishTankIndicator) indicators.push(phishTankIndicator);
    } catch { /* skip */ }

    // VirusTotal API
    try {
      const vtIndicator = await this.checkVirusTotal(url);
      if (vtIndicator) indicators.push(vtIndicator);
    } catch { /* skip */ }

    // URLhaus API (free, no API key needed)
    try {
      const urlhausIndicator = await this.checkUrlhaus(url);
      if (urlhausIndicator) indicators.push(urlhausIndicator);
    } catch { /* skip */ }

    // AI CLASSIFICATION — AI is the sole judge for scam determination
    let riskScore: number;
    let riskLevel: UrlAnalysisResult['riskLevel'];
    let analysis: string;

    const evidence: Record<string, unknown> = {
      url, domain, subdomain, tld, isHttps, hasRedirect,
      pageExists, responseTime,
    };
    if (redirectUrl) evidence.redirectUrl = redirectUrl;
    if (sslIssuer) evidence.sslIssuer = sslIssuer;
    if (contentAnalysis) evidence.contentAnalysis = contentAnalysis;

    const aiVerdict = await classifyWithAI({
      contentType: 'url',
      content: url,
      evidence,
    });

    // Map AI verdict indicators to UrlIndicator format
    const aiIndicators: UrlIndicator[] = aiVerdict.indicators.map(ind => ({
      indicator: ind.type,
      severity: ind.severity,
      description: ind.description,
      evidence: ind.evidence,
    }));
    indicators.push(...aiIndicators);

    riskScore = aiVerdict.riskScore;
    riskLevel = aiVerdict.riskLevel;
    analysis = aiVerdict.explanation || `URL analyzed with ${indicators.length} indicator(s). Risk level: ${riskLevel}`;
    const analysisUrdu = aiVerdict.explanationUrdu || undefined;
    const analysisRomanUrdu = aiVerdict.explanationRomanUrdu || undefined;

    // DETERMINISTIC RISK FLOOR — hard evidence overrides AI leniency
    // AI can be too forgiving when page is empty, but DNS failure + brand lookalike = definite threat
    const { floorScore, floorLevel, floorReason } = this.calculateRiskFloor(indicators, domain);
    if (floorScore > riskScore) {
      riskScore = floorScore;
      riskLevel = floorLevel;
      analysis = `${analysis} [Risk floor applied: ${floorReason}]`;
    }

    return {
      url,
      domain,
      subdomain,
      tld,
      isHttps,
      hasRedirect,
      redirectUrl,
      indicators,
      riskScore,
      riskLevel,
      analysis,
      analysisUrdu,
      analysisRomanUrdu,
      contentAnalysis,
      pageExists,
      sslIssuer,
      responseTime,
    };
  }

  parseUrl(url: string): { domain: string; subdomain: string; tld: string } {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return { domain: '', subdomain: '', tld: '' };
    }

    const hostname = parsed.hostname.toLowerCase();
    const parts = hostname.split('.');

    if (parts.length < 2) {
      return { domain: hostname, subdomain: '', tld: '' };
    }

    const tld = parts[parts.length - 1];
    const domain = parts[parts.length - 2];
    const subdomainParts = parts.slice(0, parts.length - 2);
    const subdomain = subdomainParts.join('.');

    return { domain, subdomain, tld };
  }

  // checkLookalikeDomain — REMOVED: AI classifies domain reputation from evidence

  checkUrlShortener(url: string): UrlIndicator | null {
    const SHORTENER_DOMAINS = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'is.gd', 'buff.ly', 'ow.ly', 'rb.gy', 'cutt.ly', 'shorturl.at'];
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return null;
    }

    const hostname = parsed.hostname.toLowerCase();
    const isShortener = SHORTENER_DOMAINS.some(
      (shortener: string) => hostname === shortener || hostname.endsWith('.' + shortener)
    );

    if (isShortener) {
      return {
        indicator: 'URL_SHORTENER',
        severity: 'medium',
        description: 'URL uses a URL shortening service which hides the true destination',
        evidence: `Shortener domain: ${hostname}`,
      };
    }

    return null;
  }

  // checkScamKeywords — REMOVED: AI classifies URL content from evidence

  // checkSuspiciousTld — REMOVED: AI classifies TLD risk from evidence

  calculateRiskScore(indicators: UrlIndicator[]): number {
    let score = 0;
    let criticalContentThreats = 0;

    for (const indicator of indicators) {
      switch (indicator.severity) {
        case 'critical':
          score += 35;
          // Track content-based critical threats separately
          if (
            indicator.indicator === 'PHISHING_LOGIN_FORM' ||
            indicator.indicator === 'CARD_DATA_COLLECTION' ||
            indicator.indicator === 'SCAM_CONTENT_PATTERN' ||
            indicator.indicator === 'BRAND_IMPERSONATION_CONTENT' ||
            indicator.indicator === 'GOOGLE_SAFE_BROWSING_THREAT' ||
            indicator.indicator === 'PHISHTANK_PHISHING' ||
            indicator.indicator === 'VIRUSTOTAL_THREAT' ||
            indicator.indicator === 'URLHAUS_MALICIOUS'
          ) {
            criticalContentThreats++;
          }
          break;
        case 'high':
          score += 18;
          break;
        case 'medium':
          score += 8;
          break;
        case 'low':
          score += 3;
          break;
      }
    }

    // CRITICAL OVERRIDE: If 2+ critical content/external threats found,
    // force score into critical range regardless of other indicators
    // This ensures phishing pages are ALWAYS flagged even with HTTPS
    if (criticalContentThreats >= 2) {
      return Math.max(score, 75);
    }
    if (criticalContentThreats >= 1) {
      return Math.max(score, 60);
    }

    return Math.min(score, 100);
  }

  async checkRedirects(
    url: string
  ): Promise<{ hasRedirect: boolean; redirectUrl?: string }> {
    let currentUrl = url;
    const maxRedirects = 5;

    for (let i = 0; i < maxRedirects; i++) {
      try {
        const response = await fetch(currentUrl, {
          method: 'HEAD',
          redirect: 'manual',
          signal: AbortSignal.timeout(5000),
        });

        const location = response.headers.get('Location');
        if (location && (response.status >= 300 && response.status < 400)) {
          let redirectUrl: string;
          try {
            redirectUrl = new URL(location, currentUrl).href;
          } catch {
            return { hasRedirect: true, redirectUrl: location };
          }

          if (redirectUrl !== url) {
            return { hasRedirect: true, redirectUrl };
          }

          currentUrl = redirectUrl;
        } else {
          break;
        }
      } catch {
        break;
      }
    }

    return { hasRedirect: false };
  }

  private async checkDnsResolution(hostname: string): Promise<UrlIndicator | null> {
    try {
      const ipRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
      if (ipRegex.test(hostname)) return null;

      // Use Node.js dns module instead of nslookup (works on Vercel)
      const dns = await import('dns');
      const { promisify } = await import('util');
      const resolveAsync = promisify(dns.resolve);

      // Check A records (IPv4)
      let aRecords: string[] = [];
      try {
        aRecords = await resolveAsync(hostname, 'A');
      } catch (e: any) {
        // Continue to check other records
      }

      // Check AAAA records (IPv6)
      let aaaaRecords: string[] = [];
      try {
        aaaaRecords = await resolveAsync(hostname, 'AAAA');
      } catch (e: any) {
        // IPv6 not always available
      }

      // Check MX records (Mail Exchange) - for future use
      try {
        await resolveAsync(hostname, 'MX');
      } catch (e: any) {
        // MX records optional
      }

      // Check NS records (Name Servers)
      let nsRecords: string[] = [];
      try {
        nsRecords = await resolveAsync(hostname, 'NS');
      } catch (e: any) {
        // NS records optional
      }

      // If no A or AAAA records, domain doesn't exist
      if ((!aRecords || aRecords.length === 0) && (!aaaaRecords || aaaaRecords.length === 0)) {
        return {
          indicator: 'DOMAIN_NOT_FOUND',
          severity: 'critical',
          description: 'Domain does not exist — no DNS records found',
          evidence: `DNS lookup for "${hostname}" returned no A or AAAA records`,
        };
      }

      // If no NS records, suspicious
      if (!nsRecords || nsRecords.length === 0) {
        return {
          indicator: 'DNS_NO_NS_RECORDS',
          severity: 'medium',
          description: 'Domain has no name servers — may be newly registered',
          evidence: `No NS records found for "${hostname}"`,
        };
      }

      // No indicator if DNS is healthy
      return null;
    } catch (error: any) {
      const code = error?.code || '';
      if (code === 'ENOTFOUND' || code === 'ENODATA') {
        return {
          indicator: 'DOMAIN_NOT_FOUND',
          severity: 'critical',
          description: 'Domain does not exist — DNS lookup failed',
          evidence: `DNS lookup for "${hostname}" failed: ${code}`,
        };
      }
      return {
        indicator: 'DNS_ERROR',
        severity: 'medium',
        description: 'DNS lookup encountered an error',
        evidence: `DNS error: ${code || error?.message || 'Unknown error'}`,
      };
    }
  }

  private async checkSslCertificate(hostname: string): Promise<UrlIndicator | null> {
    try {
      const tls = await import('tls');

      return await new Promise((resolve) => {
        const socket = tls.connect({
          host: hostname,
          port: 443,
          servername: hostname,
          rejectUnauthorized: false,
          timeout: 5000,
        }, () => {
          const cert = socket.getPeerCertificate();
          socket.destroy();

          if (!cert || !cert.valid_from) {
            resolve({
              indicator: 'SSL_NO_CERTIFICATE',
              severity: 'high',
              description: 'HTTPS connection succeeded but no SSL certificate was provided',
              evidence: `No certificate received from ${hostname}`,
            });
            return;
          }

          const validTo = new Date(cert.valid_to);
          const now = new Date();
          const daysUntilExpiry = Math.floor((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          const isSelfSigned = cert.issuer?.CN === cert.subject?.CN;
          if (isSelfSigned) {
            resolve({
              indicator: 'SSL_SELF_SIGNED',
              severity: 'high',
              description: 'SSL certificate is self-signed — not trusted by certificate authorities',
              evidence: `Certificate: ${cert.subject?.CN || 'unknown'}`,
            });
            return;
          }

          if (daysUntilExpiry < 7 && daysUntilExpiry > 0) {
            resolve({
              indicator: 'SSL_EXPIRING',
              severity: 'medium',
              description: `SSL certificate expires in ${daysUntilExpiry} days`,
              evidence: `Expires: ${cert.valid_to}`,
            });
            return;
          }

          if (daysUntilExpiry <= 0) {
            resolve({
              indicator: 'SSL_EXPIRED',
              severity: 'high',
              description: 'SSL certificate has expired',
              evidence: `Expired on: ${cert.valid_to}`,
            });
            return;
          }

          // Check hostname mismatch (certificate issued for different domain)
          const certSubject = cert.subject?.CN || '';
          const certAltNames = cert.subjectaltname || '';
          
          // Check if hostname matches certificate subject or alternative names
          const hostnameMatches = 
            certSubject === hostname ||
            certSubject === `*.${hostname.split('.').slice(-2).join('.')}` || // Wildcard match
            certAltNames.includes(hostname) ||
            certAltNames.includes(`*.${hostname.split('.').slice(-2).join('.')}`);

          if (!hostnameMatches && certSubject && certSubject !== hostname) {
            resolve({
              indicator: 'SSL_HOSTNAME_MISMATCH',
              severity: 'high',
              description: 'SSL certificate is issued for a different domain',
              evidence: `Certificate issued for "${certSubject}" but accessed via "${hostname}"`,
            });
            return;
          }

          resolve(null);
        });

        socket.on('error', (err) => {
          resolve({
            indicator: 'SSL_CONNECTION_FAILED',
            severity: 'high',
            description: 'SSL/TLS connection failed — certificate may be invalid or missing',
            evidence: `Connection error: ${err.message || 'unknown error'}`,
          });
        });

        socket.on('timeout', () => {
          socket.destroy();
          resolve({
            indicator: 'SSL_TIMEOUT',
            severity: 'medium',
            description: 'SSL certificate check timed out — server may be unreachable',
            evidence: `Connection to ${hostname}:443 timed out`,
          });
        });
      });
    } catch {
      return null;
    }
  }

  private async checkDomainAge(hostname: string): Promise<UrlIndicator | null> {
    try {
      const ipRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
      if (ipRegex.test(hostname)) return null;

      // Try multiple RDAP endpoints for different TLDs
      const tld = hostname.split('.').pop()?.toLowerCase();
      const rdapEndpoints: Record<string, string> = {
        'com': 'https://rdap.verisign.com/com/v1/domain/',
        'net': 'https://rdap.verisign.com/net/v1/domain/',
        'org': 'https://rdap.publicinterestregistry.org/rdap/domain/',
        'info': 'https://rdap.afilias.net/rdap/info/domain/',
        'xyz': 'https://rdap.centralnic.com/rdap/domain/',
        'online': 'https://rdap.nic.online/rdap/domain/',
      };

      const baseUrl = rdapEndpoints[tld || ''] || `https://rdap.org/domain/`;
      const resp = await fetch(`${baseUrl}${hostname}`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!resp.ok) return null;

      const data = await resp.json() as { events?: Array<{ eventAction: string; eventDate: string }> };
      const creationEvent = data.events?.find((e) => e.eventAction === 'registration');
      if (!creationEvent) return null;

      const created = new Date(creationEvent.eventDate);
      const now = new Date();
      const ageInDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));

      if (ageInDays < 30) {
        return {
          indicator: 'DOMAIN_NEW',
          severity: 'critical',
          description: `Domain is only ${ageInDays} days old — newly registered domains are high risk`,
          evidence: `Registered: ${creationEvent.eventDate}`,
        };
      }

      if (ageInDays < 180) {
        return {
          indicator: 'DOMAIN_YOUNG',
          severity: 'high',
          description: `Domain is ${Math.floor(ageInDays / 30)} months old — young domains are higher risk`,
          evidence: `Registered: ${creationEvent.eventDate}`,
        };
      }

      return null;
    } catch {
      return null;
    }
  }

  private async checkHttpReachability(url: string, hostname: string): Promise<UrlIndicator | null> {
    try {
      const ipRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
      if (ipRegex.test(hostname)) return null;

      // Try to fetch the URL with a short timeout
      const response = await fetch(url, {
        method: 'HEAD',
        redirect: 'follow',
        signal: AbortSignal.timeout(8000),
      });

      // If we get any response (even 403/404), the domain exists
      if (response.status > 0) {
        return null;
      }

      return null;
    } catch (error: any) {
      const errorMsg = error?.message || '';
      
      // DNS failure = domain doesn't exist
      if (errorMsg.includes('ENOTFOUND') || errorMsg.includes('getaddrinfo')) {
        return {
          indicator: 'DOMAIN_UNREACHABLE',
          severity: 'critical',
          description: 'Domain does not exist or has no web server — cannot be reached',
          evidence: `HTTP request to "${hostname}" failed: domain not found in DNS`,
        };
      }

      // Connection refused/timeout = server down or blocked
      if (errorMsg.includes('ECONNREFUSED') || errorMsg.includes('ETIMEDOUT') || errorMsg.includes('ECONNRESET')) {
        return {
          indicator: 'SERVER_UNREACHABLE',
          severity: 'high',
          description: 'Web server is unreachable — may be down, misconfigured, or blocking requests',
          evidence: `HTTP request to "${hostname}" failed: ${errorMsg}`,
        };
      }

      // Other errors
      return {
        indicator: 'HTTP_ERROR',
        severity: 'medium',
        description: 'Could not verify if domain is reachable',
        evidence: `HTTP check failed: ${errorMsg}`,
      };
    }
  }

  // ==================== CONTENT ANALYSIS ====================

  private async fetchAndAnalyzeContent(
    url: string,
    hostname: string,
    domain: string
  ): Promise<{
    contentAnalysis: ContentAnalysis;
    pageExists: boolean;
    responseTime?: number;
    sslIssuer?: string;
    indicators: UrlIndicator[];
  }> {
    const indicators: UrlIndicator[] = [];
    const startTime = Date.now();

    // Fetch the actual page content
    let html = '';
    let pageExists = false;
    let responseTime: number | undefined;
    let sslIssuer: string | undefined;
    let finalUrl: string = url;

    try {
      const response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: AbortSignal.timeout(12000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
      });

      responseTime = Date.now() - startTime;
      pageExists = response.ok || [301, 302, 303, 307, 308].includes(response.status);
      finalUrl = response.url || url;

      // Extract SSL issuer from response headers if available
      const sslHeader = response.headers.get('x-ssl-cert-issuer');
      if (sslHeader) sslIssuer = sslHeader;

      if (response.ok) {
        const text = await response.text();
        // Limit to first 100KB for analysis
        html = text.substring(0, 100000);
      }
    } catch (error: any) {
      const errorMsg = error?.message || '';

      // DNS failure = domain truly doesn't exist — only then use PAGE_NOT_FOUND
      if (errorMsg.includes('ENOTFOUND') || errorMsg.includes('getaddrinfo')) {
        indicators.push({
          indicator: 'PAGE_NOT_FOUND',
          severity: 'critical',
          description: 'Domain does not exist in DNS — no web server at this address',
          evidence: `DNS lookup for "${hostname}" failed: domain not found`,
        });
      } else if (errorMsg.includes('ECONNREFUSED') || errorMsg.includes('ECONNRESET')) {
        // Connection refused/reset ≠ page not found. Server may be blocking non-browser requests.
        indicators.push({
          indicator: 'SERVER_BLOCKING',
          severity: 'low',
          description: 'Server is blocking automated requests — page may still exist',
          evidence: `Connection refused/reset: ${errorMsg}`,
        });
      } else if (errorMsg.includes('ETIMEDOUT') || errorMsg.includes('aborted') || errorMsg.includes('timeout')) {
        // Timeout ≠ page not found. Server may be slow or geo-restricted.
        indicators.push({
          indicator: 'PAGE_TIMEOUT',
          severity: 'low',
          description: 'Request timed out — server may be slow, geo-restricted, or blocking cloud IPs',
          evidence: `Request timed out after 12 seconds`,
        });
      } else {
        // Generic fetch failure — don't claim page doesn't exist, just say we couldn't verify
        indicators.push({
          indicator: 'FETCH_FAILED',
          severity: 'low',
          description: 'Could not fetch page content — page may still exist',
          evidence: `Fetch error: ${errorMsg}`,
        });
      }

      return {
        contentAnalysis: {
          hasLoginForm: false,
          hasPasswordFields: false,
          hasCreditCardFields: false,
          detectedBrands: [],
          socialMediaBrands: [],
          topicCategory: 'unknown',
          isParkedDomain: false,
          isEmptyPage: false, // Don't claim empty — we just couldn't fetch
          suspiciousScripts: 0,
          externalLinks: 0,
          formActionExternal: false,
        },
        pageExists: false,
        responseTime,
        sslIssuer,
        indicators,
      };
    }

    // If no HTML content, return basic analysis
    if (!html) {
      return {
        contentAnalysis: {
          hasLoginForm: false,
          hasPasswordFields: false,
          hasCreditCardFields: false,
          detectedBrands: [],
          socialMediaBrands: [],
          topicCategory: pageExists ? 'unknown' : 'not_found',
          isParkedDomain: false,
          isEmptyPage: !pageExists,
          suspiciousScripts: 0,
          externalLinks: 0,
          formActionExternal: false,
        },
        pageExists,
        responseTime,
        sslIssuer,
        indicators,
      };
    }

    // Parse and analyze HTML content
    const contentAnalysis = this.parseHtmlContent(html, domain, hostname);

    // Generate content-based indicators
    const contentIndicators = this.analyzeContentForThreats(contentAnalysis, domain, hostname, finalUrl);
    indicators.push(...contentIndicators);

    return {
      contentAnalysis,
      pageExists,
      responseTime,
      sslIssuer,
      indicators,
    };
  }

  private parseHtmlContent(html: string, _domain: string, hostname: string): ContentAnalysis {
    // Extract page title
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is);
    const pageTitle = titleMatch ? titleMatch[1].trim().substring(0, 200) : undefined;

    // Extract meta description
    const metaMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/is)
      || html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/is);
    const metaDescription = metaMatch ? metaMatch[1].trim().substring(0, 500) : undefined;

    // Extract language
    const langMatch = html.match(/<html[^>]*lang=["']([^"']*)["']/i)
      || html.match(/<meta[^>]*http-equiv=["']content-language["'][^>]*content=["']([^"']*)["']/i);
    const language = langMatch ? langMatch[1].trim().substring(0, 10) : undefined;

    // Check for login/password forms
    const hasLoginForm = /<form[^>]*>[\s\S]*?<input[^>]*type=["']?password["']?/i.test(html)
      || /<input[^>]*type=["']?password["']?/i.test(html);
    const hasPasswordFields = /type=["']?password["']?/i.test(html)
      || /name=["']?(password|passwd|pass|pwd)["']?/i.test(html);
    const hasCreditCardFields = /name=["']?(card.?number|cc.?number|credit.?card|cvv|cvc|card.?exp|expiry)["']?/i.test(html)
      || /id=["']?(card.?number|cc.?number|credit.?card|cvv|cvc)["']?/i.test(html)
      || /autocomplete=["']?cc-number["']?/i.test(html);

    // Detect brands mentioned in content
    const detectedBrands = this.detectBrandsInContent(html);

    // Detect which brands are only in social media link contexts (not impersonation)
    const socialMediaBrands = this.detectSocialMediaBrands(html);

    // Detect topic category
    const topicCategory = this.detectTopicCategory(html, pageTitle, metaDescription);

    // Check for parked domain indicators
    const isParkedDomain = this.isParkedDomainCheck(html, pageTitle);

    // Check if page is essentially empty
    const textContent = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const isEmptyPage = textContent.length < 100;

    // Count suspicious scripts
    const scriptMatches = html.match(/<script[^>]*>/gi) || [];
    const externalScripts = scriptMatches.filter(s => /src=["']http/i.test(s)).length;
    const obfuscatedScripts = (html.match(/eval\s*\(/gi) || []).length
      + (html.match(/document\.write\s*\(/gi) || []).length
      + (html.match(/atob\s*\(/gi) || []).length
      + (html.match(/fromcharcode/gi) || []).length;
    const suspiciousScripts = externalScripts + obfuscatedScripts;

    // Count external links
    const escapedHost = hostname.replace(/\./g, '\\.');
    const extLinkRegex = new RegExp(`href=["']https?:\\/\\/(?!.*${escapedHost})`, 'gi');
    const externalLinkMatches = html.match(extLinkRegex) || [];
    const externalLinks = externalLinkMatches.length;

    // Content snippet (first 300 chars of visible text)
    const contentSnippet = textContent.substring(0, 300);

    // Check if form actions point to external/different domains
    const formActions = html.match(/<form[^>]*action=["']([^"']*)["']/gi) || [];
    let formActionExternal = false;
    for (const form of formActions) {
      const actionMatch = form.match(/action=["']([^"']*)["']/i);
      if (actionMatch && actionMatch[1]) {
        const actionUrl = actionMatch[1];
        if (actionUrl.startsWith('http') && !actionUrl.includes(hostname)) {
          formActionExternal = true;
          break;
        }
      }
    }

    return {
      pageTitle,
      metaDescription,
      hasLoginForm,
      hasPasswordFields,
      hasCreditCardFields,
      detectedBrands,
      socialMediaBrands,
      topicCategory,
      isParkedDomain,
      isEmptyPage,
      suspiciousScripts,
      externalLinks,
      formActionExternal,
      contentSnippet,
      language,
    };
  }

  private detectBrandsInContent(html: string): string[] {
    const brands = [
      'paypal', 'facebook', 'google', 'apple', 'microsoft', 'amazon',
      'netflix', 'whatsapp', 'instagram', 'twitter', 'linkedin',
      'hbl', 'ubl', 'mcb', 'allied bank', 'bank al habib',
      'jazzcash', 'easypaisa', 'sada pay', 'naya pay',
      'sbp', 'state bank', 'nbp', 'habib bank',
      'pta', 'furqan', 'bano qabil',
    ];
    const lowerHtml = html.toLowerCase();
    const detected: string[] = [];

    for (const brand of brands) {
      if (lowerHtml.includes(brand)) {
        detected.push(brand);
      }
    }

    return detected;
  }

  /**
   * Detect which brands are mentioned ONLY in social media link contexts
   * (e.g., footer icons linking to facebook.com/username).
   * These should NOT trigger brand impersonation indicators.
   */
  private detectSocialMediaBrands(html: string): string[] {
    const socialBrands: string[] = [];
    const socialPatterns: Record<string, string[]> = {
      'facebook': ['facebook.com', 'fb.com', 'fb.me'],
      'instagram': ['instagram.com'],
      'twitter': ['twitter.com', 'x.com'],
      'linkedin': ['linkedin.com'],
      'whatsapp': ['wa.me', 'whatsapp.com'],
      'google': ['google.com'],
      'apple': ['apple.com'],
    };

    const lowerHtml = html.toLowerCase();

    for (const [brand, domains] of Object.entries(socialPatterns)) {
      // Check if brand appears in href attributes pointing to official social domains
      // Pattern: href="https://facebook.com/something" or href='https://x.com/something'
      const hrefPattern = new RegExp(
        `href=["']https?://(?:www\\.)?(${domains.map(d => d.replace('.', '\\.')).join('|')})/[^"']*["']`,
        'gi'
      );
      const matches = lowerHtml.match(hrefPattern);

      if (matches && matches.length > 0) {
        // Count how many times the brand name appears in the HTML
        const brandMentions = (lowerHtml.match(new RegExp(brand, 'g')) || []).length;
        // If brand appears only a few times and has social links, it's just social media links
        // (legitimate sites typically have 1-3 mentions for footer social icons)
        if (brandMentions <= 5) {
          socialBrands.push(brand);
        }
      }
    }

    return socialBrands;
  }

  private detectTopicCategory(html: string, pageTitle?: string, metaDescription?: string): string {
    const text = `${pageTitle || ''} ${metaDescription || ''} ${html}`.toLowerCase();

    const categories: Record<string, string[]> = {
      'banking': ['bank', 'banking', 'account', 'balance', 'transfer', 'deposit', 'withdraw', 'atm', 'debit card', 'credit card'],
      'ecommerce': ['shop', 'store', 'buy', 'cart', 'checkout', 'order', 'product', 'price', 'sale', 'discount'],
      'social_media': ['facebook', 'instagram', 'twitter', 'whatsapp', 'social', 'profile', 'friend', 'follow', 'share'],
      'email': ['email', 'gmail', 'outlook', 'yahoo mail', 'inbox', 'mailbox', 'compose'],
      'gaming': ['game', 'gaming', 'play', 'player', 'score', 'level', 'console', 'steam', 'xbox', 'playstation'],
      'education': ['school', 'university', 'college', 'course', 'student', 'teacher', 'learn', 'study', 'degree', 'admission'],
      'healthcare': ['hospital', 'doctor', 'health', 'medical', 'medicine', 'patient', 'clinic', 'pharmacy'],
      'government': ['government', 'ministry', 'official', 'federal', 'province', 'tax', 'passport', 'nic', 'cnic'],
      'cryptocurrency': ['bitcoin', 'crypto', 'blockchain', 'wallet', 'mining', 'ethereum', 'trading', 'invest'],
      'gambling': ['casino', 'bet', 'betting', 'gambling', 'poker', 'slot', 'jackpot', 'lottery', 'win big'],
      'job_portal': ['job', 'career', 'hiring', 'resume', 'apply', 'vacancy', 'salary', 'employment'],
      'news': ['news', 'breaking', 'headline', 'article', 'report', 'journalist', 'press'],
      'entertainment': ['movie', 'music', 'video', 'stream', 'watch', 'listen', 'playlist', 'series'],
    };

    let bestCategory = 'general';
    let bestScore = 0;

    for (const [category, keywords] of Object.entries(categories)) {
      let score = 0;
      for (const kw of keywords) {
        const regex = new RegExp(`\\b${kw}\\b`, 'gi');
        const matches = text.match(regex);
        if (matches) score += matches.length;
      }
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
      }
    }

    return bestScore >= 2 ? bestCategory : 'general';
  }

  private isParkedDomainCheck(html: string, pageTitle?: string): boolean {
    const lowerHtml = html.toLowerCase();
    const title = (pageTitle || '').toLowerCase();

    const parkedIndicators = [
      'this domain is parked', 'parked domain', 'domain for sale',
      'buy this domain', 'this domain is expired', 'domain expired',
      'godaddy', 'namecheap parking', 'sedoparking', 'domainmarket',
      'related searches', 'people also search',
    ];

    for (const indicator of parkedIndicators) {
      if (lowerHtml.includes(indicator) || title.includes(indicator)) {
        return true;
      }
    }

    return false;
  }

  private analyzeContentForThreats(
    content: ContentAnalysis,
    domain: string,
    hostname: string,
    _finalUrl: string
  ): UrlIndicator[] {
    const indicators: UrlIndicator[] = [];

    // 1. LOGIN FORM ON LOOKALIKE DOMAIN = HIGH RISK PHISHING
    if (content.hasLoginForm || content.hasPasswordFields) {
      const COMMON_BRANDS = ['paypal', 'facebook', 'google', 'apple', 'microsoft', 'amazon', 'netflix', 'whatsapp', 'instagram', 'twitter', 'linkedin', 'hbl', 'ubl', 'jazzcash', 'easypaisa', 'bank'];
      const brandInDomain = COMMON_BRANDS.find(b => domain.includes(b));
      const GENERIC_TECH_BRANDS_LOGIN = ['facebook', 'google', 'apple', 'twitter', 'linkedin', 'instagram', 'whatsapp', 'microsoft'];
      // Exclude social media brands and generic tech brands (unless topic matches)
      const brandInContent = content.detectedBrands.filter(b => {
        if (domain.includes(b) || b === domain) return false;
        if (content.socialMediaBrands.includes(b)) return false;
        // Skip generic tech brands unless the site's topic is about that brand
        if (GENERIC_TECH_BRANDS_LOGIN.includes(b)) {
          const topicMatchesBrand = content.topicCategory === 'social_media' && ['facebook', 'instagram', 'twitter', 'linkedin', 'whatsapp'].includes(b);
          if (!topicMatchesBrand) return false;
        }
        return true;
      });

      if (brandInDomain && brandInContent.length > 0) {
        indicators.push({
          indicator: 'PHISHING_LOGIN_FORM',
          severity: 'critical',
          description: `Page has login form and mentions "${brandInContent.join(', ')}" but domain "${domain}" is not official`,
          evidence: `Login form detected. Brands in content: ${brandInContent.join(', ')}. Domain: ${hostname}`,
        });
      } else if (content.hasPasswordFields && brandInContent.length > 0) {
        indicators.push({
          indicator: 'CREDENTIAL_COLLECTION',
          severity: 'high',
          description: `Page collects passwords and mentions brands: ${brandInContent.slice(0, 3).join(', ')}`,
          evidence: `Password fields found on page about: ${content.topicCategory}`,
        });
      } else if (content.hasPasswordFields) {
        indicators.push({
          indicator: 'PASSWORD_FORM',
          severity: 'medium',
          description: 'Page contains password input fields — may collect credentials',
          evidence: `Password fields found on ${hostname}`,
        });
      }
    }

    // 2. CREDIT CARD FIELDS = FINANCIAL PHISHING
    if (content.hasCreditCardFields) {
      indicators.push({
        indicator: 'CARD_DATA_COLLECTION',
        severity: 'critical',
        description: 'Page collects credit card information — potential financial phishing',
        evidence: `Credit card fields found on ${hostname}`,
      });
    }

    // 3. PARKED DOMAIN
    if (content.isParkedDomain) {
      indicators.push({
        indicator: 'PARKED_DOMAIN',
        severity: 'medium',
        description: 'Domain is parked or for sale — commonly used for typosquatting',
        evidence: `Page content indicates parked domain: ${content.pageTitle}`,
      });
    }

    // 4. EMPTY PAGE WITH HTTPS
    if (content.isEmptyPage && !content.isParkedDomain) {
      indicators.push({
        indicator: 'EMPTY_PAGE',
        severity: 'low',
        description: 'Page has very little content — may be a placeholder for malicious use',
        evidence: 'Less than 100 characters of visible text content',
      });
    }

    // 5. SUSPICIOUS SCRIPTS
    // Legitimate sites (GitHub, Google, etc.) have many scripts. Only flag truly suspicious counts.
    if (content.suspiciousScripts > 15) {
      indicators.push({
        indicator: 'SUSPICIOUS_SCRIPTS',
        severity: 'high',
        description: `Page contains ${content.suspiciousScripts} suspicious script elements — possible malware or keylogger`,
        evidence: `Obfuscated/external scripts: ${content.suspiciousScripts}`,
      });
    } else if (content.suspiciousScripts > 5) {
      indicators.push({
        indicator: 'MULTIPLE_SCRIPTS',
        severity: 'medium',
        description: `Page contains ${content.suspiciousScripts} external or obfuscated scripts`,
        evidence: `External/obfuscated scripts detected`,
      });
    }

    // 6. BRAND MISMATCH — domain doesn't match brands in content
    const officialDomains: Record<string, string[]> = {
      'paypal': ['paypal.com', 'paypal.me'],
      'facebook': ['facebook.com', 'fb.com', 'meta.com'],
      'google': ['google.com', 'google.co', 'gmail.com', 'accounts.google'],
      'apple': ['apple.com', 'icloud.com'],
      'microsoft': ['microsoft.com', 'live.com', 'outlook.com', 'hotmail.com'],
      'amazon': ['amazon.com', 'amazon.co'],
      'netflix': ['netflix.com'],
      'whatsapp': ['whatsapp.com', 'web.whatsapp'],
      'instagram': ['instagram.com'],
      'twitter': ['twitter.com', 'x.com'],
      'linkedin': ['linkedin.com'],
      'hbl': ['hbl.com', 'hblbank.com'],
      'jazzcash': ['jazzcash.com.pk'],
      'easypaisa': ['easypaisa.com.pk'],
    };

    // Known parent company / subsidiary relationships
    // e.g., GitHub is owned by Microsoft, YouTube is owned by Google
    const ACTUAL_PARENT_MAP: Record<string, string[]> = {
      'github.com': ['microsoft'],
      'github.io': ['microsoft'],
      'youtube.com': ['google'],
      'linkedin.com': ['microsoft'],
      'instagram.com': ['facebook'],
      'whatsapp.com': ['facebook'],
      'twitch.tv': ['amazon'],
    };

    // Brands that are commonly mentioned on ANY website (social links, share buttons, "Sign in with", etc.)
    // These should NOT be flagged as impersonation unless the site is actively collecting credentials for that brand
    const GENERIC_TECH_BRANDS = ['facebook', 'google', 'apple', 'twitter', 'linkedin', 'instagram', 'whatsapp', 'microsoft', 'amazon'];

    // Check if this domain has a legitimate reason to mention a brand (parent company)
    const hostnameBase = hostname.replace('www.', '');
    const parentBrands = ACTUAL_PARENT_MAP[hostnameBase] || [];

    for (const brand of content.detectedBrands) {
      // Skip brands that are only mentioned in social media link contexts
      if (content.socialMediaBrands.includes(brand)) {
        continue;
      }

      // Skip if this domain legitimately belongs to the brand's parent company
      if (parentBrands.includes(brand)) {
        continue;
      }

      const official = officialDomains[brand];
      if (official) {
        const isOfficial = official.some(od => hostname.endsWith(od));
        if (!isOfficial) {
          // For generic tech brands, ONLY flag if there's a login form + brand mention
          // (real phishing needs credentials). Mere brand mention on a page is NOT impersonation.
          if (GENERIC_TECH_BRANDS.includes(brand)) {
            if (!content.hasLoginForm && !content.hasPasswordFields) {
              continue; // No credential collection = not phishing, just brand mention
            }
            // Even with login form, skip if the page topic doesn't match the brand
            const domainContainsBrand = domain.includes(brand);
            if (!domainContainsBrand) {
              continue; // Domain doesn't impersonate the brand
            }
          }

          indicators.push({
            indicator: 'BRAND_IMPERSONATION_CONTENT',
            severity: 'high',
            description: `Page content references "${brand}" but domain "${hostname}" is not an official ${brand} domain`,
            evidence: `Official ${brand} domains: ${official.join(', ')}. Actual: ${hostname}`,
          });
        }
      }
    }

    // 7. SCAM CONTENT KEYWORDS
    const scamContentKeywords = [
      { pattern: /congratulations.*won|you.*winner|claim.*prize/gi, severity: 'critical' as const, desc: 'Page contains prize/winner scam language' },
      { pattern: /verify.*account.*suspend|account.*limited.*click.*here/gi, severity: 'critical' as const, desc: 'Page contains account suspension urgency scam' },
      { pattern: /urgent.*action.*required|immediate.*verification.*needed/gi, severity: 'high' as const, desc: 'Page uses urgency tactics to pressure action' },
      { pattern: /enter.*password.*confirm.*identity/gi, severity: 'high' as const, desc: 'Page asks for password to confirm identity — phishing pattern' },
      { pattern: /click.*here.*unlock|click.*below.*verify/gi, severity: 'high' as const, desc: 'Page uses click-bait urgency patterns' },
      { pattern: /wire transfer|western union|money gram|send.*bitcoin.*to/gi, severity: 'high' as const, desc: 'Page requests money transfer — common scam pattern' },
      { pattern: /lottery.*winner|inheritance.*fund|unclaimed.*money/gi, severity: 'critical' as const, desc: 'Page contains advance-fee scam language' },
    ];

    for (const { pattern, severity, desc } of scamContentKeywords) {
      if (pattern.test(content.contentSnippet || '') || pattern.test(content.pageTitle || '')) {
        indicators.push({
          indicator: 'SCAM_CONTENT_PATTERN',
          severity,
          description: desc,
          evidence: `Scam pattern detected in page content of ${hostname}`,
        });
      }
    }

    // 10. FORM ACTION POINTS TO EXTERNAL DOMAIN (credential forwarding)
    if (content.formActionExternal && (content.hasLoginForm || content.hasPasswordFields)) {
      indicators.push({
        indicator: 'FORM_ACTION_EXTERNAL',
        severity: 'critical',
        description: 'Login/password form submits data to a different external domain — classic credential harvesting',
        evidence: `Form on ${hostname} sends credentials to external server`,
      });
    }

    // 11. EXCESSIVE EXTERNAL LINKS
    // Legitimate sites (GitHub, Wikipedia, etc.) have hundreds of external links. Only flag extreme cases.
    if (content.externalLinks > 100 && content.isParkedDomain) {
      indicators.push({
        indicator: 'EXCESSIVE_EXTERNAL_LINKS',
        severity: 'medium',
        description: `Page has ${content.externalLinks} external links on a parked domain — possible link farm or scam redirector`,
        evidence: `External links: ${content.externalLinks}`,
      });
    }

    // 9. TOPIC MISMATCH WITH DOMAIN
    if (content.topicCategory === 'gambling' && !domain.includes('bet') && !domain.includes('casino') && !domain.includes('game')) {
      indicators.push({
        indicator: 'TOPIC_MISMATCH',
        severity: 'high',
        description: `Page content is about gambling but domain "${domain}" doesn't suggest gambling`,
        evidence: `Topic: ${content.topicCategory}, Domain: ${domain}`,
      });
    }

    return indicators;
  }

  // calculateRiskScore — REMOVED: AI determines risk score

  // scoreToLevel — REMOVED: AI determines risk level

  // generateAnalysis — REMOVED: AI provides explanation

  /**
   * Deterministic risk floor — ensures hard evidence (DNS failure, brand impersonation,
   * threat database hits) cannot be downplayed by AI leniency.
   * AI sees "empty page, no login form" and may score low, but a non-existent domain
   * or suspicious combination of signals is definitively malicious.
   */
  private calculateRiskFloor(
    indicators: UrlIndicator[],
    domain: string
  ): { floorScore: number; floorLevel: UrlAnalysisResult['riskLevel']; floorReason: string } {
    const indicatorIds = indicators.map(i => i.indicator);

    const hasCriticalDns = indicatorIds.includes('DOMAIN_NOT_FOUND') || indicatorIds.includes('DOMAIN_UNREACHABLE');
    const hasBrandImpersonation = indicatorIds.includes('BRAND_IMPERSONATION_CONTENT');
    const hasThreatDbHit = indicatorIds.includes('GOOGLE_SAFE_BROWSING_THREAT')
      || indicatorIds.includes('PHISHTANK_PHISHING')
      || indicatorIds.includes('VIRUSTOTAL_THREAT')
      || indicatorIds.includes('URLHAUS_MALICIOUS');
    const hasPhishingForm = indicatorIds.includes('PHISHING_LOGIN_FORM')
      || indicatorIds.includes('CARD_DATA_COLLECTION')
      || indicatorIds.includes('FORM_ACTION_EXTERNAL');
    const hasServerUnreachable = indicatorIds.includes('SERVER_UNREACHABLE');
    const hasNewDomain = indicatorIds.includes('DOMAIN_NEW');
    const hasSslIssue = indicatorIds.includes('SSL_SELF_SIGNED')
      || indicatorIds.includes('SSL_EXPIRED')
      || indicatorIds.includes('SSL_HOSTNAME_MISMATCH');
    const hasPageNotFound = indicatorIds.includes('PAGE_NOT_FOUND'); // Only real DNS ENOTFOUND now
    const hasEmptyPage = indicatorIds.includes('EMPTY_PAGE');
    const hasHttpError = indicatorIds.includes('HTTP_ERROR');
    const hasPasswordForm = indicatorIds.includes('PASSWORD_FORM') || indicatorIds.includes('CREDENTIAL_COLLECTION');

    // Check if domain name looks like a known brand lookalike
    const KNOWN_BRANDS = ['hbl', 'ubl', 'mcb', 'paypal', 'facebook', 'google', 'apple', 'microsoft', 'amazon', 'netflix', 'jazzcash', 'easypaisa', 'bank', 'nbp', 'sbp'];
    const domainLower = domain.toLowerCase();
    const domainMimicsBrand = KNOWN_BRANDS.some(brand => domainLower.includes(brand));

    // Count critical + high severity indicators
    const criticalCount = indicators.filter(i => i.severity === 'critical').length;
    const highCount = indicators.filter(i => i.severity === 'high').length;

    let floorScore = 0;
    let floorReason = '';

    // === CRITICAL TIER (85-95) ===
    // Threat database confirmed malicious → critical floor
    if (hasThreatDbHit) {
      floorScore = 92;
      floorReason = 'Threat database confirmed malicious';
    }
    // Phishing form + brand impersonation → critical floor
    else if (hasPhishingForm && (hasBrandImpersonation || domainMimicsBrand)) {
      floorScore = 88;
      floorReason = 'Phishing form with brand impersonation';
    }
    // DNS not found + domain mimics a brand → critical floor
    else if (hasCriticalDns && domainMimicsBrand) {
      floorScore = 85;
      floorReason = 'Domain does not exist and mimics a known brand';
    }
    // DNS not found + brand impersonation indicator from AI
    else if (hasCriticalDns && hasBrandImpersonation) {
      floorScore = 82;
      floorReason = 'Domain does not exist with AI-detected brand impersonation';
    }

    // === HIGH TIER (65-84) ===
    // New domain + brand mimic
    else if (hasNewDomain && domainMimicsBrand) {
      floorScore = 78;
      floorReason = 'Newly registered domain mimicking a known brand';
    }
    // Phishing form detected (login/password fields)
    else if (hasPhishingForm) {
      floorScore = 75;
      floorReason = 'Phishing form or credential harvesting detected';
    }
    // DNS not found + page not found/unreachable (double confirmation domain is fake)
    else if (hasCriticalDns && hasPageNotFound) {
      floorScore = 72;
      floorReason = 'Domain does not exist and page not found';
    }
    // DNS not found + empty page (placeholder phishing domain)
    else if (hasCriticalDns && hasEmptyPage) {
      floorScore = 70;
      floorReason = 'Non-existent domain with empty placeholder page';
    }
    // Brand impersonation in content
    else if (hasBrandImpersonation) {
      floorScore = 68;
      floorReason = 'Brand impersonation detected in page content';
    }
    // Multiple critical indicators (2+ critical = definitely suspicious)
    else if (criticalCount >= 2) {
      floorScore = 65;
      floorReason = `Multiple critical indicators detected (${criticalCount} critical)`;
    }

    // === MEDIUM-HIGH TIER (50-64) ===
    // DNS not found alone (domain doesn't exist = very suspicious)
    else if (hasCriticalDns && hasServerUnreachable) {
      floorScore = 62;
      floorReason = 'Domain does not exist and server unreachable';
    }
    // DNS not found + HTTP error
    else if (hasCriticalDns && hasHttpError) {
      floorScore = 60;
      floorReason = 'Domain does not exist with HTTP errors';
    }
    // DNS not found alone (still very suspicious)
    else if (hasCriticalDns) {
      floorScore = 55;
      floorReason = 'Domain does not exist in DNS';
    }
    // SSL issue + brand mimic
    else if (hasSslIssue && domainMimicsBrand) {
      floorScore = 60;
      floorReason = 'SSL certificate issue on brand-mimicking domain';
    }
    // Password form + empty page
    else if (hasPasswordForm && hasEmptyPage) {
      floorScore = 55;
      floorReason = 'Password form on empty page';
    }
    // 1 critical + 1+ high indicators
    else if (criticalCount >= 1 && highCount >= 1) {
      floorScore = 52;
      floorReason = 'Critical and high severity indicators combined';
    }

    // Map floor score to level
    let floorLevel: UrlAnalysisResult['riskLevel'] = 'safe';
    if (floorScore >= 80) floorLevel = 'critical';
    else if (floorScore >= 60) floorLevel = 'high';
    else if (floorScore >= 40) floorLevel = 'medium';
    else if (floorScore >= 20) floorLevel = 'low';

    return { floorScore, floorLevel, floorReason };
  }

  /**
   * Check URL against Google Safe Browsing API
   * Requires GOOGLE_SAFE_BROWSING_API_KEY environment variable
   */
  private async checkGoogleSafeBrowsing(url: string): Promise<UrlIndicator | null> {
    try {
      const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
      if (!apiKey) {
        return null; // API key not configured, skip check
      }

      const response = await fetch(
        `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client: {
              clientId: 'eduguard-ai',
              clientVersion: '1.0.0'
            },
            threatInfo: {
              threatTypes: ['THREAT_TYPE_UNSPECIFIED', 'MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
              platformTypes: ['ANY_PLATFORM'],
              threatEntryTypes: ['URL'],
              threatEntries: [{ url }]
            }
          })
        }
      );

      if (!response.ok) {
        return null; // API error, skip check
      }

      const data = await response.json();
      
      if (data.matches && data.matches.length > 0) {
        const threatType = data.matches[0].threatType;
        return {
          indicator: 'GOOGLE_SAFE_BROWSING_THREAT',
          severity: 'critical',
          description: `Google Safe Browsing flagged this URL as ${threatType}`,
          evidence: `Threat type: ${threatType}`,
        };
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Check URL against PhishTank API
   * Requires PHISHTANK_API_KEY environment variable
   */
  private async checkPhishTank(url: string): Promise<UrlIndicator | null> {
    try {
      const apiKey = process.env.PHISHTANK_API_KEY;
      if (!apiKey) {
        return null; // API key not configured, skip check
      }

      const response = await fetch('https://checkurl.phishtank.com/checkurl/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'phishtank/EduGuardAI'
        },
        body: `url=${encodeURIComponent(url)}&format=json&api_key=${apiKey}`
      });

      if (!response.ok) {
        return null; // API error, skip check
      }

      const data = await response.json();
      
      if (data.results && data.results.in_database && data.results.phishing_id) {
        return {
          indicator: 'PHISHTANK_PHISHING',
          severity: 'critical',
          description: 'PhishTank has identified this URL as a phishing site',
          evidence: `PhishTank ID: ${data.results.phishing_id}`,
        };
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Check URL against VirusTotal API
   * Requires VIRUSTOTAL_API_KEY environment variable
   */
  private async checkVirusTotal(url: string): Promise<UrlIndicator | null> {
    try {
      const apiKey = process.env.VIRUSTOTAL_API_KEY;
      if (!apiKey) {
        return null; // API key not configured, skip check
      }

      // First, submit the URL for scanning
      const submitResponse = await fetch('https://www.virustotal.com/api/v3/urls', {
        method: 'POST',
        headers: {
          'x-apikey': apiKey,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `url=${encodeURIComponent(url)}`
      });

      if (!submitResponse.ok) {
        return null;
      }

      const submitData = await submitResponse.json();
      const analysisId = submitData.data?.id;

      if (!analysisId) {
        return null;
      }

      // Wait a moment for analysis to complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get the analysis results
      const analysisResponse = await fetch(`https://www.virustotal.com/api/v3/analyses/${analysisId}`, {
        headers: { 'x-apikey': apiKey }
      });

      if (!analysisResponse.ok) {
        return null;
      }

      const analysisData = await analysisResponse.json();
      const stats = analysisData.data?.attributes?.stats;

      if (stats && (stats.malicious > 0 || stats.phishing > 0)) {
        const totalDetections = stats.malicious + stats.phishing;
        return {
          indicator: 'VIRUSTOTAL_THREAT',
          severity: 'critical',
          description: `VirusTotal: ${totalDetections} security vendors flagged this URL as malicious`,
          evidence: `Malicious: ${stats.malicious}, Phishing: ${stats.phishing}`,
        };
      }

      return null;
    } catch {
      return null;
    }
  }
  /**
   * Check URL against URLhaus abuse.ch database (FREE — no API key needed)
   * Contains known malicious URLs reported by security researchers
   */
  private async checkUrlhaus(url: string): Promise<UrlIndicator | null> {
    try {
      const response = await fetch('https://urlhaus-api.abuse.ch/v1/url/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `url=${encodeURIComponent(url)}`,
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) return null;

      const data = await response.json() as { query_status: string; urls?: Array<{ threat: string; tags: string[]; date_reported: string }> };
      
      if (data.query_status === 'ok' && data.urls && data.urls.length > 0) {
        const threat = data.urls[0].threat || 'malware';
        const dateReported = data.urls[0].date_reported || 'unknown';
        return {
          indicator: 'URLHAUS_MALICIOUS',
          severity: 'critical',
          description: `URLhaus threat database has flagged this URL as ${threat}`,
          evidence: `Threat: ${threat}, Reported: ${dateReported}`,
        };
      }

      return null;
    } catch {
      return null;
    }
  }
}

export const urlAnalyzer = new UrlAnalyzer();
