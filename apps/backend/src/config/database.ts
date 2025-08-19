import { MongoClient, Db } from 'mongodb'

export class DatabaseConnection {
  private static instance: DatabaseConnection
  private client: MongoClient | null = null
  private db: Db | null = null

  private constructor() {}

  static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection()
    }
    return DatabaseConnection.instance
  }

  async connect(): Promise<Db> {
    if (this.db) {
      return this.db
    }

    const connectionString = process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017/hn_challenge?authSource=admin'
    
    try {
      this.client = new MongoClient(connectionString)
      await this.client.connect()
      this.db = this.client.db('hn_challenge')
      
      console.log('Connected to MongoDB successfully')
      return this.db
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error)
      throw error
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close()
      this.client = null
      this.db = null
      console.log('Disconnected from MongoDB')
    }
  }

  getDb(): Db {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.')
    }
    return this.db
  }
}