import { Snippet, SnippetsResponse } from '@hn-challenge/shared'
import { API_BASE_URL } from '../lib/api'

export async function postSnippet(text: string) {
  try {
    if (!text || !text.trim()) {
      throw new Error('Text content is required')
    }

    const response = await fetch(`${API_BASE_URL}/snippets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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

export async function getSnippets(): Promise<{
  snippets: Snippet[]
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/snippets`)
    if (response.ok) {
      const result: SnippetsResponse = await response.json()
      const snippets: Snippet[] = result.data
      return { snippets }
    }
    return { snippets: [] }
  } catch (error) {
    console.error('Failed to fetch snippets:', error)
    return { snippets: [] }
  }
}
