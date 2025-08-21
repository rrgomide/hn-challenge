import { render, screen } from '@testing-library/react'
import { ScrollArea } from '../scroll-area'

describe('ScrollArea', () => {
  it('renders children content', () => {
    render(
      <ScrollArea>
        <div>Scrollable content</div>
      </ScrollArea>
    )
    
    expect(screen.getByText('Scrollable content')).toBeInTheDocument()
  })

  it('applies default classes', () => {
    const { container } = render(
      <ScrollArea>
        <div>Content</div>
      </ScrollArea>
    )
    
    const scrollArea = container.firstChild
    expect(scrollArea).toHaveClass('relative', 'overflow-hidden')
  })

  it('applies custom className', () => {
    const { container } = render(
      <ScrollArea className="custom-scroll">
        <div>Content</div>
      </ScrollArea>
    )
    
    const scrollArea = container.firstChild
    expect(scrollArea).toHaveClass('custom-scroll', 'relative', 'overflow-hidden')
  })

  it('has correct internal structure', () => {
    const { container } = render(
      <ScrollArea>
        <div>Content</div>
      </ScrollArea>
    )
    
    const outerDiv = container.firstChild
    const innerContainer = outerDiv?.firstChild
    const scrollableDiv = innerContainer?.firstChild
    
    expect(innerContainer).toHaveClass('h-full', 'w-full', 'rounded-[inherit]')
    expect(scrollableDiv).toHaveClass('h-full', 'w-full', 'overflow-auto', 'scrollbar-thin')
  })

  it('forwards ref correctly', () => {
    const ref = vi.fn()
    render(
      <ScrollArea ref={ref}>
        <div>Content</div>
      </ScrollArea>
    )
    
    expect(ref).toHaveBeenCalled()
  })

  it('spreads additional props', () => {
    render(
      <ScrollArea data-testid="scroll-area" role="region">
        <div>Content</div>
      </ScrollArea>
    )
    
    const scrollArea = screen.getByTestId('scroll-area')
    expect(scrollArea).toHaveAttribute('role', 'region')
  })

  it('renders multiple children', () => {
    render(
      <ScrollArea>
        <div>First item</div>
        <div>Second item</div>
        <div>Third item</div>
      </ScrollArea>
    )
    
    expect(screen.getByText('First item')).toBeInTheDocument()
    expect(screen.getByText('Second item')).toBeInTheDocument()
    expect(screen.getByText('Third item')).toBeInTheDocument()
  })

  it('handles empty children', () => {
    const { container } = render(<ScrollArea />)
    
    expect(container.firstChild).toBeInTheDocument()
    expect(container.firstChild).toHaveClass('relative', 'overflow-hidden')
  })
})