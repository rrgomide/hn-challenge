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
}))

// Add vi to global scope
Object.assign(global, { vi })