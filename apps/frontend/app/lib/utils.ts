import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function validateEmail(email: string): string | null {
  if (!email) return 'Email is required'
  if (email.length < 3) return 'Email must be at least 3 characters'
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) return 'Invalid email format'
  
  return null
}

export function validateUsername(username: string): string | null {
  if (!username) return 'Username is required'
  if (username.length < 3) return 'Username must be at least 3 characters'
  if (username.length > 50) return 'Username must be less than 50 characters'
  
  const usernameRegex = /^[a-zA-Z0-9_-]+$/
  if (!usernameRegex.test(username)) {
    return 'Username can only contain letters, numbers, underscores, and hyphens'
  }
  
  return null
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required'
  if (password.length < 6) return 'Password must be at least 6 characters'
  if (password.length > 128) return 'Password must be less than 128 characters'
  
  return null
}

export function validateText(text: string, fieldName = 'Text'): string | null {
  if (!text) return `${fieldName} is required`
  if (text.trim().length === 0) return `${fieldName} cannot be empty`
  if (text.length > 10000) return `${fieldName} must be less than 10,000 characters`
  
  return null
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  if (isNaN(d.getTime())) return 'Invalid date'
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d)
}

export function formatRelativeTime(date: Date | string): string {
  const d = new Date(date)
  if (isNaN(d.getTime())) return 'Invalid date'
  
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  
  return formatDate(d)
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}

export function capitalizeFirstLetter(str: string): string {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String(error.message)
  }
  return 'An unexpected error occurred'
}