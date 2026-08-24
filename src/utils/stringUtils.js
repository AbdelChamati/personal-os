/**
 * Truncate text to specified length
 */
export function truncate(text, maxLength = 100) {
  if (!text) return '';
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
}

/**
 * Capitalize first letter
 */
export function capitalize(text) {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Convert camelCase to Title Case
 */
export function camelCaseToTitleCase(text) {
  return text
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

/**
 * Highlight text in a string
 */
export function highlightText(text, searchTerm) {
  if (!searchTerm) return text;
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

/**
 * Strip HTML tags from text
 */
export function stripHtmlTags(text) {
  return text.replace(/<[^>]*>/g, '');
}

/**
 * Count words in text
 */
export function countWords(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).length;
}
