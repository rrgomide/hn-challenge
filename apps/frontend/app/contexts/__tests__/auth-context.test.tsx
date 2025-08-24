import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { AuthProvider, useAuth } from '../auth-context'
import { act } from 'react'

// Mock the API module
vi.mock('../../lib/api', () => ({
  API_BASE_URL: 'http://localhost:3000'
}))

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage })

// Mock window.location.href
const mockLocation = {
  href: '',
  assign: vi.fn(),
  reload: vi.fn(),
  replace: vi.fn()
}
Object.defineProperty(window, 'location', { value: mockLocation, writable: true })

// Test component to use the auth hook
function TestComponent() {
  const { user, token, isAuthenticated, isLoading, login, register, logout } = useAuth()

  return (
    <div>
      <div data-testid="loading">{isLoading ? 'loading' : 'loaded'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'authenticated' : 'not authenticated'}</div>
      <div data-testid="user">{user ? user.username : 'no user'}</div>
      <div data-testid="token">{token ? 'has token' : 'no token'}</div>
      
      <button onClick={() => login('testuser', 'password123')}>Login</button>
      <button onClick={() => register('testuser', 'test@example.com', 'password123')}>Register</button>
      <button onClick={logout}>Logout</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
    mockLocation.href = ''
  })

  describe('initial state', () => {
    it('starts with unauthenticated state when no token in localStorage', async () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      expect(screen.getByTestId('authenticated')).toHaveTextContent('not authenticated')
      expect(screen.getByTestId('user')).toHaveTextContent('no user')
      expect(screen.getByTestId('token')).toHaveTextContent('no token')
    })

    it('loads existing auth data from localStorage', async () => {
      const mockToken = 'valid-jwt-token'
      const mockUser = { id: '1', username: 'testuser', role: 'user' }

      mockLocalStorage.getItem
        .mockImplementation((key) => {
          if (key === 'auth_token') return mockToken
          if (key === 'auth_user') return JSON.stringify(mockUser)
          return null
        })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('auth_token')
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('auth_user')

      expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated')
      expect(screen.getByTestId('user')).toHaveTextContent('testuser')
      expect(screen.getByTestId('token')).toHaveTextContent('has token')
    })

  })

  describe('login', () => {

    it('handles login failure', async () => {
      const user = userEvent.setup()

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid credentials' })
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      await user.click(screen.getByText('Login'))

      // Wait for the async operation to complete
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('not authenticated')
      })

      expect(mockLocalStorage.setItem).not.toHaveBeenCalled()
    })
  })

  describe('register', () => {

    it('handles registration failure', async () => {
      const user = userEvent.setup()

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Username already exists' })
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      await user.click(screen.getByText('Register'))

      // Wait for the async operation to complete
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('not authenticated')
      })
    })
  })

  describe('logout', () => {
    it('logs out user and clears storage', async () => {
      const user = userEvent.setup()
      
      // Start with authenticated state
      const mockToken = 'valid-jwt-token'
      const mockUser = { id: '1', username: 'testuser', role: 'user' }

      mockLocalStorage.getItem
        .mockImplementation((key) => {
          if (key === 'auth_token') return mockToken
          if (key === 'auth_user') return JSON.stringify(mockUser)
          return null
        })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated')
      })

      await user.click(screen.getByText('Logout'))

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_user')
      expect(mockLocation.href).toBe('/auth')
      expect(screen.getByTestId('authenticated')).toHaveTextContent('not authenticated')
      expect(screen.getByTestId('user')).toHaveTextContent('no user')
      expect(screen.getByTestId('token')).toHaveTextContent('no token')
    })
  })

  describe('error handling', () => {
    it('handles network errors during login', async () => {
      const user = userEvent.setup()

      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      await user.click(screen.getByText('Login'))

      // Should handle the error and return error state
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('not authenticated')
      })
    })

    it('handles network errors during registration', async () => {
      const user = userEvent.setup()

      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      await user.click(screen.getByText('Register'))

      // Should handle the error and return error state  
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('not authenticated')
      })
    })
  })
})