const { validatePassword, validateEmail, validatePasswordMatch } = require('../../src/utils/validators');

describe('validatePassword', () => {
  // --- Happy path ---
  it('should return null for a fully valid password', () => {
    expect(validatePassword('SecurePass123!')).toBeNull();
  });

  it('should return null for password exactly 8 chars with all requirements', () => {
    expect(validatePassword('Abcde1!x')).toBeNull();
  });

  it('should return null for all allowed special chars', () => {
    const specials = ['!', '@', '#', '$', '%', '^', '&', '*', '-', '_', '+', '='];
    for (const ch of specials) {
      expect(validatePassword(`Abcdefg1${ch}`)).toBeNull();
    }
  });

  it('should return null for longer valid passwords', () => {
    expect(validatePassword('VerySecurePassword123!')).toBeNull();
  });

  // --- Missing uppercase ---
  it('should return error message when no uppercase letter', () => {
    const result = validatePassword('securepass123!');
    expect(result).not.toBeNull();
    expect(result).toMatch(/uppercase/i);
  });

  // --- Missing lowercase ---
  it('should return error message when no lowercase letter', () => {
    const result = validatePassword('SECUREPASS123!');
    expect(result).not.toBeNull();
    expect(result).toMatch(/lowercase/i);
  });

  // --- Missing digit ---
  it('should return error message when no digit', () => {
    const result = validatePassword('SecurePass!!!');
    expect(result).not.toBeNull();
    expect(result).toMatch(/number|digit/i);
  });

  // --- Missing special char ---
  it('should return error message when no special character', () => {
    const result = validatePassword('SecurePass123');
    expect(result).not.toBeNull();
    expect(result).toMatch(/special/i);
  });

  // --- Too short ---
  it('should return error message when password is 7 chars (below boundary)', () => {
    const result = validatePassword('A1!abcd');
    expect(result).not.toBeNull();
    expect(result).toMatch(/8|character|length/i);
  });

  it('should return error message when password is 1 char', () => {
    expect(validatePassword('A')).not.toBeNull();
  });

  // --- Null / undefined / empty ---
  it('should return error message when password is null', () => {
    expect(validatePassword(null)).not.toBeNull();
  });

  it('should return error message when password is undefined', () => {
    expect(validatePassword(undefined)).not.toBeNull();
  });

  it('should return error message when password is empty string', () => {
    expect(validatePassword('')).not.toBeNull();
  });

  // --- Whitespace only ---
  it('should return error message when password is whitespace only', () => {
    expect(validatePassword('        ')).not.toBeNull();
  });

  // --- Disallowed special char ---
  it('should return error message when password uses special char not in allowed set', () => {
    const result = validatePassword('SecurePass1.');
    expect(result).not.toBeNull();
    expect(result).toMatch(/special/i);
  });

  it('should reject password with parenthesis (disallowed character)', () => {
    const result = validatePassword('SecurePass123!(');
    expect(result).not.toBeNull();
    expect(result).toMatch(/invalid|characters/i);
  });

  it('should reject password with space (disallowed character)', () => {
    const result = validatePassword('Secure Pass123!');
    expect(result).not.toBeNull();
  });

  // --- Check first failure message ---
  it('should check length before other requirements', () => {
    const result = validatePassword('a1!');
    expect(result).not.toBeNull();
    expect(result).toMatch(/8|character|length/i);
  });

  // --- Type validation ---
  it('should reject non-string password (number)', () => {
    expect(validatePassword(12345678)).not.toBeNull();
  });

  it('should reject non-string password (boolean)', () => {
    expect(validatePassword(true)).not.toBeNull();
  });

  it('should reject non-string password (object)', () => {
    expect(validatePassword({})).not.toBeNull();
  });

  it('should reject non-string password (array)', () => {
    expect(validatePassword([])).not.toBeNull();
  });
});

describe('validateEmail', () => {
  // --- Happy path ---
  it('should return null for a standard valid email', () => {
    expect(validateEmail('user@example.com')).toBeNull();
  });

  it('should return null for email with subdomain', () => {
    expect(validateEmail('john.doe@mail.company.co.uk')).toBeNull();
  });

  it('should return null for email with + tag', () => {
    expect(validateEmail('test+tag@domain.com')).toBeNull();
  });

  it('should return null for email with numbers in local part', () => {
    expect(validateEmail('user123@example.com')).toBeNull();
  });

  it('should return null for email with hyphens', () => {
    expect(validateEmail('user-name@example-domain.com')).toBeNull();
  });

  // --- Missing @ ---
  it('should return error message when email has no @ sign', () => {
    const result = validateEmail('invalidemail.com');
    expect(result).not.toBeNull();
    expect(result).toMatch(/email/i);
  });

  // --- No domain ---
  it('should return error message when email has no domain after @', () => {
    expect(validateEmail('user@')).not.toBeNull();
  });

  // --- No TLD ---
  it('should return error message when email has no TLD (no dot)', () => {
    expect(validateEmail('user@domain')).not.toBeNull();
  });

  // --- Space in email ---
  it('should return error message when email contains a space', () => {
    expect(validateEmail('user @example.com')).not.toBeNull();
    expect(validateEmail('user@ example.com')).not.toBeNull();
  });

  // --- No local part ---
  it('should return error message when local part is missing (@example.com)', () => {
    expect(validateEmail('@example.com')).not.toBeNull();
  });

  // --- Null / undefined / empty ---
  it('should return error message when email is null', () => {
    expect(validateEmail(null)).not.toBeNull();
  });

  it('should return error message when email is undefined', () => {
    expect(validateEmail(undefined)).not.toBeNull();
  });

  it('should return error message when email is empty string', () => {
    expect(validateEmail('')).not.toBeNull();
  });

  // --- Wrong type ---
  it('should return error message when email is a number', () => {
    expect(validateEmail(12345)).not.toBeNull();
  });


  // --- Multiple @ signs ---
  it('should return error message when email has multiple @ signs', () => {
    expect(validateEmail('user@@example.com')).not.toBeNull();
  });
});

describe('validatePasswordMatch', () => {
  it('should return null when passwords match', () => {
    expect(validatePasswordMatch('SecurePass123!', 'SecurePass123!')).toBeNull();
  });

  it('should return error message when passwords do not match', () => {
    const result = validatePasswordMatch('SecurePass123!', 'DifferentPass456!');
    expect(result).not.toBeNull();
    expect(result).toMatch(/match|confirm/i);
  });

  it('should return error message when confirmPassword is missing', () => {
    expect(validatePasswordMatch('SecurePass123!', undefined)).not.toBeNull();
  });

  it('should return error message when password is missing', () => {
    expect(validatePasswordMatch(undefined, 'SecurePass123!')).not.toBeNull();
  });

  it('should be case-sensitive', () => {
    const result = validatePasswordMatch('SecurePass123!', 'securePass123!');
    expect(result).not.toBeNull();
  });

  it('should reject non-string password argument', () => {
    expect(validatePasswordMatch(12345678, 'SecurePass123!')).not.toBeNull();
  });

  it('should reject non-string confirmPassword argument', () => {
    expect(validatePasswordMatch('SecurePass123!', 12345678)).not.toBeNull();
  });

  it('should reject when both are non-strings', () => {
    expect(validatePasswordMatch(123, 456)).not.toBeNull();
  });
});
