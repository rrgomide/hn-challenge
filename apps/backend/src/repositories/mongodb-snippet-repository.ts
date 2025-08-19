import { MongoClient, Db, Collection } from 'mongodb'
import { Snippet } from '../models/snippet.js'
import { SnippetRepository } from './snippet-repository.js'

export class MongoDbSnippetRepository implements SnippetRepository {
  private db: Db
  private collection: Collection<Snippet>

  constructor(db: Db) {
    this.db = db
    this.collection = db.collection<Snippet>('snippets')
  }

  async create(snippet: Snippet): Promise<Snippet> {
    const result = await this.collection.insertOne(snippet)
    if (!result.acknowledged) {
      throw new Error('Failed to create snippet')
    }
    return snippet
  }

  async findById(id: string): Promise<Snippet | null> {
    const snippet = await this.collection.findOne({ id })
    return snippet || null
  }

  async findAll(): Promise<Snippet[]> {
    const snippets = await this.collection.find({}).toArray()
    return snippets
  }

  async update(id: string, updates: Partial<Snippet>): Promise<Snippet | null> {
    const result = await this.collection.findOneAndUpdate(
      { id },
      { $set: updates },
      { returnDocument: 'after' }
    )
    return result || null
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.collection.deleteOne({ id })
    return result.deletedCount === 1
  }
}