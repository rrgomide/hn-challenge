import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import request from 'supertest'
import { Express } from 'express'
import { randomUUID } from 'crypto'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { JWTPayload, User, CreateUserRequest, Snippet, CreateSnippetRequest, UserRole } from '@hn-challenge/shared'

// Mock the AI service module before any imports
const mockSummarizeText = vi.fn()
vi.mock('../services/ai-service.js', () => ({
  createAIService: () => ({
    summarizeText: mockSummarizeText,
    getProviderName: () => 'test',
  }),
}))

// Types for mock repositories
interface MockUser extends User {
  password: string
}

interface UserUpdateData {
  username?: string
  email?: string
  password?: string
  role?: UserRole
  updatedAt?: Date
}

interface SnippetUpdateData {
  text?: string
  summary?: string
  isPublic?: boolean
  updatedAt?: Date
}

// Mock user repository for testing
const mockUserRepository = {
  users: new Map<string, MockUser>(),
  async create(user: CreateUserRequest): Promise<MockUser> {
    const id = randomUUID()
    const now = new Date()
    const hashedPassword = await bcrypt.hash(user.password, 10)
    const fullUser = {
      id,
      username: user.username,
      email: user.email,
      password: hashedPassword,
      role: user.role || 'user',
      createdAt: now,
      updatedAt: now,
    }
    this.users.set(id, fullUser)
    return fullUser
  },
  async findByUsername(username: string) {
    return Array.from(this.users.values()).find(user => user.username === username) || null
  },
  async findByEmail(email: string) {
    return Array.from(this.users.values()).find(user => user.email === email) || null
  },
  async findById(id: string) {
    return this.users.get(id) || null
  },
  async update(id: string, updates: UserUpdateData): Promise<MockUser | null> {
    const existing = this.users.get(id)
    if (!existing) return null
    const updated = { ...existing, ...updates }
    this.users.set(id, updated)
    return updated
  },
  async delete(id: string) {
    return this.users.delete(id)
  },
}

// Mock snippet repository with ownership support
const mockSnippetRepository = {
  snippets: new Map<string, Snippet>(),
  async create(snippet: CreateSnippetRequest & { ownerId: string; summary?: string }): Promise<Snippet> {
    const id = randomUUID()
    const now = new Date()
    const fullSnippet: Snippet = {
      id,
      text: snippet.text,
      summary: snippet.summary || 'Default summary',
      ownerId: snippet.ownerId,
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
    return Array.from(this.snippets.values()).filter(snippet => snippet.ownerId === ownerId)
  },
  async findPublic() {
    return Array.from(this.snippets.values()).filter(snippet => snippet.isPublic)
  },
  async findAccessible(userId: string, userRole: string) {
    const all = Array.from(this.snippets.values())
    if (userRole === 'admin' || userRole === 'moderator') {
      return all
    }
    return all.filter(s => s.ownerId === userId || s.isPublic)
  },
  async update(id: string, updates: SnippetUpdateData): Promise<Snippet | null> {
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
  MongoDbSnippetRepository: vi.fn(() => mockSnippetRepository),
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
import { config } from '../config/environment.js'

function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '1h' })
}

