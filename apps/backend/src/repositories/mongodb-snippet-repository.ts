import { Db, Collection, ObjectId } from 'mongodb'
import { Snippet } from '../models/snippet.js'
import { SnippetRepository } from './snippet-repository.js'

// MongoDB document type without id (MongoDB generates _id)
type SnippetDocument = Omit<Snippet, 'id'>

export class MongoDbSnippetRepository implements SnippetRepository {
  private collection: Collection<SnippetDocument>

  constructor(db: Db) {
    this.collection = db.collection<SnippetDocument>('snippets')
  }

  async create(snippet: Partial<Snippet>): Promise<Snippet> {
    const now = new Date()
    const snippetToInsert: SnippetDocument = {
      text: snippet.text!,
      summary: snippet.summary!,
      createdAt: now,
      updatedAt: now,
    }

    const result = await this.collection.insertOne(snippetToInsert)
    if (!result.acknowledged) {
      throw new Error('Failed to create snippet')
    }

    // Return the created snippet with MongoDB's _id converted to id
    const createdSnippet = await this.collection.findOne({
      _id: result.insertedId,
    })
    if (!createdSnippet) {
      throw new Error('Failed to retrieve created snippet')
    }

    return {
      id: createdSnippet._id.toString(),
      text: createdSnippet.text,
      summary: createdSnippet.summary,
      createdAt: createdSnippet.createdAt,
      updatedAt: createdSnippet.updatedAt,
    }
  }

  async findById(id: string): Promise<Snippet | null> {
    const snippet = await this.collection.findOne({ _id: new ObjectId(id) })
    if (!snippet) {
      return null
    }

    return {
      id: snippet._id.toString(),
      text: snippet.text,
      summary: snippet.summary,
      createdAt: snippet.createdAt,
      updatedAt: snippet.updatedAt,
    }
  }

  async findAll(): Promise<Snippet[]> {
    const snippets = await this.collection
      .find({})
      .sort({ updatedAt: -1 })
      .toArray()

    return snippets.map(snippet => ({
      id: snippet._id.toString(),
      text: snippet.text,
      summary: snippet.summary,
      createdAt: snippet.createdAt,
      updatedAt: snippet.updatedAt,
    }))
  }

  async update(id: string, updates: Partial<Snippet>): Promise<Snippet | null> {
    const updateData: Partial<SnippetDocument> = {
      ...updates,
      updatedAt: new Date(),
    }

    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    if (!result) {
      return null
    }

    return {
      id: result._id.toString(),
      text: result.text,
      summary: result.summary,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    }
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.collection.deleteOne({ _id: new ObjectId(id) })
    return result.deletedCount === 1
  }
}
