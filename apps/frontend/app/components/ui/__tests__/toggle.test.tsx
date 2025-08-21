import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { Toggle } from '../toggle'

describe('Toggle', () => {
  it('renders toggle button', () => {
    render(<Toggle>Toggle me</Toggle>)
    const toggle = screen.getByText('Toggle me')
    
    expect(toggle).toBeInTheDocument()
    expect(toggle.tagName).toBe('BUTTON')
  })

  it('applies default classes', () => {
    render(<Toggle>Toggle</Toggle>)
    const toggle = screen.getByText('Toggle')
    
    expect(toggle).toHaveClass(
      'inline-flex',
      'items-center',
      'justify-center',
      'rounded-md',
      'text-sm',
      'font-medium',
      'transition-colors'
    )
  })

  it('applies default variant and size', () => {
    render(<Toggle>Toggle</Toggle>)
    const toggle = screen.getByText('Toggle')
    
    expect(toggle).toHaveClass('bg-transparent', 'h-9', 'px-3')
  })

  it('applies outline variant classes', () => {
    render(<Toggle variant="outline">Outline Toggle</Toggle>)
    const toggle = screen.getByText('Outline Toggle')
    
    expect(toggle).toHaveClass('border', 'border-input', 'bg-transparent', 'shadow-sm')
  })

  it('applies small size classes', () => {
    render(<Toggle size="sm">Small Toggle</Toggle>)
    const toggle = screen.getByText('Small Toggle')
    
    expect(toggle).toHaveClass('h-8', 'px-2')
  })

  it('applies large size classes', () => {
    render(<Toggle size="lg">Large Toggle</Toggle>)
    const toggle = screen.getByText('Large Toggle')
    
    expect(toggle).toHaveClass('h-10', 'px-3')
  })

  it('applies custom className', () => {
    render(<Toggle className="custom-toggle">Custom Toggle</Toggle>)
    const toggle = screen.getByText('Custom Toggle')
    
    expect(toggle).toHaveClass('custom-toggle')
  })

  it('sets aria-pressed to false when not pressed', () => {
    render(<Toggle pressed={false}>Toggle</Toggle>)
    const toggle = screen.getByText('Toggle')
    
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    expect(toggle).toHaveAttribute('data-state', 'off')
  })

  it('sets aria-pressed to true when pressed', () => {
    render(<Toggle pressed={true}>Toggle</Toggle>)
    const toggle = screen.getByText('Toggle')
    
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    expect(toggle).toHaveAttribute('data-state', 'on')
  })

  it('handles click and calls onPressedChange', async () => {
    const user = userEvent.setup()
    const handlePressedChange = vi.fn()
    render(
      <Toggle pressed={false} onPressedChange={handlePressedChange}>
        Toggle
      </Toggle>
    )
    const toggle = screen.getByText('Toggle')
    
    await user.click(toggle)
    
    expect(handlePressedChange).toHaveBeenCalledWith(true)
  })

  it('toggles from pressed to unpressed', async () => {
    const user = userEvent.setup()
    const handlePressedChange = vi.fn()
    render(
      <Toggle pressed={true} onPressedChange={handlePressedChange}>
        Toggle
      </Toggle>
    )
    const toggle = screen.getByText('Toggle')
    
    await user.click(toggle)
    
    expect(handlePressedChange).toHaveBeenCalledWith(false)
  })

  it('works without onPressedChange handler', async () => {
    const user = userEvent.setup()
    render(<Toggle pressed={false}>Toggle</Toggle>)
    const toggle = screen.getByText('Toggle')
    
    await user.click(toggle)
    
    // Should not throw an error
  })

  it('forwards ref correctly', () => {
    const ref = vi.fn()
    render(<Toggle ref={ref}>Toggle</Toggle>)
    
    expect(ref).toHaveBeenCalled()
  })

  it('spreads additional props', () => {
    render(
      <Toggle data-testid="custom-toggle" disabled>
        Toggle
      </Toggle>
    )
    const toggle = screen.getByTestId('custom-toggle')
    
    expect(toggle).toBeDisabled()
  })

  it('has button type by default', () => {
    render(<Toggle>Toggle</Toggle>)
    const toggle = screen.getByText('Toggle')
    
    expect(toggle).toHaveAttribute('type', 'button')
  })

  it('applies focus-visible styles', () => {
    render(<Toggle>Toggle</Toggle>)
    const toggle = screen.getByText('Toggle')
    
    expect(toggle).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-1', 'focus-visible:ring-ring')
  })

  it('applies disabled styles when disabled', () => {
    render(<Toggle disabled>Toggle</Toggle>)
    const toggle = screen.getByText('Toggle')
    
    expect(toggle).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50')
  })

  it('applies pressed state styles', () => {
    render(<Toggle pressed={true}>Toggle</Toggle>)
    const toggle = screen.getByText('Toggle')
    
    expect(toggle).toHaveClass('data-[state=on]:bg-accent', 'data-[state=on]:text-accent-foreground')
  })
})