// Validation constants
export const VALIDATION_RULES = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 50,
    PATTERN: /^[a-zA-Z0-9_-]+$/,
  },
  PASSWORD: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 128,
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  TEXT: {
    MAX_LENGTH: 10000,
  },
} as const

// Validation functions
export function isValidEmail(email: string): boolean {
  return VALIDATION_RULES.EMAIL.PATTERN.test(email)
}

export function isValidUsername(username: string): boolean {
  return (
    username.length >= VALIDATION_RULES.USERNAME.MIN_LENGTH &&
    username.length <= VALIDATION_RULES.USERNAME.MAX_LENGTH &&
    VALIDATION_RULES.USERNAME.PATTERN.test(username)
  )
}

export function isValidPassword(password: string): boolean {
  return (
    password.length >= VALIDATION_RULES.PASSWORD.MIN_LENGTH &&
    password.length <= VALIDATION_RULES.PASSWORD.MAX_LENGTH
  )
}

export function isValidText(text: string): boolean {
  return text.length <= VALIDATION_RULES.TEXT.MAX_LENGTH
}

// Validation error messages
export const VALIDATION_MESSAGES = {
  EMAIL: {
    REQUIRED: 'Email is required',
    INVALID: 'Invalid email format',
  },
  USERNAME: {
    REQUIRED: 'Username is required',
    MIN_LENGTH: `Username must be at least ${VALIDATION_RULES.USERNAME.MIN_LENGTH} characters`,
    MAX_LENGTH: `Username must be less than ${VALIDATION_RULES.USERNAME.MAX_LENGTH} characters`,
    INVALID: 'Username can only contain letters, numbers, underscores, and hyphens',
  },
  PASSWORD: {
    REQUIRED: 'Password is required',
    MIN_LENGTH: `Password must be at least ${VALIDATION_RULES.PASSWORD.MIN_LENGTH} characters`,
    MAX_LENGTH: `Password must be less than ${VALIDATION_RULES.PASSWORD.MAX_LENGTH} characters`,
  },
  TEXT: {
    REQUIRED: 'Text is required',
    EMPTY: 'Text cannot be empty',
    MAX_LENGTH: `Text must be less than ${VALIDATION_RULES.TEXT.MAX_LENGTH} characters`,
  },
} as const