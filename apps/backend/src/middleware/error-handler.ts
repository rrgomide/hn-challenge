import { Request, Response, NextFunction } from 'express'
import { AppError } from '../utils/errors.js'

interface ErrorResponse {
  error: string
  [key: string]: unknown
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (res.headersSent) {
    return next(err)
  }

  // Handle AppError instances
  if (err instanceof AppError) {
    const response: ErrorResponse = { error: err.message }
    res.status(err.statusCode).json(response)
    return
  }

  // Handle MongoDB duplicate key errors
  if (err.name === 'MongoError' && 'code' in err && (err as { code: number }).code === 11000) {
    const field = Object.keys((err as { keyValue: Record<string, unknown> }).keyValue)[0]
    res.status(409).json({ error: `${field} already exists` })
    return
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({ error: 'Invalid token' })
    return
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({ error: 'Token expired' })
    return
  }

  // Log unexpected errors
  console.error('Unexpected error:', err)

  // Handle unexpected errors
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ error: 'Internal server error' })
  } else {
    res.status(500).json({ 
      error: err.message,
      stack: err.stack
    })
  }
}