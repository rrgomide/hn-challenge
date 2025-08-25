import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../contexts/auth-context'
import { Button } from '../components/ui/button'
import { User, ConfigUsersResponse, UpdateUserRoleRequest, UpdateUserRoleResponse } from '@hn-challenge/shared'
import { API_BASE_URL } from '../lib/api'

export function meta() {
  return [
    { title: 'User Management - Snippet Summarizer' },
    { name: 'description', content: 'Manage user roles and permissions' },
  ]
}

interface UserRowProps {
  user: User
  onRoleToggle: (userId: string, newRole: 'admin' | 'user') => Promise<void>
  isUpdating: boolean
}

function UserRow({ user, onRoleToggle, isUpdating }: UserRowProps) {
  const isAdmin = user.role === 'admin'
  
  const handleToggle = () => {
    const newRole = isAdmin ? 'user' : 'admin'
    onRoleToggle(user.id, newRole)
  }

  return (
    <tr className="border-b">
      <td className="px-4 py-3 font-medium">{user.username}</td>
      <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
      <td className="px-4 py-3">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          user.role === 'admin' 
            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            : user.role === 'moderator'
            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
        }`}>
          {user.role}
        </span>
      </td>
      <td className="px-4 py-3">
        <Button
          onClick={handleToggle}
          disabled={isUpdating}
          variant={isAdmin ? 'destructive' : 'default'}
          size="sm"
          aria-label={`${isAdmin ? 'Remove admin privileges from' : 'Make admin'} ${user.username}`}
        >
          {isUpdating 
            ? 'Updating...' 
            : isAdmin 
            ? 'Remove Admin' 
            : 'Make Admin'
          }
        </Button>
      </td>
    </tr>
  )
}

function ConfigContent() {
  const { user, token } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`${API_BASE_URL}/config`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch users' }))
        throw new Error(errorData.error || 'Failed to fetch users')
      }

      const data: ConfigUsersResponse = await response.json()
      setUsers(data.users)
    } catch (err: unknown) {
      console.error('Error fetching users:', err)
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [token])

  const handleRoleToggle = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      setError(null)
      setUpdatingUserId(userId)

      const requestBody: UpdateUserRoleRequest = { userId, role: newRole }
      
      const response = await fetch(`${API_BASE_URL}/config`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update user role' }))
        throw new Error(errorData.error || 'Failed to update user role')
      }

      const data: UpdateUserRoleResponse = await response.json()
      
      // Update the user in the local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? data.user : user
        )
      )
    } catch (err: unknown) {
      console.error('Error updating user role:', err)
      setError(`Error: ${err instanceof Error ? err.message : 'Failed to update user role'}`)
    } finally {
      setUpdatingUserId(null)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Only admins can access this page
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-destructive mb-2">Access Denied</h1>
          <p className="text-muted-foreground">
            You need administrator privileges to access this page.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading users...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Error</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchUsers}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">User Management</h1>
        <p className="text-muted-foreground">
          Manage user roles and permissions
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 border border-destructive/20 bg-destructive/10 rounded-md">
          <p className="text-destructive">{error}</p>
        </div>
      )}

      <div className="bg-card border rounded-lg overflow-hidden">
        <table 
          className="w-full"
          aria-label="User management table"
        >
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Username</th>
              <th className="px-4 py-3 text-left font-semibold">Email</th>
              <th className="px-4 py-3 text-left font-semibold">Role</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users && users.filter(user => user && user.id).map((user) => (
              <UserRow 
                key={user.id} 
                user={user} 
                onRoleToggle={handleRoleToggle}
                isUpdating={updatingUserId === user.id}
              />
            ))}
          </tbody>
        </table>

        {users && users.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No users found
          </div>
        )}
      </div>
    </div>
  )
}

export default function ConfigPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Redirect to auth if not authenticated
    if (!isLoading && !isAuthenticated) {
      navigate('/auth', { replace: true })
    }
  }, [isAuthenticated, isLoading, navigate])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render content if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null
  }

  return <ConfigContent />
}