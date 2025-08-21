import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router'
import { Textarea } from '../components/ui/textarea'
import { Button } from '../components/ui/button'
import { Send, Loader2 } from 'lucide-react'

interface OutletContext {
  onSnippetCreated: () => void
}

export default function Index() {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { onSnippetCreated } = useOutletContext<OutletContext>()

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
        const snippet = await response.json()
        setContent('')
        onSnippetCreated()
        // Navigate to the created snippet
        navigate(`/snippets/${snippet.id}`) // POST /snippets returns snippet directly
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
  )
}