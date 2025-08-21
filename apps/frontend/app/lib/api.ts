// API configuration based on environment
export const API_BASE_URL = 
  typeof window !== 'undefined' 
    ? ((import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3000') // Client-side
    : (process.env.NODE_ENV === 'production' ? 'http://backend:3000' : 'http://localhost:3000') // Server-side