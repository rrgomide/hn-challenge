import { describe, it, expect, vi, beforeAll } from 'vitest'
import request from 'supertest'
import { Express } from 'express'
import { randomUUID } from 'crypto'

// Mock the AI service module before any imports
const mockSummarizeText = vi.fn()
vi.mock('../services/ai-service.js', () => ({
  createAIService: () => ({
    summarizeText: mockSummarizeText,
    getProviderName: () => 'test',
  }),
}))

// Mock MongoDB repository to use in-memory storage for tests
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

vi.mock('../repositories/mongodb-snippet-repository.js', () => ({
  MongoDbSnippetRepository: vi.fn(() => mockRepository),
}))

vi.mock('../config/database.js', () => ({
  DatabaseConnection: {
    getInstance: () => ({
      connect: async () => ({}),
      getDb: () => ({}),
    }),
  },
}))

import { defineControllers } from '../app.js'

describe('POST /snippets integration tests', () => {
  let app: Express

  beforeAll(async () => {
    app = await defineControllers()
    vi.clearAllMocks()
    mockRepository.snippets.clear()
  })

  it('should create a snippet and return 200 with correct response format', async () => {
    const requestBody = {
      text: 'This is a test snippet for integration testing',
    }
    const aiSummary = 'AI generated summary for test snippet'
    mockSummarizeText.mockResolvedValue(aiSummary)

    const response = await request(app)
      .post('/snippets')
      .send(requestBody)
      .expect(200)

    expect(response.body).toHaveProperty('id')
    expect(response.body.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    )
    expect(response.body.text).toBe(requestBody.text)
    expect(response.body.summary).toBe(aiSummary)
    expect(response.body).toHaveProperty('createdAt')
    expect(response.body).toHaveProperty('updatedAt')
    expect(new Date(response.body.createdAt)).toBeInstanceOf(Date)
    expect(new Date(response.body.updatedAt)).toBeInstanceOf(Date)
    expect(mockSummarizeText).toHaveBeenCalledWith(requestBody.text)
  })

  it('should handle long text and create proper summary', async () => {
    const longText =
      'This is a very long piece of text that contains more than ten words and should be properly summarized by AI'
    const requestBody = { text: longText }
    const aiSummary = 'AI generated summary for long text'
    mockSummarizeText.mockResolvedValue(aiSummary)

    const response = await request(app)
      .post('/snippets')
      .send(requestBody)
      .expect(200)

    expect(response.body.text).toBe(longText)
    expect(response.body.summary).toBe(aiSummary)
    expect(mockSummarizeText).toHaveBeenCalledWith(longText)
  })

  it('should return 400 when text is missing', async () => {
    const response = await request(app).post('/snippets').send({}).expect(400)

    expect(response.body).toEqual({
      error: 'Text field is required and must be a string',
    })
  })

  it('should return 400 when text is not a string', async () => {
    const response = await request(app)
      .post('/snippets')
      .send({ text: 123 })
      .expect(400)

    expect(response.body).toEqual({
      error: 'Text field is required and must be a string',
    })
  })

  it('should return 400 when text is empty string', async () => {
    const response = await request(app)
      .post('/snippets')
      .send({ text: '' })
      .expect(400)

    expect(response.body).toEqual({
      error: 'Text field is required and must be a string',
    })
  })

  it('should return 400 when text is null', async () => {
    const response = await request(app)
      .post('/snippets')
      .send({ text: null })
      .expect(400)

    expect(response.body).toEqual({
      error: 'Text field is required and must be a string',
    })
  })

  it('should handle special characters in text', async () => {
    const specialText =
      'Special chars: !@#$%^&*()_+{}|:"<>?[]\\;\',./ àáâãäåæçèéêë'
    const expectedSanitizedText =
      'Special chars: !@#$%^&*()_+{}|:"?[]\\;\',./ àáâãäåæçèéêë' // < and > are removed
    const requestBody = { text: specialText }
    const aiSummary = 'AI summary for special characters'
    mockSummarizeText.mockResolvedValue(aiSummary)

    const response = await request(app).post('/snippets').send(requestBody)

    expect(response.body.text).toBe(expectedSanitizedText)
    expect(response.body.summary).toBe(aiSummary)
    expect(mockSummarizeText).toHaveBeenCalledWith(expectedSanitizedText)
  })

  it('should handle text with newlines and tabs', async () => {
    const textWithWhitespace = 'Line 1\nLine 2\tTabbed content\n\nLine 4'
    const expectedSanitizedText = 'Line 1\nLine 2 Tabbed content\n\nLine 4' // tabs are normalized to single spaces
    const requestBody = { text: textWithWhitespace }
    const aiSummary = 'AI summary for whitespace text'
    mockSummarizeText.mockResolvedValue(aiSummary)

    const response = await request(app).post('/snippets').send(requestBody)

    expect(response.body.text).toBe(expectedSanitizedText)
    expect(response.body.summary).toBe(aiSummary)
    expect(mockSummarizeText).toHaveBeenCalledWith(expectedSanitizedText)
  })

  it('should generate unique IDs for different requests', async () => {
    mockSummarizeText
      .mockResolvedValueOnce('AI summary for first snippet')
      .mockResolvedValueOnce('AI summary for second snippet')

    const response1 = await request(app)
      .post('/snippets')
      .send({ text: 'First snippet' })
      .expect(200)

    const response2 = await request(app)
      .post('/snippets')
      .send({ text: 'Second snippet' })
      .expect(200)

    expect(response1.body.id).not.toBe(response2.body.id)
    expect(response1.body.summary).toBe('AI summary for first snippet')
    expect(response2.body.summary).toBe('AI summary for second snippet')
  })

  it('should handle JSON content-type correctly', async () => {
    const aiSummary = 'AI summary for content type test'
    mockSummarizeText.mockResolvedValue(aiSummary)

    const response = await request(app)
      .post('/snippets')
      .set('Content-Type', 'application/json')
      .send({ text: 'Content type test' })
      .expect(200)

    expect(response.body.text).toBe('Content type test')
    expect(response.body.summary).toBe(aiSummary)
  })

  it('should return proper JSON response format', async () => {
    const aiSummary = 'AI summary for JSON format test'
    mockSummarizeText.mockResolvedValue(aiSummary)

    const response = await request(app)
      .post('/snippets')
      .send({ text: 'JSON format test' })
      .expect(200)

    expect(response.headers['content-type']).toMatch(/json/)
    expect(typeof response.body).toBe('object')
    expect(response.body).not.toBeNull()
  })

  describe('text sanitization integration', () => {
    it('should sanitize HTML tags in text input', async () => {
      const htmlText = '<script>alert("xss")</script>Hello <b>world</b>!'
      const expectedSanitizedText = 'Hello world!'
      const aiSummary = 'Sanitized integration summary'
      mockSummarizeText.mockResolvedValue(aiSummary)

      const response = await request(app)
        .post('/snippets')
        .send({ text: htmlText })
        .expect(200)

      expect(response.body.text).toBe(expectedSanitizedText)
      expect(response.body.summary).toBe(aiSummary)
      expect(mockSummarizeText).toHaveBeenCalledWith(expectedSanitizedText)
    })

    it('should handle malicious script injection attempts', async () => {
      const maliciousText =
        '<img src="x" onerror="alert(document.cookie)">Safe content'
      const expectedSanitizedText = 'Safe content'
      const aiSummary = 'Safe integration summary'
      mockSummarizeText.mockResolvedValue(aiSummary)

      const response = await request(app)
        .post('/snippets')
        .send({ text: maliciousText })
        .expect(200)

      expect(response.body.text).toBe(expectedSanitizedText)
      expect(response.body.summary).toBe(aiSummary)
    })

    it('should normalize whitespace after HTML removal', async () => {
      const messyHtml =
        '  <div>  Multiple   </div>  <span>    spaces   </span>  '
      const expectedSanitizedText = 'Multiple spaces'
      const aiSummary = 'Normalized whitespace summary'
      mockSummarizeText.mockResolvedValue(aiSummary)

      const response = await request(app)
        .post('/snippets')
        .send({ text: messyHtml })
        .expect(200)

      expect(response.body.text).toBe(expectedSanitizedText)
    })
  })
})

