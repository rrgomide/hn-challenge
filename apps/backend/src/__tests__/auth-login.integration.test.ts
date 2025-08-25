import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import request from 'supertest'
import { Express } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'
import { User, CreateUserRequest, JWTPayload } from '../models/user.js'
import { UserRepository } from '../repositories/user-repository.js'

// Mock user repository with password support
interface UserWithPassword extends User {
  password: string
}

interface MockUserRepository extends UserRepository {
  users: Map<string, UserWithPassword>
}

const mockUserRepository: MockUserRepository = {
  users: new Map<string, UserWithPassword>(),
  async create(user: CreateUserRequest): Promise<User> {
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
    // Return user without password (matching User interface)
    const { password: _password, ...userWithoutPassword } = fullUser
    return userWithoutPassword
  },
  async findByUsername(username: string): Promise<(User & { password: string }) | null> {
    const user = Array.from(this.users.values()).find(user => user.username === username)
    return user || null
  },
  async findByEmail(email: string): Promise<User | null> {
    const userWithPassword = Array.from(this.users.values()).find(user => user.email === email)
    if (!userWithPassword) return null
    const { password: _password, ...user } = userWithPassword
    return user
  },
  async findById(id: string): Promise<User | null> {
    const userWithPassword = this.users.get(id)
    if (!userWithPassword) return null
    const { password: _password, ...user } = userWithPassword
    return user
  },
  async findAll(): Promise<User[]> {
    return Array.from(this.users.values()).map(userWithPassword => {
      const { password: _password, ...user } = userWithPassword
      return user
    })
  },
  async update(id: string, updates: Partial<User>): Promise<User | null> {
    const userWithPassword = this.users.get(id)
    if (!userWithPassword) return null
    const updatedUserWithPassword = { ...userWithPassword, ...updates, updatedAt: new Date() }
    this.users.set(id, updatedUserWithPassword)
    const { password: _password, ...user } = updatedUserWithPassword
    return user
  },
  async delete(id: string): Promise<boolean> {
    return this.users.delete(id)
  },
}

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

describe('Authentication endpoints integration tests', () => {
  let app: Express

  beforeAll(async () => {
    app = await defineControllers()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mockUserRepository.users.clear()
  })

  describe('POST /auth/register', () => {
    it('should successfully register a new user', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      }

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201)

      expect(response.body).toHaveProperty('token')
      expect(response.body).toHaveProperty('user')
      expect(response.body.user.username).toBe('testuser')
      expect(response.body.user.email).toBe('test@example.com')
      expect(response.body.user.role).toBe('user')
      expect(response.body.user).not.toHaveProperty('password')

      // Verify JWT token is valid
      const decoded = jwt.verify(response.body.token, JWT_SECRET) as JWTPayload
      expect(decoded.username).toBe('testuser')
      expect(decoded.role).toBe('user')
    })

    it('should register admin with admin role when specified', async () => {
      const userData = {
        username: 'admin',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin'
      }

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201)

      expect(response.body.user.role).toBe('admin')
    })

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({ username: 'testuser' })
        .expect(400)

      expect(response.body).toEqual({ error: 'Username, email, and password are required' })
    })

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          username: 'testuser',
          email: 'invalid-email',
          password: 'password123'
        })
        .expect(400)

      expect(response.body).toEqual({ error: 'Invalid email format' })
    })

    it('should return 400 for weak password', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: '123'
        })
        .expect(400)

      expect(response.body).toEqual({ error: 'Password must be at least 6 characters long' })
    })

    it('should return 409 for duplicate username', async () => {
      await mockUserRepository.create({
        username: 'existinguser',
        email: 'first@example.com',
        password: 'password123'
      })

      const response = await request(app)
        .post('/auth/register')
        .send({
          username: 'existinguser',
          email: 'second@example.com',
          password: 'password123'
        })
        .expect(409)

      expect(response.body).toEqual({ error: 'Username already exists' })
    })

    it('should return 409 for duplicate email', async () => {
      await mockUserRepository.create({
        username: 'firstuser',
        email: 'same@example.com',
        password: 'password123'
      })

      const response = await request(app)
        .post('/auth/register')
        .send({
          username: 'seconduser',
          email: 'same@example.com',
          password: 'password123'
        })
        .expect(409)

      expect(response.body).toEqual({ error: 'Email already exists' })
    })
  })

  describe('POST /auth/login', () => {
    let testUser: User

    beforeEach(async () => {
      testUser = await mockUserRepository.create({
        username: 'loginuser',
        email: 'login@example.com',
        password: 'password123',
        role: 'user'
      })
    })

    it('should successfully login with valid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'loginuser',
          password: 'password123'
        })
        .expect(200)

      expect(response.body).toHaveProperty('token')
      expect(response.body).toHaveProperty('user')
      expect(response.body.user.username).toBe('loginuser')
      expect(response.body.user.email).toBe('login@example.com')
      expect(response.body.user).not.toHaveProperty('password')

      // Verify JWT token
      const decoded = jwt.verify(response.body.token, JWT_SECRET) as JWTPayload
      expect(decoded.username).toBe('loginuser')
      expect(decoded.userId).toBe(testUser.id)
    })

    it('should return 400 for missing credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ username: 'loginuser' })
        .expect(400)

      expect(response.body).toEqual({ error: 'Username and password are required' })
    })

    it('should return 401 for non-existent user', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'nonexistent',
          password: 'password123'
        })
        .expect(401)

      expect(response.body).toEqual({ error: 'Invalid credentials' })
    })

    it('should return 401 for incorrect password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'loginuser',
          password: 'wrongpassword'
        })
        .expect(401)

      expect(response.body).toEqual({ error: 'Invalid credentials' })
    })

    it('should login admin user with admin role', async () => {
      await mockUserRepository.create({
        username: 'adminuser',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin'
      })

      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'adminuser',
          password: 'password123'
        })
        .expect(200)

      expect(response.body.user.role).toBe('admin')

      const decoded = jwt.verify(response.body.token, JWT_SECRET) as JWTPayload
      expect(decoded.role).toBe('admin')
    })
  })

  describe('Token validation', () => {
    it('should generate valid JWT tokens with correct payload', async () => {
      const userData = {
        username: 'tokentest',
        email: 'token@example.com',
        password: 'password123',
        role: 'moderator'
      }

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201)

      const token = response.body.token
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload

      expect(decoded).toHaveProperty('userId')
      expect(decoded).toHaveProperty('username', 'tokentest')
      expect(decoded).toHaveProperty('role', 'moderator')
      expect(decoded).toHaveProperty('iat')
      expect(decoded).toHaveProperty('exp')
      expect(decoded.exp).toBeGreaterThan(decoded.iat)
    })
  })
})