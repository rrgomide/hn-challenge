import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import request from 'supertest'
import { Express } from 'express'
import { randomUUID } from 'crypto'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { JWTPayload, CreateUserRequest, User, CreateSnippetRequest, Snippet } from '@hn-challenge/shared'

// Mock the AI service module before any imports
const mockSummarizeText = vi.fn()
vi.mock('../services/ai-service.js', () => ({
  createAIService: () => ({
    summarizeText: mockSummarizeText,
    getProviderName: () => 'test',
  }),
}))

// Mock user repository for testing
const mockUserRepository = {
  users: new Map(),
  async create(user: CreateUserRequest) {
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
  async findAll() {
    return Array.from(this.users.values()).map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }))
  },
  async update(id: string, updates: Partial<User>) {
    const existing = this.users.get(id)
    if (!existing) return null
    const updated = { ...existing, ...updates }
    this.users.set(id, updated)
    
    // Return user without password (matching real repository behavior)
    const { password: _password, ...userWithoutPassword } = updated
    return userWithoutPassword
  },
  async delete(id: string) {
    return this.users.delete(id)
  },
}

// Mock snippet repository
const mockSnippetRepository = {
  snippets: new Map(),
  async create(snippet: CreateSnippetRequest & { ownerId: string, summary: string }) {
    const id = randomUUID()
    const now = new Date()
    const fullSnippet = {
      id,
      text: snippet.text,
      summary: snippet.summary,
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
  async update(id: string, updates: Partial<Snippet>) {
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
        collection: () => null
      }),
      getDb: () => ({
        collection: () => null
      }),
    }),
  },
}))

import { defineControllers } from '../app.js'
import { config } from '../config/environment.js'

function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '1h' })
}

describe('Config endpoints integration tests', () => {
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

  describe('GET /config', () => {
    it('should allow admin to get all users', async () => {
      const response = await request(app)
        .get('/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body).toHaveProperty('users')
      expect(response.body.users).toHaveLength(3)
      
      // Check that no passwords are returned
      response.body.users.forEach((user: User) => {
        expect(user).not.toHaveProperty('password')
        expect(user).toHaveProperty('id')
        expect(user).toHaveProperty('username')
        expect(user).toHaveProperty('email')
        expect(user).toHaveProperty('role')
        expect(user).toHaveProperty('createdAt')
        expect(user).toHaveProperty('updatedAt')
      })

      // Check that all test users are included
      const usernames = response.body.users.map((u: User) => u.username)
      expect(usernames).toContain('testuser')
      expect(usernames).toContain('moderator')
      expect(usernames).toContain('admin')
    })

    it('should deny access to non-admin users', async () => {
      const response = await request(app)
        .get('/config')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403)

      expect(response.body).toEqual({ error: 'Insufficient permissions' })
    })

    it('should deny access to moderators', async () => {
      const response = await request(app)
        .get('/config')
        .set('Authorization', `Bearer ${moderatorToken}`)
        .expect(403)

      expect(response.body).toEqual({ error: 'Insufficient permissions' })
    })

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/config')
        .expect(401)

      expect(response.body).toEqual({ error: 'Access token required' })
    })
  })

  describe('PATCH /config', () => {
    it('should allow admin to toggle user role to admin', async () => {
      const response = await request(app)
        .patch('/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId, role: 'admin' })
        .expect(200)

      expect(response.body).toHaveProperty('user')
      expect(response.body.user.id).toBe(userId)
      expect(response.body.user.role).toBe('admin')
      expect(response.body.user).not.toHaveProperty('password')
      expect(response.body).toHaveProperty('message', 'User role updated successfully')
    })

    it('should allow admin to toggle user role to user', async () => {
      // First make user an admin
      await mockUserRepository.update(userId, { role: 'admin' })

      const response = await request(app)
        .patch('/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId, role: 'user' })
        .expect(200)

      expect(response.body).toHaveProperty('user')
      expect(response.body.user.id).toBe(userId)
      expect(response.body.user.role).toBe('user')
      expect(response.body.user).not.toHaveProperty('password')
    })

    it('should allow admin to toggle user role to moderator', async () => {
      const response = await request(app)
        .patch('/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId, role: 'moderator' })
        .expect(200)

      expect(response.body.user.role).toBe('moderator')
    })

    it('should reject invalid role values', async () => {
      const response = await request(app)
        .patch('/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId, role: 'invalid' })
        .expect(400)

      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toContain('Invalid role')
    })

    it('should reject missing userId', async () => {
      const response = await request(app)
        .patch('/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'admin' })
        .expect(400)

      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toContain('User ID is required')
    })

    it('should reject missing role', async () => {
      const response = await request(app)
        .patch('/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId })
        .expect(400)

      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toContain('Role is required')
    })

    it('should handle non-existent user', async () => {
      const nonExistentId = randomUUID()
      
      const response = await request(app)
        .patch('/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: nonExistentId, role: 'admin' })
        .expect(404)

      expect(response.body).toEqual({ error: 'User not found' })
    })

    it('should deny access to non-admin users', async () => {
      const response = await request(app)
        .patch('/config')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ userId: moderatorId, role: 'admin' })
        .expect(403)

      expect(response.body).toEqual({ error: 'Insufficient permissions' })
    })

    it('should deny access to moderators', async () => {
      const response = await request(app)
        .patch('/config')
        .set('Authorization', `Bearer ${moderatorToken}`)
        .send({ userId, role: 'admin' })
        .expect(403)

      expect(response.body).toEqual({ error: 'Insufficient permissions' })
    })

    it('should require authentication', async () => {
      const response = await request(app)
        .patch('/config')
        .send({ userId, role: 'admin' })
        .expect(401)

      expect(response.body).toEqual({ error: 'Access token required' })
    })
  })
})