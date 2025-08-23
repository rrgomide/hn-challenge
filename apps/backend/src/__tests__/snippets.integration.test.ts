import { describe, it, expect, vi, beforeAll } from 'vitest'
import request from 'supertest'
import { Express } from 'express'
import { randomUUID } from 'crypto'
import jwt from 'jsonwebtoken'
import { JWTPayload } from '@hn-challenge/shared'

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
      ownerId: snippet.ownerId || 'test-user-id',
      isPublic: snippet.isPublic || false,
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
  async findByOwnerId(ownerId: string) {
    return Array.from(this.snippets.values()).filter(s => s.ownerId === ownerId)
  },
  async findPublic() {
    return Array.from(this.snippets.values()).filter(s => s.isPublic)
  },
  async findAccessible(userId: string, userRole: string) {
    const all = Array.from(this.snippets.values())
    if (userRole === 'admin' || userRole === 'moderator') {
      return all
    }
    return all.filter(s => s.ownerId === userId || s.isPublic)
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

// Mock user repository for new auth system
const mockUserRepository = {
  users: new Map(),
  async create() { return {} },
  async findByUsername() { return null },
  async findByEmail() { return null },
  async findById() { return null },
  async update() { return null },
  async delete() { return false },
}

vi.mock('../repositories/mongodb-snippet-repository.js', () => ({
  MongoDbSnippetRepository: vi.fn(() => mockRepository),
}))

vi.mock('../repositories/mongodb-user-repository.js', () => ({
  MongoDbUserRepository: vi.fn(() => mockUserRepository),
}))

vi.mock('../config/database.js', () => ({
  DatabaseConnection: {
    getInstance: () => ({
      connect: async () => ({
        collection: () => null // Mock collection method
      }),
      getDb: () => ({
        collection: () => null // Mock collection method
      }),
    }),
  },
}))

import { defineControllers } from '../app.js'

const JWT_SECRET = 'development-secret-key-change-in-production'

function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' })
}

describe('POST /snippets integration tests', () => {
  let app: Express
  let authToken: string

  beforeAll(async () => {
    app = await defineControllers()
    vi.clearAllMocks()
    mockRepository.snippets.clear()
    
    // Generate auth token for tests
    authToken = generateToken({
      userId: 'test-user-id',
      username: 'testuser',
      role: 'user'
    })
  })

  it('should create a snippet and return 200 with correct response format', async () => {
    const requestBody = {
      text: 'This is a test snippet for integration testing',
    }
    const aiSummary = 'AI generated summary for test snippet'
    mockSummarizeText.mockResolvedValue(aiSummary)

    const response = await request(app)
      .post('/snippets')
      .set('Authorization', `Bearer ${authToken}`)
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


  it('should return 400 when text is missing', async () => {
    const response = await request(app).post('/snippets').set('Authorization', `Bearer ${authToken}`).send({}).expect(400)

    expect(response.body).toEqual({
      error: 'Text field is required and must be a string',
    })
  })

  it('should return 400 when text is not a string', async () => {
    const response = await request(app)
      .post('/snippets')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ text: 123 })
      .expect(400)

    expect(response.body).toEqual({
      error: 'Text field is required and must be a string',
    })
  })

  it('should return 400 when text is empty string', async () => {
    const response = await request(app)
      .post('/snippets')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ text: '' })
      .expect(400)

    expect(response.body).toEqual({
      error: 'Text field is required and must be a string',
    })
  })



  it('should generate unique IDs for different requests', async () => {
    mockSummarizeText
      .mockResolvedValueOnce('AI summary for first snippet')
      .mockResolvedValueOnce('AI summary for second snippet')

    const response1 = await request(app)
      .post('/snippets')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ text: 'First snippet' })
      .expect(200)

    const response2 = await request(app)
      .post('/snippets')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ text: 'Second snippet' })
      .expect(200)

    expect(response1.body.id).not.toBe(response2.body.id)
    expect(response1.body.summary).toBe('AI summary for first snippet')
    expect(response2.body.summary).toBe('AI summary for second snippet')
  })


  describe('text sanitization integration', () => {
    it('should sanitize HTML tags in text input', async () => {
      const htmlText = '<script>alert("xss")</script>Hello <b>world</b>!'
      const expectedSanitizedText = 'Hello world!'
      const aiSummary = 'Sanitized integration summary'
      mockSummarizeText.mockResolvedValue(aiSummary)

      const response = await request(app)
        .post('/snippets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ text: htmlText })
        .expect(200)

      expect(response.body.text).toBe(expectedSanitizedText)
      expect(response.body.summary).toBe(aiSummary)
      expect(mockSummarizeText).toHaveBeenCalledWith(expectedSanitizedText)
    })

  })
})

describe('GET /snippets integration tests', () => {
  let app: Express
  let authToken: string

  beforeAll(async () => {
    app = await defineControllers()
    vi.clearAllMocks()
    mockRepository.snippets.clear()
    
    // Generate auth token for tests
    authToken = generateToken({
      userId: 'test-user-id',
      username: 'testuser',
      role: 'user'
    })
  })

  it('should return empty array when no snippets exist', async () => {
    const response = await request(app).get('/snippets').set('Authorization', `Bearer ${authToken}`).expect(200)

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
      .set('Authorization', `Bearer ${authToken}`)
      .send({ text: 'First test snippet' })
      .expect(200)

    // Create second snippet
    const createResponse2 = await request(app)
      .post('/snippets')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ text: 'Second test snippet' })
      .expect(200)

    // Get all snippets
    const getResponse = await request(app).get('/snippets').set('Authorization', `Bearer ${authToken}`).expect(200)

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


})

describe('GET /snippets/:id integration tests', () => {
  let app: Express
  let authToken: string

  beforeAll(async () => {
    app = await defineControllers()
    vi.clearAllMocks()
    mockRepository.snippets.clear()
    
    // Generate auth token for tests
    authToken = generateToken({
      userId: 'test-user-id',
      username: 'testuser',
      role: 'user'
    })
  })

  it('should return 404 when snippet does not exist', async () => {
    const nonExistentId = '123e4567-e89b-12d3-a456-426614174000'

    const response = await request(app)
      .get(`/snippets/${nonExistentId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404)

    expect(response.body).toEqual({
      error: 'Snippet not found',
    })
  })


  it('should return a snippet when valid ID exists', async () => {
    const aiSummary = 'AI summary for retrieval test'
    mockSummarizeText.mockResolvedValue(aiSummary)

    // First create a snippet
    const createResponse = await request(app)
      .post('/snippets')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ text: 'Test snippet for retrieval' })
      .expect(200)

    const snippetId = createResponse.body.id

    // Then retrieve it
    const getResponse = await request(app)
      .get(`/snippets/${snippetId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)

    expect(getResponse.body).toEqual(expect.objectContaining({
      id: snippetId,
      text: 'Test snippet for retrieval',
      summary: aiSummary,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    }))
  })

})
