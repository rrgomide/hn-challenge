import { Snippet, CreateSnippetRequest, SnippetsResponse } from '@hn-challenge/shared'
import { apiClient, APIError } from '../lib/api-client'

export interface SnippetResult {
  success: boolean
  error?: string
  data?: Snippet
}

export interface SnippetsResult {
  success: boolean
  error?: string
  data?: SnippetsResponse
}

export class SnippetService {
  async getSnippets(token: string): Promise<SnippetsResult> {
    try {
      const data: SnippetsResponse = await apiClient.get('/snippets', token)
      return { success: true, data }
    } catch (error) {
      if (error instanceof APIError) {
        return { success: false, error: error.message }
      }
      return { success: false, error: 'Failed to fetch snippets' }
    }
  }

  async getSnippet(id: string, token: string): Promise<SnippetResult> {
    try {
      const data: Snippet = await apiClient.get(`/snippets/${id}`, token)
      return { success: true, data }
    } catch (error) {
      if (error instanceof APIError) {
        return { success: false, error: error.message }
      }
      return { success: false, error: 'Failed to fetch snippet' }
    }
  }

  async createSnippet(snippet: CreateSnippetRequest, token: string): Promise<SnippetResult> {
    try {
      const data: Snippet = await apiClient.post('/snippets', snippet, token)
      return { success: true, data }
    } catch (error) {
      if (error instanceof APIError) {
        return { success: false, error: error.message }
      }
      return { success: false, error: 'Failed to create snippet' }
    }
  }

  async updateSnippet(
    id: string, 
    updates: Partial<Pick<Snippet, 'text' | 'isPublic'>>, 
    token: string
  ): Promise<SnippetResult> {
    try {
      const data: Snippet = await apiClient.put(`/snippets/${id}`, updates, token)
      return { success: true, data }
    } catch (error) {
      if (error instanceof APIError) {
        return { success: false, error: error.message }
      }
      return { success: false, error: 'Failed to update snippet' }
    }
  }

  async deleteSnippet(id: string, token: string): Promise<{ success: boolean; error?: string }> {
    try {
      await apiClient.delete(`/snippets/${id}`, token)
      return { success: true }
    } catch (error) {
      if (error instanceof APIError) {
        return { success: false, error: error.message }
      }
      return { success: false, error: 'Failed to delete snippet' }
    }
  }
}

export const snippetService = new SnippetService()