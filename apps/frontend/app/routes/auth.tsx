import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { AuthForms } from '../components/auth-forms'
import { useAuth } from '../contexts/auth-context'

export function meta() {
  return [
    { title: 'Authentication - Snippet Summarizer' },
    { name: 'description', content: 'Sign in or create an account' },
  ]
}

function AuthPageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  )
}

export default function AuthPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Redirect to home if already authenticated
    if (!isLoading && isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, isLoading, navigate])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <AuthPageWrapper>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </AuthPageWrapper>
    )
  }

  // Don't render forms if already authenticated (will redirect)
  if (isAuthenticated) {
    return null
  }

  const handleAuthSuccess = () => {
    // Navigate to home page after successful authentication
    navigate('/', { replace: true })
  }

  return (
    <AuthPageWrapper>
      <AuthForms onSuccess={handleAuthSuccess} />
    </AuthPageWrapper>
  )
}