describe('Role-based access control integration tests', () => {
  let app: Express
  let userToken: string
  let moderatorToken: string
  let adminToken: string
  let userId: string
  let moderatorId: string
  let _adminId: string

  beforeAll(async () => {
    app = await defineControllers()
    vi.clearAllMocks()
    mockSnippetRepository.snippets.clear()
    mockUserRepository.users.clear()

    // Create test users with different roles
    const user = await mockUserRepository.create({
      username: 'testuser',
      email: 'user@test.com',
      password: 'password123',
      role: 'user'
    })
    userId = user.id
    userToken = generateToken({ userId: user.id, username: user.username, role: user.role })

    const moderator = await mockUserRepository.create({
      username: 'moderator',
      email: 'mod@test.com', 
      password: 'password123',
      role: 'moderator'
    })
    moderatorId = moderator.id
    moderatorToken = generateToken({ userId: moderator.id, username: moderator.username, role: moderator.role })

    const admin = await mockUserRepository.create({
      username: 'admin',
      email: 'admin@test.com',
      password: 'password123', 
      role: 'admin'
    })
    _adminId = admin.id
    adminToken = generateToken({ userId: admin.id, username: admin.username, role: admin.role })
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mockSummarizeText.mockResolvedValue('AI generated summary')
  })

  describe('Snippet creation with ownership', () => {
    it('should allow authenticated user to create snippet', async () => {
      const response = await request(app)
        .post('/snippets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ text: 'User snippet', isPublic: true })
        .expect(201)

      expect(response.body).toHaveProperty('id')
      expect(response.body.text).toBe('User snippet')
      expect(response.body.ownerId).toBe(userId)
      expect(response.body.isPublic).toBe(true)
    })

    it('should reject unauthenticated snippet creation', async () => {
      const response = await request(app)
        .post('/snippets')
        .send({ text: 'Anonymous snippet' })
        .expect(401)

      expect(response.body).toEqual({ error: 'Access token required' })
    })

    it('should create private snippet by default', async () => {
      const response = await request(app)
        .post('/snippets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ text: 'Private snippet' })
        .expect(201)

      expect(response.body.isPublic).toBe(false)
      expect(response.body.ownerId).toBe(userId)
    })
  })

  describe('Snippet retrieval with role-based access', () => {
    let userPrivateSnippet: Snippet
    let userPublicSnippet: Snippet
    let moderatorSnippet: Snippet

    beforeEach(async () => {
      mockSnippetRepository.snippets.clear()

      userPrivateSnippet = await mockSnippetRepository.create({
        text: 'User private snippet',
        summary: 'Private summary',
        ownerId: userId,
        isPublic: false
      })

      userPublicSnippet = await mockSnippetRepository.create({
        text: 'User public snippet',
        summary: 'Public summary',
        ownerId: userId,
        isPublic: true
      })

      moderatorSnippet = await mockSnippetRepository.create({
        text: 'Moderator snippet',
        summary: 'Moderator summary',
        ownerId: moderatorId,
        isPublic: false
      })
    })

    it('should allow user to get their own private snippet', async () => {
      const response = await request(app)
        .get(`/snippets/${userPrivateSnippet.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.id).toBe(userPrivateSnippet.id)
      expect(response.body.text).toBe('User private snippet')
    })

    it('should allow user to get any public snippet', async () => {
      const response = await request(app)
        .get(`/snippets/${userPublicSnippet.id}`)
        .set('Authorization', `Bearer ${moderatorToken}`)
        .expect(200)

      expect(response.body.id).toBe(userPublicSnippet.id)
      expect(response.body.text).toBe('User public snippet')
    })

    it('should deny user access to other user private snippets', async () => {
      const response = await request(app)
        .get(`/snippets/${moderatorSnippet.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403)

      expect(response.body).toEqual({ error: 'Access denied' })
    })

    it('should allow moderator to access any snippet', async () => {
      const response = await request(app)
        .get(`/snippets/${userPrivateSnippet.id}`)
        .set('Authorization', `Bearer ${moderatorToken}`)
        .expect(200)

      expect(response.body.id).toBe(userPrivateSnippet.id)
    })

    it('should allow admin to access any snippet', async () => {
      const response = await request(app)
        .get(`/snippets/${moderatorSnippet.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.id).toBe(moderatorSnippet.id)
    })
  })

  describe('Snippet listing with role-based filtering', () => {
    beforeEach(async () => {
      mockSnippetRepository.snippets.clear()

      await mockSnippetRepository.create({
        text: 'User private snippet',
        summary: 'Private summary',
        ownerId: userId,
        isPublic: false
      })

      await mockSnippetRepository.create({
        text: 'User public snippet',
        summary: 'Public summary',
        ownerId: userId,
        isPublic: true
      })

      await mockSnippetRepository.create({
        text: 'Moderator private snippet',
        summary: 'Mod summary',
        ownerId: moderatorId,
        isPublic: false
      })
    })

    it('should return only own snippets + public snippets for regular user', async () => {
      const response = await request(app)
        .get('/snippets')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.data).toHaveLength(2) // Own private + own public
      expect(response.body.data.every((s: Snippet) => s.ownerId === userId || s.isPublic)).toBe(true)
    })

    it('should return all snippets for moderator', async () => {
      const response = await request(app)
        .get('/snippets')
        .set('Authorization', `Bearer ${moderatorToken}`)
        .expect(200)

      expect(response.body.data).toHaveLength(3) // All snippets
    })

    it('should return all snippets for admin', async () => {
      const response = await request(app)
        .get('/snippets')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.data).toHaveLength(3) // All snippets
    })
  })

  describe('Snippet modification permissions', () => {
    let userSnippet: Snippet
    let moderatorSnippet: Snippet

    beforeEach(async () => {
      mockSnippetRepository.snippets.clear()

      userSnippet = await mockSnippetRepository.create({
        text: 'User snippet',
        summary: 'Summary',
        ownerId: userId,
        isPublic: false
      })

      moderatorSnippet = await mockSnippetRepository.create({
        text: 'Moderator snippet',
        summary: 'Mod summary',
        ownerId: moderatorId,
        isPublic: false
      })
    })

    it('should allow owner to delete their snippet', async () => {
      const response = await request(app)
        .delete(`/snippets/${userSnippet.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(response.body).toEqual({ message: 'Snippet deleted successfully' })
    })

    it('should deny non-owner from deleting snippet', async () => {
      const response = await request(app)
        .delete(`/snippets/${moderatorSnippet.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403)

      expect(response.body).toEqual({ error: 'Access denied' })
    })

    it('should allow moderator to delete any snippet', async () => {
      const response = await request(app)
        .delete(`/snippets/${userSnippet.id}`)
        .set('Authorization', `Bearer ${moderatorToken}`)
        .expect(200)

      expect(response.body).toEqual({ message: 'Snippet deleted successfully' })
    })

    it('should allow admin to delete any snippet', async () => {
      const response = await request(app)
        .delete(`/snippets/${userSnippet.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body).toEqual({ message: 'Snippet deleted successfully' })
    })
  })
})