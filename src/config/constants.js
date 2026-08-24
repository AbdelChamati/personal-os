/**
 * API configuration
 */
export const API_CONFIG = {
  BASE_URL: '/api',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

/**
 * Task categories
 */
export const TASK_CATEGORIES = [
  'Personal',
  'Professional',
  'Family',
  'Home',
  'Finance',
  'Shopping',
  'Health',
  'Other',
];

/**
 * Task priorities
 */
export const TASK_PRIORITIES = [
  { value: 'low', label: 'Low', icon: '🟢', color: '#2ecc71' },
  { value: 'medium', label: 'Medium', icon: '🟡', color: '#f39c12' },
  { value: 'high', label: 'High', icon: '🔴', color: '#e74c3c' },
];

/**
 * Task statuses
 */
export const TASK_STATUSES = [
  { value: 'pending', label: 'Pending', icon: '⭕' },
  { value: 'completed', label: 'Completed', icon: '✅' },
  { value: 'archived', label: 'Archived', icon: '📦' },
];

/**
 * Recurrence patterns
 */
export const RECURRENCE_PATTERNS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Biweekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

/**
 * Reminder channels
 */
export const REMINDER_CHANNELS = [
  { value: 'in-app', label: 'In App', icon: '🔔' },
  { value: 'email', label: 'Email', icon: '📧' },
  { value: 'sms', label: 'SMS', icon: '📱' },
];

/**
 * Password requirements
 */
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
};

/**
 * API error messages
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'You are not authorized to access this resource.',
  FORBIDDEN: 'You do not have permission to access this resource.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNKNOWN_ERROR: 'An unknown error occurred. Please try again.',
};

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  TASK_CREATED: 'Task created successfully',
  TASK_UPDATED: 'Task updated successfully',
  TASK_DELETED: 'Task deleted successfully',
  TASK_COMPLETED: 'Task completed successfully',
  LOGIN_SUCCESS: 'Logged in successfully',
  LOGOUT_SUCCESS: 'Logged out successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  PASSWORD_CHANGED: 'Password changed successfully',
};
