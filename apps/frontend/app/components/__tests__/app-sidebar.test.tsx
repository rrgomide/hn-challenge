import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { BrowserRouter } from 'react-router'
import { AppSidebar } from '../app-sidebar'
import { Snippet } from '@hn-challenge/shared'

const mockNavigate = vi.fn()

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: '1' })
  }
})

const MockRouter = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
)

const mockSnippets: Snippet[] = [
  {
    id: '1',
    content: 'Test snippet 1',
    summary: 'First snippet',
    createdAt: '2023-01-01T00:00:00.000Z'
  },
  {
    id: '2',
    content: 'Test snippet 2',
    summary: 'Second snippet',
    createdAt: '2023-01-02T00:00:00.000Z'
  }
]

describe('AppSidebar', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
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
        <AppSidebar snippets={[]} onNewChat={mockOnNewChat} onClose={mockOnClose} />
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
        <AppSidebar snippets={[]} onNewChat={mockOnNewChat} onClose={mockOnClose} />
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

  it('shows "No snippets yet" when snippets is undefined', () => {
    const mockOnNewChat = vi.fn()
    render(
      <MockRouter>
        <AppSidebar snippets={undefined} onNewChat={mockOnNewChat} />
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
    
    expect(mockNavigate).toHaveBeenCalledWith('/snippets/1')
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
        <AppSidebar snippets={snippetWithoutSummary} onNewChat={mockOnNewChat} />
      </MockRouter>
    )
    
    expect(screen.getByText('Untitled')).toBeInTheDocument()
  })

  it('shows "Unknown date" for snippets without createdAt', () => {
    const snippetWithoutDate = [{ ...mockSnippets[0], createdAt: undefined }]
    const mockOnNewChat = vi.fn()
    render(
      <MockRouter>
        <AppSidebar snippets={snippetWithoutDate} onNewChat={mockOnNewChat} />
      </MockRouter>
    )
    
    expect(screen.getByText('Unknown date')).toBeInTheDocument()
  })

  it('filters out falsy snippets', () => {
    const snippetsWithNulls = [mockSnippets[0], null, mockSnippets[1], undefined]
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
    
    const buttons = container.querySelectorAll('button')
    const snippetButtons = Array.from(buttons).filter(button => 
      button.textContent?.includes('First snippet') || button.textContent?.includes('Second snippet')
    )
    
    expect(snippetButtons).toHaveLength(2)
  })
})