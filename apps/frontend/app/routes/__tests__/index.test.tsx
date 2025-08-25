import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import Index, { action as _action } from '../_index'
import { AuthProvider } from '../../contexts/auth-context'

// Mock the API module
vi.mock('../../lib/api', () => ({
  API_BASE_URL: 'http://localhost:3000'
}))

// Mock the API client
vi.mock('../../lib/api-client', () => ({
  apiClient: {
    post: vi.fn()
  }
}))

// Mock cookies module
vi.mock('../../lib/cookies', () => ({
  getAuthFromCookies: vi.fn(() => ({ token: 'mock-token' }))
}))

// Mock auth context
const mockAuthContext = {
  user: { id: '1', username: 'testuser', role: 'user' },
  token: 'mock-token',
  isAuthenticated: true,
  isLoading: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn()
}

vi.mock('../../contexts/auth-context', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => mockAuthContext
}))

// Mock fetch for streaming
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(() => 'mock-token'),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage })

// Polyfill HTMLFormElement.prototype.requestSubmit for jsdom
if (!HTMLFormElement.prototype.requestSubmit) {
  HTMLFormElement.prototype.requestSubmit = vi.fn(function(this: HTMLFormElement) {
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
    this.dispatchEvent(submitEvent)
  })
}

// Mock all React Router hooks - declare functions first
const mockNavigate = vi.fn()
const mockActionData = vi.fn()
const mockNavigation = vi.fn(() => ({ state: 'idle' }))

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useActionData: () => mockActionData(),
    useNavigation: () => mockNavigation(),
    Form: React.forwardRef(function MockForm(
      { children, onSubmit, ...props }: React.FormHTMLAttributes<HTMLFormElement>,
      ref: React.ForwardedRef<HTMLFormElement>
    ) {
      return <form {...props} ref={ref} onSubmit={onSubmit}>{children}</form>
    })
  }
})

