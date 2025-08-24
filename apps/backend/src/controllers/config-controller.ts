import { Request, Response } from 'express'
import { UserRepository } from '../repositories/user-repository.js'
import { UserRole } from '@hn-challenge/shared'

export class ConfigController {
  private userRepository: UserRepository

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository
  }

  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await this.userRepository.findAll()
      res.json({ users })
    } catch (error) {
      console.error('Get all users error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }

  async updateUserRole(req: Request, res: Response): Promise<void> {
    try {
      const { userId, role } = req.body

      // Validation
      if (!userId) {
        res.status(400).json({ error: 'User ID is required' })
        return
      }

      if (!role) {
        res.status(400).json({ error: 'Role is required' })
        return
      }

      // Validate role value
      const validRoles: UserRole[] = ['user', 'moderator', 'admin']
      if (!validRoles.includes(role)) {
        res.status(400).json({ error: 'Invalid role. Must be one of: user, moderator, admin' })
        return
      }

      // Check if user exists
      const existingUser = await this.userRepository.findById(userId)
      if (!existingUser) {
        res.status(404).json({ error: 'User not found' })
        return
      }

      // Update user role
      const updatedUser = await this.userRepository.update(userId, { role })
      if (!updatedUser) {
        res.status(500).json({ error: 'Failed to update user role' })
        return
      }

      res.json({ 
        message: 'User role updated successfully',
        user: updatedUser 
      })
    } catch (error) {
      console.error('Update user role error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
}