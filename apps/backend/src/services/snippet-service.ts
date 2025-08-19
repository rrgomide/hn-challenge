import { Snippet, CreateSnippetRequest } from '../models/snippet.js'
import { randomUUID } from 'crypto'
import { AIService, createAIService } from './ai-service.js'

export class SnippetService {
  private snippets: Map<string, Snippet> = new Map()
  private aiService: AIService | null = null

  constructor() {
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
    console.debug('🔥 ~ summary:', summary)

    const snippet: Snippet = {
      id,
      text: request.text,
      summary,
    }

    this.snippets.set(id, snippet)
    return snippet
  }

  async getSnippetById(id: string): Promise<Snippet | null> {
    return this.snippets.get(id) || null
  }

  private async generateSummary(text: string): Promise<string> {
    if (!this.aiService) {
      throw new Error('AI service not initialized')
    }

    const summary = await this.aiService.summarizeText(text)
    return summary
  }
}