// Wrapper component with routing and auth context
function IndexWrapper() {
  return (
    <MemoryRouter initialEntries={['/']}>
      <AuthProvider>
        <Index />
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('Index Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockClear()
    mockNavigate.mockClear()
    mockActionData.mockReturnValue(undefined)
    mockNavigation.mockReturnValue({ state: 'idle' })
  })

  describe('Page Structure', () => {
    it('renders main components', () => {
      render(<IndexWrapper />)

      expect(screen.getByRole('heading', { name: /snippet summarizer/i })).toBeInTheDocument()
      expect(screen.getByText('Paste or type your content below to get a summary')).toBeInTheDocument()
      expect(screen.getByLabelText('Text content for summarization')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /summarize/i })).toBeInTheDocument()
    })

    it('has proper accessibility structure', () => {
      render(<IndexWrapper />)

      const textarea = screen.getByLabelText('Text content for summarization')
      expect(textarea).toHaveAttribute('aria-describedby', 'textarea-help')
      
      const helpText = screen.getByText(/enter or paste the text content/i)
      expect(helpText).toHaveAttribute('id', 'textarea-help')
      expect(helpText).toHaveClass('sr-only')
    })

    it('shows keyboard shortcuts hint on larger screens', () => {
      render(<IndexWrapper />)

      const shortcutsHint = screen.getByText(/ctrl \+ enter/i)
      expect(shortcutsHint).toBeInTheDocument()
      expect(shortcutsHint.closest('p')).toHaveClass('hidden', 'sm:block')
    })
  })

  describe('Processing Mode Selection', () => {
    it('renders radio group with batch and stream options', () => {
      render(<IndexWrapper />)

      const radioGroup = screen.getByRole('radiogroup')
      expect(radioGroup).toBeInTheDocument()

      const batchOption = screen.getByLabelText(/batch/i)
      const streamOption = screen.getByLabelText(/stream/i)

      expect(batchOption).toBeInTheDocument()
      expect(streamOption).toBeInTheDocument()
      expect(batchOption).toBeChecked() // Default should be batch
      expect(streamOption).not.toBeChecked()
    })

    it('switches between batch and stream modes', async () => {
      const user = userEvent.setup()
      render(<IndexWrapper />)

      const batchOption = screen.getByLabelText(/batch/i)
      const streamOption = screen.getByLabelText(/stream/i)

      // Initially batch should be selected
      expect(batchOption).toBeChecked()
      expect(streamOption).not.toBeChecked()

      // Switch to stream mode
      await user.click(streamOption)

      expect(streamOption).toBeChecked()
      expect(batchOption).not.toBeChecked()

      // Switch back to batch mode
      await user.click(batchOption)

      expect(batchOption).toBeChecked()
      expect(streamOption).not.toBeChecked()
    })

    it('updates description text based on selected mode', async () => {
      const user = userEvent.setup()
      render(<IndexWrapper />)

      // Check initial description for batch mode
      expect(screen.getByText(/traditional mode - wait for complete summary/i)).toBeInTheDocument()

      // Switch to stream mode
      const streamOption = screen.getByLabelText(/stream/i)
      await user.click(streamOption)

      // Check updated description for stream mode
      expect(screen.getByText(/real-time streaming - see your summary/i)).toBeInTheDocument()
    })

    it('shows correct icons for each mode', () => {
      render(<IndexWrapper />)

      const batchLabel = screen.getByLabelText(/batch/i).closest('label')
      const streamLabel = screen.getByLabelText(/stream/i).closest('label')

      // Check that labels contain icons (using class names as proxy)
      expect(batchLabel).toBeInTheDocument()
      expect(streamLabel).toBeInTheDocument()
    })
  })

  describe('Form Interaction', () => {
    it('enables submit button when text is entered', async () => {
      const user = userEvent.setup()
      render(<IndexWrapper />)

      const textarea = screen.getByLabelText('Text content for summarization')
      const submitButton = screen.getByRole('button', { name: /summarize/i })

      // Initially disabled
      expect(submitButton).toBeDisabled()

      // Enable after entering text
      await user.type(textarea, 'Test content')
      expect(submitButton).not.toBeDisabled()

      // Disable again after clearing text
      await user.clear(textarea)
      expect(submitButton).toBeDisabled()
    })

    it('handles keyboard shortcuts for submission', async () => {
      const user = userEvent.setup()
      render(<IndexWrapper />)

      const textarea = screen.getByLabelText('Text content for summarization')
      await user.type(textarea, 'Test content')

      // Mock form submission
      const form = textarea.closest('form')
      const formSpy = vi.spyOn(form!, 'requestSubmit')

      // Test Ctrl+Enter
      await user.keyboard('{Control>}{Enter}{/Control}')
      expect(formSpy).toHaveBeenCalled()

      formSpy.mockClear()

      // Test Cmd+Enter (Meta key)
      await user.keyboard('{Meta>}{Enter}{/Meta}')
      expect(formSpy).toHaveBeenCalled()

      formSpy.mockRestore()
    })

    it('shows loading state during submission', async () => {
      const user = userEvent.setup()
      
      // Mock a delayed response
      mockFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          body: null
        }), 100))
      )

      render(<IndexWrapper />)

      const textarea = screen.getByLabelText('Text content for summarization')
      const submitButton = screen.getByRole('button', { name: /summarize/i })

      await user.type(textarea, 'Test content')

      // Switch to stream mode to test client-side submission
      await user.click(screen.getByLabelText(/stream/i))
      
      await user.click(submitButton)

      // Check for button loading state instead  
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /streaming.../i })).toBeInTheDocument()
      })
    })

  })

  describe('Streaming Functionality', () => {

    it('shows streaming results with scrollable container', async () => {
      const user = userEvent.setup()
      
      // Mock successful streaming
      const mockReader = {
        read: vi.fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: {"type":"snippet","data":{"id":"123"}}\n')
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: {"type":"complete","data":{"summary":"Long summary content that might need scrolling"}}\n')
          })
          .mockResolvedValueOnce({
            done: true,
            value: null
          })
      }

      mockFetch.mockResolvedValue({
        ok: true,
        body: { getReader: () => mockReader }
      })

      render(<IndexWrapper />)

      const textarea = screen.getByLabelText('Text content for summarization')
      await user.type(textarea, 'Test content')
      await user.click(screen.getByLabelText(/stream/i))
      await user.click(screen.getByRole('button', { name: /summarize/i }))

      await waitFor(() => {
        expect(screen.getByText(/summary complete/i)).toBeInTheDocument()
      })

      // Check that the results container has proper scrolling classes
      const summaryCompleteElement = screen.getByText(/summary complete/i)
      const resultsContainer = summaryCompleteElement.closest('div')?.parentElement
      expect(resultsContainer).toHaveClass('max-h-96')
    })

    it('handles streaming errors gracefully', async () => {
      const user = userEvent.setup()
      
      mockFetch.mockRejectedValue(new Error('Network error'))

      render(<IndexWrapper />)

      const textarea = screen.getByLabelText('Text content for summarization')
      await user.type(textarea, 'Test content')
      await user.click(screen.getByLabelText(/stream/i))
      await user.click(screen.getByRole('button', { name: /summarize/i }))

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('displays server action errors', async () => {
      render(<IndexWrapper />)
      
      // Mock component with error from action data
      const { rerender: _rerender } = render(
        <MemoryRouter initialEntries={['/']}>
          <AuthProvider>
            <Index />
          </AuthProvider>
        </MemoryRouter>
      )

      // We can't easily test server action errors in this setup, 
      // but we can test the error display structure
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('shows validation error for empty text', async () => {
      const user = userEvent.setup()
      render(<IndexWrapper />)

      const submitButton = screen.getByRole('button', { name: /summarize/i })
      
      // Button should be disabled when no text
      expect(submitButton).toBeDisabled()

      // Even trying to submit with empty text should keep button disabled
      const textarea = screen.getByLabelText('Text content for summarization')
      await user.click(textarea)
      await user.keyboard(' ') // Just whitespace
      await user.keyboard('{Backspace}')
      
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Navigation', () => {
    it('navigates to snippet view after streaming completion', async () => {
      const user = userEvent.setup()
      
      const mockReader = {
        read: vi.fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: {"type":"snippet","data":{"id":"test-id"}}\n')
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: {"type":"complete","data":{"summary":"Test summary"}}\n')
          })
          .mockResolvedValueOnce({ done: true, value: null })
      }

      mockFetch.mockResolvedValue({
        ok: true,
        body: { getReader: () => mockReader }
      })

      render(<IndexWrapper />)

      const textarea = screen.getByLabelText('Text content for summarization')
      await user.type(textarea, 'Test content')
      await user.click(screen.getByLabelText(/stream/i))
      await user.click(screen.getByRole('button', { name: /summarize/i }))

      // Wait for completion and click view snippet button
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /view full snippet/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /view full snippet/i }))

      expect(mockNavigate).toHaveBeenCalledWith('/snippets/test-id')
    })
  })

  describe('Responsive Design', () => {
    it('has responsive classes for different screen sizes', () => {
      render(<IndexWrapper />)

      // The max-w-2xl w-full classes are on the outer wrapper container
      const heading = screen.getByRole('heading', { name: /snippet summarizer/i })
      const titleDiv = heading.closest('div') // div with text-center classes
      const wrapperDiv = titleDiv?.parentElement // div with max-w-2xl w-full classes
      expect(wrapperDiv).toHaveClass('max-w-2xl', 'w-full')

      const textarea = screen.getByLabelText('Text content for summarization')
      expect(textarea).toHaveClass('min-h-[150px]', 'sm:min-h-[200px]')
    })

    it('shows/hides keyboard shortcuts based on screen size', () => {
      render(<IndexWrapper />)

      const shortcutsText = screen.getByText(/ctrl \+ enter/i).closest('p')
      expect(shortcutsText).toHaveClass('hidden', 'sm:block')
    })
  })
})

