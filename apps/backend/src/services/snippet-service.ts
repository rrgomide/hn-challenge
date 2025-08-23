import {
  Snippet,
  CreateSnippetRequest,
  SnippetsResponse,
  UserRole,
} from '@hn-challenge/shared'
import { AIService, createAIService } from './ai-service.js'
import { SnippetRepository } from '../repositories/snippet-repository.js'

interface CreateSnippetWithOwnerRequest extends CreateSnippetRequest {
  ownerId: string
}

export class SnippetService {
  private aiService: AIService | null = null
  private repository: SnippetRepository

  constructor(repository: SnippetRepository) {
    this.repository = repository
    try {
      this.aiService = createAIService()
    } catch (error) {
      console.error('Error creating AI service:', error)
      this.aiService = null
    }
  }

  async createSnippet(request: CreateSnippetWithOwnerRequest): Promise<Snippet> {
    const summary = await this.generateSummary(request.text)

    const snippet: Partial<Snippet> = {
      text: request.text,
      summary,
      ownerId: request.ownerId,
      isPublic: request.isPublic || false,
    }

    return await this.repository.create(snippet)
  }

  async getSnippetById(id: string): Promise<Snippet | null> {
    return await this.repository.findById(id)
  }

  async getAllSnippets(): Promise<SnippetsResponse> {
    const snippets = await this.repository.findAll()

    const response: SnippetsResponse = {
      data: snippets || [],
      total: snippets.length,
      page: 1,
      limit: snippets.length,
    }
    return response
  }

  async getAccessibleSnippets(userId: string, userRole: UserRole): Promise<SnippetsResponse> {
    const snippets = await this.repository.findAccessible(userId, userRole)

    const response: SnippetsResponse = {
      data: snippets || [],
      total: snippets.length,
      page: 1,
      limit: snippets.length,
    }
    return response
  }

  async getSnippetsByOwner(ownerId: string): Promise<Snippet[]> {
    return await this.repository.findByOwnerId(ownerId)
  }

  async getPublicSnippets(): Promise<Snippet[]> {
    return await this.repository.findPublic()
  }

  async updateSnippet(id: string, updates: Partial<Snippet>): Promise<Snippet | null> {
    // If text is being updated, regenerate summary
    if (updates.text && this.aiService) {
      try {
        updates.summary = await this.generateSummary(updates.text)
      } catch (error) {
        console.error('Failed to generate summary for updated snippet:', error)
        // Continue without updating summary if AI service fails
      }
    }

    return await this.repository.update(id, updates as Snippet)
  }

  async deleteSnippet(id: string): Promise<boolean> {
    return await this.repository.delete(id)
  }

  private async generateSummary(text: string): Promise<string> {
    if (!this.aiService) {
      throw new Error('AI service not initialized')
    }

    const summary = await this.aiService.summarizeText(text)
    return summary
  }
}
