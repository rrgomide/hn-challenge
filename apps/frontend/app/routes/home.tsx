import { useState, useCallback, useEffect } from 'react'
import { Sidebar } from '../components/sidebar.js'
import { MainContent } from '../components/main-content.js'
import { Header } from '../components/header.js'
import { useTheme } from '../contexts/theme-context.js'
import { Snippet } from '@hn-challenge/shared'

export function meta() {
  return [
    { title: 'Snippet Summarizer - HN Challenge' },
    { name: 'description', content: 'Summarize your text content with AI' },
  ]
}

export default function Home() {
  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | undefined>(
    undefined
  )
  const [refreshSidebar, setRefreshSidebar] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleNewChat = useCallback(() => {
    setSelectedSnippet(undefined)
    setSidebarOpen(false) // Close sidebar on mobile when starting new chat
  }, [])

  const handleSelectSnippet = useCallback((snippet: Snippet) => {
    setSelectedSnippet(snippet)
    setSidebarOpen(false) // Close sidebar on mobile when selecting snippet
  }, [])

  const handleSnippetCreated = useCallback(() => {
    setRefreshSidebar(prev => prev + 1)
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
            key={refreshSidebar}
            onNewChat={handleNewChat}
            onSelectSnippet={handleSelectSnippet}
            selectedSnippetId={selectedSnippet?.id}
            onClose={() => setSidebarOpen(false)}
          />
        </div>

        {/* Main content */}
        <div className="flex-1 w-full lg:w-auto">
          <MainContent
            selectedSnippet={selectedSnippet}
            onSnippetCreated={handleSnippetCreated}
          />
        </div>
      </div>
    </div>
  )
}
