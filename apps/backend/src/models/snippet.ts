export interface Snippet {
  id: string
  text: string
  summary: string
}

export interface CreateSnippetRequest {
  text: string
}

export interface SnippetsResponse {
  data: Partial<Snippet>[]
  total: number
  page: number
  limit: number
}
