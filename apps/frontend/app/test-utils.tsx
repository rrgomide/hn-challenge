import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import { AuthProvider } from './contexts/auth-context'
import { ThemeProvider } from './contexts/theme-context'

// Mock user for tests
const mockUser = {
  userId: 'test-user-id',
  username: 'testuser',
  email: 'test@example.com',
  role: 'user' as const
}

// Mock auth context value
const mockAuthContext = {
  user: mockUser,
  token: 'mock-token',
  isAuthenticated: true,
  isLoading: false,
  login: vi.fn().mockResolvedValue({ success: true }),
  register: vi.fn().mockResolvedValue({ success: true }),
  logout: vi.fn(),
}

// Mock theme context value
const mockThemeContext = {
  theme: 'light' as const,
  toggleTheme: vi.fn(),
  setTheme: vi.fn(),
}

// Mock the auth context
vi.mock('./contexts/auth-context', async () => {
  const actual = await vi.importActual('./contexts/auth-context')
  return {
    ...actual,
    useAuth: () => mockAuthContext,
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  }
})

// Mock the theme context
vi.mock('./contexts/theme-context', async () => {
  const actual = await vi.importActual('./contexts/theme-context')
  return {
    ...actual,
    useTheme: () => mockThemeContext,
    ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  }
})

// Mock React Router hooks
const mockNavigate = vi.fn()
const mockUseParams = vi.fn(() => ({ id: 'test-id' }))

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: mockUseParams,
    useLocation: () => ({ pathname: '/test' }),
  }
})

// Create a wrapper component that provides all necessary contexts
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }
export { mockNavigate, mockUseParams, mockUser, mockAuthContext, mockThemeContext }