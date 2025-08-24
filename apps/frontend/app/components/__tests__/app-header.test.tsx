import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { AppHeader } from '../app-header'
import { AuthProvider } from '../../contexts/auth-context'
import { MemoryRouter } from 'react-router'

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

// Wrapper component with auth context and router
function AppHeaderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter>
      <AuthProvider>
        {children}
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('AppHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  it('renders the app title', async () => {
    render(
      <AppHeaderWrapper>
        <AppHeader />
      </AppHeaderWrapper>
    )

    await screen.findByText('Snippet Summarizer')
    expect(screen.getByText('Snippet Summarizer')).toBeInTheDocument()
  })

  it('always renders theme toggle', async () => {
    render(
      <AppHeaderWrapper>
        <AppHeader />
      </AppHeaderWrapper>
    )
    
    await screen.findByText('Snippet Summarizer')
    expect(screen.getByLabelText('Toggle theme')).toBeInTheDocument()
  })

  it('renders mobile menu button when onToggleSidebar is provided', async () => {
    const mockToggleSidebar = vi.fn()
    render(
      <AppHeaderWrapper>
        <AppHeader onToggleSidebar={mockToggleSidebar} />
      </AppHeaderWrapper>
    )
    
    await screen.findByText('Snippet Summarizer')
    expect(screen.getByLabelText('Toggle sidebar')).toBeInTheDocument()
  })

  it('does not render mobile menu button when onToggleSidebar is not provided', async () => {
    render(
      <AppHeaderWrapper>
        <AppHeader />
      </AppHeaderWrapper>
    )
    
    await screen.findByText('Snippet Summarizer')
    expect(screen.queryByLabelText('Toggle sidebar')).not.toBeInTheDocument()
  })

  it('theme toggle is interactive', async () => {
    const user = userEvent.setup()
    render(
      <AppHeaderWrapper>
        <AppHeader />
      </AppHeaderWrapper>
    )
    
    await screen.findByText('Snippet Summarizer')
    const themeToggle = screen.getByLabelText('Toggle theme')
    
    // Just verify it's clickable without errors
    await user.click(themeToggle)
    expect(themeToggle).toBeInTheDocument()
  })

  it('calls onToggleSidebar when mobile menu button is clicked', async () => {
    const user = userEvent.setup()
    const mockToggleSidebar = vi.fn()
    render(
      <AppHeaderWrapper>
        <AppHeader onToggleSidebar={mockToggleSidebar} />
      </AppHeaderWrapper>
    )
    
    await screen.findByText('Snippet Summarizer')
    const sidebarToggle = screen.getByLabelText('Toggle sidebar')
    await user.click(sidebarToggle)
    
    expect(mockToggleSidebar).toHaveBeenCalledTimes(1)
  })

  it('renders both theme toggle and sidebar toggle when sidebar handler is provided', async () => {
    const mockToggleSidebar = vi.fn()
    render(
      <AppHeaderWrapper>
        <AppHeader onToggleSidebar={mockToggleSidebar} />
      </AppHeaderWrapper>
    )
    
    await screen.findByText('Snippet Summarizer')
    expect(screen.getByLabelText('Toggle theme')).toBeInTheDocument()
    expect(screen.getByLabelText('Toggle sidebar')).toBeInTheDocument()
  })

  it('has proper header structure with correct CSS classes', async () => {
    const { container } = render(
      <AppHeaderWrapper>
        <AppHeader />
      </AppHeaderWrapper>
    )
    
    await screen.findByText('Snippet Summarizer')
    const header = container.querySelector('header')
    
    expect(header).toBeInTheDocument()
    expect(header).toHaveClass('border-b', 'border-border', 'bg-background/95', 'backdrop-blur')
  })

  describe('user authentication display', () => {
    it('shows user info when authenticated', async () => {
      const mockUser = { id: '1', username: 'testuser', role: 'user' }
      const mockToken = 'valid-jwt-token'

      mockLocalStorage.getItem
        .mockImplementation((key) => {
          if (key === 'auth_token') return mockToken
          if (key === 'auth_user') return JSON.stringify(mockUser)
          return null
        })

      render(
        <AppHeaderWrapper>
          <AppHeader />
        </AppHeaderWrapper>
      )

      // Wait for AuthProvider to load auth data
      await waitFor(() => {
        expect(screen.queryByText('testuser')).toBeInTheDocument()
      }, { timeout: 3000 })
      
      expect(screen.getByText('user')).toBeInTheDocument()
      expect(screen.getByLabelText('Sign out')).toBeInTheDocument()
    })

    it('calls logout when sign out button is clicked', async () => {
      const user = userEvent.setup()
      const mockUser = { id: '1', username: 'testuser', role: 'user' }
      const mockToken = 'valid-jwt-token'

      mockLocalStorage.getItem
        .mockImplementation((key) => {
          if (key === 'auth_token') return mockToken
          if (key === 'auth_user') return JSON.stringify(mockUser)
          return null
        })

      render(
        <AppHeaderWrapper>
          <AppHeader />
        </AppHeaderWrapper>
      )

      // Wait for AuthProvider to load auth data
      await waitFor(() => {
        expect(screen.queryByText('testuser')).toBeInTheDocument()
      }, { timeout: 3000 })
      
      const signOutButton = screen.getByLabelText('Sign out')
      await user.click(signOutButton)

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_user')
    })

    it('does not show user info when not authenticated', async () => {
      render(
        <AppHeaderWrapper>
          <AppHeader />
        </AppHeaderWrapper>
      )

      await screen.findByText('Snippet Summarizer')
      expect(screen.queryByLabelText('Sign out')).not.toBeInTheDocument()
    })
  })
})