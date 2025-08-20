import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  return (
    context ?? {
      theme: 'light',
      toggleTheme: () => {},
      setTheme: () => {},
    }
  )
}

interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  storageKey = 'theme',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // This runs only on client side after hydration
    const stored = localStorage.getItem(storageKey) as Theme | null
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
      .matches
      ? 'dark'
      : 'light'

    const initialTheme = stored || systemTheme
    setThemeState(initialTheme)
    setMounted(true)
  }, [storageKey])

  useEffect(() => {
    if (!mounted) return

    const root = window.document.documentElement

    // Add transition class temporarily for smooth theme switching
    root.classList.add('theme-transition')
    root.classList.remove('light', 'dark')
    root.classList.add(theme)

    localStorage.setItem(storageKey, theme)

    // Remove transition class after transition completes
    const timer = setTimeout(() => {
      root.classList.remove('theme-transition')
    }, 200)

    return () => clearTimeout(timer)
  }, [theme, mounted, storageKey])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  const toggleTheme = () => {
    setThemeState(theme === 'light' ? 'dark' : 'light')
  }

  // Prevent hydration mismatch by not rendering until client-side
  if (!mounted) {
    return <div className={defaultTheme}>{children}</div>
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      <div className={theme}>{children}</div>
    </ThemeContext.Provider>
  )
}
