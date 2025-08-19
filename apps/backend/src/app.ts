import express, { Express } from 'express'
import { DatabaseConnection } from './config/database.js'
import { SnippetController } from './controllers/snippet-controller.js'
import { MongoDbSnippetRepository } from './repositories/mongodb-snippet-repository.js'
import { SnippetService } from './services/snippet-service.js'

export async function defineControllers(): Promise<Express> {
  const app = express()

  app.use(express.json())

  // Initialize database connection and repository
  const dbConnection = DatabaseConnection.getInstance()
  const db = await dbConnection.connect()
  const snippetRepository = new MongoDbSnippetRepository(db)
  const snippetService = new SnippetService(snippetRepository)
  const snippetController = new SnippetController(snippetService)

  app.post('/snippets', (request, response) =>
    snippetController.createSnippet(request, response)
  )
  app.get('/snippets', (request, response) =>
    snippetController.getAllSnippets(request, response)
  )
  app.get('/snippets/:id', (request, response) =>
    snippetController.getSnippet(request, response)
  )

  return app
}
