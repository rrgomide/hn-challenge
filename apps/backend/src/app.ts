import express, { Express } from 'express'
import { DatabaseConnection } from './config/database.js'
import { SnippetController } from './controllers/snippet-controller.js'
import { AuthController } from './controllers/auth-controller.js'
import { MongoDbSnippetRepository } from './repositories/mongodb-snippet-repository.js'
import { MongoDbUserRepository } from './repositories/mongodb-user-repository.js'
import { SnippetService } from './services/snippet-service.js'
import { authMiddleware, requireRole } from './middleware/auth.js'

export async function defineControllers(): Promise<Express> {
  const app = express()

  app.use(express.json())

  // CORS middleware
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    if (req.method === 'OPTIONS') {
      res.sendStatus(200)
    } else {
      next()
    }
  })

  // Initialize database connection and repositories
  const dbConnection = DatabaseConnection.getInstance()
  const db = await dbConnection.connect()
  
  // Initialize repositories
  const snippetRepository = new MongoDbSnippetRepository(db)
  const userRepository = new MongoDbUserRepository(db)
  
  // Initialize services
  const snippetService = new SnippetService(snippetRepository)
  
  // Initialize controllers
  const snippetController = new SnippetController(snippetService)
  const authController = new AuthController(userRepository)

  // Authentication routes (no auth required)
  app.post('/auth/register', (request, response) =>
    authController.register(request, response)
  )
  app.post('/auth/login', (request, response) =>
    authController.login(request, response)
  )

  // Protected snippet routes (auth required)
  app.post('/snippets', authMiddleware, requireRole(['user', 'moderator', 'admin']), (request, response) =>
    snippetController.createSnippet(request, response)
  )
  app.get('/snippets', authMiddleware, requireRole(['user', 'moderator', 'admin']), (request, response) =>
    snippetController.getAllSnippets(request, response)
  )
  app.get('/snippets/:id', authMiddleware, requireRole(['user', 'moderator', 'admin']), (request, response) =>
    snippetController.getSnippet(request, response)
  )
  app.put('/snippets/:id', authMiddleware, requireRole(['user', 'moderator', 'admin']), (request, response) =>
    snippetController.updateSnippet(request, response)
  )
  app.delete('/snippets/:id', authMiddleware, requireRole(['user', 'moderator', 'admin']), (request, response) =>
    snippetController.deleteSnippet(request, response)
  )

  return app
}
