import { useState, useCallback, useEffect } from 'react'
import { Outlet, useLoaderData } from 'react-router'
import { AppSidebar } from '../components/app-sidebar'
import { AppHeader } from '../components/app-header'
import { useTheme } from '../contexts/theme-context'
import { getSnippetsWithSummaries } from '../server/snippets.server'
import { Snippet } from '@hn-challenge/shared'

interface LoaderData {
  snippets: Partial<Snippet[]>
}

export async function loader(): Promise<LoaderData> {
  const { snippets } = await getSnippetsWithSummaries()
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
  return <div className="flex-1 w-full lg:w-auto">{children}</div>
}

function AppBodyWrapper({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 overflow-hidden">{children}</div>
}

export default function Layout() {
  const { snippets } = useLoaderData<typeof loader>()
  const [mounted, setMounted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { toggleTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

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
          <AppSidebar
            snippets={snippets}
            onNewChat={handleNewChat}
            onClose={() => setSidebarOpen(false)}
          />
        </SidebarWrapper>

        <MainContentWrapper>
          <Outlet />
        </MainContentWrapper>
      </AppBodyWrapper>
    </Wrapper>
  )
}
