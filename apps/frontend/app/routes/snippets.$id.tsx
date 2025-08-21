import { useState, useEffect } from 'react'
import { useParams } from 'react-router'
import { ScrollArea } from '../components/ui/scroll-area'
import { Snippet } from '@hn-challenge/shared'

export default function SnippetView() {
  const { id } = useParams<{ id: string }>()
  const [snippet, setSnippet] = useState<Snippet | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    const fetchSnippet = async () => {
      try {
        const response = await fetch(`http://localhost:3000/snippets/${id}`)
        if (response.ok) {
          const snippet = await response.json()
          setSnippet(snippet) // GET /snippets/:id returns snippet directly, not wrapped in data
        } else if (response.status === 404) {
          setError('Snippet not found')
        } else {
          setError('Failed to load snippet')
        }
      } catch (error) {
        console.error('Error fetching snippet:', error)
        setError('Failed to load snippet')
      } finally {
        setLoading(false)
      }
    }

    fetchSnippet()
  }, [id])

  if (loading) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="text-muted-foreground">Loading snippet...</div>
      </div>
    )
  }

  if (error || !snippet) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="text-destructive">{error || 'Snippet not found'}</div>
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