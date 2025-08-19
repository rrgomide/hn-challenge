import { Request, Response } from 'express'
import { SnippetService } from '../services/snippet-service.js'
import { CreateSnippetRequest } from '../models/snippet'

export class SnippetController {
  private snippetService: SnippetService

  constructor() {
    this.snippetService = new SnippetService()
  }

  private sanitizeText(text: string): string {
    // First, remove script tags and their content completely
    let sanitized = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    
    // Remove other HTML tags but keep their content
    sanitized = sanitized.replace(/<[^>]*>/g, '')
    
    // Only normalize whitespace that appears to be from HTML (multiple spaces/tabs)
    // but preserve intentional newlines and single spaces
    sanitized = sanitized.replace(/[ \t]+/g, ' ').trim()
    
    return sanitized
  }

  async createSnippet(request: Request, response: Response): Promise<void> {
    try {
      const { text }: CreateSnippetRequest = request.body

      if (!text || typeof text !== 'string') {
        response
          .status(400)
          .json({ error: 'Text field is required and must be a string' })
        return
      }

      // Sanitize the text input to remove HTML tags and normalize whitespace
      const sanitizedText = this.sanitizeText(text)

      const snippet = await this.snippetService.createSnippet({ text: sanitizedText })
      response.json(snippet)
    } catch (error) {
      console.error('Error creating snippet:', error)
      response.status(500).json({ error: 'Internal server error' })
    }
  }

  async getSnippet(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params

      if (!id || id.trim() === '') {
        res.status(400).json({ error: 'Snippet ID is required' })
        return
      }

      const snippet = await this.snippetService.getSnippetById(id)

      if (!snippet) {
        res.status(404).json({ error: 'Snippet not found' })
        return
      }

      res.json(snippet)
    } catch (error) {
      console.error('Error retrieving snippet:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
}
