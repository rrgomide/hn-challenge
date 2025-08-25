import { Snippet, SnippetsResponse } from '@hn-challenge/shared'
import { API_BASE_URL } from '../lib/api'

export async function getSnippets(token?: string): Promise<{
  snippets: Snippet[]
  error?: string
}> {
  try {
    if (!token) {
      return { snippets: [] }
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    }

    const response = await fetch(`${API_BASE_URL}/snippets`, { headers })

    if (response.ok) {
      const result: SnippetsResponse = await response.json()
      const snippets: Snippet[] = result.data || []
      return { snippets }
    }

    if (response.status === 401) {
      return { snippets: [], error: 'Unauthorized' }
    }

    return { snippets: [], error: 'Failed to fetch snippets' }
  } catch (error) {
    console.error('Failed to fetch snippets server-side:', error)
    return { snippets: [], error: 'Network error' }
  }
}

export async function getSnippet(
  id: string,
  token?: string
): Promise<{
  snippet: Snippet | null
  error?: string
}> {
  try {
    const headers: Record<string, string> = {}

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}/snippets/${id}`, { headers })

    if (response.ok) {
      const snippet: Snippet = await response.json()
      return { snippet }
    }

    if (response.status === 404) {
      return { snippet: null, error: 'Snippet not found' }
    }

    if (response.status === 403) {
      return { snippet: null, error: 'Access denied' }
    }

    return { snippet: null, error: 'Failed to fetch snippet' }
  } catch (error) {
    console.error('Failed to fetch snippet:', error)
    return { snippet: null, error: 'Network error' }
  }
}

export async function postSnippet(text: string, token?: string) {
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
