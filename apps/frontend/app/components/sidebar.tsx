import { useState, useEffect } from 'react'
import { ScrollArea } from './ui/scroll-area'
import { Button } from './ui/button'
import { Plus, MessageSquare, X } from 'lucide-react'
import { Snippet } from '@hn-challenge/shared'

interface SidebarProps {
  onNewChat: () => void
  onSelectSnippet: (snippet: Snippet) => void
  selectedSnippetId?: string
  onClose?: () => void
}

export function Sidebar({
  onNewChat,
  onSelectSnippet,
  selectedSnippetId,
  onClose,
}: SidebarProps) {
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSnippets()
  }, [])

  const fetchSnippets = async () => {
    try {
      const response = await fetch('http://localhost:3000/snippets')
      if (response.ok) {
        const result = await response.json()
        setSnippets(result.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch snippets:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full w-80 lg:w-64 bg-card border-r border-border">
      <div className="p-3 sm:p-4 border-b border-border flex items-center justify-between">
        <Button
          onClick={onNewChat}
          className="flex-1 justify-start gap-2 mr-2"
          variant="outline"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Chat</span>
          <span className="sm:hidden">New</span>
        </Button>

        {/* Mobile close button */}
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-9 w-9 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {loading ? (
            <div className="text-sm text-muted-foreground p-2">Loading...</div>
          ) : snippets.length === 0 ? (
            <div className="text-sm text-muted-foreground p-2">
              No snippets yet
            </div>
          ) : (
            <div className="space-y-1">
              {snippets.map(snippet => (
                <Button
                  key={snippet.id}
                  onClick={() => onSelectSnippet(snippet)}
                  variant={
                    selectedSnippetId === snippet.id ? 'secondary' : 'ghost'
                  }
                  className="w-full justify-start p-2 h-auto text-left touch-manipulation"
                >
                  <div className="flex items-start gap-2 w-full">
                    <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {snippet.summary || 'Untitled'}
                      </div>
                      <div className="text-xs text-muted-foreground truncate hidden sm:block">
                        {snippet.text.length > 50
                          ? snippet.text.substring(0, 50) + '...'
                          : snippet.text}
                      </div>
                      <div className="text-xs text-muted-foreground/70">
                        {new Date(snippet.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
