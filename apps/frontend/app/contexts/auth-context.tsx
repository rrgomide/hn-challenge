import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode
} from 'react'
import { User, AuthResponse } from '@hn-challenge/shared'
import { authService } from '../services/auth-service'
import { LocalStorageManager } from '../lib/storage'
import { CookieManager } from '../lib/cookies'

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
    const loadAuthData = () => {
      try {
        const savedToken = LocalStorageManager.getItem<string>(TOKEN_KEY)
        const savedUser = LocalStorageManager.getItem<User>(USER_KEY)
        
        if (savedToken && savedUser) {
          setToken(savedToken)
          setUser(savedUser)
        }
      } catch (error) {
        console.error('Failed to load auth data from localStorage:', error)
        // Clear corrupted data
        LocalStorageManager.removeItems([TOKEN_KEY, USER_KEY])
      } finally {
        setIsLoading(false)
      }
    }

    loadAuthData()
  }, [])

  const saveAuthData = useCallback((authResponse: AuthResponse) => {
    setToken(authResponse.token)
    setUser(authResponse.user)
    // Save to localStorage for client-side access
    LocalStorageManager.setItem(TOKEN_KEY, authResponse.token)
    LocalStorageManager.setItem(USER_KEY, authResponse.user)
    // Save to cookies for server-side access
    CookieManager.set(TOKEN_KEY, authResponse.token, { maxAge: 7 * 24 * 60 * 60 }) // 7 days
    CookieManager.set(USER_KEY, JSON.stringify(authResponse.user), { maxAge: 7 * 24 * 60 * 60 }) // 7 days
  }, [])

  const clearAuthData = useCallback(() => {
    setToken(null)
    setUser(null)
    LocalStorageManager.removeItems([TOKEN_KEY, USER_KEY])
    // Clear cookies as well
    CookieManager.remove(TOKEN_KEY)
    CookieManager.remove(USER_KEY)
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const result = await authService.login(username, password)
    
    if (result.success && result.data) {
      saveAuthData(result.data)
    }
    
    return result
  }, [saveAuthData])

  const register = useCallback(async (
    username: string, 
    email: string, 
    password: string, 
    role?: string
  ) => {
    const result = await authService.register(username, email, password, role)
    
    if (result.success && result.data) {
      saveAuthData(result.data)
    }
    
    return result
  }, [saveAuthData])

  const logout = useCallback(() => {
    clearAuthData()
    window.location.href = '/auth'
  }, [clearAuthData])

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