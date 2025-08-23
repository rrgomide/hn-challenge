import { useNavigate } from 'react-router'
import { Textarea } from '../components/ui/textarea'
import { Button } from '../components/ui/button'
import { Send, Loader2 as Loader } from 'lucide-react'
import { useAuth } from '../contexts/auth-context'
import { useState, useRef } from 'react'
import { Snippet } from '@hn-challenge/shared'
import { API_BASE_URL } from '../lib/api'

// Client-side function to post a snippet
async function createSnippet(text: string, token?: string) {
  try {
    if (!text || !text.trim()) {
      throw new Error('Text content is required')
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}/snippets`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ text: text.trim() }),
    })

    if (!response.ok) {
      console.error('📛 Failed to create snippet:', { response })
      throw new Error('Failed to create snippet')
    }

    const newSnippet: Snippet = await response.json()
    return { newSnippet, error: null }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'

    return {
      newSnippet: null,
      error: `Error creating snippet: ${errorMessage}`,
    }
  }
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-2xl w-full space-y-4 sm:space-y-6">
          {children}
        </div>
      </div>
    </div>
  )
}

function Title() {
  return (
    <div className="text-center space-y-2 sm:space-y-3">
      <h1 className="text-2xl sm:text-4xl font-bold">Snippet Summarizer</h1>
      <p className="text-base sm:text-lg text-muted-foreground">
        Paste or type your content below to get a summary
      </p>
    </div>
  )
}

function KeyboardShortcuts() {
  return (
    <p className="hidden sm:block text-sm text-muted-foreground text-center sm:text-left">
      💡 You can press{' '}
      <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted rounded border">
        Ctrl + Enter
      </kbd>{' '}
      or{' '}
      <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted rounded border">
        ⌘ + Enter
      </kbd>{' '}
      to Summarize
    </p>
  )
}

function SummarizeForm() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const formRef = useRef<HTMLFormElement>(null)
  const [text, setText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!text.trim()) {
      setError('Text content is required')
      return
    }

    if (!token) {
      setError('Authentication required')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const { newSnippet, error: apiError } = await createSnippet(text.trim(), token)
      
      if (apiError) {
        setError(apiError)
        return
      }

      if (!newSnippet) {
        setError('Failed to create snippet')
        return
      }

      // Success - navigate to the new snippet
      navigate(`/snippets/${newSnippet.id}`)
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault()
      handleSubmit(event as any)
    }
  }

  const shouldRenderError = error && !isSubmitting

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        autoFocus
        required
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          if (error) setError('') // Clear error when user types
        }}
        placeholder="Paste your text here to get a summary..."
        className="min-h-[150px] sm:min-h-[200px] resize-none touch-manipulation"
        aria-label="Text content for summarization"
        aria-describedby="textarea-help"
        onKeyDown={handleKeyDown}
        disabled={isSubmitting}
      />

      <div id="textarea-help" className="sr-only">
        Enter or paste the text content you want to summarize. This field is
        required.
      </div>

      {shouldRenderError && (
        <div role="alert" className="text-red-500" aria-live="polite">
          {error}
        </div>
      )}

      <div className="flex-col sm:flex sm:flex-row sm:justify-between sm:items-center gap-2">
        <KeyboardShortcuts />

        <Button
          type="submit"
          disabled={isSubmitting || !text.trim()}
          className="gap-2 w-full sm:w-48"
        >
          {isSubmitting ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          {isSubmitting ? 'Summarizing...' : 'Summarize'}
        </Button>
      </div>
    </form>
  )
}

export default function Index() {
  return (
    <Wrapper>
      <Title />
      <SummarizeForm />
    </Wrapper>
  )
}
