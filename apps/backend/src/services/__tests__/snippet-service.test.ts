import { describe, it, expect, beforeEach, vi } from 'vitest'
import { randomUUID } from 'crypto'

// Mock the AI service module before any imports
const mockSummarizeText = vi.fn()
vi.mock('../ai-service.js', () => ({
  createAIService: () => ({
    summarizeText: mockSummarizeText,
    getProviderName: () => 'test',
  }),
}))

import { SnippetService } from '../snippet-service.js'

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

describe('SnippetService', () => {
  let snippetService: SnippetService

  beforeEach(() => {
    vi.clearAllMocks()
    mockRepository.snippets.clear()
    snippetService = new SnippetService(mockRepository as any)
  })

  describe('createSnippet', () => {
    it('should create a snippet with id, text, and summary', async () => {
      mockSummarizeText.mockResolvedValue('This is a test snippet')
      const request = { text: 'This is a test snippet' }

      const result = await snippetService.createSnippet(request)

      expect(result).toHaveProperty('id')
      expect(result.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      )
      expect(result.text).toBe('This is a test snippet')
      expect(result.summary).toBe('This is a test snippet')
      expect(mockSummarizeText).toHaveBeenCalledWith('This is a test snippet')
    })

    it('should generate AI summary for long text', async () => {
      const longText =
        'This is a very long text that contains more than ten words and should be summarized by AI'
      const aiSummary = 'AI generated summary of the long text'
      mockSummarizeText.mockResolvedValue(aiSummary)
      const request = { text: longText }

      const result = await snippetService.createSnippet(request)

      expect(result.text).toBe(longText)
      expect(result.summary).toBe(aiSummary)
      expect(mockSummarizeText).toHaveBeenCalledWith(longText)
    })


    it('should generate unique IDs for different snippets', async () => {
      mockSummarizeText
        .mockResolvedValueOnce('First snippet summary')
        .mockResolvedValueOnce('Second snippet summary')

      const request1 = { text: 'First snippet' }
      const request2 = { text: 'Second snippet' }

      const result1 = await snippetService.createSnippet(request1)
      const result2 = await snippetService.createSnippet(request2)

      expect(result1.id).not.toBe(result2.id)
      expect(result1.summary).toBe('First snippet summary')
      expect(result2.summary).toBe('Second snippet summary')
    })

  })

  describe('getSnippetById', () => {
    it('should return a snippet when it exists', async () => {
      mockSummarizeText.mockResolvedValue('Test summary')
      const request = { text: 'Test snippet' }

      const createdSnippet = await snippetService.createSnippet(request)
      const retrievedSnippet = await snippetService.getSnippetById(
        createdSnippet.id
      )

      expect(retrievedSnippet).toEqual(createdSnippet)
    })

    it('should return null when snippet does not exist', async () => {
      const result = await snippetService.getSnippetById('non-existent-id')

      expect(result).toBeNull()
    })
  })

  describe('AI service initialization', () => {
    it('should handle AI service initialization failure', () => {
      // Mock createAIService to throw an error temporarily
      vi.doMock('../ai-service.js', () => ({
        createAIService: () => {
          throw new Error('AI service init failed')
        },
      }))

      // This should not throw during construction, but log an error
      expect(() => new SnippetService(mockRepository as any)).not.toThrow()
    })

    it('should add getAllSnippets method', async () => {
      mockSummarizeText
        .mockResolvedValueOnce('First snippet summary')
        .mockResolvedValueOnce('Second snippet summary')

      const request1 = { text: 'First snippet' }
      const request2 = { text: 'Second snippet' }

      await snippetService.createSnippet(request1)
      await snippetService.createSnippet(request2)

      const allSnippets = await snippetService.getAllSnippets()

      expect(allSnippets.data).toHaveLength(2)
      expect(allSnippets.data[0].text).toBe('First snippet')
      expect(allSnippets.data[1].text).toBe('Second snippet')
    })
  })
})
