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
    const id = randomUUID()
    const summary = await this.generateSummary(request.text)
    const now = new Date()

    const snippet: Snippet = {
      id,
      text: request.text,
      summary,
      createdAt: now,
      updatedAt: now,
    }

    return await this.repository.create(snippet)
  }

  async getSnippetById(id: string): Promise<Snippet | null> {
    return await this.repository.findById(id)
  }

  async getAllSnippets(
    options: { summaryOnly: boolean } = { summaryOnly: false }
  ): Promise<SnippetsResponse> {
    const snippets = await this.repository.findAll(options)

    // TODO: Implement pagination
    return {
      data: snippets,
      total: snippets.length,
      page: 1,
      limit: snippets.length,
    }
  }

  private async generateSummary(text: string): Promise<string> {
    if (!this.aiService) {
      throw new Error('AI service not initialized')
    }

    const summary = await this.aiService.summarizeText(text)
    return summary
  }
}
