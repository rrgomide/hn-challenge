import {
  Snippet,
  CreateSnippetRequest,
  SnippetsResponse,
} from '../models/snippet.js'
import { randomUUID } from 'crypto'
import { AIService, createAIService } from './ai-service.js'
import { SnippetRepository } from '../repositories/snippet-repository.js'

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

  async createSnippet(request: CreateSnippetRequest): Promise<Snippet> {
    const summary = await this.generateSummary(request.text)

    const snippet: Partial<Snippet> = {
      text: request.text,
      summary,
    }

    return await this.repository.create(snippet)
  }

  async getSnippetById(id: string): Promise<Snippet | null> {
    return await this.repository.findById(id)
  }

  async getAllSnippets(): Promise<SnippetsResponse> {
    const snippets = await this.repository.findAll()

    // TODO: Implement pagination
    const response: SnippetsResponse = {
      data: snippets || [],
      total: snippets.length,
      page: 1,
      limit: snippets.length,
    }
    return response
  }

  private async generateSummary(text: string): Promise<string> {
    if (!this.aiService) {
      throw new Error('AI service not initialized')
    }

    const summary = await this.aiService.summarizeText(text)
    return summary
  }
}
