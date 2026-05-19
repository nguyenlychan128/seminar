// Simplified email format check (not full RFC 5322, but practical for most use cases)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password strength regex - Min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char
// IMPORTANT: Keep in sync with validatePassword() sequential checks + final regex test
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*\-_+=])[A-Za-z\d!@#$%^&*\-_+=]{8,}$/;

function validateEmail(email) {
  if (!email || typeof email !== 'string') return 'Email is required';
  if (!EMAIL_REGEX.test(email)) return 'Invalid email format';
  return null;
}

function validatePassword(password) {
  if (!password || typeof password !== 'string') return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least 1 uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain at least 1 lowercase letter';
  if (!/\d/.test(password)) return 'Password must contain at least 1 number';
  if (!/[!@#$%^&*\-_+=]/.test(password)) return 'Password must contain at least 1 special character (!@#$%^&*-_+=)';
  if (!PASSWORD_REGEX.test(password)) return 'Password contains invalid characters';
  return null;
}

function validatePasswordMatch(password, confirmPassword) {
  if (!password || typeof password !== 'string' || !confirmPassword || typeof confirmPassword !== 'string') {
    return 'Both passwords are required';
  }
  if (password !== confirmPassword) return 'Passwords do not match';
  return null;
}

module.exports = {
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  EMAIL_REGEX,
  PASSWORD_REGEX,
};
