import { Menu, Moon, Sun, X } from 'lucide-react'
import { siteConfig } from '../data'
import type { PortfolioTheme } from '../hooks/useTheme'

const navigationItems = [
  { label: 'JOURNEY', href: '#journey' },
  { label: 'WORK', href: '#work' },
  { label: 'CLIENT', href: '#freelance' },
  { label: 'ABOUT', href: '#about' },
  { label: 'RESEARCH', href: '#research' },
]

type NavigationProps = {
  onCommand: () => void
  scrolled: boolean
  mobileOpen: boolean
  onToggleMobile: () => void
  onCloseMobile: () => void
  theme: PortfolioTheme
  onToggleTheme: () => void
}

export function Navigation({
  onCommand,
  scrolled,
  mobileOpen,
  onToggleMobile,
  onCloseMobile,
  theme,
  onToggleTheme,
}: NavigationProps) {
  return (
    <>
      <header className={`site-nav ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="nav-brand-group">
          <a className="wordmark" href="#top" data-cursor="TOP" onClick={onCloseMobile}>
            AKIF<i className="wordmark-dot" aria-hidden="true" />
          </a>
          <span className="wordmark-divider" aria-hidden="true" />
        </div>

        {/* Center Primary Nav matching Reference */}
        <nav className="desktop-nav" aria-label="Primary navigation">
          {navigationItems.map((item) => (
            <a key={item.href} href={item.href} data-cursor={item.label}>
              {item.label}
            </a>
          ))}
        </nav>

        {/* Right Nav Actions: [ GITHUB ] [ LINKEDIN ] [ EMAIL ] + ⌘ COMMAND K + Light/Dark Toggle */}
        <div className="nav-actions">
          {/* Social links with [ ... ] design */}
          <div className="nav-social" aria-label="Social links">
            <a
              href={siteConfig.github}
              target="_blank"
              rel="noreferrer"
              data-cursor="GITHUB"
              className="nav-bracket-link"
            >
              <span className="nav-bracket">[</span>
              <span className="nav-bracket-text">GITHUB</span>
              <span className="nav-bracket">]</span>
            </a>
            <a
              href={siteConfig.linkedin}
              target="_blank"
              rel="noreferrer"
              data-cursor="LINKEDIN"
              className="nav-bracket-link"
            >
              <span className="nav-bracket">[</span>
              <span className="nav-bracket-text">LINKEDIN</span>
              <span className="nav-bracket">]</span>
            </a>
            <a
              href={`mailto:${siteConfig.email}`}
              data-cursor="EMAIL"
              className="nav-bracket-link"
            >
              <span className="nav-bracket">[</span>
              <span className="nav-bracket-text">EMAIL</span>
              <span className="nav-bracket">]</span>
            </a>
          </div>

          {/* Command Palette Trigger */}
          <button
            className="command-trigger"
            type="button"
            onClick={onCommand}
            data-cursor="CMD K"
            aria-label="Open command palette"
          >
            <span className="command-trigger-icon">⌘</span>
            <span className="command-trigger-label">COMMAND</span>
            <span className="command-trigger-key">K</span>
          </button>

          {/* Light / Dark Mode Toggle */}
          <button
            className="theme-toggle-btn"
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            data-cursor={theme === 'light' ? 'DARK' : 'LIGHT'}
          >
            {theme === 'light' ? <Moon size={14} strokeWidth={1.8} /> : <Sun size={14} strokeWidth={1.8} />}
          </button>

          {/* Mobile hamburger menu */}
          <button
            className="mobile-menu"
            type="button"
            aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            onClick={onToggleMobile}
          >
            <span className="mobile-menu-icon">{mobileOpen ? <X size={18} /> : <Menu size={18} />}</span>
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="mobile-navigation" id="mobile-navigation">
          <button
            className="mobile-navigation-backdrop"
            type="button"
            aria-label="Close navigation"
            onClick={onCloseMobile}
          />
          <nav className="mobile-navigation-panel" aria-label="Mobile navigation">
            <div className="mobile-nav-header">
              <span className="mono-label">AKIF.SYSTEM / NAVIGATION</span>
              <button
                type="button"
                className="mobile-nav-close"
                aria-label="Close navigation"
                onClick={onCloseMobile}
              >
                <X size={18} />
              </button>
            </div>
            <div className="mobile-navigation-links">
              {navigationItems.map((item, index) => (
                <a key={item.href} href={item.href} onClick={onCloseMobile}>
                  <span>[{String(index + 1).padStart(2, '0')}]</span>
                  {item.label}
                </a>
              ))}
            </div>
            <div className="mobile-navigation-contact">
              <a href={`mailto:${siteConfig.email}`} onClick={onCloseMobile}>
                [ EMAIL ]
              </a>
              <a href={siteConfig.github} target="_blank" rel="noreferrer" onClick={onCloseMobile}>
                [ GITHUB ]
              </a>
              <a href={siteConfig.linkedin} target="_blank" rel="noreferrer" onClick={onCloseMobile}>
                [ LINKEDIN ]
              </a>
            </div>
          </nav>
        </div>
      )}
    </>
  )
}
