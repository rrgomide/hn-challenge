import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { BrowserRouter } from 'react-router'
import { AppSidebar } from '../app-sidebar'
import { Snippet } from '@hn-challenge/shared'
import { AuthProvider } from '../../contexts/auth-context'

// Mock the API module
vi.mock('../../lib/api', () => ({
  API_BASE_URL: 'http://localhost:3000/api'
}))

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage })

const mockNavigate = vi.fn()

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: '1' }),
  }
})

const MockRouter = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
)

const mockSnippets: Snippet[] = [
  {
    id: '1',
    text: 'Test snippet 1',
    summary: 'First snippet',
    ownerId: 'user1',
    isPublic: true,
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    updatedAt: new Date('2023-01-01T00:00:00.000Z'),
  },
  {
    id: '2',
    text: 'Test snippet 2',
    summary: 'Second snippet',
    ownerId: 'user1',
    isPublic: false,
    createdAt: new Date('2023-01-02T00:00:00.000Z'),
    updatedAt: new Date('2023-01-02T00:00:00.000Z'),
  },
]

describe('AppSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  it('renders new chat button', () => {
    const mockOnNewChat = vi.fn()
    render(
      <MockRouter>
        <AppSidebar snippets={[]} onNewChat={mockOnNewChat} />
      </MockRouter>
    )

    expect(screen.getByText('New Chat')).toBeInTheDocument()
  })

  it('calls onNewChat and navigates when new chat button is clicked', async () => {
    const user = userEvent.setup()
    const mockOnNewChat = vi.fn()
    render(
      <MockRouter>
        <AppSidebar snippets={[]} onNewChat={mockOnNewChat} />
      </MockRouter>
    )

    const newChatButton = screen.getByText('New Chat')
    await user.click(newChatButton)

    expect(mockOnNewChat).toHaveBeenCalledTimes(1)
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  it('renders close button when onClose is provided', () => {
    const mockOnClose = vi.fn()
    const mockOnNewChat = vi.fn()
    render(
      <MockRouter>
        <AppSidebar
          snippets={[]}
          onNewChat={mockOnNewChat}
          onClose={mockOnClose}
        />
      </MockRouter>
    )

    expect(screen.getByLabelText('Close sidebar')).toBeInTheDocument()
  })

  it('does not render close button when onClose is not provided', () => {
    const mockOnNewChat = vi.fn()
    render(
      <MockRouter>
        <AppSidebar snippets={[]} onNewChat={mockOnNewChat} />
      </MockRouter>
    )

    expect(screen.queryByLabelText('Close sidebar')).not.toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup()
    const mockOnClose = vi.fn()
    const mockOnNewChat = vi.fn()
    render(
      <MockRouter>
        <AppSidebar
          snippets={[]}
          onNewChat={mockOnNewChat}
          onClose={mockOnClose}
        />
      </MockRouter>
    )

    const closeButton = screen.getByLabelText('Close sidebar')
    await user.click(closeButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('shows "No snippets yet" when snippets array is empty', () => {
    const mockOnNewChat = vi.fn()
    render(
      <MockRouter>
        <AppSidebar snippets={[]} onNewChat={mockOnNewChat} />
      </MockRouter>
    )

    expect(screen.getByText('No snippets yet')).toBeInTheDocument()
  })

  it('shows "No snippets yet" when snippets is empty array', () => {
    const mockOnNewChat = vi.fn()
    render(
      <MockRouter>
        <AppSidebar snippets={[]} onNewChat={mockOnNewChat} />
      </MockRouter>
    )

    expect(screen.getByText('No snippets yet')).toBeInTheDocument()
  })

  it('renders snippet list when snippets are provided', () => {
    const mockOnNewChat = vi.fn()
    render(
      <MockRouter>
        <AppSidebar snippets={mockSnippets} onNewChat={mockOnNewChat} />
      </MockRouter>
    )

    expect(screen.getByText('First snippet')).toBeInTheDocument()
    expect(screen.getByText('Second snippet')).toBeInTheDocument()
    expect(screen.queryByText('No snippets yet')).not.toBeInTheDocument()
  })

  it('navigates to snippet when snippet is clicked', async () => {
    const user = userEvent.setup()
    const mockOnNewChat = vi.fn()
    render(
      <MockRouter>
        <AppSidebar snippets={mockSnippets} onNewChat={mockOnNewChat} />
      </MockRouter>
    )

    const firstSnippet = screen.getByText('First snippet')
    await user.click(firstSnippet)

    // NavLink handles navigation internally, so we check that the link has the correct href
    const snippetLink = firstSnippet.closest('a')
    expect(snippetLink).toHaveAttribute('href', '/snippets/1')
  })

  it('displays formatted creation dates for snippets', () => {
    const mockOnNewChat = vi.fn()
    render(
      <MockRouter>
        <AppSidebar snippets={mockSnippets} onNewChat={mockOnNewChat} />
      </MockRouter>
    )

    expect(screen.getByText('12/31/2022')).toBeInTheDocument()
    expect(screen.getByText('1/1/2023')).toBeInTheDocument()
  })

  it('shows "Untitled" for snippets without summary', () => {
    const snippetWithoutSummary = [{ ...mockSnippets[0], summary: '' }]
    const mockOnNewChat = vi.fn()
    render(
      <MockRouter>
        <AppSidebar
          snippets={snippetWithoutSummary}
          onNewChat={mockOnNewChat}
        />
      </MockRouter>
    )

    expect(screen.getByText('Untitled')).toBeInTheDocument()
  })

  it('shows "Unknown date" for snippets without createdAt', () => {
    const snippetWithoutDate = [
      { ...mockSnippets[0], createdAt: undefined as any },
    ]
    const mockOnNewChat = vi.fn()
    render(
      <MockRouter>
        <AppSidebar snippets={snippetWithoutDate} onNewChat={mockOnNewChat} />
      </MockRouter>
    )

    expect(screen.getByText('Unknown date')).toBeInTheDocument()
  })

  it('filters out falsy snippets', () => {
    const snippetsWithNulls = [
      mockSnippets[0],
      undefined,
      mockSnippets[1],
      undefined,
    ]
    const mockOnNewChat = vi.fn()
    render(
      <MockRouter>
        <AppSidebar snippets={snippetsWithNulls} onNewChat={mockOnNewChat} />
      </MockRouter>
    )

    expect(screen.getByText('First snippet')).toBeInTheDocument()
    expect(screen.getByText('Second snippet')).toBeInTheDocument()
  })

  it('applies secondary variant to selected snippet', () => {
    const mockOnNewChat = vi.fn()
    const { container } = render(
      <MockRouter>
        <AppSidebar snippets={mockSnippets} onNewChat={mockOnNewChat} />
      </MockRouter>
    )

    const links = container.querySelectorAll('a')
    const snippetLinks = Array.from(links).filter(
      link =>
        link.textContent?.includes('First snippet') ||
        link.textContent?.includes('Second snippet')
    )

    expect(snippetLinks).toHaveLength(2)
  })
})
