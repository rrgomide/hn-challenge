export async function postSnippet(text: string) {
  try {
    if (!text || !text.trim()) {
      throw new Error('Text content is required')
    }

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

    const newSnippet = await response.json()
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
