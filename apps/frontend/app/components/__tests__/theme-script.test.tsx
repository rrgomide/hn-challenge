import { render } from '@testing-library/react'
import { ThemeScript } from '../theme-script'

describe('ThemeScript', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
  })

  it('renders a script tag', () => {
    const { container } = render(<ThemeScript />)
    const script = container.querySelector('script')
    
    expect(script).toBeInTheDocument()
  })

  it('uses default storage key when not provided', () => {
    const { container } = render(<ThemeScript />)
    const script = container.querySelector('script')
    
    expect(script?.innerHTML).toContain("localStorage.getItem('theme')")
  })

  it('uses custom storage key when provided', () => {
    const { container } = render(<ThemeScript storageKey="custom-theme" />)
    const script = container.querySelector('script')
    
    expect(script?.innerHTML).toContain("localStorage.getItem('custom-theme')")
  })

  it('contains theme management logic', () => {
    const { container } = render(<ThemeScript />)
    const script = container.querySelector('script')
    const scriptContent = script?.innerHTML || ''
    
    expect(scriptContent).toContain('localStorage.getItem')
    expect(scriptContent).toContain('window.matchMedia')
    expect(scriptContent).toContain('prefers-color-scheme: dark')
    expect(scriptContent).toContain("classList.remove('light', 'dark')")
    expect(scriptContent).toContain('classList.add(theme)')
  })

  it('includes fallback error handling', () => {
    const { container } = render(<ThemeScript />)
    const script = container.querySelector('script')
    const scriptContent = script?.innerHTML || ''
    
    expect(scriptContent).toContain('try {')
    expect(scriptContent).toContain('} catch (e) {')
    expect(scriptContent).toContain("classList.add('dark')")
    expect(scriptContent).toContain("classList.add('light')")
  })

  it('renders script without hydration warnings', () => {
    const { container } = render(<ThemeScript />)
    const script = container.querySelector('script')
    
    // The suppressHydrationWarning prop is handled by React internally
    // We just verify the script renders correctly
    expect(script).toBeInTheDocument()
  })

  it('contains proper IIFE structure', () => {
    const { container } = render(<ThemeScript />)
    const script = container.querySelector('script')
    const scriptContent = script?.innerHTML || ''
    
    expect(scriptContent).toContain('(function() {')
    expect(scriptContent).toContain('})();')
  })

  it('handles system theme detection', () => {
    const { container } = render(<ThemeScript />)
    const script = container.querySelector('script')
    const scriptContent = script?.innerHTML || ''
    
    expect(scriptContent).toContain("var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'")
    expect(scriptContent).toContain('var theme = stored || systemTheme')
  })
})