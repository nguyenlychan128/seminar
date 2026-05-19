'use strict';

const jwt = require('jsonwebtoken');
const { authenticate } = require('../../src/middleware/authenticate');
const { requireRole } = require('../../src/middleware/authorize');

const TEST_SECRET = 'test-secret-at-least-32-characters-long!!';

const VALID_USER_PAYLOAD = {
  userId: '507f1f77bcf86cd799439011',
  email: 'alice@example.com',
  role: 'User',
};

const VALID_ADMIN_PAYLOAD = {
  userId: '507f1f77bcf86cd799439022',
  email: 'admin@example.com',
  role: 'Admin',
};

function makeAccessToken(overrides = {}) {
  return jwt.sign(
    { ...VALID_USER_PAYLOAD, ...overrides },
    TEST_SECRET,
    { expiresIn: '15m', algorithm: 'HS256' }
  );
}

function makeExpiredAccessToken(overrides = {}) {
  return jwt.sign(
    { ...VALID_USER_PAYLOAD, ...overrides },
    TEST_SECRET,
    { expiresIn: '-1s', algorithm: 'HS256' }
  );
}

function makeRefreshToken(overrides = {}) {
  return jwt.sign(
    { userId: VALID_USER_PAYLOAD.userId, email: VALID_USER_PAYLOAD.email, type: 'refresh', ...overrides },
    TEST_SECRET,
    { expiresIn: '7d', algorithm: 'HS256' }
  );
}

function makeTokenWithWrongSecret(overrides = {}) {
  return jwt.sign(
    { ...VALID_USER_PAYLOAD, ...overrides },
    'completely-wrong-secret-xxxxxxxxxxxxxx',
    { expiresIn: '15m', algorithm: 'HS256' }
  );
}

function mockReq(headerValue) {
  return {
    get: (name) => (name === 'Authorization' ? headerValue : undefined),
    user: undefined,
  };
}

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

const mockNext = jest.fn();

beforeEach(() => {
  process.env.JWT_SECRET = TEST_SECRET;
  mockNext.mockClear();
});

afterEach(() => {
  delete process.env.JWT_SECRET;
});

