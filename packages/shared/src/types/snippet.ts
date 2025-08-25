export interface Snippet {
  id: string
  text: string
  summary: string
  ownerId: string
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateSnippetRequest {
  text: string
  isPublic?: boolean
}

export interface SnippetsResponse {
  data: Snippet[]
  total: number
  page: number
  limit: number
}