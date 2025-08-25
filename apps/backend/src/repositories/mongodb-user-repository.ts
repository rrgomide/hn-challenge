import { Db, Collection } from 'mongodb'
import { randomUUID } from 'crypto'
import bcrypt from 'bcryptjs'
import { User, CreateUserRequest } from '../models/user.js'
import { UserRepository } from './user-repository.js'

interface UserDocument {
  _id: string
  username: string
  email: string
  password: string
  role: 'user' | 'moderator' | 'admin'
  createdAt: Date
  updatedAt: Date
}

export class MongoDbUserRepository implements UserRepository {
  private collection: Collection<UserDocument>

  constructor(db: Db) {
    this.collection = db.collection<UserDocument>('users')
    // Create indexes for performance and uniqueness
    this.createIndexes()
  }

  private async createIndexes(): Promise<void> {
    try {
      if (this.collection && typeof this.collection.createIndex === 'function') {
        await this.collection.createIndex({ username: 1 }, { unique: true })
        await this.collection.createIndex({ email: 1 }, { unique: true })
      }
    } catch (error) {
      console.warn('Failed to create user indexes:', error)
    }
  }

  private documentToUser(doc: UserDocument): User {
    return {
      id: doc._id,
      username: doc.username,
      email: doc.email,
      role: doc.role,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }
  }

  private documentToUserWithPassword(doc: UserDocument): User & { password: string } {
    return {
      id: doc._id,
      username: doc.username,
      email: doc.email,
      role: doc.role,
      password: doc.password,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }
  }

  async create(userData: CreateUserRequest): Promise<User> {
    const id = randomUUID()
    const now = new Date()
    const hashedPassword = await bcrypt.hash(userData.password, 12)
    
    const document: UserDocument = {
      _id: id,
      username: userData.username,
      email: userData.email,
      password: hashedPassword,
      role: userData.role || 'user',
      createdAt: now,
      updatedAt: now,
    }

    await this.collection.insertOne(document)
    return this.documentToUser(document)
  }

  async findById(id: string): Promise<User | null> {
    const document = await this.collection.findOne({ _id: id })
    return document ? this.documentToUser(document) : null
  }

  async findByUsername(username: string): Promise<(User & { password: string }) | null> {
    const document = await this.collection.findOne({ username })
    return document ? this.documentToUserWithPassword(document) : null
  }

  async findByEmail(email: string): Promise<User | null> {
    const document = await this.collection.findOne({ email })
    return document ? this.documentToUser(document) : null
  }

  async findAll(): Promise<User[]> {
    const documents = await this.collection.find({}).toArray()
    return documents.map(doc => this.documentToUser(doc))
  }

  async update(id: string, updates: Partial<User>): Promise<User | null> {
    const now = new Date()
    const updateDoc = { ...updates, updatedAt: now }
    if ('id' in updateDoc) {
      delete updateDoc.id // Remove id from updates
    }

    const result = await this.collection.findOneAndUpdate(
      { _id: id },
      { $set: updateDoc },
      { returnDocument: 'after' }
    )

    return result ? this.documentToUser(result) : null
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.collection.deleteOne({ _id: id })
    return result.deletedCount === 1
  }
}