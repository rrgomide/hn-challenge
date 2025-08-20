export function ThemeScript({ storageKey = 'theme' }: { storageKey?: string }) {
  const script = `
    (function() {
      try {
        var stored = localStorage.getItem('${storageKey}');
        var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        var theme = stored || systemTheme;
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(theme);
      } catch (e) {
        // If localStorage is not available, fall back to system preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.add('light');
        }
      }
    })();
  `

  return (
    <script
      dangerouslySetInnerHTML={{ __html: script }}
      suppressHydrationWarning
    />
  )
}