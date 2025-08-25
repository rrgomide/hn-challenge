import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { AuthForms } from '../auth-forms'
import { AuthProvider } from '../../contexts/auth-context'
import { act as _act } from 'react'
import type { UserRole } from '@hn-challenge/shared'

// Mock the auth service
vi.mock('../../services/auth-service')

// Mock the API module
vi.mock('../../lib/api', () => ({
  API_BASE_URL: 'http://localhost:3000',
}))

// Mock fetch for any remaining direct calls
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
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
  beforeEach(async () => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
    mockFetch.mockClear()
  })

  describe('initial rendering', () => {
    it('renders login form by default', async () => {
      render(<AuthFormsWrapper />)

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: 'Sign In' })
        ).toBeInTheDocument()
      })

      expect(screen.getByLabelText('Username')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'Sign In' })
      ).toBeInTheDocument()
      expect(
        screen.getByText("Don't have an account? Sign up")
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: "Don't have an account? Sign up" })
      ).toBeInTheDocument()
    })

    it('has proper form accessibility attributes', async () => {
      render(<AuthFormsWrapper />)

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: 'Sign In' })
        ).toBeInTheDocument()
      })

      const form = document.querySelector('form')
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
        expect(
          screen.getByRole('heading', { name: 'Sign In' })
        ).toBeInTheDocument()
      })

      await user.click(
        screen.getByRole('button', { name: "Don't have an account? Sign up" })
      )

      expect(
        screen.getByRole('heading', { name: 'Create Account' })
      ).toBeInTheDocument()
      expect(screen.getByLabelText('Username')).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'Create Account' })
      ).toBeInTheDocument()
      expect(
        screen.getByText('Already have an account? Sign in')
      ).toBeInTheDocument()
    })

    it('switches back to login form when "Sign in" is clicked', async () => {
      const user = userEvent.setup()
      render(<AuthFormsWrapper />)

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: 'Sign In' })
        ).toBeInTheDocument()
      })

      // Switch to signup
      await user.click(
        screen.getByRole('button', { name: "Don't have an account? Sign up" })
      )
      expect(
        screen.getByRole('heading', { name: 'Create Account' })
      ).toBeInTheDocument()

      // Switch back to login
      await user.click(
        screen.getByRole('button', { name: 'Already have an account? Sign in' })
      )
      expect(
        screen.getByRole('heading', { name: 'Sign In' })
      ).toBeInTheDocument()
      expect(screen.queryByLabelText('Email')).not.toBeInTheDocument()
    })
  })

  describe('login form', () => {
    it('successfully submits login form', async () => {
      const { authService } = await import('../../services/auth-service')
      const user = userEvent.setup()
      const mockResponse = {
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          role: 'user' as UserRole,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        token: 'jwt-token',
      }

      vi.mocked(authService.login).mockResolvedValueOnce({
        success: true,
        data: mockResponse,
      })

      render(<AuthFormsWrapper />)

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: 'Sign In' })
        ).toBeInTheDocument()
      })

      // Fill form
      await user.type(screen.getByLabelText('Username'), 'testuser')
      await user.type(screen.getByLabelText('Password'), 'password123')

      // Submit form
      await user.click(screen.getByRole('button', { name: 'Sign In' }))

      await waitFor(() => {
        expect(vi.mocked(authService.login)).toHaveBeenCalledWith(
          'testuser',
          'password123'
        )
      })
    })
  })

  describe('signup form', () => {
    beforeEach(async () => {
      const user = userEvent.setup()
      render(<AuthFormsWrapper />)

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: 'Sign In' })
        ).toBeInTheDocument()
      })

      await user.click(
        screen.getByRole('button', { name: "Don't have an account? Sign up" })
      )

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: 'Create Account' })
        ).toBeInTheDocument()
      })
    })

    it('has all required signup fields', () => {
      expect(screen.getByLabelText('Username')).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'Create Account' })
      ).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has proper form labels and ARIA attributes', async () => {
      render(<AuthFormsWrapper />)

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: 'Sign In' })
        ).toBeInTheDocument()
      })

      // Check form structure
      const form = document.querySelector('form')
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

    it('maintains focus management during form switching', async () => {
      const user = userEvent.setup()
      render(<AuthFormsWrapper />)

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: 'Sign In' })
        ).toBeInTheDocument()
      })

      const createAccountButton = screen.getByRole('button', {
        name: "Don't have an account? Sign up",
      })
      await user.click(createAccountButton)

      // Focus should be managed appropriately
      expect(
        screen.getByRole('heading', { name: 'Create Account' })
      ).toBeInTheDocument()

      const signInButton = screen.getByRole('button', {
        name: 'Already have an account? Sign in',
      })
      await user.click(signInButton)

      expect(
        screen.getByRole('heading', { name: 'Sign In' })
      ).toBeInTheDocument()
    })
  })
})
