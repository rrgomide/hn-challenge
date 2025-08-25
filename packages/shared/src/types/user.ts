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

export interface ConfigUsersResponse {
  users: User[]
}

export interface UpdateUserRoleRequest {
  userId: string
  role: UserRole
}

export interface UpdateUserRoleResponse {
  message: string
  user: User
}