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
  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | undefined>(undefined)
  const [refreshSidebar, setRefreshSidebar] = useState(0)
  const [mounted, setMounted] = useState(false)
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleNewChat = useCallback(() => {
    setSelectedSnippet(undefined)
  }, [])

  const handleSelectSnippet = useCallback((snippet: Snippet) => {
    setSelectedSnippet(snippet)
  }, [])

  const handleSnippetCreated = useCallback(() => {
    setRefreshSidebar(prev => prev + 1)
  }, [])

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header 
        onToggleTheme={mounted ? toggleTheme : undefined} 
        theme={mounted ? theme : 'light'} 
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          key={refreshSidebar}
          onNewChat={handleNewChat}
          onSelectSnippet={handleSelectSnippet}
          selectedSnippetId={selectedSnippet?.id}
        />
        <MainContent
          selectedSnippet={selectedSnippet}
          onSnippetCreated={handleSnippetCreated}
        />
      </div>
    </div>
  )
}
