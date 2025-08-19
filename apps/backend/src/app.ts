import express, { Express } from 'express'
import { greet } from '@hn-challenge/shared'
import { SnippetController } from './controllers/snippet-controller.js'
import { SnippetService } from './services/snippet-service.js'
import { MongoDbSnippetRepository } from './repositories/mongodb-snippet-repository.js'
import { DatabaseConnection } from './config/database.js'
import { generateText } from 'ai'
import { google } from '@ai-sdk/google'

export async function defineControllers(): Promise<Express> {
  const app = express()

  app.use(express.json())

  // Initialize database connection and repository
  const dbConnection = DatabaseConnection.getInstance()
  const db = await dbConnection.connect()
  const snippetRepository = new MongoDbSnippetRepository(db)
  const snippetService = new SnippetService(snippetRepository)
  const snippetController = new SnippetController(snippetService)

  app.post('/snippets', (req, res) => snippetController.createSnippet(req, res))
  app.get('/snippets', (req, res) => snippetController.getAllSnippets(req, res))
  app.get('/snippets/:id', (req, res) => snippetController.getSnippet(req, res))

  return app
}
