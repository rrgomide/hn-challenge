import { useState, useCallback, useEffect, useRef } from 'react'
import { Outlet, useLoaderData } from 'react-router'
import { AppSidebar } from '../components/app-sidebar'
import { AppHeader } from '../components/app-header'
import { useTheme } from '../contexts/theme-context'
import { getSnippets } from '../server/snippets.server'
import { Snippet } from '@hn-challenge/shared'

interface LoaderData {
  snippets: Snippet[]
}

export async function loader(): Promise<LoaderData> {
  const { snippets } = await getSnippets()
  return { snippets }
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
  const { snippets } = useLoaderData<typeof loader>()
  const [mounted, setMounted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { toggleTheme } = useTheme()
  const sidebarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

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

  return (
    <Wrapper>
      <AppHeader
        onToggleTheme={mounted ? toggleTheme : undefined}
        onToggleSidebar={toggleSidebar}
      />

      <AppBodyWrapper>
        {sidebarOpen && (
          <MobileMenuOverlay onClick={() => setSidebarOpen(false)} />
        )}

        <SidebarWrapper sidebarOpen={sidebarOpen}>
          <div ref={sidebarRef}>
            <AppSidebar
              snippets={snippets}
              onNewChat={handleNewChat}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        </SidebarWrapper>

        <MainContentWrapper>
          <Outlet />
        </MainContentWrapper>
      </AppBodyWrapper>
    </Wrapper>
  )
}