describe('GET /snippets integration tests', () => {
  let app: Express

  beforeAll(async () => {
    app = await defineControllers()
    vi.clearAllMocks()
    mockRepository.snippets.clear()
  })

  it('should return empty array when no snippets exist', async () => {
    const response = await request(app).get('/snippets').expect(200)

    expect(response.body).toEqual({
      data: [],
      total: 0,
      page: 1,
      limit: 0,
    })
  })

  it('should return all snippets', async () => {
    const aiSummary1 = 'AI summary for snippet 1'
    const aiSummary2 = 'AI summary for snippet 2'

    mockSummarizeText
      .mockResolvedValueOnce(aiSummary1)
      .mockResolvedValueOnce(aiSummary2)

    // Create first snippet
    const createResponse1 = await request(app)
      .post('/snippets')
      .send({ text: 'First test snippet' })
      .expect(200)

    // Create second snippet
    const createResponse2 = await request(app)
      .post('/snippets')
      .send({ text: 'Second test snippet' })
      .expect(200)

    // Get all snippets
    const getResponse = await request(app).get('/snippets').expect(200)

    expect(getResponse.body.data).toHaveLength(2)
    expect(getResponse.body.total).toBe(2)
    expect(getResponse.body.page).toBe(1)
    expect(getResponse.body.limit).toBe(2)
    expect(getResponse.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: createResponse1.body.id,
          text: 'First test snippet',
          summary: aiSummary1,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        }),
        expect.objectContaining({
          id: createResponse2.body.id,
          text: 'Second test snippet',
          summary: aiSummary2,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        }),
      ])
    )
  })

  it('should return correct content type for JSON response', async () => {
    const response = await request(app).get('/snippets').expect(200)

    expect(response.headers['content-type']).toMatch(/json/)
    expect(response.body).toHaveProperty('data')
    expect(response.body).toHaveProperty('total')
    expect(response.body).toHaveProperty('page')
    expect(response.body).toHaveProperty('limit')
  })

})

