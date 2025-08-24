import { AuthResponse, LoginRequest, CreateUserRequest } from '@hn-challenge/shared'
import { apiClient, APIError } from '../lib/api-client'

export interface AuthResult {
  success: boolean
  error?: string
  data?: AuthResponse
}

export class AuthService {
  async login(username: string, password: string): Promise<AuthResult> {
    try {
      const data: AuthResponse = await apiClient.post('/auth/login', { username, password })
      return { success: true, data }
    } catch (error) {
      if (error instanceof APIError) {
        return { success: false, error: error.message }
      }
      return { success: false, error: 'Network error. Please try again.' }
    }
  }

  async register(
    username: string, 
    email: string, 
    password: string, 
    role?: string
  ): Promise<AuthResult> {
    try {
      const data: AuthResponse = await apiClient.post('/auth/register', { 
        username, 
        email, 
        password, 
        role 
      })
      return { success: true, data }
    } catch (error) {
      if (error instanceof APIError) {
        return { success: false, error: error.message }
      }
      return { success: false, error: 'Network error. Please try again.' }
    }
  }
}

export const authService = new AuthService()