import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import { UserRepository } from '../repositories/user-repository.js'
import { CreateUserRequest, LoginRequest, AuthResponse } from '../models/user.js'
import { generateToken } from '../middleware/auth.js'
import { ValidationError, ConflictError, UnauthorizedError } from '../utils/errors.js'
import { validateString, validateEmail } from '../utils/validators.js'

export class AuthController {
  constructor(private readonly userRepository: UserRepository) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { username, email, password, role }: CreateUserRequest = req.body

      // Validation - check all required fields first
      if (!username || !email || !password) {
        throw new ValidationError('Username, email, and password are required')
      }

      validateString(username, 'username', 3)
      validateEmail(email)
      if (password.length < 6) {
        throw new ValidationError('Password must be at least 6 characters long')
      }

      // Check for existing user
      const existingUserByUsername = await this.userRepository.findByUsername(username)
      if (existingUserByUsername) {
        throw new ConflictError('Username already exists')
      }

      const existingUserByEmail = await this.userRepository.findByEmail(email)
      if (existingUserByEmail) {
        throw new ConflictError('Email already exists')
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
      next(error)
    }
  }

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { username, password }: LoginRequest = req.body

      // Validation - check both required fields
      if (!username || !password) {
        throw new ValidationError('Username and password are required')
      }

      validateString(username, 'username')
      validateString(password, 'password')

      // Find user with password
      const userWithPassword = await this.userRepository.findByUsername(username)
      if (!userWithPassword) {
        throw new UnauthorizedError('Invalid credentials')
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, userWithPassword.password)
      if (!isPasswordValid) {
        throw new UnauthorizedError('Invalid credentials')
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
      next(error)
    }
  }
}