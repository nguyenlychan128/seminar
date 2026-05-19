import { describe, it, expect } from 'vitest';
import { validateEmail, validateLoginForm, validatePassword, validateRegisterForm } from '../validation';

// ============================================================================
// validateEmail() Tests
// ============================================================================

describe('validateEmail()', () => {
  // --- Happy path ---
  describe('valid emails', () => {
    it('should return true for standard valid email', () => {
      expect(validateEmail('user@example.com')).toBe(true);
    });

    it('should return true for email with subdomain', () => {
      expect(validateEmail('user@mail.example.co.uk')).toBe(true);
    });

    it('should return true for email with plus-tag', () => {
      expect(validateEmail('user+tag@example.com')).toBe(true);
    });

    it('should return true for email with numeric local part', () => {
      expect(validateEmail('123@example.com')).toBe(true);
    });

    it('should return true for email with dots in local part', () => {
      expect(validateEmail('first.last@example.com')).toBe(true);
    });
  });

  // --- Error path ---
  describe('invalid emails', () => {
    it('should return false for email missing @', () => {
      expect(validateEmail('userexample.com')).toBe(false);
    });

    it('should return false for email missing domain', () => {
      expect(validateEmail('user@')).toBe(false);
    });

    it('should return false for email missing TLD', () => {
      expect(validateEmail('user@example')).toBe(false);
    });

    it('should return false for email with spaces', () => {
      expect(validateEmail('user @example.com')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(validateEmail('')).toBe(false);
    });

    it('should return false for email with multiple @ symbols', () => {
      expect(validateEmail('user@@example.com')).toBe(false);
    });

    it('should return false for email starting with @', () => {
      expect(validateEmail('@example.com')).toBe(false);
    });
  });

  // --- Edge cases ---
  describe('edge cases', () => {
    it('should return false for null', () => {
      expect(validateEmail(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(validateEmail(undefined)).toBe(false);
    });

    it('should return false for number value', () => {
      expect(validateEmail(12345)).toBe(false);
    });

    it('should return false for object value', () => {
      expect(validateEmail({})).toBe(false);
    });

    it('should return false for array value', () => {
      expect(validateEmail([])).toBe(false);
    });

    it('should handle email with leading/trailing whitespace', () => {
      // validateEmail trims the email
      expect(validateEmail('  user@example.com  ')).toBe(true);
    });
  });
});

// ============================================================================
// validateLoginForm() Tests
// ============================================================================

describe('validateLoginForm()', () => {
  // --- Happy path ---
  describe('valid input', () => {
    it('should return empty object for valid email and password', () => {
      const errors = validateLoginForm('user@example.com', 'SecurePass1!');
      expect(errors).toEqual({});
      expect(Object.keys(errors).length).toBe(0);
    });

    it('should return empty object for valid email with long password', () => {
      const errors = validateLoginForm('user@example.com', 'VeryLongPassword123!@#');
      expect(errors).toEqual({});
    });

    it('should return empty object for email with plus-tag', () => {
      const errors = validateLoginForm('user+tag@example.com', 'ValidPass1!');
      expect(errors).toEqual({});
    });
  });

  // --- Email validation errors ---
  describe('email validation', () => {
    it('should return error when email is empty string', () => {
      const errors = validateLoginForm('', 'ValidPass1!');
      expect(errors).toHaveProperty('email');
      expect(errors.email).toBe('Email is required');
    });

    it('should return error when email is null', () => {
      const errors = validateLoginForm(null, 'ValidPass1!');
      expect(errors).toHaveProperty('email');
      expect(errors.email).toBe('Email is required');
    });

    it('should return error when email is undefined', () => {
      const errors = validateLoginForm(undefined, 'ValidPass1!');
      expect(errors).toHaveProperty('email');
      expect(errors.email).toBe('Email is required');
    });

    it('should return error when email format is invalid', () => {
      const errors = validateLoginForm('not-an-email', 'ValidPass1!');
      expect(errors).toHaveProperty('email');
      expect(errors.email).toBe('Invalid email format');
    });

    it('should return error when email is only whitespace', () => {
      const errors = validateLoginForm('   ', 'ValidPass1!');
      expect(errors).toHaveProperty('email');
    });
  });

  // --- Password validation errors ---
  describe('password validation', () => {
    it('should return error when password is empty string', () => {
      const errors = validateLoginForm('user@example.com', '');
      expect(errors).toHaveProperty('password');
      expect(errors.password).toBe('Password is required');
    });

    it('should return error when password is null', () => {
      const errors = validateLoginForm('user@example.com', null);
      expect(errors).toHaveProperty('password');
      expect(errors.password).toBe('Password is required');
    });

    it('should return error when password is undefined', () => {
      const errors = validateLoginForm('user@example.com', undefined);
      expect(errors).toHaveProperty('password');
      expect(errors.password).toBe('Password is required');
    });

    it('should accept password of any length (backend validates strength)', () => {
      const errors = validateLoginForm('user@example.com', 'x');
      expect(errors).not.toHaveProperty('password');
    });

    it('should accept password with exactly 8 characters', () => {
      const errors = validateLoginForm('user@example.com', 'Exactly8');
      expect(errors).not.toHaveProperty('password');
    });

    it('should accept password with 9+ characters', () => {
      const errors = validateLoginForm('user@example.com', 'LongerPass');
      expect(errors).not.toHaveProperty('password');
    });

    it('should accept passwords with special characters', () => {
      const errors = validateLoginForm('user@example.com', 'Pass!@#$%');
      expect(errors).not.toHaveProperty('password');
    });
  });

  // --- Multiple errors ---
  describe('multiple errors', () => {
    it('should return both errors when both fields are empty', () => {
      const errors = validateLoginForm('', '');
      expect(errors).toHaveProperty('email');
      expect(errors).toHaveProperty('password');
      expect(Object.keys(errors).length).toBe(2);
    });

    it('should return email error when email invalid and password is non-empty', () => {
      const errors = validateLoginForm('bad', '123');
      expect(errors).toHaveProperty('email');
      expect(errors.email).toBe('Invalid email format');
      // '123' is non-empty, so no password error (login doesn't validate password strength)
      expect(errors).not.toHaveProperty('password');
    });

    it('should return email error when email missing and password is non-empty', () => {
      const errors = validateLoginForm('', 'short');
      expect(errors).toHaveProperty('email');
      expect(errors.email).toBe('Email is required');
      // 'short' is non-empty, so no password error (login doesn't validate password strength)
      expect(errors).not.toHaveProperty('password');
    });
  });

  // --- Edge cases ---
  describe('edge cases', () => {
    it('should not mutate input arguments', () => {
      const email = 'user@example.com';
      const password = 'Password123';
      const emailBefore = email;
      const passwordBefore = password;

      validateLoginForm(email, password);

      expect(email).toBe(emailBefore);
      expect(password).toBe(passwordBefore);
    });

    it('should trim whitespace from email before validation', () => {
      const errors = validateLoginForm('  user@example.com  ', 'ValidPass1!');
      expect(errors).toEqual({});
    });

    it('should handle very long email addresses', () => {
      const longEmail = 'a'.repeat(100) + '@example.com';
      const errors = validateLoginForm(longEmail, 'ValidPass1!');
      expect(errors).toEqual({});
    });

    it('should handle very long passwords', () => {
      const longPassword = 'P' + 'a'.repeat(1000);
      const errors = validateLoginForm('user@example.com', longPassword);
      expect(errors).toEqual({});
    });

    it('should handle passwords with only spaces as valid non-empty', () => {
      // "        " is 8 spaces - a non-empty string, accepted since login doesn't validate strength
      const errors = validateLoginForm('user@example.com', '        ');
      expect(errors).not.toHaveProperty('password');
    });
  });
});

// ============================================================================
// validatePassword() Tests
// ============================================================================

describe('validatePassword()', () => {
  describe('valid passwords (all 5 criteria met)', () => {
    it('should return true for a strong password with all criteria', () => {
      expect(validatePassword('StrongP@ss1')).toBe(true);
    });

    it('should return true for exactly 8 chars with all criteria', () => {
      expect(validatePassword('Abcde1!a')).toBe(true);
    });

    it('should return true for password with multiple special chars', () => {
      expect(validatePassword('Secret1!@#')).toBe(true);
    });
  });

  describe('invalid passwords — missing criteria', () => {
    it('should return false for password under 8 chars', () => {
      expect(validatePassword('Ab1!')).toBe(false);
    });

    it('should return false for password missing uppercase', () => {
      expect(validatePassword('secret1!abc')).toBe(false);
    });

    it('should return false for password missing lowercase', () => {
      expect(validatePassword('SECRET1!ABC')).toBe(false);
    });

    it('should return false for password missing number', () => {
      expect(validatePassword('SecretPass!')).toBe(false);
    });

    it('should return false for password missing special char', () => {
      expect(validatePassword('SecretPass1')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(validatePassword('')).toBe(false);
    });

    it('should return false for null', () => {
      expect(validatePassword(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(validatePassword(undefined)).toBe(false);
    });
  });

  describe('strength scoring', () => {
    it('should pass for "Medium1!" — has all 5 criteria', () => {
      expect(validatePassword('Medium1!')).toBe(true);
    });
  });
});

// ============================================================================
// validateRegisterForm() Tests
// ============================================================================

describe('validateRegisterForm()', () => {
  describe('valid input', () => {
    it('should return empty errors for valid email, strong password, matching confirm', () => {
      const errors = validateRegisterForm('user@example.com', 'StrongP@ss1', 'StrongP@ss1');
      expect(errors).toEqual({});
    });
  });

  describe('email validation', () => {
    it('should return email error when email is empty', () => {
      const errors = validateRegisterForm('', 'StrongP@ss1', 'StrongP@ss1');
      expect(errors.email).toBe('Email is required');
    });

    it('should return email error for invalid email format', () => {
      const errors = validateRegisterForm('not-valid', 'StrongP@ss1', 'StrongP@ss1');
      expect(errors.email).toBe('Invalid email format');
    });

    it('should return email error when email is null', () => {
      const errors = validateRegisterForm(null, 'StrongP@ss1', 'StrongP@ss1');
      expect(errors.email).toBe('Email is required');
    });
  });

  describe('password validation', () => {
    it('should return password error when password is empty', () => {
      const errors = validateRegisterForm('user@example.com', '', 'StrongP@ss1');
      expect(errors.password).toBe('Password is required');
    });

    it('should return password error for weak password', () => {
      const errors = validateRegisterForm('user@example.com', 'weakpass', 'weakpass');
      expect(errors.password).toBe(
        'Password must have min 8 chars, uppercase, lowercase, number, special char'
      );
    });

    it('should return password error for password missing special char', () => {
      const errors = validateRegisterForm('user@example.com', 'SecretPass1', 'SecretPass1');
      expect(errors.password).toContain('special char');
    });

    it('should return password error when password is null', () => {
      const errors = validateRegisterForm('user@example.com', null, null);
      expect(errors.password).toBe('Password is required');
    });
  });

  describe('confirmPassword validation', () => {
    it('should return confirmPassword error when confirmPassword is empty', () => {
      const errors = validateRegisterForm('user@example.com', 'StrongP@ss1', '');
      expect(errors.confirmPassword).toBe('Please confirm your password');
    });

    it('should return confirmPassword error when passwords do not match', () => {
      const errors = validateRegisterForm('user@example.com', 'StrongP@ss1', 'DifferentP@ss1');
      expect(errors.confirmPassword).toBe('Passwords do not match');
    });

    it('should return confirmPassword error when confirmPassword is null', () => {
      const errors = validateRegisterForm('user@example.com', 'StrongP@ss1', null);
      expect(errors.confirmPassword).toBe('Please confirm your password');
    });
  });

  describe('multiple errors', () => {
    it('should return errors for all three fields when all are empty', () => {
      const errors = validateRegisterForm('', '', '');
      expect(errors).toHaveProperty('email');
      expect(errors).toHaveProperty('password');
      expect(errors).toHaveProperty('confirmPassword');
      expect(Object.keys(errors).length).toBe(3);
    });

    it('should return both password and confirmPassword errors independently', () => {
      const errors = validateRegisterForm('user@example.com', 'weak', 'different');
      expect(errors).toHaveProperty('password');
      expect(errors).toHaveProperty('confirmPassword');
    });
  });
});
