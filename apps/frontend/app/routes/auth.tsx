import { useEffect } from 'react'
import { useNavigate, useLoaderData, redirect } from 'react-router'
import { AuthForms } from '../components/auth-forms'
import { useAuth } from '../contexts/auth-context'
import { getAuthFromCookies } from '../lib/cookies'
import type { LoaderFunctionArgs } from 'react-router'

export async function loader({ request }: LoaderFunctionArgs) {
  const cookieHeader = request.headers.get('Cookie')
  const { token } = getAuthFromCookies(cookieHeader)
  
  // If already authenticated, redirect to home
  if (token) {
    throw redirect('/')
  }
  
  return {}
}

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
  const navigate = useNavigate()

  const handleAuthSuccess = () => {
    // Navigate to home page after successful authentication
    navigate('/', { replace: true })
  }

  // Server-side loader handles auth redirect, so we can render directly
  return (
    <AuthPageWrapper>
      <AuthForms onSuccess={handleAuthSuccess} />
    </AuthPageWrapper>
  )
}