describe('GET /snippets/:id integration tests', () => {
  let app: Express

  beforeAll(async () => {
    app = await defineControllers()
    vi.clearAllMocks()
    mockRepository.snippets.clear()
  })

  it('should return 404 when snippet does not exist', async () => {
    const nonExistentId = '123e4567-e89b-12d3-a456-426614174000'

    const response = await request(app)
      .get(`/snippets/${nonExistentId}`)
      .expect(404)

    expect(response.body).toEqual({
      error: 'Snippet not found',
    })
  })

  it('should return 404 when snippet with invalid ID format does not exist', async () => {
    const invalidId = 'invalid-id'

    const response = await request(app)
      .get(`/snippets/${invalidId}`)
      .expect(404)

    expect(response.body).toEqual({
      error: 'Snippet not found',
    })
  })

  it('should return all snippets when accessing /snippets/', async () => {
    await request(app).get('/snippets/').expect(200) // This now routes to GET /snippets endpoint
  })

  it('should return a snippet when valid ID exists', async () => {
    const aiSummary = 'AI summary for retrieval test'
    mockSummarizeText.mockResolvedValue(aiSummary)

    // First create a snippet
    const createResponse = await request(app)
      .post('/snippets')
      .send({ text: 'Test snippet for retrieval' })
      .expect(200)

    const snippetId = createResponse.body.id

    // Then retrieve it
    const getResponse = await request(app)
      .get(`/snippets/${snippetId}`)
      .expect(200)

    expect(getResponse.body).toEqual(expect.objectContaining({
      id: snippetId,
      text: 'Test snippet for retrieval',
      summary: aiSummary,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    }))
  })

  it('should return correct snippet with long text and summary', async () => {
    const longText =
      'This is a very long piece of text that contains more than ten words and should be properly summarized by AI'
    const aiSummary = 'AI summary for long text in GET test'
    mockSummarizeText.mockResolvedValue(aiSummary)

    // First create a snippet
    const createResponse = await request(app)
      .post('/snippets')
      .send({ text: longText })
      .expect(200)

    const snippetId = createResponse.body.id

    // Then retrieve it
    const getResponse = await request(app)
      .get(`/snippets/${snippetId}`)
      .expect(200)

    expect(getResponse.body).toEqual(expect.objectContaining({
      id: snippetId,
      text: longText,
      summary: aiSummary,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    }))
  })

  it('should return correct content type for JSON response', async () => {
    const aiSummary = 'AI summary for content type in GET test'
    mockSummarizeText.mockResolvedValue(aiSummary)

    // First create a snippet
    const createResponse = await request(app)
      .post('/snippets')
      .send({ text: 'Content type test' })
      .expect(200)

    const snippetId = createResponse.body.id

    // Then retrieve it
    const getResponse = await request(app)
      .get(`/snippets/${snippetId}`)
      .expect(200)

    expect(getResponse.headers['content-type']).toMatch(/json/)
    expect(typeof getResponse.body).toBe('object')
    expect(getResponse.body).not.toBeNull()
  })

  it('should handle special characters in retrieved snippet', async () => {
    const specialText =
      'Special chars: !@#$%^&*()_+{}|:"<>?[]\\;\',./ àáâãäåæçèéêë'
    const expectedSanitizedText =
      'Special chars: !@#$%^&*()_+{}|:"?[]\\;\',./ àáâãäåæçèéêë' // < and > are removed
    const aiSummary = 'AI summary for special chars in GET test'
    mockSummarizeText.mockResolvedValue(aiSummary)

    // First create a snippet
    const createResponse = await request(app)
      .post('/snippets')
      .send({ text: specialText })
      .expect(200)

    const snippetId = createResponse.body.id

    // Then retrieve it
    const getResponse = await request(app)
      .get(`/snippets/${snippetId}`)
      .expect(200)

    expect(getResponse.body.text).toBe(expectedSanitizedText)
    expect(getResponse.body.summary).toBe(aiSummary)
  })

  it('should preserve whitespace in retrieved snippet', async () => {
    const textWithWhitespace = 'Line 1\nLine 2\tTabbed content\n\nLine 4'
    const expectedSanitizedText = 'Line 1\nLine 2 Tabbed content\n\nLine 4' // tabs are normalized to single spaces
    const aiSummary = 'AI summary for whitespace in GET test'
    mockSummarizeText.mockResolvedValue(aiSummary)

    // First create a snippet
    const createResponse = await request(app)
      .post('/snippets')
      .send({ text: textWithWhitespace })
      .expect(200)

    const snippetId = createResponse.body.id

    // Then retrieve it
    const getResponse = await request(app)
      .get(`/snippets/${snippetId}`)
      .expect(200)

    expect(getResponse.body.text).toBe(expectedSanitizedText)
    expect(getResponse.body.summary).toBe(aiSummary)
  })
})
