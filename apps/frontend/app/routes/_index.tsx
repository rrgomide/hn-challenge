import { Form, useActionData, redirect } from 'react-router'
import { Textarea } from '../components/ui/textarea'
import { Button } from '../components/ui/button'
import { Send } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { getAuthFromCookies } from '../lib/cookies'
import { apiClient } from '../lib/api-client'
import type { ActionFunctionArgs } from 'react-router'

// Server-side action for snippet creation
export async function action({ request }: ActionFunctionArgs) {
  const cookieHeader = request.headers.get('Cookie')
  const { token } = getAuthFromCookies(cookieHeader)
  
  if (!token) {
    throw redirect('/auth')
  }

  const formData = await request.formData()
  const text = formData.get('text') as string
  
  if (!text?.trim()) {
    return { error: 'Text content is required' }
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
  const formRef = useRef<HTMLFormElement>(null)
  const [text, setText] = useState('')
  const actionData = useActionData() as { error?: string } | undefined

  // Clear the text field when form is submitted successfully (no action data means redirect happened)
  useEffect(() => {
    if (!actionData) {
      setText('')
    }
  }, [actionData])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault()
      formRef.current?.requestSubmit()
    }
  }

  const error = actionData?.error
  const shouldRenderError = !!error

  return (
    <Form ref={formRef} method="post" className="space-y-4">
      <Textarea
        autoFocus
        required
        name="text"
        value={text}
        onChange={(e) => {
          setText(e.target.value)
        }}
        placeholder="Paste your text here to get a summary..."
        className="min-h-[150px] sm:min-h-[200px] resize-none touch-manipulation"
        aria-label="Text content for summarization"
        aria-describedby="textarea-help"
        onKeyDown={handleKeyDown}
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
          disabled={!text.trim()}
          className="gap-2 w-full sm:w-48"
        >
          <Send className="w-4 h-4" />
          Summarize
        </Button>
      </div>
    </Form>
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
