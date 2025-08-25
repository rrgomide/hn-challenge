/**
 * Sanitizes a string for safe JSON serialization
 * @param text The text to sanitize
 * @returns The sanitized text
 */
export function sanitizeJsonString(text: string): string {
  return text.replace(/["\\/\b\f\n\r\t]/g, function (match: string) {
    switch (match) {
      case '"':
        return '\\"'
      case '\\':
        return '\\\\'
      case '/':
        return '\\/'
      case '\b':
        return '\\b'
      case '\f':
        return '\\f'
      case '\n':
        return '\\n'
      case '\r':
        return '\\r'
      case '\t':
        return '\\t'
      default:
        return match
    }
  })
}

/**
 * Sanitizes HTML by removing script tags and normalizing whitespace
 * @param html The HTML string to sanitize
 * @returns The sanitized text
 */
export function sanitizeHtml(html: string): string {
  // Remove script tags and their content completely
  let sanitized = html.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ''
  )

  // Remove other HTML tags but keep their content
  sanitized = sanitized.replace(/<[^>]*>/g, '')

  // Normalize whitespace that appears to be from HTML
  sanitized = sanitized.replace(/[ \t]+/g, ' ').trim()

  return sanitized
}

/**
 * Escapes special characters in a string for use in regular expressions
 * @param string The string to escape
 * @returns The escaped string
 */
export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Truncates text to a specified length and adds ellipsis if needed
 * @param text The text to truncate
 * @param maxLength The maximum length
 * @returns The truncated text
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}
