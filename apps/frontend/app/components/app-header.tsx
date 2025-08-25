import { Menu, LogOut, User, Settings, BarChart3 } from 'lucide-react'
import { Button } from './ui/button'
import { useAuth } from '../contexts/auth-context'
import { NavLink, Link } from 'react-router'
import { ThemeToggle } from './theme-toggle'

interface AppHeaderProps {
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
  return (
    <h1 className="text-lg font-semibold">
      <Link to="/" className="hover:text-primary transition-colors">
        Snippet Summarizer
      </Link>
    </h1>
  )
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

function ConfigLink() {
  const { user } = useAuth()
  
  // Only show for admin users
  if (!user || user.role !== 'admin') return null
  
  return (
    <NavLink
      to="/config"
      className={({ isActive }) =>
        `inline-flex items-center h-9 px-3 rounded-md text-sm font-medium transition-colors touch-manipulation ${
          isActive
            ? 'bg-secondary text-secondary-foreground'
            : 'hover:bg-accent hover:text-accent-foreground'
        }`
      }
      aria-label="User management configuration"
    >
      <Settings className="h-4 w-4 sm:mr-2" />
      <span className="hidden sm:inline">Config</span>
    </NavLink>
  )
}

function ReportLink() {
  const { user } = useAuth()
  
  // Only show for admin users
  if (!user || user.role !== 'admin') return null
  
  return (
    <NavLink
      to="/report"
      className={({ isActive }) =>
        `inline-flex items-center h-9 px-3 rounded-md text-sm font-medium transition-colors touch-manipulation ${
          isActive
            ? 'bg-secondary text-secondary-foreground'
            : 'hover:bg-accent hover:text-accent-foreground'
        }`
      }
      aria-label="User activity reports"
    >
      <BarChart3 className="h-4 w-4 sm:mr-2" />
      <span className="hidden sm:inline">Reports</span>
    </NavLink>
  )
}


export function AppHeader({ onToggleSidebar }: AppHeaderProps) {
  return (
    <Wrapper>
      <div className="flex items-center space-x-2">
        {onToggleSidebar && (
          <MobileMenuButton onToggleSidebar={onToggleSidebar} />
        )}

        <AppTitle />
      </div>

      <div className="flex items-center space-x-2">
        <ConfigLink />
        <ReportLink />
        <UserInfo />
        <ThemeToggle />
      </div>
    </Wrapper>
  )
}
