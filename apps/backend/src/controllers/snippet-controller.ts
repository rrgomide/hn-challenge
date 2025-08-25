import { Request, Response, NextFunction } from 'express'
import { SnippetService } from '../services/snippet-service.js'
import { CreateSnippetRequest } from '../models/snippet'
import { Snippet } from '@hn-challenge/shared'
import { ValidationError, NotFoundError, ForbiddenError } from '../utils/errors.js'
import { validateString, validateUUID, validateBoolean, sanitizeText } from '../utils/validators.js'

export class SnippetController {
  constructor(private readonly snippetService: SnippetService) {}

  createSnippet = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const { text, isPublic }: CreateSnippetRequest = request.body
      const user = request.user!

      // Custom validation for text to match test expectations  
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        throw new ValidationError('Text field is required and must be a string')
      }
      
      const sanitizedText = sanitizeText(text)
      const publicFlag = validateBoolean(isPublic, 'isPublic')

      const snippet = await this.snippetService.createSnippet({
        text: sanitizedText,
        isPublic: publicFlag,
        ownerId: user.userId
      })
      
      response.status(201).json(snippet)
    } catch (error) {
      next(error)
    }
  }

  getSnippet = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = request.params
      const user = request.user!

      validateUUID(id, 'snippet ID')

      const snippet = await this.snippetService.getSnippetById(id)
      if (!snippet) {
        throw new NotFoundError('Snippet not found')
      }

      // Check access permissions
      const hasAccess = await this.snippetService.hasReadAccess(snippet, user.userId, user.role)
      if (!hasAccess) {
        throw new ForbiddenError('Access denied')
      }

      response.json(snippet)
    } catch (error) {
      next(error)
    }
  }

  getAllSnippets = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const user = request.user!
      const snippetsResponse = await this.snippetService.getAccessibleSnippets(user.userId, user.role)
      
      // Service already returns paginated response
      response.json(snippetsResponse)
    } catch (error) {
      next(error)
    }
  }

  updateSnippet = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = request.params
      const { text, isPublic } = request.body
      const user = request.user!

      validateUUID(id, 'snippet ID')

      const snippet = await this.snippetService.getSnippetById(id)
      if (!snippet) {
        throw new NotFoundError('Snippet not found')
      }

      // Check modification permissions
      const canModify = await this.snippetService.hasWriteAccess(snippet, user.userId, user.role)
      if (!canModify) {
        throw new ForbiddenError('Access denied')
      }

      const updates: Partial<Pick<Snippet, 'text' | 'isPublic'>> = {}
      if (text !== undefined) {
        validateString(text, 'text')
        updates.text = sanitizeText(text)
      }
      if (isPublic !== undefined) {
        updates.isPublic = validateBoolean(isPublic, 'isPublic')
      }

      const updatedSnippet = await this.snippetService.updateSnippet(id, updates)
      response.json(updatedSnippet)
    } catch (error) {
      next(error)
    }
  }

  deleteSnippet = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = request.params
      const user = request.user!

      validateUUID(id, 'snippet ID')

      const snippet = await this.snippetService.getSnippetById(id)
      if (!snippet) {
        throw new NotFoundError('Snippet not found')
      }

      // Check deletion permissions
      const canDelete = await this.snippetService.hasWriteAccess(snippet, user.userId, user.role)
      if (!canDelete) {
        throw new ForbiddenError('Access denied')
      }

      const deleted = await this.snippetService.deleteSnippet(id)
      if (deleted) {
        response.json({ message: 'Snippet deleted successfully' })
      } else {
        throw new Error('Failed to delete snippet')
      }
    } catch (error) {
      next(error)
    }
  }

  createSnippetStream = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const { text, isPublic }: CreateSnippetRequest = request.body
      const user = request.user!

      // Custom validation for text to match test expectations  
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        throw new ValidationError('Text field is required and must be a string')
      }
      
      const sanitizedText = sanitizeText(text)
      const publicFlag = validateBoolean(isPublic, 'isPublic')

      const { snippet, summaryStream } = await this.snippetService.createSnippetStream({
        text: sanitizedText,
        isPublic: publicFlag,
        ownerId: user.userId
      })

      // Set headers for Server-Sent Events
      response.setHeader('Content-Type', 'text/plain')
      response.setHeader('Cache-Control', 'no-cache')
      response.setHeader('Connection', 'keep-alive')
      response.setHeader('Access-Control-Allow-Origin', '*')
      response.setHeader('Access-Control-Allow-Headers', 'Cache-Control')

      // Send initial snippet data as JSON followed by newline
      response.write(`data: ${JSON.stringify({ type: 'snippet', data: snippet })}\n\n`)

      let fullSummary = ''

      try {
        // Stream the summary chunks
        for await (const chunk of summaryStream) {
          fullSummary += chunk
          response.write(`data: ${JSON.stringify({ type: 'summary_chunk', data: chunk })}\n\n`)
        }

        // Update the snippet with the complete summary
        await this.snippetService.updateSnippet(snippet.id, { summary: fullSummary })

        // Send completion event
        response.write(`data: ${JSON.stringify({ type: 'complete', data: { summary: fullSummary } })}\n\n`)
        
      } catch (streamError) {
        console.error('Error during streaming:', streamError)
        response.write(`data: ${JSON.stringify({ type: 'error', data: { message: 'Stream interrupted' } })}\n\n`)
      }

      response.end()
    } catch (error) {
      next(error)
    }
  }
}
