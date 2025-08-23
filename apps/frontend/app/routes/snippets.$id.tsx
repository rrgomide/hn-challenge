import { useState, useEffect } from 'react'
import { useParams } from 'react-router'
import { ScrollArea } from '../components/ui/scroll-area'
import { Snippet } from '@hn-challenge/shared'
import { useAuth } from '../contexts/auth-context'
import { API_BASE_URL } from '../lib/api'

// Client-side function to fetch a single snippet
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
  const [snippet, setSnippet] = useState<Snippet | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
        <h2 className="text-lg sm:text-xl font-semibold mb-2">
          {snippet.summary || 'Untitled'}
        </h2>
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
              <h3 className="text-sm font-medium mb-2 text-muted-foreground">
                Summary
              </h3>
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