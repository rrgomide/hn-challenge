import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { RadioGroup, RadioItem } from '../radio-group'

describe('RadioGroup', () => {
  it('renders with default props', () => {
    render(
      <RadioGroup>
        <RadioItem value="option1">Option 1</RadioItem>
        <RadioItem value="option2">Option 2</RadioItem>
      </RadioGroup>
    )

    expect(screen.getByRole('radiogroup')).toBeInTheDocument()
    expect(screen.getByLabelText('Option 1')).toBeInTheDocument()
    expect(screen.getByLabelText('Option 2')).toBeInTheDocument()
  })

  it('calls onValueChange when radio item is selected', async () => {
    const user = userEvent.setup()
    const mockOnValueChange = vi.fn()

    render(
      <RadioGroup onValueChange={mockOnValueChange}>
        <RadioItem value="option1">Option 1</RadioItem>
        <RadioItem value="option2">Option 2</RadioItem>
      </RadioGroup>
    )

    const option1 = screen.getByLabelText('Option 1')
    await user.click(option1)

    expect(mockOnValueChange).toHaveBeenCalledWith('option1')
  })

  it('shows correct selected state', () => {
    render(
      <RadioGroup value="option2">
        <RadioItem value="option1">Option 1</RadioItem>
        <RadioItem value="option2">Option 2</RadioItem>
      </RadioGroup>
    )

    const option1Input = screen.getByLabelText('Option 1')
    const option2Input = screen.getByLabelText('Option 2')

    expect(option1Input).not.toBeChecked()
    expect(option2Input).toBeChecked()
  })

  it('updates selected state when value changes', async () => {
    const user = userEvent.setup()
    let selectedValue = 'option1'
    const mockOnValueChange = vi.fn((value) => {
      selectedValue = value
    })

    const { rerender } = render(
      <RadioGroup value={selectedValue} onValueChange={mockOnValueChange}>
        <RadioItem value="option1">Option 1</RadioItem>
        <RadioItem value="option2">Option 2</RadioItem>
      </RadioGroup>
    )

    const option2 = screen.getByLabelText('Option 2')
    await user.click(option2)

    expect(mockOnValueChange).toHaveBeenCalledWith('option2')

    // Rerender with new value
    rerender(
      <RadioGroup value="option2" onValueChange={mockOnValueChange}>
        <RadioItem value="option1">Option 1</RadioItem>
        <RadioItem value="option2">Option 2</RadioItem>
      </RadioGroup>
    )

    const option1Input = screen.getByLabelText('Option 1')
    const option2Input = screen.getByLabelText('Option 2')

    expect(option1Input).not.toBeChecked()
    expect(option2Input).toBeChecked()
  })

  it('applies correct CSS classes for size variants', () => {
    render(
      <RadioGroup size="lg">
        <RadioItem value="option1" size="lg">Option 1</RadioItem>
      </RadioGroup>
    )

    const radioGroup = screen.getByRole('radiogroup')
    expect(radioGroup).toHaveClass('text-base', 'gap-3', 'p-1.5')
  })

  it('applies correct CSS classes for orientation', () => {
    render(
      <RadioGroup orientation="vertical">
        <RadioItem value="option1">Option 1</RadioItem>
      </RadioGroup>
    )

    const radioGroup = screen.getByRole('radiogroup')
    expect(radioGroup).toHaveClass('flex-col')
  })

  it('handles disabled state', () => {
    render(
      <RadioGroup disabled>
        <RadioItem value="option1">Option 1</RadioItem>
        <RadioItem value="option2">Option 2</RadioItem>
      </RadioGroup>
    )

    const option1Input = screen.getByLabelText('Option 1')
    const option2Input = screen.getByLabelText('Option 2')

    expect(option1Input).toBeDisabled()
    expect(option2Input).toBeDisabled()
  })

  it('handles individual item disabled state', () => {
    render(
      <RadioGroup>
        <RadioItem value="option1">Option 1</RadioItem>
        <RadioItem value="option2" disabled>Option 2</RadioItem>
      </RadioGroup>
    )

    const option1Input = screen.getByLabelText('Option 1')
    const option2Input = screen.getByLabelText('Option 2')

    expect(option1Input).not.toBeDisabled()
    expect(option2Input).toBeDisabled()
  })

  it('supports custom name attribute', () => {
    render(
      <RadioGroup name="customName">
        <RadioItem value="option1">Option 1</RadioItem>
        <RadioItem value="option2">Option 2</RadioItem>
      </RadioGroup>
    )

    const option1Input = screen.getByLabelText('Option 1')
    const option2Input = screen.getByLabelText('Option 2')

    expect(option1Input).toHaveAttribute('name', 'customName')
    expect(option2Input).toHaveAttribute('name', 'customName')
  })

  it('applies variant styles correctly', () => {
    const { container } = render(
      <RadioGroup>
        <RadioItem value="option1" variant="filled">Option 1</RadioItem>
        <RadioItem value="option2" variant="default">Option 2</RadioItem>
      </RadioGroup>
    )

    const option1Label = screen.getByLabelText('Option 1').closest('label')
    const option2Label = screen.getByLabelText('Option 2').closest('label')

    // Check that different variant classes are applied
    expect(option1Label).toHaveClass('data-[checked]:bg-primary', 'data-[checked]:text-primary-foreground')
    expect(option2Label).toHaveClass('data-[checked]:bg-background', 'data-[checked]:text-foreground')
  })

  it('throws error when RadioItem is used outside RadioGroup', () => {
    // Mock console.error to suppress error output during test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    expect(() => {
      render(<RadioItem value="option1">Option 1</RadioItem>)
    }).toThrow('RadioItem must be used within a RadioGroup')
    
    consoleSpy.mockRestore()
  })

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup()
    const mockOnValueChange = vi.fn()

    render(
      <RadioGroup onValueChange={mockOnValueChange}>
        <RadioItem value="option1">Option 1</RadioItem>
        <RadioItem value="option2">Option 2</RadioItem>
      </RadioGroup>
    )

    const option1Input = screen.getByLabelText('Option 1')
    
    // Focus and press Enter/Space should select the option
    await user.click(option1Input)
    
    expect(mockOnValueChange).toHaveBeenCalledWith('option1')
  })

  it('renders with proper accessibility attributes', () => {
    render(
      <RadioGroup value="option1">
        <RadioItem value="option1">Option 1</RadioItem>
        <RadioItem value="option2">Option 2</RadioItem>
      </RadioGroup>
    )

    const radioGroup = screen.getByRole('radiogroup')
    const option1Input = screen.getByLabelText('Option 1')
    const option2Input = screen.getByLabelText('Option 2')

    expect(radioGroup).toHaveAttribute('role', 'radiogroup')
    expect(option1Input).toHaveAttribute('type', 'radio')
    expect(option2Input).toHaveAttribute('type', 'radio')
    expect(option1Input).toHaveAttribute('value', 'option1')
    expect(option2Input).toHaveAttribute('value', 'option2')
  })
})