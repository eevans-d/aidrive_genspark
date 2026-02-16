/**
 * Coverage tests for scraper-maxiconsumo/anti-detection.ts
 * Covers: proxy/captcha helpers, session/request ID generators,
 *         generarHeadersAleatorios, generateAdvancedHeaders,
 *         fetchConReintentos, delay, getRandomDelay, calculateExponentialBackoff,
 *         detectCaptcha, handleCaptchaBypass, fetchWithAdvancedAntiDetection
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Deno.env for config.ts imports
if (typeof globalThis.Deno === 'undefined') {
  (globalThis as any).Deno = { env: { get: () => undefined } };
}

import {
  DEFAULT_ANTI_DETECTION_CONFIG,
  isProxyEffectivelyEnabled,
  isCaptchaServiceEnabled,
  getEffectiveProxyUrl,
  getEffectiveCaptchaService,
  generarHeadersAleatorios,
  generateAdvancedHeaders,
  generateSessionId,
  generateRequestId,
  delay,
  getRandomDelay,
  calculateExponentialBackoff,
  fetchConReintentos,
  detectCaptcha,
  handleCaptchaBypass,
  fetchWithAdvancedAntiDetection,
} from '../../supabase/functions/scraper-maxiconsumo/anti-detection';

describe('DEFAULT_ANTI_DETECTION_CONFIG', () => {
  it('has expected default values', () => {
    expect(DEFAULT_ANTI_DETECTION_CONFIG.minDelay).toBe(1500);
    expect(DEFAULT_ANTI_DETECTION_CONFIG.maxDelay).toBe(6000);
    expect(DEFAULT_ANTI_DETECTION_CONFIG.jitterFactor).toBe(0.25);
    expect(DEFAULT_ANTI_DETECTION_CONFIG.userAgentRotation).toBe(true);
    expect(DEFAULT_ANTI_DETECTION_CONFIG.headerRandomization).toBe(true);
    expect(DEFAULT_ANTI_DETECTION_CONFIG.captchaBypass).toBe(false);
  });
});

describe('Proxy/Captcha helpers', () => {
  it('isProxyEffectivelyEnabled returns boolean', () => {
    const result = isProxyEffectivelyEnabled();
    expect(typeof result).toBe('boolean');
  });

  it('isCaptchaServiceEnabled returns boolean', () => {
    const result = isCaptchaServiceEnabled();
    expect(typeof result).toBe('boolean');
  });

  it('getEffectiveProxyUrl returns null when unconfigured', () => {
    const result = getEffectiveProxyUrl();
    expect(result).toBeNull();
  });

  it('getEffectiveCaptchaService returns null when unconfigured', () => {
    const result = getEffectiveCaptchaService();
    expect(result).toBeNull();
  });
});

describe('Header generators', () => {
  it('generarHeadersAleatorios returns required headers', () => {
    const headers = generarHeadersAleatorios();
    expect(headers['User-Agent']).toBeTruthy();
    expect(headers['Accept']).toBeTruthy();
    expect(headers['Accept-Language']).toBeTruthy();
    expect(headers['Accept-Encoding']).toBe('gzip, deflate');
    expect(headers['Connection']).toBe('keep-alive');
    expect(headers['Upgrade-Insecure-Requests']).toBe('1');
    expect(headers['Sec-Fetch-Dest']).toBe('document');
    expect(headers['Sec-Fetch-Mode']).toBe('navigate');
    expect(headers['Sec-Fetch-Site']).toBe('none');
    expect(headers['Cache-Control']).toBe('max-age=0');
  });

  it('generateAdvancedHeaders returns additional fields', () => {
    const headers = generateAdvancedHeaders();
    expect(headers['User-Agent']).toBeTruthy();
    expect(headers['DNT']).toBe('1');
    expect(headers['Pragma']).toBe('no-cache');
    expect(headers['Sec-Ch-Ua']).toBeTruthy();
    expect(headers['Sec-Ch-Ua-Mobile']).toBe('?0');
    expect(headers['Sec-Ch-Ua-Platform']).toBe('"Windows"');
    expect(headers['X-Timezone']).toBeTruthy();
    expect(headers['X-Client-Time']).toBeTruthy();
  });
});

describe('Session/Request ID generators', () => {
  it('generateSessionId returns alphanumeric string', () => {
    const id = generateSessionId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(10);
  });

  it('generates unique session IDs', () => {
    const ids = new Set(Array.from({ length: 10 }, () => generateSessionId()));
    expect(ids.size).toBe(10);
  });

  it('generateRequestId returns UUID format', () => {
    const id = generateRequestId();
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe('Delay functions', () => {
  it('getRandomDelay returns value within range', () => {
    for (let i = 0; i < 20; i++) {
      const d = getRandomDelay(100, 200, 0);
      expect(d).toBeGreaterThanOrEqual(100);
      expect(d).toBeLessThanOrEqual(200);
    }
  });

  it('getRandomDelay with jitter stays reasonable', () => {
    for (let i = 0; i < 20; i++) {
      const d = getRandomDelay(100, 200, 0.5);
      expect(d).toBeGreaterThanOrEqual(50); // min - jitter
      expect(d).toBeLessThan(400); // reasonable upper bound
    }
  });

  it('calculateExponentialBackoff increases with attempts', () => {
    const d0 = calculateExponentialBackoff(0, 1000, 30000, false);
    const d1 = calculateExponentialBackoff(1, 1000, 30000, false);
    const d2 = calculateExponentialBackoff(2, 1000, 30000, false);
    expect(d0).toBe(1000);
    expect(d1).toBe(2000);
    expect(d2).toBe(4000);
  });

  it('calculateExponentialBackoff caps at maxDelay', () => {
    const d = calculateExponentialBackoff(10, 1000, 5000, false);
    expect(d).toBe(5000);
  });

  it('calculateExponentialBackoff with jitter stays within bounds', () => {
    for (let i = 0; i < 20; i++) {
      const d = calculateExponentialBackoff(1, 1000, 30000, true);
      expect(d).toBeGreaterThanOrEqual(1000);
      expect(d).toBeLessThanOrEqual(30000);
    }
  });

  it('delay resolves (fast check)', async () => {
    await delay(1); // Should not hang
  });
});

describe('fetchConReintentos', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('returns response on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('OK', { status: 200 }),
    );

    const resp = await fetchConReintentos('https://example.com', {}, 3, 5000);
    expect(resp.status).toBe(200);
  });

  it('retries on 429 and succeeds', async () => {
    let calls = 0;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      calls++;
      if (calls === 1) return new Response('Rate Limited', { status: 429 });
      return new Response('OK', { status: 200 });
    });

    // Use low delay by mocking delay
    const resp = await fetchConReintentos('https://example.com', {}, 3, 5000);
    expect(resp.status).toBe(200);
    expect(calls).toBe(2);
  }, 30000);

  it('retries on server error and succeeds', async () => {
    let calls = 0;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      calls++;
      if (calls === 1) return new Response('Error', { status: 500 });
      return new Response('OK', { status: 200 });
    });

    const resp = await fetchConReintentos('https://example.com', {}, 3, 5000);
    expect(resp.status).toBe(200);
  }, 30000);

  it('throws on non-retryable error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Forbidden', { status: 403, statusText: 'Forbidden' }),
    );

    await expect(
      fetchConReintentos('https://example.com', {}, 2, 5000),
    ).rejects.toThrow('HTTP 403');
  });

  it('throws after exhausting retries', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network failure'));

    await expect(
      fetchConReintentos('https://example.com', {}, 1, 5000),
    ).rejects.toThrow('Network failure');
  });
});

describe('detectCaptcha', () => {
  it('detects captcha from status 429', () => {
    const resp = new Response('', { status: 429 });
    expect(detectCaptcha(resp)).toBe(true);
  });

  it('detects captcha from x-captcha-detected header', () => {
    const resp = new Response('', { status: 200, headers: { 'x-captcha-detected': 'true' } });
    expect(detectCaptcha(resp)).toBe(true);
  });

  it('detects captcha from HTML content', () => {
    const resp = new Response('', { status: 200 });
    expect(detectCaptcha(resp, '<div class="g-recaptcha">challenge</div>')).toBe(true);
  });

  it('detects hcaptcha in HTML', () => {
    const resp = new Response('', { status: 200 });
    expect(detectCaptcha(resp, '<div class="hcaptcha-box">test</div>')).toBe(true);
  });

  it('detects cf-turnstile in HTML', () => {
    const resp = new Response('', { status: 200 });
    expect(detectCaptcha(resp, '<div id="cf-turnstile">test</div>')).toBe(true);
  });

  it('detects challenge-form in HTML', () => {
    const resp = new Response('', { status: 200 });
    expect(detectCaptcha(resp, '<form class="challenge-form">test</form>')).toBe(true);
  });

  it('returns false for clean response', () => {
    const resp = new Response('', { status: 200 });
    expect(detectCaptcha(resp)).toBe(false);
  });

  it('returns false for clean HTML', () => {
    const resp = new Response('', { status: 200 });
    expect(detectCaptcha(resp, '<html><body>Normal page</body></html>')).toBe(false);
  });
});

describe('handleCaptchaBypass', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('completes without error (no captcha service)', async () => {
    // handleCaptchaBypass should just delay when no service is configured
    await expect(
      handleCaptchaBypass('https://example.com', {}, { requestId: 'r1' } as any),
    ).resolves.toBeUndefined();
  }, 30000);
});

describe('fetchWithAdvancedAntiDetection', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('returns response on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('OK', { status: 200 }),
    );

    const resp = await fetchWithAdvancedAntiDetection(
      'https://example.com',
      {},
      { requestId: 'r1' } as any,
      5000,
      1,
    );
    expect(resp.status).toBe(200);
  });

  it('retries on 429', async () => {
    let calls = 0;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      calls++;
      if (calls === 1) return new Response('', { status: 429 });
      return new Response('OK', { status: 200 });
    });

    const resp = await fetchWithAdvancedAntiDetection(
      'https://example.com',
      {},
      { requestId: 'r2' } as any,
      5000,
      2,
    );
    expect(resp.status).toBe(200);
  }, 60000);

  it('retries on 503', async () => {
    let calls = 0;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      calls++;
      if (calls === 1) return new Response('', { status: 503 });
      return new Response('OK', { status: 200 });
    });

    const resp = await fetchWithAdvancedAntiDetection(
      'https://example.com',
      {},
      { requestId: 'r3' } as any,
      5000,
      2,
    );
    expect(resp.status).toBe(200);
  }, 60000);

  it('throws after exhausting retries', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network'));

    await expect(
      fetchWithAdvancedAntiDetection(
        'https://example.com',
        {},
        { requestId: 'r4' } as any,
        5000,
        1,
      ),
    ).rejects.toThrow('Network');
  }, 30000);
});
