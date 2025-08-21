import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { Textarea } from '../textarea'

describe('Textarea', () => {
  it('renders textarea element', () => {
    render(<Textarea placeholder="Enter text" />)
    const textarea = screen.getByPlaceholderText('Enter text')
    
    expect(textarea).toBeInTheDocument()
    expect(textarea.tagName).toBe('TEXTAREA')
  })

  it('applies default classes', () => {
    render(<Textarea placeholder="test" />)
    const textarea = screen.getByPlaceholderText('test')
    
    expect(textarea).toHaveClass(
      'flex',
      'min-h-[60px]',
      'w-full',
      'rounded-md',
      'border',
      'border-input',
      'bg-transparent',
      'px-3',
      'py-2',
      'text-sm',
      'shadow-sm'
    )
  })

  it('applies custom className', () => {
    render(<Textarea className="custom-textarea" placeholder="test" />)
    const textarea = screen.getByPlaceholderText('test')
    
    expect(textarea).toHaveClass('custom-textarea')
  })

  it('forwards placeholder prop', () => {
    render(<Textarea placeholder="Enter your message" />)
    const textarea = screen.getByPlaceholderText('Enter your message')
    
    expect(textarea).toHaveAttribute('placeholder', 'Enter your message')
  })

  it('handles text input', async () => {
    const user = userEvent.setup()
    render(<Textarea placeholder="test" />)
    const textarea = screen.getByPlaceholderText('test')
    
    await user.type(textarea, 'Hello world')
    
    expect(textarea).toHaveValue('Hello world')
  })

  it('handles onChange event', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<Textarea onChange={handleChange} placeholder="test" />)
    const textarea = screen.getByPlaceholderText('test')
    
    await user.type(textarea, 'test')
    
    expect(handleChange).toHaveBeenCalled()
  })

  it('can be disabled', () => {
    render(<Textarea disabled placeholder="test" />)
    const textarea = screen.getByPlaceholderText('test')
    
    expect(textarea).toBeDisabled()
    expect(textarea).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50')
  })

  it('forwards ref correctly', () => {
    const ref = vi.fn()
    render(<Textarea ref={ref} placeholder="test" />)
    
    expect(ref).toHaveBeenCalled()
  })

  it('spreads additional props', () => {
    render(
      <Textarea 
        data-testid="custom-textarea" 
        rows={5} 
        cols={50}
        placeholder="test"
      />
    )
    const textarea = screen.getByTestId('custom-textarea')
    
    expect(textarea).toHaveAttribute('rows', '5')
    expect(textarea).toHaveAttribute('cols', '50')
  })

  it('has focus-visible styles', () => {
    render(<Textarea placeholder="test" />)
    const textarea = screen.getByPlaceholderText('test')
    
    expect(textarea).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-1', 'focus-visible:ring-ring')
  })

  it('has placeholder styles', () => {
    render(<Textarea placeholder="test" />)
    const textarea = screen.getByPlaceholderText('test')
    
    expect(textarea).toHaveClass('placeholder:text-muted-foreground')
  })

  it('accepts default value', () => {
    render(<Textarea defaultValue="Initial text" placeholder="test" />)
    const textarea = screen.getByDisplayValue('Initial text')
    
    expect(textarea).toHaveValue('Initial text')
  })

  it('accepts controlled value', () => {
    render(<Textarea value="Controlled text" onChange={() => {}} placeholder="test" />)
    const textarea = screen.getByDisplayValue('Controlled text')
    
    expect(textarea).toHaveValue('Controlled text')
  })
})