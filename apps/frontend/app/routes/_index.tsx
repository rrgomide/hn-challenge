import { Form, useActionData, redirect, useNavigation, Link, useNavigate } from 'react-router'
import { Textarea } from '../components/ui/textarea'
import { Button } from '../components/ui/button'
import { RadioGroup, RadioItem } from '../components/ui/radio-group'
import { ScrollArea } from '../components/ui/scroll-area'
import { Send, Zap, Clock } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { getAuthFromCookies } from '../lib/cookies'
import { apiClient } from '../lib/api-client'
import { useAuth } from '../contexts/auth-context'
import { API_BASE_URL } from '../lib/api'
import type { ActionFunctionArgs } from 'react-router'

export async function action({ request }: ActionFunctionArgs) {
  const cookieHeader = request.headers.get('Cookie')
  const { token } = getAuthFromCookies(cookieHeader)
  
  if (!token) {
    throw redirect('/auth')
  }

  const formData = await request.formData()
  const text = formData.get('text') as string
  const mode = formData.get('mode') as 'batch' | 'stream'
  const useStreaming = mode === 'stream'
  
  if (!text?.trim()) {
    return { error: 'Text content is required' }
  }

  // Only handle batch requests in the server action
  // Streaming is handled client-side
  if (useStreaming) {
    return { error: 'Streaming should be handled client-side' }
  }

  try {
    const snippet = await apiClient.post('/snippets', { text: text.trim() }, token)
    return redirect(`/snippets/${snippet.id}`)
  } catch (error) {
    console.error('Action error creating snippet:', error)
    return { 
      error: error instanceof Error ? error.message : 'Failed to create snippet. Please try again.'
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
      <h1 className="text-2xl sm:text-4xl font-bold">
        <Link to="/" className="hover:text-primary transition-colors">
          Snippet Summarizer
        </Link>
      </h1>
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
  const formRef = useRef<HTMLFormElement>(null)
  const [text, setText] = useState('')
  const [mode, setMode] = useState<'batch' | 'stream'>('batch')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [streamingData, setStreamingData] = useState<{
    snippet: any;
    summary: string;
    isComplete: boolean;
  } | null>(null)
  
  const actionData = useActionData() as { error?: string } | undefined
  const navigation = useNavigation()
  const isServerSubmitting = navigation.state === 'submitting'
  const navigate = useNavigate()
  const { token } = useAuth()

  // Clear the text field when form is submitted successfully (no action data means redirect happened)
  const useStreaming = mode === 'stream'
  useEffect(() => {
    if (!actionData && !useStreaming) {
      setText('')
    }
  }, [actionData, useStreaming])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault()
      if (useStreaming) {
        handleStreamingSubmit()
      } else {
        formRef.current?.requestSubmit()
      }
    }
  }

  const handleStreamingSubmit = async () => {
    if (!text.trim() || !token || isSubmitting) return
    
    setIsSubmitting(true)
    setError(null)
    setStreamingData(null)

    try {
      const response = await fetch(`${API_BASE_URL}/snippets/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: text.trim(),
          isPublic: false
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let snippet: any = null
      let summaryAccumulator = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              switch (data.type) {
                case 'snippet':
                  snippet = data.data
                  setStreamingData({
                    snippet: data.data,
                    summary: '',
                    isComplete: false
                  })
                  break
                  
                case 'summary_chunk':
                  summaryAccumulator += data.data
                  setStreamingData(prev => prev ? {
                    ...prev,
                    summary: summaryAccumulator
                  } : null)
                  break
                  
                case 'complete':
                  setStreamingData(prev => prev ? {
                    ...prev,
                    summary: data.data.summary,
                    isComplete: true
                  } : null)
                  
                  // Don't redirect for streaming - per requirement
                  setText('')
                  break
                  
                case 'error':
                  throw new Error(data.data.message)
              }
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError)
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error)
      setError(error instanceof Error ? error.message : 'Failed to create snippet')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNormalSubmit = (e: React.FormEvent) => {
    if (useStreaming) {
      e.preventDefault()
      handleStreamingSubmit()
    }
    // Let the form submit normally for batch mode
  }

  const displayError = error || actionData?.error
  const showSpinner = isSubmitting || isServerSubmitting

  return (
    <div className="space-y-4">
      <Form ref={formRef} method="post" className="space-y-4" onSubmit={handleNormalSubmit}>
        <Textarea
          autoFocus
          required
          name="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setError(null)
          }}
          placeholder="Paste your text here to get a summary..."
          className="min-h-[150px] sm:min-h-[200px] resize-none touch-manipulation"
          aria-label="Text content for summarization"
          aria-describedby="textarea-help"
          onKeyDown={handleKeyDown}
        />

        <input type="hidden" name="mode" value={mode} />

        <div id="textarea-help" className="sr-only">
          Enter or paste the text content you want to summarize. This field is
          required.
        </div>

        {/* Processing Mode Selection */}
        <div className="flex flex-col items-center space-y-3">
          <RadioGroup
            value={mode}
            onValueChange={(value) => setMode(value as 'batch' | 'stream')}
            name="processingMode"
            className="w-full max-w-xs"
          >
            <RadioItem value="batch" className="flex-1">
              <Clock className="h-4 w-4" />
              <span>Batch</span>
            </RadioItem>
            <RadioItem value="stream" className="flex-1">
              <Zap className="h-4 w-4" />
              <span>Stream</span>
            </RadioItem>
          </RadioGroup>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          {mode === 'stream'
            ? "Real-time streaming - see your summary as it's generated" 
            : "Traditional mode - wait for complete summary before redirect"
          }
        </p>

        {displayError && (
          <div role="alert" className="text-red-500 text-sm" aria-live="polite">
            {displayError}
          </div>
        )}

        <div className="flex-col sm:flex sm:flex-row sm:justify-between sm:items-center gap-2">
          <KeyboardShortcuts />

          <Button
            type="submit"
            disabled={!text.trim() || showSpinner}
            className="gap-2 w-full sm:w-48"
          >
            {useStreaming ? (
              <Zap className={`w-4 h-4 ${showSpinner ? 'animate-pulse' : ''}`} />
            ) : (
              <Send className={`w-4 h-4 ${showSpinner ? 'animate-pulse' : ''}`} />
            )}
            {showSpinner ? (useStreaming ? 'Streaming...' : 'Summarizing...') : 'Summarize'}
          </Button>
        </div>
      </Form>

      {/* Streaming Results Display */}
      {streamingData && (
        <div className="mt-6 p-4 bg-card border border-border rounded-lg space-y-3 max-h-96">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">
              {streamingData.isComplete ? 'Summary Complete' : 'Generating Summary...'}
            </h3>
            {!streamingData.isComplete && (
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            )}
          </div>
          
          <ScrollArea className="max-h-64">
            <div className="bg-muted p-3 rounded text-sm">
              {streamingData.summary || 'Waiting for summary...'}
              {!streamingData.isComplete && <span className="animate-pulse">|</span>}
            </div>
          </ScrollArea>

          {streamingData.isComplete && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/snippets/${streamingData.snippet.id}`)}
              >
                View Full Snippet
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
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
