import { useCallback, useEffect, useState } from 'react'

export type PortfolioTheme = 'light' | 'dark'

const STORAGE_KEY = 'akif-portfolio-theme'

function getInitialTheme(): PortfolioTheme {
  if (typeof window === 'undefined') return 'dark'
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // Ignore storage errors
  }
  return 'dark'
}

export function useTheme() {
  const [theme, setTheme] = useState<PortfolioTheme>(getInitialTheme)

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = theme
    root.style.colorScheme = theme

    const metaTheme = document.querySelector('meta[name="theme-color"]')
    if (metaTheme) {
      metaTheme.setAttribute('content', theme === 'light' ? '#F4F2EC' : '#000000')
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // Ignore storage errors
    }
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }, [])

  return { theme, setTheme, toggleTheme }
}
