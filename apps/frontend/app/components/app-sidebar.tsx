import { Snippet } from '@hn-challenge/shared'
import { MessageSquare, Plus, X, Trash2 } from 'lucide-react'
import { NavLink, useNavigate, useParams } from 'react-router'
import { cn } from '../lib/utils'
import { Button } from './ui/button'
import { ScrollArea } from './ui/scroll-area'
import { useAuth } from '../contexts/auth-context'
import { snippetService } from '../services/snippet-service'
import { useState } from 'react'

interface AppSidebarProps {
  snippets: (Snippet | undefined)[]
  onNewChat: () => void
  onClose?: () => void
  onSnippetDeleted?: (id: string) => void
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <nav
      className="flex flex-col h-full w-80 lg:w-64 bg-card border-r border-border"
      role="navigation"
      aria-label="Snippet navigation"
    >
      {children}
    </nav>
  )
}

function NewChatWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-3 sm:p-4 border-b border-border flex items-center justify-between">
      {children}
    </div>
  )
}

function NewChatButton({ onNewChat }: { onNewChat: () => void }) {
  const navigate = useNavigate()

  return (
    <Button
      onClick={() => {
        onNewChat()
        navigate('/')
      }}
      className="flex-1 justify-start gap-2 mr-2"
      variant="outline"
      aria-label="Create new snippet"
    >
      <Plus className="w-4 h-4" />
      <span className="hidden sm:inline">New Chat</span>
      <span className="sm:hidden">New</span>
    </Button>
  )
}

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClose}
      className="h-9 w-9 lg:hidden"
      aria-label="Close sidebar"
    >
      <X className="h-4 w-4" />
    </Button>
  )
}

function NoSnippets() {
  return (
    <div className="p-2">
      <div className="text-sm text-muted-foreground p-2">No snippets yet</div>
    </div>
  )
}

function SnippetList({ 
  snippets, 
  onSnippetDeleted 
}: { 
  snippets: (Snippet | undefined)[]
  onSnippetDeleted?: (id: string) => void
}) {
  const { token } = useAuth()
  const navigate = useNavigate()
  const params = useParams()
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())

  const handleDelete = async (e: React.MouseEvent, snippet: Snippet) => {
    e.preventDefault()
    e.stopPropagation()

    if (!token || deletingIds.has(snippet.id)) return

    if (!confirm(`Delete snippet "${snippet.summary || 'Untitled'}"?`)) {
      return
    }

    setDeletingIds(prev => new Set([...prev, snippet.id]))

    try {
      const result = await snippetService.deleteSnippet(snippet.id, token)
      if (result.success) {
        onSnippetDeleted?.(snippet.id)
        // If we're currently viewing the deleted snippet, navigate away
        if (params.id === snippet.id) {
          navigate('/')
        }
      } else {
        alert(`Failed to delete snippet: ${result.error}`)
      }
    } catch (error) {
      console.error('Error deleting snippet:', error)
      alert('An error occurred while deleting the snippet')
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(snippet.id)
        return newSet
      })
    }
  }

  return (
    <div className="p-2">
      <div className="space-y-1" role="list" aria-label="Snippets">
        {snippets.map(snippet => {
          if (!snippet) {
            return null
          }

          const snippetTitle = snippet.summary || 'Untitled'
          const snippetDate = snippet.createdAt
            ? new Date(snippet.createdAt).toLocaleDateString()
            : 'Unknown date'
          const isDeleting = deletingIds.has(snippet.id)

          return (
            <div key={snippet.id} className="group relative" role="listitem">
              <NavLink
                to={`/snippets/${snippet.id}`}
                prefetch="intent"
                className={({ isActive }) =>
                  cn(
                    'w-full justify-start p-2 h-auto text-left touch-manipulation block rounded-md',
                    isActive
                      ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      : 'hover:bg-accent hover:text-accent-foreground'
                  )
                }
                aria-label={`View snippet: ${snippetTitle}, created on ${snippetDate}`}
              >
                <div className="flex items-start gap-2 w-full pr-8">
                  <MessageSquare
                    className="w-4 h-4 mt-0.5 flex-shrink-0"
                    aria-hidden="true"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {snippetTitle}
                    </div>
                    <div className="text-xs text-muted-foreground/70">
                      {snippetDate}
                    </div>
                  </div>
                </div>
              </NavLink>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => handleDelete(e, snippet)}
                disabled={isDeleting}
                className="absolute right-1 top-1 h-7 w-7 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 hover:bg-destructive hover:text-destructive-foreground transition-opacity touch-manipulation"
                aria-label={`Delete snippet: ${snippetTitle}`}
              >
                {isDeleting ? (
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function AppSidebar({ snippets, onNewChat, onClose, onSnippetDeleted }: AppSidebarProps) {
  const noSnippets = !snippets || snippets.length === 0

  return (
    <Wrapper>
      <NewChatWrapper>
        <NewChatButton onNewChat={onNewChat} />
        {onClose && <CloseButton onClose={onClose} />}
      </NewChatWrapper>

      <ScrollArea className="flex-1 scrollbar-thin">
        {noSnippets ? <NoSnippets /> : <SnippetList snippets={snippets} onSnippetDeleted={onSnippetDeleted} />}
      </ScrollArea>
    </Wrapper>
  )
}
