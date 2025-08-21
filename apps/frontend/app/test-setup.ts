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
}))

// Add vi to global scope
Object.assign(global, { vi })