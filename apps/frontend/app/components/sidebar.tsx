import { useNavigate, useParams } from 'react-router'
import { ScrollArea } from './ui/scroll-area'
import { Button } from './ui/button'
import { Plus, MessageSquare, X } from 'lucide-react'
import { Snippet } from '@hn-challenge/shared'

type PartialSnippet = Pick<Snippet, 'id' | 'summary' | 'createdAt'>

interface SidebarProps {
  snippets: PartialSnippet[]
  onNewChat: () => void
  onSelectSnippet: (snippet: PartialSnippet) => void
  onClose?: () => void
}

export function Sidebar({ snippets, onNewChat, onClose }: SidebarProps) {
  const navigate = useNavigate()
  const { id: selectedSnippetId } = useParams()

  return (
    <div className="flex flex-col h-full w-80 lg:w-64 bg-card border-r border-border">
      <div className="p-3 sm:p-4 border-b border-border flex items-center justify-between">
        <Button
          onClick={() => {
            onNewChat()
            navigate('/')
          }}
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
          {snippets.length === 0 ? (
            <div className="text-sm text-muted-foreground p-2">
              No snippets yet
            </div>
          ) : (
            <div className="space-y-1">
              {snippets.map(({ id, summary, createdAt }) => (
                <Button
                  key={id}
                  onClick={() => navigate(`/snippets/${id}`)}
                  variant={selectedSnippetId === id ? 'secondary' : 'ghost'}
                  className="w-full justify-start p-2 h-auto text-left touch-manipulation"
                >
                  <div className="flex items-start gap-2 w-full">
                    <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {summary || 'Untitled'}
                      </div>
                      <div className="text-xs text-muted-foreground/70">
                        {createdAt
                          ? new Date(createdAt).toLocaleDateString()
                          : 'Unknown date'}
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
