import { Snippet } from '../models/snippet.js'

export interface SnippetRepository {
  create(snippet: Partial<Snippet>): Promise<Snippet>
  findById(id: string): Promise<Snippet | null>
  findAll(): Promise<Snippet[]>
  findByOwnerId(ownerId: string): Promise<Snippet[]>
  findPublic(): Promise<Snippet[]>
  findAccessible(userId: string, userRole: 'user' | 'moderator' | 'admin'): Promise<Snippet[]>
  update(id: string, snippet: Snippet): Promise<Snippet | null>
  delete(id: string): Promise<boolean>
}
