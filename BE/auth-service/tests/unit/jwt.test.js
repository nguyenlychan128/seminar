'use strict';

const jwt = require('jsonwebtoken');
const { generateAccessToken, generateRefreshToken, verifyToken, verifyRefreshToken } = require('../../src/utils/jwt');

const MOCK_USER = {
  _id: '507f1f77bcf86cd799439011',
  email: 'alice@example.com',
  role: 'User',
};

const TEST_SECRET = 'test-secret-at-least-32-characters-long!!';

beforeEach(() => {
  process.env.JWT_SECRET = TEST_SECRET;
  process.env.JWT_EXPIRES_IN = '15m';
  process.env.JWT_REFRESH_EXPIRES_IN = '7d';
});

afterEach(() => {
  delete process.env.JWT_SECRET;
  delete process.env.JWT_EXPIRES_IN;
  delete process.env.JWT_REFRESH_EXPIRES_IN;
});

describe('generateAccessToken', () => {
  it('should return a string', () => {
    const token = generateAccessToken(MOCK_USER);
    expect(typeof token).toBe('string');
  });

  it('should produce a JWT with three dot-separated segments', () => {
    const token = generateAccessToken(MOCK_USER);
    const parts = token.split('.');
    expect(parts.length).toBe(3);
  });

  it('should embed userId, email, role in payload', () => {
    const token = generateAccessToken(MOCK_USER);
    const decoded = jwt.verify(token, TEST_SECRET);
    expect(decoded.userId).toBe(MOCK_USER._id);
    expect(decoded.email).toBe(MOCK_USER.email);
    expect(decoded.role).toBe(MOCK_USER.role);
  });

  it('should set algorithm to HS256', () => {
    const token = generateAccessToken(MOCK_USER);
    const header = JSON.parse(Buffer.from(token.split('.')[0], 'base64url').toString());
    expect(header.alg).toBe('HS256');
  });

  it('should expire in exactly 900 seconds (15m)', () => {
    const token = generateAccessToken(MOCK_USER);
    const decoded = jwt.verify(token, TEST_SECRET);
    const ttl = decoded.exp - decoded.iat;
    expect(ttl).toBe(900);
  });

  it('should not include a "type" claim', () => {
    const token = generateAccessToken(MOCK_USER);
    const decoded = jwt.verify(token, TEST_SECRET);
    expect(decoded.type).toBeUndefined();
  });

  it('should include iat claim', () => {
    const token = generateAccessToken(MOCK_USER);
    const decoded = jwt.verify(token, TEST_SECRET);
    expect(decoded.iat).toBeDefined();
    expect(typeof decoded.iat).toBe('number');
  });

  it('should use JWT_EXPIRES_IN env variable when set', () => {
    process.env.JWT_EXPIRES_IN = '30m';
    const token = generateAccessToken(MOCK_USER);
    const decoded = jwt.verify(token, TEST_SECRET);
    const ttl = decoded.exp - decoded.iat;
    expect(ttl).toBe(30 * 60); // 1800 seconds
  });

  it('should produce different tokens on consecutive calls (iat uniqueness)', (done) => {
    const token1 = generateAccessToken(MOCK_USER);
    // Wait 1 second to guarantee different iat
    setTimeout(() => {
      const token2 = generateAccessToken(MOCK_USER);
      expect(token1).not.toBe(token2);
      const decoded1 = jwt.verify(token1, TEST_SECRET);
      const decoded2 = jwt.verify(token2, TEST_SECRET);
      expect(decoded1.iat).not.toBe(decoded2.iat);
      done();
    }, 1100);
  });
});

describe('generateRefreshToken', () => {
  it('should return a string', () => {
    const token = generateRefreshToken(MOCK_USER);
    expect(typeof token).toBe('string');
  });

  it('should embed userId, email in payload', () => {
    const token = generateRefreshToken(MOCK_USER);
    const decoded = jwt.verify(token, TEST_SECRET);
    expect(decoded.userId).toBe(MOCK_USER._id);
    expect(decoded.email).toBe(MOCK_USER.email);
  });

  it('should set type claim to "refresh"', () => {
    const token = generateRefreshToken(MOCK_USER);
    const decoded = jwt.verify(token, TEST_SECRET);
    expect(decoded.type).toBe('refresh');
  });

  it('should not include a "role" claim', () => {
    const token = generateRefreshToken(MOCK_USER);
    const decoded = jwt.verify(token, TEST_SECRET);
    expect(decoded.role).toBeUndefined();
  });

  it('should expire in 7 days', () => {
    const token = generateRefreshToken(MOCK_USER);
    const decoded = jwt.verify(token, TEST_SECRET);
    const ttl = decoded.exp - decoded.iat;
    expect(ttl).toBe(7 * 24 * 60 * 60); // 604800 seconds
  });

  it('should use JWT_REFRESH_EXPIRES_IN env variable when set', () => {
    process.env.JWT_REFRESH_EXPIRES_IN = '30d';
    const token = generateRefreshToken(MOCK_USER);
    const decoded = jwt.verify(token, TEST_SECRET);
    const ttl = decoded.exp - decoded.iat;
    expect(ttl).toBe(30 * 24 * 60 * 60); // 2592000 seconds
  });

  it('should set algorithm to HS256', () => {
    const token = generateRefreshToken(MOCK_USER);
    const header = JSON.parse(Buffer.from(token.split('.')[0], 'base64url').toString());
    expect(header.alg).toBe('HS256');
  });
});

