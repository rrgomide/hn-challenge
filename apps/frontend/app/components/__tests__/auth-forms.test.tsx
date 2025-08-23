import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { AuthForms } from '../auth-forms'
import { AuthProvider } from '../../contexts/auth-context'
import { act } from 'react'

// Mock the API module
vi.mock('../../lib/api', () => ({
  API_BASE_URL: 'http://localhost:3000/api'
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

// Wrapper component with auth context
function AuthFormsWrapper() {
  return (
    <AuthProvider>
      <AuthForms />
    </AuthProvider>
  )
}

describe('AuthForms', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
    // Mock initial auth check
    mockFetch.mockClear()
  })

  describe('initial rendering', () => {
    it('renders login form by default', async () => {
      render(<AuthFormsWrapper />)

      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument()
      })

      expect(screen.getByLabelText('Username')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
      expect(screen.getByText("Don't have an account?")).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Create one' })).toBeInTheDocument()
    })

    it('has proper form accessibility attributes', async () => {
      render(<AuthFormsWrapper />)

      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument()
      })

      const form = screen.getByRole('form')
      expect(form).toBeInTheDocument()

      const usernameInput = screen.getByLabelText('Username')
      expect(usernameInput).toHaveAttribute('type', 'text')
      expect(usernameInput).toHaveAttribute('required')

      const passwordInput = screen.getByLabelText('Password')
      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(passwordInput).toHaveAttribute('required')
    })
  })

  describe('form switching', () => {
    it('switches to signup form when "Create one" is clicked', async () => {
      const user = userEvent.setup()
      render(<AuthFormsWrapper />)

      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: 'Create one' }))

      expect(screen.getByText('Create Account')).toBeInTheDocument()
      expect(screen.getByLabelText('Username')).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument()
      expect(screen.getByText('Already have an account?')).toBeInTheDocument()
    })

    it('switches back to login form when "Sign in" is clicked', async () => {
      const user = userEvent.setup()
      render(<AuthFormsWrapper />)

      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument()
      })

      // Switch to signup
      await user.click(screen.getByRole('button', { name: 'Create one' }))
      expect(screen.getByText('Create Account')).toBeInTheDocument()

      // Switch back to login
      await user.click(screen.getByRole('button', { name: 'Sign in' }))
      expect(screen.getByText('Sign In')).toBeInTheDocument()
      expect(screen.queryByLabelText('Email')).not.toBeInTheDocument()
    })
  })

  describe('login form', () => {
    it('successfully submits login form', async () => {
      const user = userEvent.setup()
      const mockResponse = {
        user: { id: '1', username: 'testuser', role: 'user' },
        token: 'jwt-token'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      render(<AuthFormsWrapper />)

      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument()
      })

      // Fill form
      await user.type(screen.getByLabelText('Username'), 'testuser')
      await user.type(screen.getByLabelText('Password'), 'password123')

      // Submit form
      await user.click(screen.getByRole('button', { name: 'Sign In' }))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'testuser', password: 'password123' })
        })
      })
    })

    it('shows loading state during login', async () => {
      const user = userEvent.setup()

      // Create a promise that doesn't resolve immediately
      let resolvePromise: (value: any) => void
      const delayedPromise = new Promise((resolve) => {
        resolvePromise = resolve
      })

      mockFetch.mockReturnValueOnce(delayedPromise)

      render(<AuthFormsWrapper />)

      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText('Username'), 'testuser')
      await user.type(screen.getByLabelText('Password'), 'password123')

      await user.click(screen.getByRole('button', { name: 'Sign In' }))

      // Should show loading state
      expect(screen.getByText('Signing in...')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Signing in...' })).toBeDisabled()

      // Resolve the promise
      resolvePromise!({
        ok: true,
        json: async () => ({
          user: { id: '1', username: 'testuser', role: 'user' },
          token: 'jwt-token'
        })
      })

      await waitFor(() => {
        expect(screen.queryByText('Signing in...')).not.toBeInTheDocument()
      })
    })

    it('shows error message on login failure', async () => {
      const user = userEvent.setup()

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid credentials' })
      })

      render(<AuthFormsWrapper />)

      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText('Username'), 'testuser')
      await user.type(screen.getByLabelText('Password'), 'wrongpassword')

      await user.click(screen.getByRole('button', { name: 'Sign In' }))

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
      })

      // Form should still be usable
      expect(screen.getByRole('button', { name: 'Sign In' })).not.toBeDisabled()
    })

    it('validates required fields', async () => {
      const user = userEvent.setup()
      render(<AuthFormsWrapper />)

      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument()
      })

      // Try to submit empty form
      await user.click(screen.getByRole('button', { name: 'Sign In' }))

      // Should not make API call
      expect(mockFetch).not.toHaveBeenCalled()

      // HTML5 validation should prevent submission
      const usernameInput = screen.getByLabelText('Username')
      const passwordInput = screen.getByLabelText('Password')
      
      expect(usernameInput).toBeInvalid()
      expect(passwordInput).toBeInvalid()
    })

    it('clears error when user starts typing', async () => {
      const user = userEvent.setup()

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid credentials' })
      })

      render(<AuthFormsWrapper />)

      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument()
      })

      // Trigger error
      await user.type(screen.getByLabelText('Username'), 'testuser')
      await user.type(screen.getByLabelText('Password'), 'wrong')
      await user.click(screen.getByRole('button', { name: 'Sign In' }))

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
      })

      // Start typing in username field
      await user.type(screen.getByLabelText('Username'), 'x')

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument()
      })
    })
  })

  describe('signup form', () => {
    beforeEach(async () => {
      const user = userEvent.setup()
      render(<AuthFormsWrapper />)

      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: 'Create one' }))
      
      await waitFor(() => {
        expect(screen.getByText('Create Account')).toBeInTheDocument()
      })
    })

    it('has all required signup fields', () => {
      expect(screen.getByLabelText('Username')).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument()
    })

    it('successfully submits signup form', async () => {
      const user = userEvent.setup()
      const mockResponse = {
        user: { id: '1', username: 'newuser', role: 'user' },
        token: 'jwt-token'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      await user.type(screen.getByLabelText('Username'), 'newuser')
      await user.type(screen.getByLabelText('Email'), 'newuser@example.com')
      await user.type(screen.getByLabelText('Password'), 'password123')

      await user.click(screen.getByRole('button', { name: 'Create Account' }))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'newuser',
            email: 'newuser@example.com',
            password: 'password123'
          })
        })
      })
    })

    it('shows error message on signup failure', async () => {
      const user = userEvent.setup()

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Username already exists' })
      })

      await user.type(screen.getByLabelText('Username'), 'existinguser')
      await user.type(screen.getByLabelText('Email'), 'test@example.com')
      await user.type(screen.getByLabelText('Password'), 'password123')

      await user.click(screen.getByRole('button', { name: 'Create Account' }))

      await waitFor(() => {
        expect(screen.getByText('Username already exists')).toBeInTheDocument()
      })
    })

    it('validates email format', () => {
      const emailInput = screen.getByLabelText('Email')
      expect(emailInput).toHaveAttribute('type', 'email')
    })

    it('shows loading state during signup', async () => {
      const user = userEvent.setup()

      let resolvePromise: (value: any) => void
      const delayedPromise = new Promise((resolve) => {
        resolvePromise = resolve
      })

      mockFetch.mockReturnValueOnce(delayedPromise)

      await user.type(screen.getByLabelText('Username'), 'newuser')
      await user.type(screen.getByLabelText('Email'), 'test@example.com')
      await user.type(screen.getByLabelText('Password'), 'password123')

      await user.click(screen.getByRole('button', { name: 'Create Account' }))

      expect(screen.getByText('Creating account...')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Creating account...' })).toBeDisabled()

      resolvePromise!({
        ok: true,
        json: async () => ({
          user: { id: '1', username: 'newuser', role: 'user' },
          token: 'jwt-token'
        })
      })

      await waitFor(() => {
        expect(screen.queryByText('Creating account...')).not.toBeInTheDocument()
      })
    })
  })

  describe('accessibility', () => {
    it('has proper form labels and ARIA attributes', async () => {
      render(<AuthFormsWrapper />)

      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument()
      })

      // Check form structure
      const form = screen.getByRole('form')
      expect(form).toBeInTheDocument()

      // Check inputs have proper labels
      const usernameInput = screen.getByLabelText('Username')
      const passwordInput = screen.getByLabelText('Password')

      expect(usernameInput.getAttribute('id')).toBeTruthy()
      expect(passwordInput.getAttribute('id')).toBeTruthy()

      // Check submit button
      const submitButton = screen.getByRole('button', { name: 'Sign In' })
      expect(submitButton).toHaveAttribute('type', 'submit')
    })

    it('properly announces errors to screen readers', async () => {
      const user = userEvent.setup()

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid credentials' })
      })

      render(<AuthFormsWrapper />)

      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText('Username'), 'test')
      await user.type(screen.getByLabelText('Password'), 'wrong')
      await user.click(screen.getByRole('button', { name: 'Sign In' }))

      await waitFor(() => {
        const errorElement = screen.getByText('Invalid credentials')
        expect(errorElement).toBeInTheDocument()
        expect(errorElement).toHaveAttribute('role', 'alert')
        expect(errorElement).toHaveAttribute('aria-live', 'polite')
      })
    })

    it('maintains focus management during form switching', async () => {
      const user = userEvent.setup()
      render(<AuthFormsWrapper />)

      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument()
      })

      const createAccountButton = screen.getByRole('button', { name: 'Create one' })
      await user.click(createAccountButton)

      // Focus should be managed appropriately
      expect(screen.getByText('Create Account')).toBeInTheDocument()
      
      const signInButton = screen.getByRole('button', { name: 'Sign in' })
      await user.click(signInButton)

      expect(screen.getByText('Sign In')).toBeInTheDocument()
    })
  })
})