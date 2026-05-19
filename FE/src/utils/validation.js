// Email validation using simple regex (frontend only, backend validates RFC 5322)
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

// Password strength validation for registration
// Must have: min 8 chars, uppercase, lowercase, number, special char
// Leading/trailing whitespace is not allowed
export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') return false;
  if (password !== password.trim()) return false;
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  return hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
};

// Login form validation
export const validateLoginForm = (email, password) => {
  const errors = {};

  // Email validation
  if (!email || email.trim() === '') {
    errors.email = 'Email is required';
  } else if (!validateEmail(email)) {
    errors.email = 'Invalid email format';
  }

  // Password validation (login only requires non-empty)
  // Backend validates password strength on registration
  if (!password || password === '') {
    errors.password = 'Password is required';
  }

  return errors;
};

// Register form validation
export const validateRegisterForm = (email, password, confirmPassword) => {
  const errors = {};

  if (!email || email.trim() === '') {
    errors.email = 'Email is required';
  } else if (!validateEmail(email)) {
    errors.email = 'Invalid email format';
  }

  if (!password) {
    errors.password = 'Password is required';
  } else if (!validatePassword(password)) {
    errors.password = 'Password must have min 8 chars, uppercase, lowercase, number, special char';
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return errors;
};
