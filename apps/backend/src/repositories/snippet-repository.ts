import { Snippet } from '../models/snippet.js'

export interface SnippetRepositoryOptions {
  summaryOnly: boolean
}

export interface SnippetRepository {
  create(snippet: Snippet): Promise<Snippet>
  findById(id: string): Promise<Snippet | null>
  findAll(options: SnippetRepositoryOptions): Partial<Snippet[]>
  update(id: string, snippet: Partial<Snippet>): Promise<Snippet | null>
  delete(id: string): Promise<boolean>
}
