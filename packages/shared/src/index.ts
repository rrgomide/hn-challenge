export function greet(name: string): string {
  return `Hello, ${name}!`
}

export function sanitizeJsonString(text: string) {
  return text.replace(/["\\\/\b\f\n\r\t]/g, function (match) {
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
