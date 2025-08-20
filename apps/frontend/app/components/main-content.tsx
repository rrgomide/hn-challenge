import { useState } from 'react'
import { Textarea } from './ui/textarea.js'
import { Button } from './ui/button.js'
import { Send, Loader2 } from 'lucide-react'
import { ScrollArea } from './ui/scroll-area.js'
import { Snippet } from '@hn-challenge/shared'

interface MainContentProps {
  selectedSnippet?: Snippet
  onSnippetCreated: () => void
}

export function MainContent({
  selectedSnippet,
  onSnippetCreated,
}: MainContentProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || loading) return

    setLoading(true)
    try {
      const response = await fetch('http://localhost:3000/snippets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: content.trim() }),
      })

      if (response.ok) {
        setContent('')
        onSnippetCreated()
      } else {
        console.error('Failed to create snippet')
      }
    } catch (error) {
      console.error('Error creating snippet:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full flex-1">
      {selectedSnippet ? (
        <div className="flex flex-col h-full">
          <div className="p-4 sm:p-6 border-b border-border">
            <h2 className="text-lg sm:text-xl font-semibold mb-2">
              {selectedSnippet.summary || 'Untitled'}
            </h2>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Original text: {selectedSnippet.text.length} characters
              </p>
              <p className="text-xs text-muted-foreground">
                Last updated:{' '}
                {new Date(selectedSnippet.updatedAt).toLocaleString()}
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
                  {selectedSnippet.text}
                </div>
              </div>

              {selectedSnippet.summary && (
                <div>
                  <h3 className="text-sm font-medium mb-2 text-muted-foreground">
                    Summary
                  </h3>
                  <div className="bg-card border border-border p-3 sm:p-4 rounded-lg text-sm">
                    {selectedSnippet.summary}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
            <div className="max-w-2xl w-full space-y-4 sm:space-y-6">
              <div className="text-center space-y-2 sm:space-y-3">
                <h1 className="text-2xl sm:text-4xl font-bold">
                  Snippet Summarizer
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground">
                  Paste or type your content below to get a summary
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Paste your text here to get a summary..."
                  className="min-h-[150px] sm:min-h-[200px] resize-none touch-manipulation"
                />

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={!content.trim() || loading}
                    className="gap-2 w-full sm:w-auto touch-manipulation"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {loading ? 'Summarizing...' : 'Summarize'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
