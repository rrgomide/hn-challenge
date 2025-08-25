import { Db, Collection, Filter } from 'mongodb'
import { randomUUID } from 'crypto'
import { Snippet } from '../models/snippet.js'
import { SnippetRepository, UserSnippetCount } from './snippet-repository.js'

interface SnippetDocument {
  _id: string
  text: string
  summary: string
  ownerId: string
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
}

export class MongoDbSnippetRepository implements SnippetRepository {
  private collection: Collection<SnippetDocument>

  constructor(db: Db) {
    this.collection = db.collection<SnippetDocument>('snippets')
    // Create indexes for performance
    this.createIndexes()
  }

  private async createIndexes(): Promise<void> {
    try {
      if (this.collection && typeof this.collection.createIndex === 'function') {
        await this.collection.createIndex({ ownerId: 1 })
        await this.collection.createIndex({ isPublic: 1 })
        await this.collection.createIndex({ updatedAt: -1 })
      }
    } catch (error) {
      console.warn('Failed to create snippet indexes:', error)
    }
  }

  private documentToSnippet(doc: SnippetDocument): Snippet {
    return {
      id: doc._id,
      text: doc.text,
      summary: doc.summary,
      ownerId: doc.ownerId,
      isPublic: doc.isPublic,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }
  }

  async create(snippet: Partial<Snippet>): Promise<Snippet> {
    const id = randomUUID()
    const now = new Date()
    const snippetToInsert: SnippetDocument = {
      _id: id,
      text: snippet.text!,
      summary: snippet.summary!,
      ownerId: snippet.ownerId!,
      isPublic: snippet.isPublic || false,
      createdAt: now,
      updatedAt: now,
    }

    await this.collection.insertOne(snippetToInsert)
    return this.documentToSnippet(snippetToInsert)
  }

  async findById(id: string): Promise<Snippet | null> {
    const document = await this.collection.findOne({ _id: id })
    return document ? this.documentToSnippet(document) : null
  }

  async findAll(): Promise<Snippet[]> {
    const documents = await this.collection
      .find({})
      .sort({ updatedAt: -1 })
      .toArray()

    return documents.map(doc => this.documentToSnippet(doc))
  }

  async findByOwnerId(ownerId: string): Promise<Snippet[]> {
    const documents = await this.collection
      .find({ ownerId })
      .sort({ updatedAt: -1 })
      .toArray()

    return documents.map(doc => this.documentToSnippet(doc))
  }

  async findPublic(): Promise<Snippet[]> {
    const documents = await this.collection
      .find({ isPublic: true })
      .sort({ updatedAt: -1 })
      .toArray()

    return documents.map(doc => this.documentToSnippet(doc))
  }

  async findAccessible(userId: string, userRole: 'user' | 'moderator' | 'admin'): Promise<Snippet[]> {
    let query: Filter<SnippetDocument>

    if (userRole === 'admin' || userRole === 'moderator') {
      // Admin and moderator can see all snippets
      query = {}
    } else {
      // Regular users can only see their own snippets and public snippets
      query = {
        $or: [
          { ownerId: userId },
          { isPublic: true }
        ]
      }
    }

    const documents = await this.collection
      .find(query)
      .sort({ updatedAt: -1 })
      .toArray()

    return documents.map(doc => this.documentToSnippet(doc))
  }

  async update(id: string, updates: Partial<Snippet>): Promise<Snippet | null> {
    const updateData: Partial<SnippetDocument> = {
      ...updates,
      updatedAt: new Date(),
    }
    if ('id' in updateData) {
      delete updateData.id // Remove id from updates
    }

    const result = await this.collection.findOneAndUpdate(
      { _id: id },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    return result ? this.documentToSnippet(result) : null
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.collection.deleteOne({ _id: id })
    return result.deletedCount === 1
  }

  async getSnippetCountsByUser(): Promise<UserSnippetCount[]> {
    const pipeline = [
      {
        $group: {
          _id: '$ownerId',
          snippetCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          userId: '$_id',
          username: '$user.username',
          snippetCount: 1,
          _id: 0
        }
      },
      {
        $sort: { snippetCount: -1, username: 1 }
      }
    ]

    const results = await this.collection.aggregate<UserSnippetCount>(pipeline).toArray()
    return results
  }
}
