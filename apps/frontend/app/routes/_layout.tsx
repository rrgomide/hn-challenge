import { useState, useCallback, useEffect, useRef } from 'react'
import { Outlet, useLoaderData, useLocation, redirect } from 'react-router'
import { AppSidebar } from '../components/app-sidebar'
import { AppHeader } from '../components/app-header'
import { useAuth } from '../contexts/auth-context'
import { Snippet, User } from '@hn-challenge/shared'
import type { LoaderFunctionArgs } from 'react-router'
import { validateSession } from '../server/session.server'
import { getSnippets } from '../server/snippets.server'

interface LoaderData {
  snippets: Snippet[]
  isAuthenticated: boolean
  user: User | null
}

export async function loader({
  request,
}: LoaderFunctionArgs): Promise<LoaderData> {
  const { token, user } = validateSession(request)

  if (!token) {
    return { snippets: [], isAuthenticated: false, user: null }
  }

  try {
    const { snippets, error } = await getSnippets(token)

    if (error === 'Unauthorized') {
      throw redirect('/auth')
    }

    return {
      snippets,
      isAuthenticated: true,
      user,
    }
  } catch (error) {
    console.error('Failed to fetch snippets in loader:', error)
    if (error instanceof Error && error.message.includes('401')) {
      throw redirect('/auth')
    }
    return { snippets: [], isAuthenticated: Boolean(token), user }
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
      onKeyDown={e => {
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
  return (
    <main
      id="main-content"
      className="flex-1 w-full lg:w-auto overflow-y-auto scrollbar-thin"
      role="main"
    >
      {children}
    </main>
  )
}

function AppBodyWrapper({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 overflow-hidden min-h-0">{children}</div>
}

export default function Layout() {
  const { snippets: loaderSnippets, isAuthenticated: loaderAuthenticated } =
    useLoaderData<typeof loader>()
  const [_mounted, setMounted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [snippets, setSnippets] = useState<Snippet[]>(loaderSnippets)
  const { isAuthenticated: contextAuthenticated, isLoading, token: _token } = useAuth()
  const location = useLocation()
  const sidebarRef = useRef<HTMLDivElement>(null)

  const _isAuthenticated = loaderAuthenticated || contextAuthenticated

  const shouldHideSidebar = location.pathname === '/config'

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setSnippets(loaderSnippets)
  }, [loaderSnippets])

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
    setSidebarOpen(false)
  }, [])

  const handleSnippetDeleted = useCallback((deletedId: string) => {
    setSnippets(prevSnippets =>
      prevSnippets.filter(snippet => snippet?.id !== deletedId)
    )
  }, [])

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(value => !value)
  }, [])

  if (isLoading && !loaderAuthenticated) {
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

  return (
    <Wrapper>
      <AppHeader
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
                onSnippetDeleted={handleSnippetDeleted}
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
