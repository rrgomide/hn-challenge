import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest'
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { authMiddleware, requireRole } from '../auth.js'
import { JWTPayload } from '@hn-challenge/shared'

// Define interfaces for properly typed mocks
interface MockRequest extends Partial<Request> {
  headers?: Record<string, string | undefined>
  user?: JWTPayload
}

interface MockResponse extends Partial<Response> {
  status: MockedFunction<(code: number) => Response>
  json: MockedFunction<(body: unknown) => Response>
}

// Mock JWT
vi.mock('jsonwebtoken')

describe('authMiddleware', () => {
  let mockRequest: MockRequest
  let mockResponse: MockResponse
  let mockNext: NextFunction
  let mockStatus: MockedFunction<(code: number) => Response>
  let mockJson: MockedFunction<(body: unknown) => Response>

  beforeEach(() => {
    mockStatus = vi.fn().mockReturnThis() as MockedFunction<(code: number) => Response>
    mockJson = vi.fn() as MockedFunction<(body: unknown) => Response>
    mockRequest = {
      headers: {}
    }
    mockResponse = {
      status: mockStatus,
      json: mockJson
    }
    mockNext = vi.fn() as unknown as NextFunction
    vi.clearAllMocks()
  })

  it('should return 401 when no authorization header is provided', async () => {
    authMiddleware(mockRequest as Request, mockResponse as Response, mockNext)
    
    expect(mockNext).toHaveBeenCalled()
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error))
    expect(mockStatus).not.toHaveBeenCalled()
  })

  it('should return 401 when authorization header is malformed (no Bearer prefix)', async () => {
    mockRequest.headers = { authorization: 'invalid-token' }
    
    authMiddleware(mockRequest as Request, mockResponse as Response, mockNext)
    
    expect(mockNext).toHaveBeenCalled()
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error))
    expect(mockStatus).not.toHaveBeenCalled()
  })

  it('should return 401 when JWT token is invalid', async () => {
    mockRequest.headers = { authorization: 'Bearer invalid-token' }
    vi.mocked(jwt.verify).mockImplementation(() => {
      throw new Error('Invalid token')
    })
    
    authMiddleware(mockRequest as Request, mockResponse as Response, mockNext)
    
    expect(mockNext).toHaveBeenCalled()
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error))
    expect(mockStatus).not.toHaveBeenCalled()
  })

  it('should add user to request and call next() when JWT token is valid', async () => {
    const mockPayload: JWTPayload = {
      userId: 'user-123',
      username: 'testuser',
      role: 'user',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    }
    
    mockRequest.headers = { authorization: 'Bearer valid-token' }
    vi.mocked(jwt.verify).mockReturnValue(mockPayload)
    
    authMiddleware(mockRequest as Request, mockResponse as Response, mockNext)
    
    expect(jwt.verify).toHaveBeenCalledWith('valid-token', expect.any(String))
    expect(mockRequest.user).toEqual(mockPayload)
    expect(mockNext).toHaveBeenCalled()
    expect(mockNext).toHaveBeenCalledWith()
    expect(mockStatus).not.toHaveBeenCalled()
  })

  it('should handle JWT expired token error', async () => {
    mockRequest.headers = { authorization: 'Bearer expired-token' }
    const expiredError = new Error('jwt expired')
    expiredError.name = 'TokenExpiredError'
    vi.mocked(jwt.verify).mockImplementation(() => {
      throw expiredError
    })
    
    authMiddleware(mockRequest as Request, mockResponse as Response, mockNext)
    
    expect(mockNext).toHaveBeenCalled()
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error))
    expect(mockStatus).not.toHaveBeenCalled()
  })

  it('should handle JWT malformed token error', async () => {
    mockRequest.headers = { authorization: 'Bearer malformed-token' }
    const malformedError = new Error('jwt malformed')
    malformedError.name = 'JsonWebTokenError'
    vi.mocked(jwt.verify).mockImplementation(() => {
      throw malformedError
    })
    
    authMiddleware(mockRequest as Request, mockResponse as Response, mockNext)
    
    expect(mockNext).toHaveBeenCalled()
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error))
    expect(mockStatus).not.toHaveBeenCalled()
  })
})

describe('requireRole', () => {
  let mockRequest: MockRequest
  let mockResponse: MockResponse
  let mockNext: NextFunction
  let mockStatus: MockedFunction<(code: number) => Response>
  let mockJson: MockedFunction<(body: unknown) => Response>

  beforeEach(() => {
    mockStatus = vi.fn().mockReturnThis() as MockedFunction<(code: number) => Response>
    mockJson = vi.fn() as MockedFunction<(body: unknown) => Response>
    mockRequest = {}
    mockResponse = {
      status: mockStatus,
      json: mockJson
    }
    mockNext = vi.fn() as unknown as NextFunction
    vi.clearAllMocks()
  })

  it('should return 401 when user is not attached to request', () => {
    const middleware = requireRole(['admin'])
    
    middleware(mockRequest as Request, mockResponse as Response, mockNext)
    
    expect(mockNext).toHaveBeenCalled()
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error))
    expect(mockStatus).not.toHaveBeenCalled()
  })

  it('should return 403 when user role is not in allowed roles', () => {
    const mockUser: JWTPayload = {
      userId: 'user-123',
      username: 'testuser',
      role: 'user',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    }
    
    mockRequest.user = mockUser
    const middleware = requireRole(['admin', 'moderator'])
    
    middleware(mockRequest as Request, mockResponse as Response, mockNext)
    
    expect(mockNext).toHaveBeenCalled()
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error))
    expect(mockStatus).not.toHaveBeenCalled()
  })

  it('should call next() when user has required role', () => {
    const mockUser: JWTPayload = {
      userId: 'admin-123',
      username: 'adminuser',
      role: 'admin',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    }
    
    mockRequest.user = mockUser
    const middleware = requireRole(['admin', 'moderator'])
    
    middleware(mockRequest as Request, mockResponse as Response, mockNext)
    
    expect(mockNext).toHaveBeenCalled()
    expect(mockNext).toHaveBeenCalledWith()
    expect(mockStatus).not.toHaveBeenCalled()
  })

  it('should allow user role when user role is included', () => {
    const mockUser: JWTPayload = {
      userId: 'user-123',
      username: 'regularuser',
      role: 'user',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    }
    
    mockRequest.user = mockUser
    const middleware = requireRole(['user'])
    
    middleware(mockRequest as Request, mockResponse as Response, mockNext)
    
    expect(mockNext).toHaveBeenCalled()
    expect(mockNext).toHaveBeenCalledWith()
    expect(mockStatus).not.toHaveBeenCalled()
  })

  it('should allow moderator to access user endpoints', () => {
    const mockUser: JWTPayload = {
      userId: 'mod-123',
      username: 'moderator',
      role: 'moderator',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    }
    
    mockRequest.user = mockUser
    const middleware = requireRole(['user', 'moderator'])
    
    middleware(mockRequest as Request, mockResponse as Response, mockNext)
    
    expect(mockNext).toHaveBeenCalled()
    expect(mockNext).toHaveBeenCalledWith()
    expect(mockStatus).not.toHaveBeenCalled()
  })
})