describe('verifyToken', () => {
  it('should decode a valid access token and return payload', () => {
    const token = generateAccessToken(MOCK_USER);
    const decoded = verifyToken(token);
    expect(decoded.userId).toBe(MOCK_USER._id);
    expect(decoded.email).toBe(MOCK_USER.email);
    expect(decoded.role).toBe(MOCK_USER.role);
  });

  it('should throw JsonWebTokenError when token is signed with wrong secret', () => {
    const token = generateAccessToken(MOCK_USER);
    expect(() => {
      verifyToken(token.replace(/.$/, 'X')); // Tamper last character
    }).toThrow();
  });

  it('should throw TokenExpiredError when token is expired', () => {
    process.env.JWT_EXPIRES_IN = '-1s'; // Negative expiry = already expired
    const token = generateAccessToken(MOCK_USER);
    expect(() => {
      verifyToken(token);
    }).toThrow();
  });

  it('should throw when token string is malformed', () => {
    expect(() => {
      verifyToken('not.a.valid.token');
    }).toThrow();
  });

  it('should throw when token is null', () => {
    expect(() => {
      verifyToken(null);
    }).toThrow();
  });

  it('should throw when token is undefined', () => {
    expect(() => {
      verifyToken(undefined);
    }).toThrow();
  });

  it('should throw when token is an empty string', () => {
    expect(() => {
      verifyToken('');
    }).toThrow();
  });

  it('should throw when passed a refresh token', () => {
    const refreshToken = generateRefreshToken(MOCK_USER);
    expect(() => {
      verifyToken(refreshToken);
    }).toThrow('Refresh token cannot be used as access token');
  });
});

describe('verifyRefreshToken', () => {
  it('should decode a valid refresh token and return payload', () => {
    const token = generateRefreshToken(MOCK_USER);
    const decoded = verifyRefreshToken(token);
    expect(decoded.userId).toBe(MOCK_USER._id);
    expect(decoded.email).toBe(MOCK_USER.email);
    expect(decoded.type).toBe('refresh');
  });

  it('should throw when passed an access token (no type: "refresh" claim)', () => {
    const accessToken = generateAccessToken(MOCK_USER);
    expect(() => {
      verifyRefreshToken(accessToken);
    }).toThrow('Invalid token type');
  });

  it('should throw TokenExpiredError when refresh token is expired', () => {
    process.env.JWT_REFRESH_EXPIRES_IN = '-1s';
    const token = generateRefreshToken(MOCK_USER);
    expect(() => {
      verifyRefreshToken(token);
    }).toThrow();
  });

  it('should throw when token is tampered (wrong secret)', () => {
    const token = generateRefreshToken(MOCK_USER);
    expect(() => {
      verifyRefreshToken(token.replace(/.$/, 'X'));
    }).toThrow();
  });
});

describe('JWT_SECRET not set', () => {
  beforeEach(() => {
    delete process.env.JWT_SECRET;
  });

  it('generateAccessToken should throw when JWT_SECRET is missing', () => {
    expect(() => {
      generateAccessToken(MOCK_USER);
    }).toThrow();
  });

  it('generateRefreshToken should throw when JWT_SECRET is missing', () => {
    expect(() => {
      generateRefreshToken(MOCK_USER);
    }).toThrow();
  });

  it('verifyToken should throw when JWT_SECRET is missing', () => {
    process.env.JWT_SECRET = TEST_SECRET;
    const token = generateAccessToken(MOCK_USER);
    delete process.env.JWT_SECRET;
    expect(() => {
      verifyToken(token);
    }).toThrow('JWT_SECRET environment variable is not set');
  });

  it('verifyRefreshToken should throw when JWT_SECRET is missing', () => {
    process.env.JWT_SECRET = TEST_SECRET;
    const token = generateRefreshToken(MOCK_USER);
    delete process.env.JWT_SECRET;
    expect(() => {
      verifyRefreshToken(token);
    }).toThrow('JWT_SECRET environment variable is not set');
  });
});
