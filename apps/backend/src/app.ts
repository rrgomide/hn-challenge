import express, { Express } from 'express'
import { DatabaseConnection } from './config/database.js'
import { SnippetController } from './controllers/snippet-controller.js'
import { AuthController } from './controllers/auth-controller.js'
import { ConfigController } from './controllers/config-controller.js'
import { ReportController } from './controllers/report-controller.js'
import { MongoDbSnippetRepository } from './repositories/mongodb-snippet-repository.js'
import { MongoDbUserRepository } from './repositories/mongodb-user-repository.js'
import { SnippetService } from './services/snippet-service.js'
import { authMiddleware, requireRole } from './middleware/auth.js'
import { errorHandler } from './middleware/error-handler.js'

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
  const reportController = new ReportController(snippetService)

  // Health check endpoint (no auth required)
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime() 
    })
  })

  // Authentication routes (no auth required)
  app.post('/auth/register', authController.register)
  app.post('/auth/login', authController.login)

  // Protected snippet routes (auth required)
  app.post(
    '/snippets',
    authMiddleware,
    requireRole(['user', 'moderator', 'admin']),
    snippetController.createSnippet
  )
  app.post(
    '/snippets/stream',
    authMiddleware,
    requireRole(['user', 'moderator', 'admin']),
    snippetController.createSnippetStream
  )
  app.get(
    '/snippets',
    authMiddleware,
    requireRole(['user', 'moderator', 'admin']),
    snippetController.getAllSnippets
  )
  app.get(
    '/snippets/:id',
    authMiddleware,
    requireRole(['user', 'moderator', 'admin']),
    snippetController.getSnippet
  )
  app.put(
    '/snippets/:id',
    authMiddleware,
    requireRole(['user', 'moderator', 'admin']),
    snippetController.updateSnippet
  )
  app.delete(
    '/snippets/:id',
    authMiddleware,
    requireRole(['user', 'moderator', 'admin']),
    snippetController.deleteSnippet
  )

  // Admin-only routes
  app.get(
    '/config',
    authMiddleware,
    requireRole(['admin']),
    configController.getAllUsers
  )
  app.patch(
    '/config',
    authMiddleware,
    requireRole(['admin']),
    configController.updateUserRole
  )
  app.get(
    '/report',
    authMiddleware,
    requireRole(['admin']),
    reportController.getSnippetReport
  )

  // Error handling middleware (must be last)
  app.use(errorHandler)

  return app
}
