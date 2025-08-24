import { Moon, Sun } from 'lucide-react'
import { Button } from './ui/button'
import { useTheme } from '../contexts/theme-context'

interface ThemeToggleProps {
  size?: 'default' | 'sm' | 'lg' | 'icon'
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  className?: string
}

export function ThemeToggle({ 
  size = 'icon', 
  variant = 'ghost',
  className = ''
}: ThemeToggleProps) {
  const { toggleTheme } = useTheme()

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleTheme}
      className={`h-9 w-9 touch-manipulation ${className}`}
      aria-label="Toggle theme"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}