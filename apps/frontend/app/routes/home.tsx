import { useState, useCallback } from 'react'
import { Sidebar } from '../components/sidebar.js'
import { MainContent } from '../components/main-content.js'

interface Snippet {
  id: string
  text: string
  summary: string
}

export function meta() {
  return [
    { title: 'Snippet Summarizer - HN Challenge' },
    { name: 'description', content: 'Summarize your text content with AI' },
  ]
}

export default function Home() {
  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | undefined>(undefined)
  const [refreshSidebar, setRefreshSidebar] = useState(0)

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
    <div className="flex h-screen bg-background">
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
  )
}
