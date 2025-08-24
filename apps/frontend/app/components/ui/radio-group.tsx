import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const radioGroupVariants = cva(
  "flex items-center gap-2 p-1 rounded-lg bg-muted/50 backdrop-blur-sm",
  {
    variants: {
      orientation: {
        horizontal: "flex-row",
        vertical: "flex-col",
      },
      size: {
        sm: "text-xs gap-1 p-0.5",
        default: "text-sm gap-2 p-1",
        lg: "text-base gap-3 p-1.5",
      },
    },
    defaultVariants: {
      orientation: "horizontal",
      size: "default",
    },
  }
)

const radioItemVariants = cva(
  "relative flex items-center justify-center gap-2 px-3 py-2 rounded-md font-medium transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      size: {
        sm: "px-2 py-1 text-xs",
        default: "px-3 py-2 text-sm",
        lg: "px-4 py-3 text-base",
      },
      variant: {
        default: "data-[checked]:bg-background data-[checked]:text-foreground data-[checked]:shadow-sm hover:bg-background/50 text-muted-foreground",
        filled: "data-[checked]:bg-primary data-[checked]:text-primary-foreground hover:bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
)

interface RadioGroupProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof radioGroupVariants> {
  value?: string
  onValueChange?: (value: string) => void
  name?: string
  disabled?: boolean
}

interface RadioItemProps
  extends React.LabelHTMLAttributes<HTMLLabelElement>,
    VariantProps<typeof radioItemVariants> {
  value: string
  disabled?: boolean
  children: React.ReactNode
}

const RadioGroupContext = React.createContext<{
  value?: string
  onValueChange?: (value: string) => void
  name?: string
  disabled?: boolean
} | null>(null)

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, orientation, size, value, onValueChange, name, disabled, children, ...props }, ref) => {
    return (
      <RadioGroupContext.Provider value={{ value, onValueChange, name, disabled }}>
        <div
          ref={ref}
          role="radiogroup"
          className={cn(radioGroupVariants({ orientation, size, className }))}
          {...props}
        >
          {children}
        </div>
      </RadioGroupContext.Provider>
    )
  }
)

const RadioItem = React.forwardRef<HTMLLabelElement, RadioItemProps>(
  ({ className, size, variant, value, disabled, children, ...props }, ref) => {
    const context = React.useContext(RadioGroupContext)
    
    if (!context) {
      throw new Error('RadioItem must be used within a RadioGroup')
    }

    const { value: groupValue, onValueChange, name, disabled: groupDisabled } = context
    const isChecked = groupValue === value
    const isDisabled = disabled || groupDisabled

    return (
      <label
        ref={ref}
        className={cn(radioItemVariants({ size, variant, className }))}
        data-checked={isChecked}
        data-disabled={isDisabled}
        {...props}
      >
        <input
          type="radio"
          name={name}
          value={value}
          checked={isChecked}
          onChange={() => onValueChange?.(value)}
          disabled={isDisabled}
          className="sr-only"
        />
        {children}
      </label>
    )
  }
)

RadioGroup.displayName = "RadioGroup"
RadioItem.displayName = "RadioItem"

export { RadioGroup, RadioItem, type RadioGroupProps, type RadioItemProps }