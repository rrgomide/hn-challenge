import { Request, Response, NextFunction } from 'express'
import { UserRepository } from '../repositories/user-repository.js'
import { UserRole } from '@hn-challenge/shared'
import { ValidationError, NotFoundError } from '../utils/errors.js'
import { validateString, validateUUID } from '../utils/validators.js'

export class ConfigController {
  constructor(private readonly userRepository: UserRepository) {}

  getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const users = await this.userRepository.findAll()
      res.json({ users })
    } catch (error) {
      next(error)
    }
  }

  updateUserRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, role } = req.body

      // Validation
      if (!userId) {
        throw new ValidationError('User ID is required')
      }
      if (!role) {
        throw new ValidationError('Role is required')
      }
      
      validateUUID(userId, 'userId')
      validateString(role, 'role')

      // Validate role value
      const validRoles: UserRole[] = ['user', 'moderator', 'admin']
      if (!validRoles.includes(role)) {
        throw new ValidationError('Invalid role. Must be one of: user, moderator, admin')
      }

      // Check if user exists
      const existingUser = await this.userRepository.findById(userId)
      if (!existingUser) {
        throw new NotFoundError('User not found')
      }

      // Update user role
      const updatedUser = await this.userRepository.update(userId, { role })
      if (!updatedUser) {
        throw new Error('Failed to update user role')
      }

      res.json({ 
        message: 'User role updated successfully',
        user: updatedUser 
      })
    } catch (error) {
      next(error)
    }
  }
}