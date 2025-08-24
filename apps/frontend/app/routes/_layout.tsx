import { useState, useCallback, useEffect, useRef } from 'react'
import { Outlet, useLoaderData, useNavigate, useLocation } from 'react-router'
import { AppSidebar } from '../components/app-sidebar'
import { AppHeader } from '../components/app-header'
import { useTheme } from '../contexts/theme-context'
import { useAuth } from '../contexts/auth-context'
import { Snippet, SnippetsResponse } from '@hn-challenge/shared'
import { API_BASE_URL } from '../lib/api'

interface LoaderData {
  snippets: Snippet[]
}

export async function loader(): Promise<LoaderData> {
  // Authentication is handled client-side, so we'll load snippets after authentication
  return { snippets: [] }
}

// Client-side function to fetch snippets
async function fetchSnippets(token?: string): Promise<{ snippets: Snippet[] }> {
  try {
    const headers: Record<string, string> = {}
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}/snippets`, { headers })
    if (response.ok) {
      const result: SnippetsResponse = await response.json()
      const snippets: Snippet[] = result.data
      return { snippets }
    }
    return { snippets: [] }
  } catch (error) {
    console.error('Failed to fetch snippets:', error)
    return { snippets: [] }
  }
}

export function meta() {
  return [
    { title: 'Snippet Summarizer - HN Challenge' },
    { name: 'description', content: 'Summarize your text content with AI' },
  ]
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col h-screen bg-background">{children}</div>
}

function MobileMenuOverlay({ onClick }: { onClick: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-40 lg:hidden"
      onClick={onClick}
      aria-label="Close sidebar overlay"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
    />
  )
}

function SidebarWrapper({
  children,
  sidebarOpen,
}: {
  children: React.ReactNode
  sidebarOpen: boolean
}) {
  return (
    <div
      className={`
    fixed lg:static inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out
    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
  `}
    >
      {children}
    </div>
  )
}

function MainContentWrapper({ children }: { children: React.ReactNode }) {
  return <main id="main-content" className="flex-1 w-full lg:w-auto" role="main">{children}</main>
}

function AppBodyWrapper({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 overflow-hidden">{children}</div>
}

export default function Layout() {
  const { snippets: initialSnippets } = useLoaderData<typeof loader>()
  const [mounted, setMounted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [snippets, setSnippets] = useState<Snippet[]>(initialSnippets)
  const { toggleTheme } = useTheme()
  const { isAuthenticated, isLoading, token } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const sidebarRef = useRef<HTMLDivElement>(null)
  
  // Check if we should hide the sidebar (e.g., on config page)
  const shouldHideSidebar = location.pathname === '/config'

  useEffect(() => {
    setMounted(true)
  }, [])

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth', { replace: true })
    }
  }, [isAuthenticated, isLoading, navigate])

  // Load snippets when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchSnippets(token)
        .then(({ snippets }) => {
          setSnippets(snippets)
        })
        .catch((error: any) => {
          console.error('Failed to load snippets:', error)
        })
    }
  }, [isAuthenticated, token])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false)
      }
    }

    if (sidebarOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [sidebarOpen])

  const handleNewChat = useCallback(() => {
    setSidebarOpen(false) // Close sidebar on mobile when starting new chat
  }, [])

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(value => !value)
  }, [])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <Wrapper>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading...</p>
          </div>
        </div>
      </Wrapper>
    )
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null
  }

  return (
    <Wrapper>
      <AppHeader
        onToggleTheme={mounted ? toggleTheme : undefined}
        onToggleSidebar={shouldHideSidebar ? undefined : toggleSidebar}
      />

      <AppBodyWrapper>
        {!shouldHideSidebar && sidebarOpen && (
          <MobileMenuOverlay onClick={() => setSidebarOpen(false)} />
        )}

        {!shouldHideSidebar && (
          <SidebarWrapper sidebarOpen={sidebarOpen}>
            <div ref={sidebarRef}>
              <AppSidebar
                snippets={snippets}
                onNewChat={handleNewChat}
                onClose={() => setSidebarOpen(false)}
              />
            </div>
          </SidebarWrapper>
        )}

        <MainContentWrapper>
          <Outlet />
        </MainContentWrapper>
      </AppBodyWrapper>
    </Wrapper>
  )
}
