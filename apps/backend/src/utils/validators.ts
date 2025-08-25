import { ValidationError } from './errors.js'

export function validateRequired(value: unknown, fieldName: string): void {
  if (value === undefined || value === null) {
    throw new ValidationError(`${fieldName} is required`)
  }
}

export function validateString(value: unknown, fieldName: string, minLength: number = 1): void {
  validateRequired(value, fieldName)
  
  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} must be a string`)
  }
  
  if (value.trim().length < minLength) {
    throw new ValidationError(`${fieldName} must be at least ${minLength} character${minLength === 1 ? '' : 's'} long`)
  }
}

export function validateEmail(email: string): void {
  validateString(email, 'email')
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format')
  }
}

export function validateObjectId(id: string, fieldName: string = 'id'): void {
  validateString(id, fieldName)
  
  // MongoDB ObjectId validation (24 character hex string)
  const objectIdRegex = /^[0-9a-fA-F]{24}$/
  if (!objectIdRegex.test(id)) {
    throw new ValidationError(`Invalid ${fieldName} format`)
  }
}

export function validateUUID(id: string, fieldName: string = 'id'): void {
  validateString(id, fieldName)
  
  // UUID v4 validation (8-4-4-4-12 format with hyphens)
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i
  if (!uuidRegex.test(id)) {
    throw new ValidationError(`Invalid ${fieldName} format`)
  }
}

export function validateBoolean(value: unknown, fieldName: string, required: boolean = false): boolean {
  if (value === undefined || value === null) {
    if (required) {
      throw new ValidationError(`${fieldName} is required`)
    }
    return false
  }
  
  return Boolean(value)
}

export function sanitizeText(text: string): string {
  // Remove script tags and their content completely
  let sanitized = text.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ''
  )

  // Remove other HTML tags but keep their content
  sanitized = sanitized.replace(/<[^>]*>/g, '')

  // Normalize whitespace that appears to be from HTML
  sanitized = sanitized.replace(/[ \t]+/g, ' ').trim()

  return sanitized
}