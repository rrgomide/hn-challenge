export interface Snippet {
  id: string
  text: string
  summary: string
  ownerId: string
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateSnippetRequest {
  text: string
  isPublic?: boolean
}

export type UserRole = 'user' | 'moderator' | 'admin'

export interface User {
  id: string
  username: string
  email: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export interface CreateUserRequest {
  username: string
  email: string
  password: string
  role?: UserRole
}

export interface LoginRequest {
  username: string
  password: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface JWTPayload {
  userId: string
  username: string
  role: UserRole
  iat: number
  exp: number
}

export interface SnippetsResponse {
  data: Snippet[]
  total: number
  page: number
  limit: number
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
