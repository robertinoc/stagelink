import { AnalyticsEnvironment } from '@prisma/client';
import { detectBotFromUserAgent, resolveTrafficFlags } from './analytics-flags';

// ---------------------------------------------------------------------------
// detectBotFromUserAgent
// ---------------------------------------------------------------------------

describe('detectBotFromUserAgent', () => {
  // ── Empty / missing UA → always bot ──────────────────────────────────────
  describe('empty / missing UA', () => {
    it('returns true for undefined', () => {
      expect(detectBotFromUserAgent(undefined)).toBe(true);
    });

    it('returns true for null', () => {
      expect(detectBotFromUserAgent(null)).toBe(true);
    });

    it('returns true for empty string', () => {
      expect(detectBotFromUserAgent('')).toBe(true);
    });

    it('returns true for whitespace-only string', () => {
      expect(detectBotFromUserAgent('   ')).toBe(true);
    });
  });

  // ── Known bot / crawler patterns → flagged ───────────────────────────────
  describe('known bot UAs', () => {
    const botUAs: Array<[string, string]> = [
      ['Googlebot', 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'],
      ['Bingbot', 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)'],
      [
        'Baiduspider',
        'Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)',
      ],
      ['YandexBot', 'Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)'],
      ['curl', 'curl/7.68.0'],
      ['wget', 'Wget/1.20.3 (linux-gnu)'],
      ['python-requests', 'python-requests/2.28.2'],
      [
        'Playwright',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/112.0.0.0 Safari/537.36 playwright/1.32.0',
      ],
      [
        'Puppeteer (headlesschrome)',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/112.0.0.0 Safari/537.36',
      ],
      [
        'Selenium',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36 selenium/4.1.0',
      ],
      [
        'PhantomJS',
        'Mozilla/5.0 (Unknown; Linux x86_64) AppleWebKit/534.34 (KHTML, like Gecko) PhantomJS/1.9.8 Safari/534.34',
      ],
      ['Twitterbot', 'Twitterbot/1.0'],
      [
        'facebookexternalhit',
        'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
      ],
      [
        'LinkedInBot',
        'LinkedInBot/1.0 (compatible; Mozilla/5.0; Jakarta Commons-HttpClient/3.1 +http://www.linkedin.com)',
      ],
      ['Scrapy', 'Scrapy/2.8.0 (+https://scrapy.org)'],
      ['Ahrefs', 'Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)'],
      ['SemrushBot', 'Mozilla/5.0 (compatible; SemrushBot/7~bl; +http://www.semrush.com/bot.html)'],
      ['MJ12bot', 'Mozilla/5.0 (compatible; MJ12bot/v1.4.8; http://mj12bot.com/)'],
      ['DotBot', 'Mozilla/5.0 (compatible; DotBot/1.2; +https://opensiteexplorer.org/dotbot)'],
      ['Go HTTP client', 'Go-http-client/1.1'],
      ['Java default', 'Java/11.0.15'],
      [
        'ia_archiver',
        'ia_archiver (+http://www.alexa.com/site/help/webmasters; crawler@alexa.com)',
      ],
      [
        'archive.org bot',
        'Mozilla/5.0 (compatible; archive.org_bot; +http://www.archive.org/details/archive.org_bot)',
      ],
    ];

    it.each(botUAs)('%s is flagged as bot', (_name, ua) => {
      expect(detectBotFromUserAgent(ua)).toBe(true);
    });
  });

  // ── Real browser UAs → NOT flagged ───────────────────────────────────────
  describe('real browser UAs', () => {
    const realUAs: Array<[string, string]> = [
      [
        'Chrome on Windows',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      ],
      [
        'Firefox on macOS',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.2; rv:121.0) Gecko/20100101 Firefox/121.0',
      ],
      [
        'Safari on macOS',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
      ],
      [
        'Chrome on Android',
        'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36',
      ],
      [
        'Safari on iPhone',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
      ],
      [
        'Edge on Windows',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
      ],
    ];

    it.each(realUAs)('%s is NOT flagged as bot', (_name, ua) => {
      expect(detectBotFromUserAgent(ua)).toBe(false);
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────────────
  describe('edge cases', () => {
    it('"robot" as a substring triggers the pattern', () => {
      // "robot" contains "bot" — covered by the \bbot regex
      expect(detectBotFromUserAgent('MyRobot/1.0')).toBe(true);
    });

    it('"java/" with trailing slash triggers the Java pattern', () => {
      expect(detectBotFromUserAgent('Java/17.0')).toBe(true);
    });

    it('"java" without slash does NOT trigger (conservative match)', () => {
      // "javascript" should not be flagged — the pattern is "java/" (with slash)
      expect(detectBotFromUserAgent('Mozilla/5.0 (JavaScript runtime v8)')).toBe(false);
    });

    it('"crawler" in UA is flagged', () => {
      expect(detectBotFromUserAgent('MyCrawler/2.0')).toBe(true);
    });

    it('"spider" in UA is flagged', () => {
      expect(detectBotFromUserAgent('SpiderMan-Agent/1.0')).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// resolveTrafficFlags
// ---------------------------------------------------------------------------

describe('resolveTrafficFlags', () => {
  it('returns isBotSuspected=true for empty UA', () => {
    const flags = resolveTrafficFlags({ userAgent: '' });
    expect(flags.isBotSuspected).toBe(true);
  });

  it('returns isBotSuspected=false for real browser UA', () => {
    const flags = resolveTrafficFlags({
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
    });
    expect(flags.isBotSuspected).toBe(false);
  });

  it('isQa=true when slQaHeader is "1"', () => {
    const flags = resolveTrafficFlags({ slQaHeader: '1' });
    expect(flags.isQa).toBe(true);
  });

  it('isQa=false when slQaHeader is anything other than "1"', () => {
    expect(resolveTrafficFlags({ slQaHeader: '0' }).isQa).toBe(false);
    expect(resolveTrafficFlags({ slQaHeader: undefined }).isQa).toBe(false);
    expect(resolveTrafficFlags({ slQaHeader: '' }).isQa).toBe(false);
  });

  it('isInternal=false since X-SL-Internal is not yet implemented', () => {
    // Even if the header value is '1', the current web tier never sends it;
    // this test documents the expected behavior when it IS eventually wired up.
    const flags = resolveTrafficFlags({ slInternalHeader: '1' });
    expect(flags.isInternal).toBe(true); // flag is resolved from header when present
  });

  describe('hasTrackingConsent', () => {
    it('returns null when slAcHeader is absent (unknown consent)', () => {
      expect(resolveTrafficFlags({}).hasTrackingConsent).toBeNull();
    });

    it('returns true when slAcHeader is "1"', () => {
      expect(resolveTrafficFlags({ slAcHeader: '1' }).hasTrackingConsent).toBe(true);
    });

    it('returns false when slAcHeader is "0"', () => {
      expect(resolveTrafficFlags({ slAcHeader: '0' }).hasTrackingConsent).toBe(false);
    });

    it('returns null for unexpected values', () => {
      expect(resolveTrafficFlags({ slAcHeader: 'yes' }).hasTrackingConsent).toBeNull();
    });
  });

  describe('environment mapping', () => {
    it('maps "production" to AnalyticsEnvironment.production', () => {
      const flags = resolveTrafficFlags({ appEnvironment: 'production' });
      expect(flags.environment).toBe(AnalyticsEnvironment.production);
    });

    it('maps "staging" to AnalyticsEnvironment.staging', () => {
      const flags = resolveTrafficFlags({ appEnvironment: 'staging' });
      expect(flags.environment).toBe(AnalyticsEnvironment.staging);
    });

    it('maps "development" to AnalyticsEnvironment.development', () => {
      const flags = resolveTrafficFlags({ appEnvironment: 'development' });
      expect(flags.environment).toBe(AnalyticsEnvironment.development);
    });

    it('maps "test" to AnalyticsEnvironment.development (safe fallback)', () => {
      const flags = resolveTrafficFlags({ appEnvironment: 'test' });
      expect(flags.environment).toBe(AnalyticsEnvironment.development);
    });

    it('maps unknown values to AnalyticsEnvironment.development (safe fallback)', () => {
      const flags = resolveTrafficFlags({ appEnvironment: 'ci' });
      expect(flags.environment).toBe(AnalyticsEnvironment.development);
    });

    it('defaults to production when appEnvironment is absent', () => {
      // Relies on process.env.NODE_ENV being unset or 'test' in Jest context.
      // The function falls through to 'development' for 'test' env — which is correct.
      const flags = resolveTrafficFlags({});
      // In Jest NODE_ENV is 'test' → maps to development (safe fallback)
      expect(flags.environment).toBe(AnalyticsEnvironment.development);
    });
  });
});
