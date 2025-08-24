import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import AuthRoute from '../auth'
import { AuthProvider } from '../../contexts/auth-context'

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

// Mock navigate function
const mockNavigate = vi.fn()
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

// Wrapper component with routing and auth context
function AuthRouteWrapper({ initialRoute = '/auth' }: { initialRoute?: string }) {
  return (
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthProvider>
        <AuthRoute />
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('Auth Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
    mockNavigate.mockClear()
  })

  describe('unauthenticated users', () => {
    it('renders auth forms for unauthenticated users', async () => {
      render(<AuthRouteWrapper />)

      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument()
      })

      expect(screen.getByText('Welcome to Snippet Summarizer')).toBeInTheDocument()
      expect(screen.getByLabelText('Username')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
    })

    it('shows loading state while checking authentication', async () => {
      // Mock a delayed response to simulate loading state
      let resolveAuthCheck: (value: any) => void
      const delayedAuthPromise = new Promise((resolve) => {
        resolveAuthCheck = resolve
      })

      mockFetch.mockReturnValueOnce(delayedAuthPromise)
      mockLocalStorage.getItem.mockReturnValue('some-token')

      render(<AuthRouteWrapper />)

      // Should show loading initially
      expect(screen.getByText('Loading...')).toBeInTheDocument()

      // Resolve auth check as unauthenticated
      resolveAuthCheck!({
        ok: false,
        status: 401
      })

      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument()
      })

      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    it('does not navigate away when unauthenticated', async () => {
      render(<AuthRouteWrapper />)

      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument()
      })

      // Should not have called navigate
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  describe('authenticated users', () => {
    it('redirects authenticated users to home page', async () => {
      const mockUser = { id: '1', username: 'testuser', role: 'user' }
      const mockToken = 'valid-jwt-token'

      mockLocalStorage.getItem.mockReturnValue(mockToken)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser
      })

      render(<AuthRouteWrapper />)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
      })
    })

    it('handles authentication verification errors gracefully', async () => {
      const mockToken = 'expired-token'

      mockLocalStorage.getItem.mockReturnValue(mockToken)
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      render(<AuthRouteWrapper />)

      // Should show auth forms after network error
      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument()
      })

      // Should have cleared the invalid token
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token')
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('handles 401 response by showing auth forms', async () => {
      const mockToken = 'expired-token'

      mockLocalStorage.getItem.mockReturnValue(mockToken)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      })

      render(<AuthRouteWrapper />)

      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument()
      })

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token')
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  describe('page structure and accessibility', () => {
    it('has proper page structure with main content area', async () => {
      render(<AuthRouteWrapper />)

      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument()
      })

      // Check main content structure
      const main = screen.getByRole('main')
      expect(main).toBeInTheDocument()
      expect(main).toHaveClass('flex-1')

      // Check wrapper structure
      const wrapper = screen.getByText('Welcome to Snippet Summarizer').closest('div')
      expect(wrapper).toHaveClass('max-w-md', 'w-full', 'space-y-6')
    })

    it('has proper heading structure', async () => {
      render(<AuthRouteWrapper />)

      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument()
      })

      const welcomeHeading = screen.getByRole('heading', { name: 'Welcome to Snippet Summarizer' })
      expect(welcomeHeading).toBeInTheDocument()

      const signInHeading = screen.getByRole('heading', { name: 'Sign In' })
      expect(signInHeading).toBeInTheDocument()
    })

    it('has accessible skip link target', async () => {
      render(<AuthRouteWrapper />)

      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument()
      })

      // Main content should be accessible for skip links
      const main = screen.getByRole('main')
      expect(main).toHaveAttribute('id', 'main-content')
    })

    it('provides proper semantic structure', async () => {
      render(<AuthRouteWrapper />)

      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument()
      })

      // Check for proper semantic elements
      expect(screen.getByRole('main')).toBeInTheDocument()
      expect(screen.getByRole('form')).toBeInTheDocument()
      expect(screen.getAllByRole('heading')).toHaveLength(2) // Welcome + Sign In headings
      expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
    })
  })

  describe('responsive design', () => {
    it('has responsive classes for mobile and desktop', async () => {
      render(<AuthRouteWrapper />)

      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument()
      })

      // Check responsive padding and spacing classes
      const container = screen.getByText('Welcome to Snippet Summarizer').closest('div')
      expect(container).toHaveClass('space-y-6')

      // Check for responsive form layout
      const mainElement = screen.getByRole('main')
      expect(mainElement).toHaveClass('flex', 'flex-1', 'items-center', 'justify-center')
    })
  })

  describe('meta information', () => {
    it('exports proper meta function', () => {
      // Import the meta function directly
      const { meta } = require('../auth')
      
      const metaTags = meta()
      
      expect(metaTags).toContainEqual({
        title: 'Sign In - Snippet Summarizer'
      })
      
      expect(metaTags).toContainEqual({
        name: 'description',
        content: 'Sign in to your account or create a new one to start summarizing text content'
      })
    })
  })

  describe('edge cases', () => {
    it('handles undefined token gracefully', async () => {
      mockLocalStorage.getItem.mockReturnValue(undefined)

      render(<AuthRouteWrapper />)

      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument()
      })

      // Should not make any auth verification requests
      expect(mockFetch).not.toHaveBeenCalled()
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('handles empty token gracefully', async () => {
      mockLocalStorage.getItem.mockReturnValue('')

      render(<AuthRouteWrapper />)

      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument()
      })

      expect(mockFetch).not.toHaveBeenCalled()
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('handles malformed JSON response', async () => {
      const mockToken = 'valid-token'

      mockLocalStorage.getItem.mockReturnValue(mockToken)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Malformed JSON')
        }
      })

      render(<AuthRouteWrapper />)

      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument()
      })

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token')
    })
  })
})