import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { Button } from '../button'

describe('Button', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('handles click events', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    await user.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('applies default variant classes', () => {
    render(<Button>Default Button</Button>)
    const button = screen.getByText('Default Button')
    
    expect(button).toHaveClass('bg-primary', 'text-primary-foreground')
  })

  it('applies destructive variant classes', () => {
    render(<Button variant="destructive">Destructive Button</Button>)
    const button = screen.getByText('Destructive Button')
    
    expect(button).toHaveClass('bg-destructive', 'text-destructive-foreground')
  })

  it('applies outline variant classes', () => {
    render(<Button variant="outline">Outline Button</Button>)
    const button = screen.getByText('Outline Button')
    
    expect(button).toHaveClass('border', 'border-input', 'bg-background')
  })

  it('applies secondary variant classes', () => {
    render(<Button variant="secondary">Secondary Button</Button>)
    const button = screen.getByText('Secondary Button')
    
    expect(button).toHaveClass('bg-secondary', 'text-secondary-foreground')
  })

  it('applies ghost variant classes', () => {
    render(<Button variant="ghost">Ghost Button</Button>)
    const button = screen.getByText('Ghost Button')
    
    expect(button).toHaveClass('hover:bg-accent', 'hover:text-accent-foreground')
  })

  it('applies link variant classes', () => {
    render(<Button variant="link">Link Button</Button>)
    const button = screen.getByText('Link Button')
    
    expect(button).toHaveClass('text-primary', 'underline-offset-4')
  })

  it('applies default size classes', () => {
    render(<Button>Default Size</Button>)
    const button = screen.getByText('Default Size')
    
    expect(button).toHaveClass('h-9', 'px-4', 'py-2')
  })

  it('applies small size classes', () => {
    render(<Button size="sm">Small Button</Button>)
    const button = screen.getByText('Small Button')
    
    expect(button).toHaveClass('h-8', 'px-3', 'text-xs')
  })

  it('applies large size classes', () => {
    render(<Button size="lg">Large Button</Button>)
    const button = screen.getByText('Large Button')
    
    expect(button).toHaveClass('h-10', 'px-8')
  })

  it('applies icon size classes', () => {
    render(<Button size="icon">Icon</Button>)
    const button = screen.getByText('Icon')
    
    expect(button).toHaveClass('h-9', 'w-9')
  })

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom Button</Button>)
    const button = screen.getByText('Custom Button')
    
    expect(button).toHaveClass('custom-class')
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>)
    const button = screen.getByText('Disabled Button')
    
    expect(button).toBeDisabled()
    expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50')
  })

  it('forwards ref correctly', () => {
    const ref = vi.fn()
    render(<Button ref={ref}>Ref Button</Button>)
    
    expect(ref).toHaveBeenCalled()
  })

  it('spreads additional props', () => {
    render(<Button data-testid="test-button" type="submit">Props Button</Button>)
    const button = screen.getByTestId('test-button')
    
    expect(button).toHaveAttribute('type', 'submit')
  })

  it('combines variant and size classes correctly', () => {
    render(<Button variant="outline" size="sm">Combined Button</Button>)
    const button = screen.getByText('Combined Button')
    
    expect(button).toHaveClass('border', 'border-input', 'h-8', 'px-3')
  })
})