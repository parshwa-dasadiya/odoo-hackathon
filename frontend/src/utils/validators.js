/**
 * Validates if a value is present (non-empty)
 */
export const validateRequired = (value, fieldName = 'Field') => {
  if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldName} is required`;
  }
  return '';
};

/**
 * Validates if the email matches standard pattern
 */
export const validateEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!email) {
    return 'Email is required';
  }
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  return '';
};

/**
 * Validates password strength
 * Requires at least 8 characters, 1 uppercase, 1 lowercase, 1 number, and 1 special character
 */
export const validatePasswordStrength = (password) => {
  if (!password) {
    return 'Password is required';
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const errors = [];
  if (!hasUppercase) errors.push('one uppercase letter');
  if (!hasLowercase) errors.push('one lowercase letter');
  if (!hasNumber) errors.push('one number');
  if (!hasSpecial) errors.push('one special character');

  if (errors.length > 0) {
    return `Password must contain at least ${errors.join(', ')}`;
  }
  return '';
};

/**
 * Validates if confirm password matches password
 */
export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) {
    return 'Please confirm your password';
  }
  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }
  return '';
};
