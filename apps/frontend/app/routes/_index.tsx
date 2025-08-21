import {
  useOutletContext,
  redirect,
  type ActionFunctionArgs,
} from 'react-router'
import { Form } from 'react-router'
import { Textarea } from '../components/ui/textarea'
import { Button } from '../components/ui/button'
import { Send, Loader2 as Loader } from 'lucide-react'
import { useNavigation } from 'react-router'

interface OutletContext {
  onSnippetCreated: () => void
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()
  const text = formData.get('text') as string

  // Validate input
  if (!text || !text.trim()) {
    throw new Error('Text content is required')
  }

  try {
    const response = await fetch('http://localhost:3000/snippets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: text.trim() }),
    })

    if (!response.ok) {
      throw new Error('Failed to create snippet')
    }

    const snippet = await response.json()

    // Redirect to the created snippet
    return redirect(`/snippets/${snippet.id}`)
  } catch (error) {
    console.error('Error creating snippet:', error)
    throw new Error('Failed to create snippet')
  }
}

export default function Index() {
  const { onSnippetCreated } = useOutletContext<OutletContext>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

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

          <Form method="post" className="space-y-4">
            <Textarea
              name="text"
              placeholder="Paste your text here to get a summary..."
              className="min-h-[150px] sm:min-h-[200px] resize-none touch-manipulation"
              required
            />

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="gap-2 w-full sm:w-48 touch-manipulation"
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
        </div>
      </div>
    </div>
  )
}
