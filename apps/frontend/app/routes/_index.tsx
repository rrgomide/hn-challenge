import { redirect, useActionData, type ActionFunctionArgs } from 'react-router'
import { Form } from 'react-router'
import { Textarea } from '../components/ui/textarea'
import { Button } from '../components/ui/button'
import { Send, Loader2 as Loader } from 'lucide-react'
import { useNavigation } from 'react-router'
import { postSnippet } from '../server/snippets.server'
import { useRef } from 'react'

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()
  const text = formData.get('text')?.toString() ?? ''
  const { newSnippet, error } = await postSnippet(text)

  if (error) {
    return { error }
  }

  if (!newSnippet) {
    return { error: 'Failed to create snippet' }
  }

  return redirect(`/snippets/${newSnippet.id}`)
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
  const navigation = useNavigation()
  const actionData = useActionData<typeof action>()
  const formRef = useRef<HTMLFormElement>(null)
  const isSubmitting = navigation.state === 'submitting'
  const shouldRenderError = actionData?.error && navigation.state === 'idle'

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault()
      formRef.current?.requestSubmit()
    }
  }

  return (
    <Form ref={formRef} method="post" className="space-y-4">
      <Textarea
        autoFocus
        required
        name="text"
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
          {actionData.error}
        </div>
      )}

      <div className="flex-col sm:flex sm:flex-row sm:justify-between sm:items-center gap-2">
        <KeyboardShortcuts />

        <Button
          type="submit"
          disabled={isSubmitting}
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