describe('authenticate middleware', () => {
  // --- Happy path ---

  it('should call next() when a valid Bearer access token is provided', () => {
    const token = makeAccessToken();
    const req = mockReq(`Bearer ${token}`);
    const res = mockRes();

    authenticate(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('should inject req.user with userId, email, and role from token payload', () => {
    const token = makeAccessToken();
    const req = mockReq(`Bearer ${token}`);
    const res = mockRes();

    authenticate(req, res, mockNext);

    expect(req.user).toBeDefined();
    expect(req.user.userId).toBe(VALID_USER_PAYLOAD.userId);
    expect(req.user.email).toBe(VALID_USER_PAYLOAD.email);
    expect(req.user.role).toBe(VALID_USER_PAYLOAD.role);
  });

  it('should inject req.user.userId as a string', () => {
    const token = makeAccessToken();
    const req = mockReq(`Bearer ${token}`);
    const res = mockRes();

    authenticate(req, res, mockNext);

    expect(typeof req.user.userId).toBe('string');
  });

  it('should inject req.user.email matching the token email claim', () => {
    const token = makeAccessToken();
    const req = mockReq(`Bearer ${token}`);
    const res = mockRes();

    authenticate(req, res, mockNext);

    expect(req.user.email).toBe(VALID_USER_PAYLOAD.email);
  });

  it('should inject req.user.role matching the token role claim', () => {
    const token = makeAccessToken();
    const req = mockReq(`Bearer ${token}`);
    const res = mockRes();

    authenticate(req, res, mockNext);

    expect(req.user.role).toBe(VALID_USER_PAYLOAD.role);
  });

  it('should not call res.status() when token is valid', () => {
    const token = makeAccessToken();
    const req = mockReq(`Bearer ${token}`);
    const res = mockRes();

    authenticate(req, res, mockNext);

    expect(res.status).not.toHaveBeenCalled();
  });

  // --- Missing / malformed Authorization header ---

  it('should return 401 with "Missing authorization token" when Authorization header is absent', () => {
    const req = mockReq(undefined);
    const res = mockRes();

    authenticate(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Missing authorization token' });
  });

  it('should return 401 with "Missing authorization token" when Authorization header is null', () => {
    const req = mockReq(null);
    const res = mockRes();

    authenticate(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Missing authorization token' });
  });

  it('should return 401 with "Missing authorization token" when Authorization header is empty string', () => {
    const req = mockReq('');
    const res = mockRes();

    authenticate(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Missing authorization token' });
  });

  it('should return 401 with "Invalid authorization header" when header has no Bearer prefix', () => {
    const token = makeAccessToken();
    const req = mockReq(`Token ${token}`);
    const res = mockRes();

    authenticate(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid authorization header' });
  });

  it('should return 401 with "Invalid authorization header" when header is just "Bearer" with no token', () => {
    const req = mockReq('Bearer');
    const res = mockRes();

    authenticate(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid authorization header' });
  });

  it('should return 401 with "Invalid authorization header" when header has extra parts', () => {
    const token = makeAccessToken();
    const req = mockReq(`Bearer ${token} extra`);
    const res = mockRes();

    authenticate(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid authorization header' });
  });

  it('should return 401 with "Invalid authorization header" when header is "bearer <token>" (lowercase scheme)', () => {
    const token = makeAccessToken();
    const req = mockReq(`bearer ${token}`);
    const res = mockRes();

    authenticate(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid authorization header' });
  });

  it('should not call next() when Authorization header is missing', () => {
    const req = mockReq(undefined);
    const res = mockRes();

    authenticate(req, res, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should not call next() when Authorization header format is invalid', () => {
    const token = makeAccessToken();
    const req = mockReq(`Token ${token}`);
    const res = mockRes();

    authenticate(req, res, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
  });

  // --- Invalid signature ---

  it('should return 401 with "Invalid token signature" when token is signed with wrong secret', () => {
    const token = makeTokenWithWrongSecret();
    const req = mockReq(`Bearer ${token}`);
    const res = mockRes();

    authenticate(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token signature' });
  });

  it('should return 401 with "Invalid token signature" when token string is tampered', () => {
    const token = makeAccessToken();
    const tamperedToken = token.slice(0, -1) + 'X';
    const req = mockReq(`Bearer ${tamperedToken}`);
    const res = mockRes();

    authenticate(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token signature' });
  });

  it('should return 401 with "Invalid token signature" when token is a random non-JWT string', () => {
    const req = mockReq('Bearer randomstringnotajwt');
    const res = mockRes();

    authenticate(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token signature' });
  });

  it('should return 401 with "Invalid token signature" when token has only two segments', () => {
    const req = mockReq('Bearer header.payload');
    const res = mockRes();

    authenticate(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token signature' });
  });

  it('should not call next() when token signature is invalid', () => {
    const token = makeTokenWithWrongSecret();
    const req = mockReq(`Bearer ${token}`);
    const res = mockRes();

    authenticate(req, res, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
  });

  // --- Expired token ---

  it('should return 401 with "Token expired" when access token is past its expiry time', () => {
    const token = makeExpiredAccessToken();
    const req = mockReq(`Bearer ${token}`);
    const res = mockRes();

    authenticate(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token expired' });
  });

  it('should not call next() when token is expired', () => {
    const token = makeExpiredAccessToken();
    const req = mockReq(`Bearer ${token}`);
    const res = mockRes();

    authenticate(req, res, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
  });

  // --- Refresh token used as access token ---

  it('should return 401 when a refresh token (type="refresh") is provided instead of access token', () => {
    const token = makeRefreshToken();
    const req = mockReq(`Bearer ${token}`);
    const res = mockRes();

    authenticate(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should not inject req.user when a refresh token is provided', () => {
    const token = makeRefreshToken();
    const req = mockReq(`Bearer ${token}`);
    const res = mockRes();

    authenticate(req, res, mockNext);

    expect(req.user).toBeUndefined();
  });

  it('should not call next() when a refresh token is used as Bearer token', () => {
    const token = makeRefreshToken();
    const req = mockReq(`Bearer ${token}`);
    const res = mockRes();

    authenticate(req, res, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
  });

  // --- JWT_SECRET not configured ---

  it('should not crash when JWT_SECRET is not set', () => {
    delete process.env.JWT_SECRET;
    const token = makeAccessToken();
    const req = mockReq(`Bearer ${token}`);
    const res = mockRes();

    expect(() => {
      authenticate(req, res, mockNext);
    }).not.toThrow();
  });

  // --- req.user object structure ---

  it('should inject exactly three fields on req.user: userId, email, role', () => {
    const token = makeAccessToken();
    const req = mockReq(`Bearer ${token}`);
    const res = mockRes();

    authenticate(req, res, mockNext);

    const keys = Object.keys(req.user);
    expect(keys.length).toBe(3);
    expect(keys).toContain('userId');
    expect(keys).toContain('email');
    expect(keys).toContain('role');
  });

  it('should not inject iat or exp onto req.user', () => {
    const token = makeAccessToken();
    const req = mockReq(`Bearer ${token}`);
    const res = mockRes();

    authenticate(req, res, mockNext);

    expect(req.user).not.toHaveProperty('iat');
    expect(req.user).not.toHaveProperty('exp');
  });
});

describe('requireRole middleware', () => {
  // --- Returns a function ---

  it('should return a function when called with an array of roles', () => {
    const middleware = requireRole(['Admin']);
    expect(typeof middleware).toBe('function');
  });

  it('should return a function when called with an empty array', () => {
    const middleware = requireRole([]);
    expect(typeof middleware).toBe('function');
  });

  // --- Happy path: role is allowed ---

  it('should call next() when req.user.role is in allowedRoles (exact match "Admin")', () => {
    const middleware = requireRole(['Admin']);
    const req = { user: { role: 'Admin' } };
    const res = mockRes();

    middleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('should call next() when req.user.role is "User" and allowedRoles includes "User"', () => {
    const middleware = requireRole(['User']);
    const req = { user: { role: 'User' } };
    const res = mockRes();

    middleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('should call next() when req.user.role is "Admin" and allowedRoles includes both roles', () => {
    const middleware = requireRole(['User', 'Admin']);
    const req = { user: { role: 'Admin' } };
    const res = mockRes();

    middleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('should call next() when req.user.role is "User" and allowedRoles includes both roles', () => {
    const middleware = requireRole(['User', 'Admin']);
    const req = { user: { role: 'User' } };
    const res = mockRes();

    middleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('should not call res.status() when role is allowed', () => {
    const middleware = requireRole(['Admin']);
    const req = { user: { role: 'Admin' } };
    const res = mockRes();

    middleware(req, res, mockNext);

    expect(res.status).not.toHaveBeenCalled();
  });

  // --- 403 Forbidden: role not in allowedRoles ---

  it('should return 403 with "Forbidden" when req.user.role is "User" but only "Admin" allowed', () => {
    const middleware = requireRole(['Admin']);
    const req = { user: { role: 'User' } };
    const res = mockRes();

    middleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden' });
  });

  it('should return 403 with "Forbidden" when req.user.role is "Admin" but only "User" allowed', () => {
    const middleware = requireRole(['User']);
    const req = { user: { role: 'Admin' } };
    const res = mockRes();

    middleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden' });
  });

  it('should return 403 with "Forbidden" when allowedRoles is an empty array', () => {
    const middleware = requireRole([]);
    const req = { user: { role: 'User' } };
    const res = mockRes();

    middleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden' });
  });

  it('should not call next() when role is not in allowedRoles', () => {
    const middleware = requireRole(['Admin']);
    const req = { user: { role: 'User' } };
    const res = mockRes();

    middleware(req, res, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
  });

  // --- 401 Unauthorized: req.user is missing ---

  it('should return 401 with "Unauthorized" when req.user is undefined', () => {
    const middleware = requireRole(['Admin']);
    const req = { user: undefined };
    const res = mockRes();

    middleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
  });

  it('should return 401 with "Unauthorized" when req.user is null', () => {
    const middleware = requireRole(['Admin']);
    const req = { user: null };
    const res = mockRes();

    middleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
  });

  it('should return 401 with "Unauthorized" when req object has no user property', () => {
    const middleware = requireRole(['Admin']);
    const req = {};
    const res = mockRes();

    middleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
  });

  it('should not call next() when req.user is missing', () => {
    const middleware = requireRole(['Admin']);
    const req = {};
    const res = mockRes();

    middleware(req, res, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
  });

  // --- Role case sensitivity ---

  it('should return 403 when role is "user" (lowercase) but allowedRoles has "User"', () => {
    const middleware = requireRole(['User']);
    const req = { user: { role: 'user' } };
    const res = mockRes();

    middleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('should return 403 when role is "admin" (lowercase) but allowedRoles has "Admin"', () => {
    const middleware = requireRole(['Admin']);
    const req = { user: { role: 'admin' } };
    const res = mockRes();

    middleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  // --- Middleware chaining correctness ---

  it('should not mutate req.user when role is allowed', () => {
    const middleware = requireRole(['Admin']);
    const originalUser = { role: 'Admin', userId: '123' };
    const req = { user: { ...originalUser } };
    const res = mockRes();

    middleware(req, res, mockNext);

    expect(req.user).toEqual(originalUser);
  });
});
