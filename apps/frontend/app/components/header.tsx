import { Moon, Sun } from "lucide-react"
import { Button } from "./ui/button.js"

interface HeaderProps {
  onToggleTheme?: () => void
  theme?: 'light' | 'dark'
}

export function Header({ onToggleTheme, theme }: HeaderProps) {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-6">
        <div className="flex items-center space-x-2">
          <h1 className="text-lg font-semibold">Snippet Summarizer</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          {onToggleTheme && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleTheme}
              className="h-9 w-9"
              aria-label="Toggle theme"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}