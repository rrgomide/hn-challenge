import { redirect, useActionData, type ActionFunctionArgs } from 'react-router'
import { Form } from 'react-router'
import { Textarea } from '../components/ui/textarea'
import { Button } from '../components/ui/button'
import { Send, Loader2 as Loader } from 'lucide-react'
import { useNavigation } from 'react-router'
import { postSnippet } from '../server/snippets.server'

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

function SummarizeForm() {
  const navigation = useNavigation()
  const actionData = useActionData<typeof action>()
  const isSubmitting = navigation.state === 'submitting'

  return (
    <Form method="post" className="space-y-4">
      <Textarea
        name="text"
        placeholder="Paste your text here to get a summary..."
        className="min-h-[150px] sm:min-h-[200px] resize-none touch-manipulation"
        required
        aria-label="Text content for summarization"
        aria-describedby="textarea-help"
      />
      <div id="textarea-help" className="sr-only">
        Enter or paste the text content you want to summarize. This field is required.
      </div>

      {actionData?.error && (
        <div role="alert" className="text-red-500" aria-live="polite">
          {actionData.error}
        </div>
      )}

      <div className="flex justify-end">
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
