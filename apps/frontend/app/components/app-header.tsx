import { Moon, Sun, Menu, LogOut, User } from 'lucide-react'
import { Button } from './ui/button'
import { useAuth } from '../contexts/auth-context'

interface AppHeaderProps {
  onToggleTheme?: () => void
  onToggleSidebar?: () => void
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        {children}
      </div>
    </header>
  )
}

function MobileMenuButton({
  onToggleSidebar,
}: {
  onToggleSidebar: () => void
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onToggleSidebar}
      className="h-9 w-9 lg:hidden touch-manipulation"
      aria-label="Toggle sidebar"
    >
      <Menu className="h-4 w-4" />
    </Button>
  )
}

function AppTitle() {
  return <h1 className="text-lg font-semibold">Snippet Summarizer</h1>
}

function UserInfo() {
  const { user, logout } = useAuth()
  
  if (!user) return null
  
  return (
    <div className="flex items-center space-x-2">
      <div className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-muted rounded-md">
        <User className="h-4 w-4" />
        <span className="text-sm font-medium">{user.username}</span>
        <span className="text-xs text-muted-foreground px-1.5 py-0.5 bg-background rounded">
          {user.role}
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={logout}
        className="h-9 touch-manipulation"
        aria-label="Sign out"
      >
        <LogOut className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">Sign Out</span>
      </Button>
    </div>
  )
}

function ThemeToggle({ onToggleTheme }: { onToggleTheme: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onToggleTheme}
      className="h-9 w-9 touch-manipulation"
      aria-label="Toggle theme"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

export function AppHeader({ onToggleTheme, onToggleSidebar }: AppHeaderProps) {
  return (
    <Wrapper>
      <div className="flex items-center space-x-2">
        {onToggleSidebar && (
          <MobileMenuButton onToggleSidebar={onToggleSidebar} />
        )}

        <AppTitle />
      </div>

      <div className="flex items-center space-x-2">
        <UserInfo />
        {onToggleTheme && <ThemeToggle onToggleTheme={onToggleTheme} />}
      </div>
    </Wrapper>
  )
}
