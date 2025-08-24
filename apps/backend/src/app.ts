import express, { Express } from 'express'
import { DatabaseConnection } from './config/database.js'
import { SnippetController } from './controllers/snippet-controller.js'
import { AuthController } from './controllers/auth-controller.js'
import { ConfigController } from './controllers/config-controller.js'
import { MongoDbSnippetRepository } from './repositories/mongodb-snippet-repository.js'
import { MongoDbUserRepository } from './repositories/mongodb-user-repository.js'
import { SnippetService } from './services/snippet-service.js'
import { authMiddleware, requireRole } from './middleware/auth.js'

export async function defineControllers(): Promise<Express> {
  const app = express()

  app.use(express.json())

  // CORS middleware
  app.use((request, response, next) => {
    response.header('Access-Control-Allow-Origin', '*')
    response.header(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, PATCH, DELETE, OPTIONS'
    )
    response.header(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization'
    )
    if (request.method === 'OPTIONS') {
      response.sendStatus(200)
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
  const configController = new ConfigController(userRepository)

  // Authentication routes (no auth required)
  app.post('/auth/register', (request, response) =>
    authController.register(request, response)
  )
  app.post('/auth/login', (request, response) =>
    authController.login(request, response)
  )

  // Protected snippet routes (auth required)
  app.post(
    '/snippets',
    authMiddleware,
    requireRole(['user', 'moderator', 'admin']),
    (request, response) => snippetController.createSnippet(request, response)
  )
  app.get(
    '/snippets',
    authMiddleware,
    requireRole(['user', 'moderator', 'admin']),
    (request, response) => snippetController.getAllSnippets(request, response)
  )
  app.get(
    '/snippets/:id',
    authMiddleware,
    requireRole(['user', 'moderator', 'admin']),
    (request, response) => snippetController.getSnippet(request, response)
  )
  app.put(
    '/snippets/:id',
    authMiddleware,
    requireRole(['user', 'moderator', 'admin']),
    (request, response) => snippetController.updateSnippet(request, response)
  )
  app.delete(
    '/snippets/:id',
    authMiddleware,
    requireRole(['user', 'moderator', 'admin']),
    (request, response) => snippetController.deleteSnippet(request, response)
  )

  // Admin-only config routes
  app.get(
    '/config',
    authMiddleware,
    requireRole(['admin']),
    (request, response) => configController.getAllUsers(request, response)
  )
  app.patch(
    '/config',
    authMiddleware,
    requireRole(['admin']),
    (request, response) => configController.updateUserRole(request, response)
  )

  return app
}
