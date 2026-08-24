/**
 * Validate email format
 */
export function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Validate password strength
 */
export function validatePassword(password) {
  const errors = [];

  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain a lowercase letter');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain an uppercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain a number');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push('Password must contain a special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate task title
 */
export function validateTaskTitle(title) {
  if (!title || !title.trim()) {
    return { isValid: false, error: 'Title is required' };
  }
  if (title.length > 500) {
    return { isValid: false, error: 'Title must be less than 500 characters' };
  }
  return { isValid: true };
}

/**
 * Validate task description
 */
export function validateTaskDescription(description) {
  if (description && description.length > 5000) {
    return { isValid: false, error: 'Description must be less than 5000 characters' };
  }
  return { isValid: true };
}

/**
 * Validate estimated minutes
 */
export function validateEstimatedMinutes(minutes) {
  if (!minutes) return { isValid: true };
  if (isNaN(minutes) || minutes < 1) {
    return { isValid: false, error: 'Must be a positive number' };
  }
  if (minutes > 10080) {
    // 10080 = 1 week in minutes
    return { isValid: false, error: 'Cannot exceed 1 week' };
  }
  return { isValid: true };
}
