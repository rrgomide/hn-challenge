import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Request, Response } from 'express'
import { randomUUID } from 'crypto'

// Mock the AI service module before any imports
const mockSummarizeText = vi.fn()
vi.mock('../../services/ai-service.js', () => ({
  createAIService: () => ({
    summarizeText: mockSummarizeText,
    getProviderName: () => 'test',
  }),
}))

import { SnippetController } from '../snippet-controller.js'
import { SnippetService } from '../../services/snippet-service.js'

// Mock repository for testing
const mockRepository = {
  snippets: new Map(),
  async create(snippet: any) {
    const id = randomUUID()
    const now = new Date()
    const fullSnippet = {
      id,
      text: snippet.text,
      summary: snippet.summary,
      createdAt: now,
      updatedAt: now,
    }
    this.snippets.set(id, fullSnippet)
    return fullSnippet
  },
  async findById(id: string) {
    return this.snippets.get(id) || null
  },
  async findAll() {
    return Array.from(this.snippets.values())
  },
  async update(id: string, updates: any) {
    const existing = this.snippets.get(id)
    if (!existing) return null
    const updated = { ...existing, ...updates }
    this.snippets.set(id, updated)
    return updated
  },
  async delete(id: string) {
    return this.snippets.delete(id)
  },
}

describe('SnippetController', () => {
  let controller: SnippetController
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let mockJson: ReturnType<typeof vi.fn>
  let mockStatus: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    mockSummarizeText.mockResolvedValue('Mocked AI summary')
    mockRepository.snippets.clear()
    const snippetService = new SnippetService(mockRepository as any)
    controller = new SnippetController(snippetService)
    mockJson = vi.fn()
    mockStatus = vi.fn().mockReturnValue({ json: mockJson })

    mockRequest = {
      body: {},
      params: {},
    }

    mockResponse = {
      status: mockStatus as any,
      json: mockJson as any,
    }
  })

  describe('createSnippet', () => {
    it('should create and return a snippet when valid text is provided', async () => {
      mockSummarizeText.mockResolvedValue('AI generated summary')
      mockRequest.body = { text: 'Test snippet text' }

      await controller.createSnippet(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.stringMatching(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
          ),
          text: 'Test snippet text',
          summary: 'AI generated summary',
        })
      )
    })

    it('should return 400 when text is missing', async () => {
      mockRequest.body = {}

      await controller.createSnippet(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockStatus).toHaveBeenCalledWith(400)
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Text field is required and must be a string',
      })
    })

    it('should return 400 when text is not a string', async () => {
      mockRequest.body = { text: 123 }

      await controller.createSnippet(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockStatus).toHaveBeenCalledWith(400)
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Text field is required and must be a string',
      })
    })

    it('should return 400 when text is null', async () => {
      mockRequest.body = { text: null }

      await controller.createSnippet(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockStatus).toHaveBeenCalledWith(400)
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Text field is required and must be a string',
      })
    })

    it('should return 400 when text is empty string', async () => {
      mockRequest.body = { text: '' }

      await controller.createSnippet(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockStatus).toHaveBeenCalledWith(400)
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Text field is required and must be a string',
      })
    })

    it('should handle long text and create proper summary', async () => {
      const longText =
        'This is a very long piece of text that should be summarized properly by the service layer'
      const aiSummary = 'AI generated summary for long text'
      mockSummarizeText.mockResolvedValue(aiSummary)
      mockRequest.body = { text: longText }

      await controller.createSnippet(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          text: longText,
          summary: aiSummary,
        })
      )
    })

    it('should return 500 when service throws an error', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})

      // Mock the service to throw an error
      const originalService = (controller as any).snippetService
      ;(controller as any).snippetService = {
        createSnippet: vi.fn().mockRejectedValue(new Error('Service error')),
      }

      mockRequest.body = { text: 'Valid text' }

      await controller.createSnippet(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockStatus).toHaveBeenCalledWith(500)
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Internal server error',
      })
      expect(consoleErrorSpy).toHaveBeenCalled()

      // Restore
      ;(controller as any).snippetService = originalService
      consoleErrorSpy.mockRestore()
    })

    describe('text sanitization', () => {
      it('should sanitize HTML tags from text', async () => {
        const htmlText = '<script>alert("xss")</script>Hello <b>world</b>!'
        const expectedSanitizedText = 'Hello world!'
        mockSummarizeText.mockResolvedValue('Sanitized text summary')

        mockRequest.body = { text: htmlText }

        await controller.createSnippet(
          mockRequest as Request,
          mockResponse as Response
        )

        expect(mockJson).toHaveBeenCalledWith(
          expect.objectContaining({
            text: expectedSanitizedText,
            summary: 'Sanitized text summary',
          })
        )
        expect(mockSummarizeText).toHaveBeenCalledWith(expectedSanitizedText)
      })

      it('should remove potentially dangerous script tags', async () => {
        const maliciousText =
          '<script>document.cookie</script>Safe content here'
        const expectedSanitizedText = 'Safe content here'
        mockSummarizeText.mockResolvedValue('Safe summary')

        mockRequest.body = { text: maliciousText }

        await controller.createSnippet(
          mockRequest as Request,
          mockResponse as Response
        )

        expect(mockJson).toHaveBeenCalledWith(
          expect.objectContaining({
            text: expectedSanitizedText,
          })
        )
      })

      it('should handle text with multiple HTML elements', async () => {
        const complexHtml =
          '<div>Content <span>with</span> <img src="x" onerror="alert(1)"> nested <p>elements</p></div>'
        const expectedSanitizedText = 'Content with nested elements'
        mockSummarizeText.mockResolvedValue('Complex summary')

        mockRequest.body = { text: complexHtml }

        await controller.createSnippet(
          mockRequest as Request,
          mockResponse as Response
        )

        expect(mockJson).toHaveBeenCalledWith(
          expect.objectContaining({
            text: expectedSanitizedText,
          })
        )
      })

      it('should preserve plain text without HTML', async () => {
        const plainText = 'This is plain text with no HTML tags'
        mockSummarizeText.mockResolvedValue('Plain text summary')

        mockRequest.body = { text: plainText }

        await controller.createSnippet(
          mockRequest as Request,
          mockResponse as Response
        )

        expect(mockJson).toHaveBeenCalledWith(
          expect.objectContaining({
            text: plainText,
          })
        )
      })

      it('should handle empty HTML tags', async () => {
        const emptyTagsText = '<div></div><span></span>Actual content<p></p>'
        const expectedSanitizedText = 'Actual content'
        mockSummarizeText.mockResolvedValue('Empty tags summary')

        mockRequest.body = { text: emptyTagsText }

        await controller.createSnippet(
          mockRequest as Request,
          mockResponse as Response
        )

        expect(mockJson).toHaveBeenCalledWith(
          expect.objectContaining({
            text: expectedSanitizedText,
          })
        )
      })

      it('should trim whitespace after sanitization', async () => {
        const whitespaceText = '  <div>  Content  </div>  '
        const expectedSanitizedText = 'Content'
        mockSummarizeText.mockResolvedValue('Trimmed summary')

        mockRequest.body = { text: whitespaceText }

        await controller.createSnippet(
          mockRequest as Request,
          mockResponse as Response
        )

        expect(mockJson).toHaveBeenCalledWith(
          expect.objectContaining({
            text: expectedSanitizedText,
          })
        )
      })
    })
  })

  describe('getSnippet', () => {
    it('should return a snippet when valid ID is provided', async () => {
      const snippetId = 'test-uuid-123'
      const mockSnippet = {
        id: snippetId,
        text: 'Test snippet text',
        summary: 'Test snippet text',
      }

      // Mock the service to return the snippet
      const originalService = (controller as any).snippetService
      ;(controller as any).snippetService = {
        getSnippetById: vi.fn().mockResolvedValue(mockSnippet),
      }

      mockRequest.params = { id: snippetId }

      await controller.getSnippet(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockJson).toHaveBeenCalledWith(mockSnippet)
      expect(mockStatus).not.toHaveBeenCalled()

      // Restore
      ;(controller as any).snippetService = originalService
    })

    it('should return 404 when snippet is not found', async () => {
      const snippetId = 'non-existent-id'

      // Mock the service to return null
      const originalService = (controller as any).snippetService
      ;(controller as any).snippetService = {
        getSnippetById: vi.fn().mockResolvedValue(null),
      }

      mockRequest.params = { id: snippetId }

      await controller.getSnippet(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockStatus).toHaveBeenCalledWith(404)
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Snippet not found',
      })

      // Restore
      ;(controller as any).snippetService = originalService
    })

    it('should return 400 when ID parameter is missing', async () => {
      mockRequest.params = {}

      await controller.getSnippet(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockStatus).toHaveBeenCalledWith(400)
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Snippet ID is required',
      })
    })

    it('should return 400 when ID parameter is empty string', async () => {
      mockRequest.params = { id: '' }

      await controller.getSnippet(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockStatus).toHaveBeenCalledWith(400)
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Snippet ID is required',
      })
    })

    it('should return 500 when service throws an error', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      const snippetId = 'test-id'

      // Mock the service to throw an error
      const originalService = (controller as any).snippetService
      ;(controller as any).snippetService = {
        getSnippetById: vi.fn().mockRejectedValue(new Error('Service error')),
      }

      mockRequest.params = { id: snippetId }

      await controller.getSnippet(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockStatus).toHaveBeenCalledWith(500)
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Internal server error',
      })
      expect(consoleErrorSpy).toHaveBeenCalled()

      // Restore
      ;(controller as any).snippetService = originalService
      consoleErrorSpy.mockRestore()
    })
  })
})
