import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { UserRepository } from '../repositories/user-repository.js'
import { CreateUserRequest, LoginRequest, AuthResponse } from '../models/user.js'
import { generateToken } from '../middleware/auth.js'

export class AuthController {
  private userRepository: UserRepository

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository
  }

  async register(req: Request, res: Response): Promise<void> {
    try {
      const { username, email, password, role }: CreateUserRequest = req.body

      // Validation
      if (!username || !email || !password) {
        res.status(400).json({ error: 'Username, email, and password are required' })
        return
      }

      if (password.length < 6) {
        res.status(400).json({ error: 'Password must be at least 6 characters long' })
        return
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        res.status(400).json({ error: 'Invalid email format' })
        return
      }

      // Check for existing user
      const existingUserByUsername = await this.userRepository.findByUsername(username)
      if (existingUserByUsername) {
        res.status(409).json({ error: 'Username already exists' })
        return
      }

      const existingUserByEmail = await this.userRepository.findByEmail(email)
      if (existingUserByEmail) {
        res.status(409).json({ error: 'Email already exists' })
        return
      }

      // Create user
      const user = await this.userRepository.create({
        username,
        email,
        password,
        role: role || 'user'
      })

      // Generate token
      const token = generateToken({
        userId: user.id,
        username: user.username,
        role: user.role
      })

      const response: AuthResponse = {
        token,
        user
      }

      res.status(201).json(response)
    } catch (error) {
      console.error('Registration error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, password }: LoginRequest = req.body

      // Validation
      if (!username || !password) {
        res.status(400).json({ error: 'Username and password are required' })
        return
      }

      // Find user with password
      const userWithPassword = await this.userRepository.findByUsername(username)
      if (!userWithPassword) {
        res.status(401).json({ error: 'Invalid credentials' })
        return
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, userWithPassword.password)
      if (!isPasswordValid) {
        res.status(401).json({ error: 'Invalid credentials' })
        return
      }

      // Remove password from user object
      const { password: _, ...user } = userWithPassword

      // Generate token
      const token = generateToken({
        userId: user.id,
        username: user.username,
        role: user.role
      })

      const response: AuthResponse = {
        token,
        user
      }

      res.json(response)
    } catch (error) {
      console.error('Login error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
}