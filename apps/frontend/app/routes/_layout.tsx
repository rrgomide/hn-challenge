import { useState, useCallback, useEffect } from 'react'
import { Outlet } from 'react-router'
import { Sidebar } from '../components/sidebar'
import { Header } from '../components/header'
import { useTheme } from '../contexts/theme-context'
import { Snippet } from '@hn-challenge/shared'

interface LoaderData {
  snippets: Snippet[]
}

interface ComponentProps {
  loaderData: LoaderData
}

export async function loader(): Promise<{ snippets: Snippet[] }> {
  try {
    const response = await fetch('http://localhost:3000/snippets')
    if (response.ok) {
      const result = await response.json()
      return { snippets: result.data || [] }
    }
    return { snippets: [] }
  } catch (error) {
    console.error('Failed to fetch snippets in loader:', error)
    return { snippets: [] }
  }
}

export function meta() {
  return [
    { title: 'Snippet Summarizer - HN Challenge' },
    { name: 'description', content: 'Summarize your text content with AI' },
  ]
}

export default function Layout({ loaderData }: ComponentProps) {
  const [mounted, setMounted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleNewChat = useCallback(() => {
    setSidebarOpen(false) // Close sidebar on mobile when starting new chat
  }, [])

  const handleSelectSnippet = useCallback((snippet: Snippet) => {
    setSidebarOpen(false) // Close sidebar on mobile when selecting snippet
  }, [])

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev)
  }, [])

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header
        onToggleTheme={mounted ? toggleTheme : undefined}
        theme={mounted ? theme : 'light'}
        onToggleSidebar={toggleSidebar}
        sidebarOpen={sidebarOpen}
      />
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`
          fixed lg:static inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out
          ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }
        `}
        >
          <Sidebar
            snippets={loaderData.snippets}
            onNewChat={handleNewChat}
            onSelectSnippet={handleSelectSnippet}
            onClose={() => setSidebarOpen(false)}
          />
        </div>

        {/* Main content */}
        <div className="flex-1 w-full lg:w-auto">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
