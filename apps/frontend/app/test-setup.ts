import '@testing-library/jest-dom'
import { vi } from 'vitest'
import React from 'react'

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  Moon: () => React.createElement('div', { 'data-testid': 'moon-icon' }),
  Sun: () => React.createElement('div', { 'data-testid': 'sun-icon' }),
  Menu: () => React.createElement('div', { 'data-testid': 'menu-icon' }),
  Plus: () => React.createElement('div', { 'data-testid': 'plus-icon' }),
  MessageSquare: () => React.createElement('div', { 'data-testid': 'message-square-icon' }),
  X: () => React.createElement('div', { 'data-testid': 'x-icon' }),
  LogIn: () => React.createElement('div', { 'data-testid': 'login-icon' }),
  UserPlus: () => React.createElement('div', { 'data-testid': 'user-plus-icon' }),
  User: () => React.createElement('div', { 'data-testid': 'user-icon' }),
  LogOut: () => React.createElement('div', { 'data-testid': 'logout-icon' }),
  Send: () => React.createElement('div', { 'data-testid': 'send-icon' }),
  Loader2: () => React.createElement('div', { 'data-testid': 'loader-icon' }),
  Loader: () => React.createElement('div', { 'data-testid': 'loader-icon' }),
  Trash2: () => React.createElement('div', { 'data-testid': 'trash-icon' }),
  Clock: () => React.createElement('div', { 'data-testid': 'clock-icon' }),
  Zap: () => React.createElement('div', { 'data-testid': 'zap-icon' }),
  Check: () => React.createElement('div', { 'data-testid': 'check-icon' }),
}))

// Mock window.location.href to prevent jsdom navigation errors
const mockLocation = {
  href: 'http://localhost:3000',
  origin: 'http://localhost:3000',
  assign: vi.fn(),
  reload: vi.fn(),
  replace: vi.fn()
}
Object.defineProperty(window, 'location', { value: mockLocation, writable: true })

// Mock HTMLFormElement.prototype.requestSubmit
HTMLFormElement.prototype.requestSubmit = vi.fn(function(this: HTMLFormElement) {
  // Trigger form submission event
  const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
  this.dispatchEvent(submitEvent)
})

// Add vi to global scope
Object.assign(global, { vi })