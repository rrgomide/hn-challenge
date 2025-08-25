import { API_BASE_URL } from './api'

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: Response
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export interface RequestOptions {
  method?: string
  headers?: Record<string, string>
  body?: string | FormData | null
  token?: string
}

class APIClient {
  private baseURL: string

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
  }

  private async handleResponse(response: Response) {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      
      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorMessage
      } catch {
        // If response is not JSON, use status text
      }
      
      throw new APIError(errorMessage, response.status, response)
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      return response.json()
    }
    
    return response.text()
  }

  async request<T = unknown>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const {
      method = 'GET',
      headers = {},
      body = null,
      token
    } = options

    const requestHeaders: Record<string, string> = {
      ...headers
    }

    if (body && typeof body === 'string') {
      requestHeaders['Content-Type'] = 'application/json'
    }

    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method,
        headers: requestHeaders,
        body
      })

      return this.handleResponse(response)
    } catch (error) {
      if (error instanceof APIError) {
        throw error
      }
      
      throw new APIError(
        error instanceof Error ? error.message : 'Network error occurred',
        0
      )
    }
  }

  // Convenience methods
  async get<T = unknown>(endpoint: string, token?: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', token })
  }

  async post<T = unknown>(endpoint: string, data?: unknown, token?: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : null,
      token
    })
  }

  async put<T = unknown>(endpoint: string, data?: unknown, token?: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : null,
      token
    })
  }

  async patch<T = unknown>(endpoint: string, data?: unknown, token?: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : null,
      token
    })
  }

  async delete<T = unknown>(endpoint: string, token?: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', token })
  }
}

export const apiClient = new APIClient()

export default apiClient