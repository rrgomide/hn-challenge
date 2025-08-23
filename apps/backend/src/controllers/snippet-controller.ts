import { Request, Response } from 'express'
import { SnippetService } from '../services/snippet-service.js'
import { CreateSnippetRequest, SnippetsResponse } from '../models/snippet'

export class SnippetController {
  private snippetService: SnippetService

  constructor(snippetService: SnippetService) {
    this.snippetService = snippetService
  }

  private sanitizeText(text: string): string {
    // First, remove script tags and their content completely
    let sanitized = text.replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      ''
    )

    // Remove other HTML tags but keep their content
    sanitized = sanitized.replace(/<[^>]*>/g, '')

    // Only normalize whitespace that appears to be from HTML (multiple spaces/tabs)
    // but preserve intentional newlines and single spaces
    sanitized = sanitized.replace(/[ \t]+/g, ' ').trim()

    return sanitized
  }

  async createSnippet(request: Request, response: Response): Promise<void> {
    try {
      const { text, isPublic }: CreateSnippetRequest = request.body
      const user = request.user!

      if (!text || typeof text !== 'string') {
        response
          .status(400)
          .json({ error: 'Text field is required and must be a string' })
        return
      }

      if (text.trim() === '') {
        response
          .status(400)
          .json({ error: 'Text field is required and must be a string' })
        return
      }

      // Sanitize the text input to remove HTML tags and normalize whitespace
      const sanitizedText = this.sanitizeText(text)

      const snippet = await this.snippetService.createSnippet({
        text: sanitizedText,
        isPublic: isPublic || false,
        ownerId: user.userId
      })
      response.json(snippet)
    } catch (error) {
      console.error('Error creating snippet:', error)
      response.status(500).json({ error: 'Internal server error' })
    }
  }

  async getSnippet(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const user = req.user!

      if (!id || id.trim() === '') {
        res.status(400).json({ error: 'Snippet ID is required' })
        return
      }

      const snippet = await this.snippetService.getSnippetById(id)

      if (!snippet) {
        res.status(404).json({ error: 'Snippet not found' })
        return
      }

      // Check access permissions
      const hasAccess = 
        snippet.ownerId === user.userId || 
        snippet.isPublic || 
        user.role === 'admin' || 
        user.role === 'moderator'

      if (!hasAccess) {
        res.status(403).json({ error: 'Access denied' })
        return
      }

      res.json(snippet)
    } catch (error) {
      console.error('Error retrieving snippet:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }

  async getAllSnippets(request: Request, response: Response): Promise<void> {
    try {
      const user = request.user!
      const snippets = await this.snippetService.getAccessibleSnippets(user.userId, user.role)
      response.json(snippets)
    } catch (error) {
      console.error('Error retrieving all snippets:', error)
      response.status(500).json({ error: 'Internal server error' })
    }
  }

  async updateSnippet(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const { text, isPublic } = req.body
      const user = req.user!

      if (!id || id.trim() === '') {
        res.status(400).json({ error: 'Snippet ID is required' })
        return
      }

      const snippet = await this.snippetService.getSnippetById(id)

      if (!snippet) {
        res.status(404).json({ error: 'Snippet not found' })
        return
      }

      // Check modification permissions
      const canModify = 
        snippet.ownerId === user.userId || 
        user.role === 'admin' || 
        user.role === 'moderator'

      if (!canModify) {
        res.status(403).json({ error: 'Access denied' })
        return
      }

      const updates: any = {}
      if (text !== undefined) {
        if (!text || typeof text !== 'string' || text.trim() === '') {
          res.status(400).json({ error: 'Text must be a non-empty string' })
          return
        }
        updates.text = this.sanitizeText(text)
      }
      if (isPublic !== undefined) {
        updates.isPublic = Boolean(isPublic)
      }

      const updatedSnippet = await this.snippetService.updateSnippet(id, updates)
      res.json(updatedSnippet)
    } catch (error) {
      console.error('Error updating snippet:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }

  async deleteSnippet(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const user = req.user!

      if (!id || id.trim() === '') {
        res.status(400).json({ error: 'Snippet ID is required' })
        return
      }

      const snippet = await this.snippetService.getSnippetById(id)

      if (!snippet) {
        res.status(404).json({ error: 'Snippet not found' })
        return
      }

      // Check deletion permissions
      const canDelete = 
        snippet.ownerId === user.userId || 
        user.role === 'admin' || 
        user.role === 'moderator'

      if (!canDelete) {
        res.status(403).json({ error: 'Access denied' })
        return
      }

      const deleted = await this.snippetService.deleteSnippet(id)
      if (deleted) {
        res.json({ message: 'Snippet deleted successfully' })
      } else {
        res.status(500).json({ error: 'Failed to delete snippet' })
      }
    } catch (error) {
      console.error('Error deleting snippet:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
}
