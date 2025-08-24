import { User, CreateUserRequest } from '../models/user.js'

export interface UserRepository {
  create(userData: CreateUserRequest): Promise<User>
  findById(id: string): Promise<User | null>
  findByUsername(username: string): Promise<(User & { password: string }) | null>
  findByEmail(email: string): Promise<User | null>
  findAll(): Promise<User[]>
  update(id: string, updates: Partial<User>): Promise<User | null>
  delete(id: string): Promise<boolean>
}