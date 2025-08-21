import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { AppHeader } from '../app-header'

describe('AppHeader', () => {
  it('renders the app title', () => {
    render(<AppHeader />)
    expect(screen.getByText('Snippet Summarizer')).toBeInTheDocument()
  })

  it('renders theme toggle when onToggleTheme is provided', () => {
    const mockToggleTheme = vi.fn()
    render(<AppHeader onToggleTheme={mockToggleTheme} />)
    
    expect(screen.getByLabelText('Toggle theme')).toBeInTheDocument()
  })

  it('does not render theme toggle when onToggleTheme is not provided', () => {
    render(<AppHeader />)
    
    expect(screen.queryByLabelText('Toggle theme')).not.toBeInTheDocument()
  })

  it('renders mobile menu button when onToggleSidebar is provided', () => {
    const mockToggleSidebar = vi.fn()
    render(<AppHeader onToggleSidebar={mockToggleSidebar} />)
    
    expect(screen.getByLabelText('Toggle sidebar')).toBeInTheDocument()
  })

  it('does not render mobile menu button when onToggleSidebar is not provided', () => {
    render(<AppHeader />)
    
    expect(screen.queryByLabelText('Toggle sidebar')).not.toBeInTheDocument()
  })

  it('calls onToggleTheme when theme toggle is clicked', async () => {
    const user = userEvent.setup()
    const mockToggleTheme = vi.fn()
    render(<AppHeader onToggleTheme={mockToggleTheme} />)
    
    const themeToggle = screen.getByLabelText('Toggle theme')
    await user.click(themeToggle)
    
    expect(mockToggleTheme).toHaveBeenCalledTimes(1)
  })

  it('calls onToggleSidebar when mobile menu button is clicked', async () => {
    const user = userEvent.setup()
    const mockToggleSidebar = vi.fn()
    render(<AppHeader onToggleSidebar={mockToggleSidebar} />)
    
    const sidebarToggle = screen.getByLabelText('Toggle sidebar')
    await user.click(sidebarToggle)
    
    expect(mockToggleSidebar).toHaveBeenCalledTimes(1)
  })

  it('renders both toggle buttons when both handlers are provided', () => {
    const mockToggleTheme = vi.fn()
    const mockToggleSidebar = vi.fn()
    render(<AppHeader onToggleTheme={mockToggleTheme} onToggleSidebar={mockToggleSidebar} />)
    
    expect(screen.getByLabelText('Toggle theme')).toBeInTheDocument()
    expect(screen.getByLabelText('Toggle sidebar')).toBeInTheDocument()
  })

  it('has proper header structure with correct CSS classes', () => {
    const { container } = render(<AppHeader />)
    const header = container.querySelector('header')
    
    expect(header).toBeInTheDocument()
    expect(header).toHaveClass('border-b', 'border-border', 'bg-background/95', 'backdrop-blur')
  })
})