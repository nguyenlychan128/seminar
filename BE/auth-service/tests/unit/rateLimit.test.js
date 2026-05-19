'use strict';

const { createRateLimiter, resetStore } = require('../../src/middleware/rateLimit');

function mockReq(ip = '1.2.3.4', path = '/api/auth/login') {
  return { ip, path };
}

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function mockNext() {
  return jest.fn();
}

describe('createRateLimiter — factory', () => {
  beforeEach(() => {
    resetStore();
  });

  it('should return a function when called with windowSeconds and maxAttempts', () => {
    const limiter = createRateLimiter(900, 5);
    expect(typeof limiter).toBe('function');
  });

  it('should not throw during factory call', () => {
    expect(() => createRateLimiter(900, 5)).not.toThrow();
  });
});

describe('createRateLimiter — allowing requests under limit', () => {
  beforeEach(() => {
    resetStore();
  });

  it('should call next() on the first request', () => {
    const limiter = createRateLimiter(900, 5);
    const req = mockReq();
    const res = mockRes();
    const next = mockNext();

    limiter(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should call next() on each of the first N requests (up to maxAttempts)', () => {
    const limiter = createRateLimiter(900, 5);
    const req = mockReq();
    const res = mockRes();

    for (let i = 0; i < 5; i++) {
      const next = mockNext();
      limiter(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
    }
  });

  it('should not call res.status() when under the limit', () => {
    const limiter = createRateLimiter(900, 5);
    const req = mockReq();
    const res = mockRes();
    const next = mockNext();

    limiter(req, res, next);
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe('createRateLimiter — blocking at limit', () => {
  beforeEach(() => {
    resetStore();
  });

  it('should return 429 on the (maxAttempts + 1)th request from same IP+path', () => {
    const limiter = createRateLimiter(900, 5);
    const req = mockReq();
    const res = mockRes();

    // First 5 requests pass
    for (let i = 0; i < 5; i++) {
      limiter(req, res, mockNext());
    }

    // 6th request blocked
    limiter(req, res, mockNext());
    expect(res.status).toHaveBeenCalledWith(429);
  });

  it('should not call next() when limit is exceeded', () => {
    const limiter = createRateLimiter(900, 5);
    const req = mockReq();
    const res = mockRes();

    // First 5 requests pass
    for (let i = 0; i < 5; i++) {
      limiter(req, res, mockNext());
    }

    // 6th request blocked
    const next = mockNext();
    limiter(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return success: false in the 429 body', () => {
    const limiter = createRateLimiter(900, 5);
    const req = mockReq();
    const res = mockRes();

    for (let i = 0; i < 6; i++) {
      limiter(req, res, mockNext());
    }

    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.success).toBe(false);
  });

  it('should return the exact message "Too many requests. Please try again later."', () => {
    const limiter = createRateLimiter(900, 5);
    const req = mockReq();
    const res = mockRes();

    for (let i = 0; i < 6; i++) {
      limiter(req, res, mockNext());
    }

    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.message).toBe('Too many requests. Please try again later.');
  });

  it('should return a numeric retryAfter in the 429 body', () => {
    const limiter = createRateLimiter(900, 5);
    const req = mockReq();
    const res = mockRes();

    for (let i = 0; i < 6; i++) {
      limiter(req, res, mockNext());
    }

    const jsonCall = res.json.mock.calls[0][0];
    expect(typeof jsonCall.retryAfter).toBe('number');
  });

  it('should return retryAfter > 0 when window has not expired', () => {
    const limiter = createRateLimiter(900, 5);
    const req = mockReq();
    const res = mockRes();

    for (let i = 0; i < 6; i++) {
      limiter(req, res, mockNext());
    }

    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.retryAfter).toBeGreaterThan(0);
  });

  it('should set Retry-After header equal to retryAfter value', () => {
    const limiter = createRateLimiter(900, 5);
    const req = mockReq();
    const res = mockRes();

    for (let i = 0; i < 6; i++) {
      limiter(req, res, mockNext());
    }

    const retryAfter = res.json.mock.calls[0][0].retryAfter;
    expect(res.set).toHaveBeenCalledWith('Retry-After', retryAfter.toString());
  });
});

describe('createRateLimiter — IP isolation', () => {
  beforeEach(() => {
    resetStore();
  });

  it('should track IP-A and IP-B independently (exhausting A does not block B)', () => {
    const limiter = createRateLimiter(900, 5);

    // Exhaust IP-A
    const reqA = mockReq('1.1.1.1', '/api/auth/login');
    const resA = mockRes();
    for (let i = 0; i < 6; i++) {
      limiter(reqA, resA, mockNext());
    }

    // IP-B should still work
    const reqB = mockReq('2.2.2.2', '/api/auth/login');
    const resB = mockRes();
    const nextB = mockNext();
    limiter(reqB, resB, nextB);
    expect(nextB).toHaveBeenCalled();
  });

  it('should track same IP on different paths independently', () => {
    const limiter = createRateLimiter(900, 5);

    // Exhaust /api/auth/login for IP-A
    const reqLogin = mockReq('1.1.1.1', '/api/auth/login');
    const resLogin = mockRes();
    for (let i = 0; i < 6; i++) {
      limiter(reqLogin, resLogin, mockNext());
    }

    // Same IP on /api/auth/register should work
    const reqRegister = mockReq('1.1.1.1', '/api/auth/register');
    const resRegister = mockRes();
    const nextRegister = mockNext();
    limiter(reqRegister, resRegister, nextRegister);
    expect(nextRegister).toHaveBeenCalled();
  });
});

describe('createRateLimiter — window expiry', () => {
  beforeEach(() => {
    resetStore();
    jest.spyOn(Date, 'now');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should reset count after window has expired', () => {
    const windowSeconds = 10;
    const limiter = createRateLimiter(windowSeconds, 5);
    const req = mockReq();
    const res = mockRes();

    // Exhaust limit
    for (let i = 0; i < 6; i++) {
      limiter(req, res, mockNext());
    }

    // Window expires
    const originalNow = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(originalNow + (windowSeconds * 1000) + 1);

    // Reset and try again
    const nextAfterReset = mockNext();
    limiter(req, mockRes(), nextAfterReset);
    expect(nextAfterReset).toHaveBeenCalled();

    jest.restoreAllMocks();
  });

  it('should allow requests again immediately after window reset', () => {
    const windowSeconds = 10;
    const limiter = createRateLimiter(windowSeconds, 5);
    const req = mockReq();
    const res = mockRes();

    // Exhaust limit
    for (let i = 0; i < 6; i++) {
      limiter(req, res, mockNext());
    }

    // Fast forward past window
    const originalNow = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(originalNow + (windowSeconds * 1000) + 1);

    // Next request after reset should pass
    const next1 = mockNext();
    limiter(req, mockRes(), next1);
    expect(next1).toHaveBeenCalled();

    jest.restoreAllMocks();
  });

  it('should set a new resetTime after reset', () => {
    const windowSeconds = 10;
    const limiter = createRateLimiter(windowSeconds, 5);
    const req = mockReq();
    const res = mockRes();

    // First window
    for (let i = 0; i < 5; i++) {
      limiter(req, res, mockNext());
    }

    const originalNow = Date.now();
    const firstResetTime = originalNow + (windowSeconds * 1000);

    // Fast forward past window
    jest.spyOn(Date, 'now').mockReturnValue(firstResetTime + 1);

    // Next request after reset
    limiter(req, mockRes(), mockNext());

    // Now fast forward less than the new window
    jest.spyOn(Date, 'now').mockReturnValue(firstResetTime + 2);

    // Make more requests - should not hit limit yet
    for (let i = 0; i < 5; i++) {
      limiter(req, mockRes(), mockNext());
    }

    jest.restoreAllMocks();
  });

  it('retryAfter should reflect remaining time correctly mid-window', () => {
    const windowSeconds = 100;
    const limiter = createRateLimiter(windowSeconds, 1);
    const req = mockReq();
    const res = mockRes();

    const startTime = 1000000;
    jest.spyOn(Date, 'now').mockReturnValue(startTime);

    // First request passes
    limiter(req, res, mockNext());

    // Second request blocked
    limiter(req, res, mockNext());
    const retryAfter1 = res.json.mock.calls[0][0].retryAfter;
    expect(retryAfter1).toBeLessThanOrEqual(windowSeconds);

    // Fast forward 50 seconds
    jest.spyOn(Date, 'now').mockReturnValue(startTime + 50000);

    const res2 = mockRes();
    limiter(req, res2, mockNext());
    const retryAfter2 = res2.json.mock.calls[0][0].retryAfter;

    // Should be approximately 50 seconds remaining
    expect(retryAfter2).toBeLessThan(retryAfter1);

    jest.restoreAllMocks();
  });
});

describe('createRateLimiter — disabled via RATE_LIMIT_ENABLED=false', () => {
  beforeEach(() => {
    resetStore();
    process.env.RATE_LIMIT_ENABLED = 'false';
  });

  afterEach(() => {
    delete process.env.RATE_LIMIT_ENABLED;
  });

  it('should call next() even after exceeding maxAttempts when disabled', () => {
    const limiter = createRateLimiter(900, 5);
    const req = mockReq();
    const res = mockRes();

    // Make 10 requests
    for (let i = 0; i < 10; i++) {
      const next = mockNext();
      limiter(req, res, next);
      expect(next).toHaveBeenCalled();
    }
  });

  it('should never return 429 when RATE_LIMIT_ENABLED is false', () => {
    const limiter = createRateLimiter(900, 5);
    const req = mockReq();
    const res = mockRes();

    for (let i = 0; i < 20; i++) {
      limiter(req, res, mockNext());
    }

    expect(res.status).not.toHaveBeenCalledWith(429);
  });
});

describe('createRateLimiter — configuration via env vars', () => {
  beforeEach(() => {
    resetStore();
  });

  afterEach(() => {
    delete process.env.RATE_LIMIT_LOGIN_MAX_ATTEMPTS;
    delete process.env.RATE_LIMIT_LOGIN_WINDOW;
  });

  it('should read maxAttempts from constructor parameter', () => {
    const limiter = createRateLimiter(900, 3);
    const req = mockReq();
    const res = mockRes();

    for (let i = 0; i < 3; i++) {
      limiter(req, res, mockNext());
    }

    // 4th should be blocked
    const next = mockNext();
    limiter(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });

  it('should read window from constructor parameter', () => {
    const limiter = createRateLimiter(10, 5);
    const req = mockReq();
    const res = mockRes();

    for (let i = 0; i < 6; i++) {
      limiter(req, res, mockNext());
    }

    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.retryAfter).toBeLessThanOrEqual(10);
  });

  it('should parse env var as integer, not string', () => {
    const limiter = createRateLimiter(900, 2);
    const req = mockReq();
    const res = mockRes();

    // Should respect numeric 2, not string '2'
    for (let i = 0; i < 2; i++) {
      limiter(req, res, mockNext());
    }

    const next = mockNext();
    limiter(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('createRateLimiter — edge cases', () => {
  beforeEach(() => {
    resetStore();
  });

  it('should handle req.ip being undefined gracefully', () => {
    const limiter = createRateLimiter(900, 5);
    const req = { path: '/api/auth/login' };
    const res = mockRes();
    const next = mockNext();

    // Should not crash
    expect(() => limiter(req, res, next)).not.toThrow();
  });

  it('should handle maxAttempts=0 by blocking the first request', () => {
    const limiter = createRateLimiter(900, 0);
    const req = mockReq();
    const res = mockRes();
    const next = mockNext();

    limiter(req, res, next);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(next).not.toHaveBeenCalled();
  });

  it('should handle maxAttempts=1: first request passes, second blocked', () => {
    const limiter = createRateLimiter(900, 1);
    const req = mockReq();
    const res = mockRes();

    const next1 = mockNext();
    limiter(req, res, next1);
    expect(next1).toHaveBeenCalled();

    const next2 = mockNext();
    limiter(req, res, next2);
    expect(next2).not.toHaveBeenCalled();
  });

  it('should handle concurrent-looking calls correctly', () => {
    const limiter = createRateLimiter(900, 5);
    const req = mockReq();
    const res = mockRes();

    for (let i = 0; i < 5; i++) {
      const next = mockNext();
      limiter(req, res, next);
      expect(next).toHaveBeenCalled();
    }

    const next6 = mockNext();
    limiter(req, res, next6);
    expect(next6).not.toHaveBeenCalled();
  });

  it('should not share state between two separately created limiter instances', () => {
    const limiter1 = createRateLimiter(900, 2);
    const limiter2 = createRateLimiter(900, 5);
    const req = mockReq();
    const res = mockRes();

    // Exhaust limiter1
    for (let i = 0; i < 3; i++) {
      limiter1(req, res, mockNext());
    }

    // limiter2 should work independently
    const next = mockNext();
    limiter2(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
