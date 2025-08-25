import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import { ScrollArea } from '../components/ui/scroll-area'
import { Button } from '../components/ui/button'
import { Snippet } from '@hn-challenge/shared'
import { useAuth } from '../contexts/auth-context'
import { API_BASE_URL } from '../lib/api'
import { snippetService } from '../services/snippet-service'
import { Trash2, Copy, Check } from 'lucide-react'

async function fetchSnippet(id: string, token?: string): Promise<{
  snippet: Snippet | null
  error?: string
}> {
  try {
    const headers: Record<string, string> = {}
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}/snippets/${id}`, { headers })
    
    if (response.ok) {
      const snippet: Snippet = await response.json()
      return { snippet }
    }
    
    if (response.status === 404) {
      return { snippet: null, error: 'Snippet not found' }
    }
    
    if (response.status === 403) {
      return { snippet: null, error: 'Access denied' }
    }
    
    return { snippet: null, error: 'Failed to fetch snippet' }
  } catch (error) {
    console.error('Failed to fetch snippet:', error)
    return { snippet: null, error: 'Network error' }
  }
}

export default function SnippetView() {
  const { id } = useParams<{ id: string }>()
  const { token } = useAuth()
  const navigate = useNavigate()
  const [snippet, setSnippet] = useState<Snippet | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    if (!id || !token) return

    const loadSnippet = async () => {
      try {
        const { snippet, error: apiError } = await fetchSnippet(id, token)
        
        if (apiError) {
          setError(apiError)
        } else if (snippet) {
          setSnippet(snippet)
        } else {
          setError('Snippet not found')
        }
      } catch (error) {
        console.error('Error fetching snippet:', error)
        setError('Failed to load snippet')
      } finally {
        setLoading(false)
      }
    }

    loadSnippet()
  }, [id, token])

  const handleDelete = async () => {
    if (!snippet || !token || isDeleting) return

    const confirmDelete = confirm(`Delete snippet "${snippet.summary || 'Untitled'}"?`)
    if (!confirmDelete) return

    setIsDeleting(true)

    try {
      const result = await snippetService.deleteSnippet(snippet.id, token)
      if (result.success) {
        // Navigate to home after successful deletion
        navigate('/', { replace: true })
      } else {
        alert(`Failed to delete snippet: ${result.error}`)
      }
    } catch (error) {
      console.error('Error deleting snippet:', error)
      alert('An error occurred while deleting the snippet')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000) // Reset after 2 seconds
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea')
        textArea.value = text
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError)
        alert('Unable to copy to clipboard')
      }
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="text-muted-foreground" role="status" aria-live="polite">
          Loading snippet...
        </div>
      </div>
    )
  }

  if (error || !snippet) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="text-destructive" role="alert" aria-live="assertive">
          {error || 'Snippet not found'}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 sm:p-6 border-b border-border">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h2 className="text-lg sm:text-xl font-semibold flex-1">
            {snippet.summary || 'Untitled'}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="hover:bg-destructive hover:text-destructive-foreground hover:border-destructive flex-shrink-0"
            aria-label={`Delete snippet: ${snippet.summary || 'Untitled'}`}
          >
            {isDeleting ? (
              <>
                <div className="h-3 w-3 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </>
            )}
          </Button>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            Original text: {snippet.text.length} characters
          </p>
          <p className="text-xs text-muted-foreground">
            Last updated:{' '}
            {new Date(snippet.updatedAt).toLocaleString()}
          </p>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4 sm:p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2 text-muted-foreground">
              Original Content
            </h3>
            <div className="bg-muted p-3 sm:p-4 rounded-lg whitespace-pre-wrap text-sm">
              {snippet.text}
            </div>
          </div>

          {snippet.summary && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Summary
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyToClipboard(snippet.summary || '')}
                  className="h-7 px-2 hover:bg-accent"
                  aria-label="Copy summary to clipboard"
                >
                  {isCopied ? (
                    <>
                      <Check className="h-3 w-3 mr-1 text-green-500" />
                      <span className="text-xs text-green-500">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" />
                      <span className="text-xs">Copy</span>
                    </>
                  )}
                </Button>
              </div>
              <div className="bg-card border border-border p-3 sm:p-4 rounded-lg text-sm">
                {snippet.summary}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}