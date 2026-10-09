import { Menu, X } from 'lucide-react'
import { siteConfig } from '../data'

const navigationItems = [
  { label: 'WORK', href: '#work' },
  { label: 'CLIENT WORK', href: '#freelance' },
  { label: 'RESEARCH', href: '#research' },
  { label: 'LAB', href: '#lab' },
  { label: 'ABOUT', href: '#about' },
  { label: 'CONTACT', href: '#contact' },
]

type NavigationProps = {
  onCommand: () => void
  scrolled: boolean
  mobileOpen: boolean
  onToggleMobile: () => void
  onCloseMobile: () => void
}

export function Navigation({ onCommand, scrolled, mobileOpen, onToggleMobile, onCloseMobile }: NavigationProps) {
  return (
    <>
      <header className={`site-nav ${scrolled ? 'is-scrolled' : ''}`}>
        <a className="wordmark" href="#top" data-cursor="TOP" onClick={onCloseMobile}>AKIF<span>.SYSTEM</span></a>
        <nav className="desktop-nav" aria-label="Primary navigation">
          {navigationItems.slice(0, 5).map((item) => <a key={item.href} href={item.href} data-cursor={item.label}>{item.label}</a>)}
        </nav>
        <div className="nav-actions">
          <div className="nav-social" aria-label="Social links">
            <a href={siteConfig.github} target="_blank" rel="noreferrer" data-cursor="GITHUB">GITHUB</a>
            <a href={siteConfig.linkedin} target="_blank" rel="noreferrer" data-cursor="LINKEDIN">LINKEDIN</a>
            <a href={`mailto:${siteConfig.email}`} data-cursor="EMAIL">EMAIL</a>
          </div>
          <button className="command-trigger" type="button" onClick={onCommand} data-cursor="CMD K"><span className="command-trigger-icon">⌘</span><span className="command-trigger-label">COMMAND</span><span className="command-trigger-key">K</span></button>
          <button className="mobile-menu" type="button" aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={mobileOpen} aria-controls="mobile-navigation" onClick={onToggleMobile}><span className="mobile-menu-icon">{mobileOpen ? <X size={18} /> : <Menu size={18} />}</span></button>
        </div>
      </header>

      {mobileOpen && (
        <div className="mobile-navigation" id="mobile-navigation">
          <button className="mobile-navigation-backdrop" type="button" aria-label="Close navigation" onClick={onCloseMobile} />
          <nav className="mobile-navigation-panel" aria-label="Mobile navigation">
            <span className="mono-label">AKIF.SYSTEM / NAVIGATION</span>
            <div className="mobile-navigation-links">
              {navigationItems.map((item, index) => <a key={item.href} href={item.href} onClick={onCloseMobile}><span>[{String(index + 1).padStart(2, '0')}]</span>{item.label}</a>)}
            </div>
            <div className="mobile-navigation-contact">
              <a href={`mailto:${siteConfig.email}`} onClick={onCloseMobile}>EMAIL AKIF</a>
              <a href={siteConfig.linkedin} target="_blank" rel="noreferrer" onClick={onCloseMobile}>LINKEDIN</a>
            </div>
          </nav>
        </div>
      )}
    </>
  )
}
