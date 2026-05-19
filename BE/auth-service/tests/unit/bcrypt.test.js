const { hashPassword, comparePassword } = require('../../src/utils/bcrypt');

describe('Bcrypt utilities', () => {
  const password = 'SecurePass123!';

  it('should hash a password', async () => {
    const hash = await hashPassword(password);
    expect(hash).toBeDefined();
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(50);
    expect(hash).toMatch(/^\$2[ab]\$/);
  });

  it('should compare password with hash correctly', async () => {
    const hash = await hashPassword(password);
    const isMatch = await comparePassword(password, hash);
    expect(isMatch).toBe(true);
  });

  it('should not match incorrect password with hash', async () => {
    const hash = await hashPassword(password);
    const isMatch = await comparePassword('WrongPassword123!', hash);
    expect(isMatch).toBe(false);
  });

  it('should use BCRYPT_ROUNDS from env variable', async () => {
    const originalRounds = process.env.BCRYPT_ROUNDS;
    try {
      process.env.BCRYPT_ROUNDS = '5';
      const hash = await hashPassword(password);
      expect(hash).toMatch(/\$2[ab]\$05\$/);
    } finally {
      if (originalRounds === undefined) {
        delete process.env.BCRYPT_ROUNDS;
      } else {
        process.env.BCRYPT_ROUNDS = originalRounds;
      }
    }
  });

  it('should default to 10 rounds if BCRYPT_ROUNDS not set', async () => {
    const originalRounds = process.env.BCRYPT_ROUNDS;
    try {
      delete process.env.BCRYPT_ROUNDS;
      const hash = await hashPassword(password);
      expect(hash).toMatch(/\$2[ab]\$10\$/);
    } finally {
      if (originalRounds !== undefined) {
        process.env.BCRYPT_ROUNDS = originalRounds;
      }
    }
  });
});
