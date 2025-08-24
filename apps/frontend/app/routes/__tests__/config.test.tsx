import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { vi } from 'vitest'
import ConfigRoute from '../config'
import { AuthProvider } from '../../contexts/auth-context'

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

// Mock navigate function
const mockNavigate = vi.fn()
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

// Test data
const mockAdminUser = {
  id: '1',
  username: 'admin',
  email: 'admin@test.com',
  role: 'admin',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
}

const mockRegularUser = {
  id: '2',
  username: 'user',
  email: 'user@test.com',
  role: 'user',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
}

const mockUsers = [
  mockAdminUser,
  mockRegularUser,
  {
    id: '3',
    username: 'moderator',
    email: 'mod@test.com',
    role: 'moderator',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
]

// Mock useAuth hook directly
const mockUseAuth = vi.fn()

vi.mock('../../contexts/auth-context', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => mockUseAuth()
}))

// Wrapper component with routing
function ConfigRouteWrapper({ initialRoute = '/config' }: { initialRoute?: string }) {
  return (
    <MemoryRouter initialEntries={[initialRoute]}>
      <ConfigRoute />
    </MemoryRouter>
  )
}

describe('Config Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()
  })

  describe('admin access', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockAdminUser,
        token: 'admin-token',
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn()
      })
    })

    it('renders config page for admin users', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ users: mockUsers })
      })

      render(<ConfigRouteWrapper />)

      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument()
      })

      expect(screen.getByText('Manage user roles and permissions')).toBeInTheDocument()
      expect(screen.getByText('admin')).toBeInTheDocument()
      expect(screen.getByText('user')).toBeInTheDocument()
      expect(screen.getByText('moderator')).toBeInTheDocument()
    })

    it('displays users in a table format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ users: mockUsers })
      })

      render(<ConfigRouteWrapper />)

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument()
      })

      expect(screen.getByRole('columnheader', { name: 'Username' })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: 'Email' })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: 'Role' })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: 'Actions' })).toBeInTheDocument()
    })

    it('shows role toggle buttons for each user', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ users: mockUsers })
      })

      render(<ConfigRouteWrapper />)

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument()
      })

      // Should show toggle buttons for non-admin users
      const userRow = screen.getByText(mockRegularUser.email).closest('tr')
      expect(userRow).toContainElement(screen.getByRole('button', { name: /make admin/i }))

      const moderatorRow = screen.getByText('mod@test.com').closest('tr')
      expect(moderatorRow).toContainElement(screen.getByRole('button', { name: /make admin/i }))

      // Admin user should show "Remove Admin" button
      const adminRow = screen.getByText(mockAdminUser.email).closest('tr')
      expect(adminRow).toContainElement(screen.getByRole('button', { name: /remove admin/i }))
    })

    it('handles role toggle for user to admin', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ users: mockUsers })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            message: 'User role updated successfully',
            user: { ...mockRegularUser, role: 'admin' }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ users: mockUsers.map(u => u.id === '2' ? { ...u, role: 'admin' } : u) })
        })

      render(<ConfigRouteWrapper />)

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument()
      })

      const makeAdminButton = screen.getByRole('button', { name: /make admin/i })
      fireEvent.click(makeAdminButton)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenLastCalledWith('http://localhost:3000/config', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer admin-token'
          },
          body: JSON.stringify({ userId: '2', role: 'admin' })
        })
      })
    })

    it('handles role toggle for admin to user', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ users: mockUsers })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            message: 'User role updated successfully',
            user: { ...mockAdminUser, role: 'user' }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ users: mockUsers.map(u => u.id === '1' ? { ...u, role: 'user' } : u) })
        })

      render(<ConfigRouteWrapper />)

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument()
      })

      const removeAdminButton = screen.getByRole('button', { name: /remove admin/i })
      fireEvent.click(removeAdminButton)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/config', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer admin-token'
          },
          body: JSON.stringify({ userId: '1', role: 'user' })
        })
      })
    })

    it('handles API errors gracefully', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ users: mockUsers })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
          json: async () => ({ error: 'Insufficient permissions' })
        })

      render(<ConfigRouteWrapper />)

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument()
      })

      const makeAdminButton = screen.getByRole('button', { name: /make admin/i })
      fireEvent.click(makeAdminButton)

      await waitFor(() => {
        expect(screen.getByText(/error.*insufficient permissions/i)).toBeInTheDocument()
      })
    })

    it('shows loading state while fetching users', async () => {
      let resolveUsersPromise: (value: any) => void
      const delayedPromise = new Promise((resolve) => {
        resolveUsersPromise = resolve
      })

      mockFetch.mockReturnValueOnce(delayedPromise)

      render(<ConfigRouteWrapper />)

      expect(screen.getByText('Loading users...')).toBeInTheDocument()

      resolveUsersPromise!({
        ok: true,
        json: async () => ({ users: mockUsers })
      })

      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument()
      })
    })
  })

  describe('non-admin access', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockRegularUser,
        token: 'user-token',
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn()
      })
    })

    it('shows access denied message for non-admin users', async () => {
      render(<ConfigRouteWrapper />)

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument()
      })

      expect(screen.getByText('You need administrator privileges to access this page.')).toBeInTheDocument()
    })

    it('does not fetch users data for non-admin users', async () => {
      render(<ConfigRouteWrapper />)

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument()
      })

      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('unauthenticated access', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn()
      })
    })

    it('redirects to auth page for unauthenticated users', async () => {
      render(<ConfigRouteWrapper />)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/auth', { replace: true })
      })
    })
  })

  describe('meta information', () => {
    it('exports proper meta function', () => {
      const { meta } = require('../config')
      
      const metaTags = meta()
      
      expect(metaTags).toContainEqual({
        title: 'User Management - Snippet Summarizer'
      })
      
      expect(metaTags).toContainEqual({
        name: 'description',
        content: 'Manage user roles and permissions'
      })
    })
  })

  describe('accessibility', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockAdminUser,
        token: 'admin-token',
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn()
      })
    })

    it('has proper heading structure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ users: mockUsers })
      })

      render(<ConfigRouteWrapper />)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'User Management' })).toBeInTheDocument()
      })

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('User Management')
    })

    it('has accessible table with proper headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ users: mockUsers })
      })

      render(<ConfigRouteWrapper />)

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument()
      })

      const table = screen.getByRole('table')
      expect(table).toHaveAttribute('aria-label', 'User management table')

      const headers = screen.getAllByRole('columnheader')
      expect(headers).toHaveLength(4)
    })

    it('has accessible buttons with proper labels', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ users: mockUsers })
      })

      render(<ConfigRouteWrapper />)

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument()
      })

      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-label')
      })
    })
  })

  describe('error states', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockAdminUser,
        token: 'admin-token',
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn()
      })
    })

    it('handles network errors when fetching users', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      render(<ConfigRouteWrapper />)

      await waitFor(() => {
        expect(screen.getByText(/failed to load users.*network error/i)).toBeInTheDocument()
      })
    })

    it('handles 403 errors when fetching users', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ error: 'Insufficient permissions' })
      })

      render(<ConfigRouteWrapper />)

      await waitFor(() => {
        expect(screen.getByText(/error.*insufficient permissions/i)).toBeInTheDocument()
      })
    })
  })
})