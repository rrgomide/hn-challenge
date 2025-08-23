import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode
} from 'react'
import { User, AuthResponse } from '@hn-challenge/shared'

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (username: string, email: string, password: string, role?: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load auth data from localStorage on mount
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem(TOKEN_KEY)
      const savedUser = localStorage.getItem(USER_KEY)
      
      if (savedToken && savedUser) {
        setToken(savedToken)
        setUser(JSON.parse(savedUser))
      }
    } catch (error) {
      console.error('Failed to load auth data from localStorage:', error)
      // Clear corrupted data
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const saveAuthData = (authResponse: AuthResponse) => {
    setToken(authResponse.token)
    setUser(authResponse.user)
    localStorage.setItem(TOKEN_KEY, authResponse.token)
    localStorage.setItem(USER_KEY, JSON.stringify(authResponse.user))
  }

  const clearAuthData = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  const login = async (username: string, password: string) => {
    try {
      const API_BASE_URL = typeof window !== 'undefined' 
        ? ((import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3000')
        : (process.env.NODE_ENV === 'production' ? 'http://backend:3000' : 'http://localhost:3000')

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Login failed' }))
        return { success: false, error: errorData.error || 'Login failed' }
      }

      const authResponse: AuthResponse = await response.json()
      saveAuthData(authResponse)
      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Network error. Please try again.' }
    }
  }

  const register = async (username: string, email: string, password: string, role?: string) => {
    try {
      const API_BASE_URL = typeof window !== 'undefined' 
        ? ((import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3000')
        : (process.env.NODE_ENV === 'production' ? 'http://backend:3000' : 'http://localhost:3000')

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password, role }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Registration failed' }))
        return { success: false, error: errorData.error || 'Registration failed' }
      }

      const authResponse: AuthResponse = await response.json()
      saveAuthData(authResponse)
      return { success: true }
    } catch (error) {
      console.error('Registration error:', error)
      return { success: false, error: 'Network error. Please try again.' }
    }
  }

  const logout = () => {
    clearAuthData()
  }

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}