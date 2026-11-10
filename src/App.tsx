import { useCallback, useEffect, useRef, useState } from 'react'
import { BootScreen } from './components/BootScreen'
import { CommandPalette } from './components/CommandPalette'
import { CustomCursor } from './components/CustomCursor'
import { CollapseSurface, type CollapseSurfaceHandle } from './components/CollapseSurface'
import { SectionSweep } from './components/SectionSweep'
import { Hero } from './components/Hero'
import { JourneySection } from './components/JourneySection'
import { Navigation } from './components/Navigation'
import { ProjectModal } from './components/ProjectModal'
import {
  AboutSection,
  ClientSection,
  ContactSection,
  GraphSection,
  ManifestoSection,
  ResearchSection,
  SignalSection,
  SiteFooter,
  WorkSection,
} from './sections/PortfolioSections'
import { clientProjects, projects, type Project } from './data'
import { useReducedMotion } from './hooks'
import { usePortfolioCollapse } from './hooks/usePortfolioCollapse'
import './styles.css'
import './project-preview.css'
import './ui-overrides.css'
import './collapse.css'
import './echo-sections.css'
import './fullscreen.css'
import './mobile-fixes.css'

function App() {
  const reducedMotion = useReducedMotion()
  const portfolioShellRef = useRef<HTMLDivElement>(null)
  const collapseTargetRef = useRef<HTMLSpanElement>(null)
  const collapseSurfaceRef = useRef<CollapseSurfaceHandle>(null)
  const collapseBlackoutRef = useRef<HTMLDivElement>(null)
  const voidScreenRef = useRef<HTMLDivElement>(null)
  const restoreFocusRef = useRef<HTMLButtonElement>(null)
  const { state: collapseState, startCollapse, restore } = usePortfolioCollapse({
    shellRef: portfolioShellRef,
    collapseTargetRef,
    surfaceRef: collapseSurfaceRef,
    blackoutRef: collapseBlackoutRef,
    voidScreenRef,
    restoreFocusRef,
    reducedMotion,
  })
  const [booted, setBooted] = useState(() => {
    try {
      return window.sessionStorage.getItem('akif-system-initialized') === '1'
    } catch {
      return false
    }
  })
  // The boot layer stays mounted until its own circle has receded (booted flips earlier, at the reveal).
  const [bootMounted, setBootMounted] = useState(() => !booted)
  const [commandOpen, setCommandOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(() => {
    const hash = window.location.hash
    if (hash.startsWith('#project=')) {
      const id = hash.replace('#project=', '')
      return [...projects, ...clientProjects].find((p) => p.id === id) ?? null
    }
    return null
  })
  const [scrolled, setScrolled] = useState(false)

  const handleSelectProject = useCallback((project: Project | null) => {
    setSelectedProject(project)
    if (project) {
      window.history.replaceState(null, '', `#project=${project.id}`)
    } else if (window.location.hash.startsWith('#project=')) {
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [])

  const finishBoot = useCallback(() => {
    try {
      window.sessionStorage.setItem('akif-system-initialized', '1')
    } catch {
      // Continue normally when storage is unavailable.
    }
    setBooted(true)
  }, [])

  const unmountBoot = useCallback(() => setBootMounted(false), [])

  useEffect(() => {
    const revealItems = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'))
    const parallaxItems = Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'))
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduced) {
      revealItems.forEach((item) => item.classList.add('is-revealed'))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )

    revealItems.forEach((item) => observer.observe(item))

    let frame = 0
    const updateParallax = () => {
      const viewport = window.innerHeight
      parallaxItems.forEach((item) => {
        const rect = item.getBoundingClientRect()
        const progress = (rect.top + rect.height / 2 - viewport / 2) / (viewport / 2 + rect.height / 2)
        const strength = Number(item.dataset.parallax ?? '0.06')
        const shift = Math.max(-16, Math.min(16, -progress * strength * 100))
        item.style.setProperty('--parallax-y', `${shift}px`)
      })
      frame = 0
    }

    const queueParallax = () => {
      if (!frame) frame = window.requestAnimationFrame(updateParallax)
    }

    queueParallax()
    window.addEventListener('scroll', queueParallax, { passive: true })
    window.addEventListener('resize', queueParallax)

    return () => {
      observer.disconnect()
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', queueParallax)
      window.removeEventListener('resize', queueParallax)
    }
  }, [])

  useEffect(() => {
    const update = () => {
      const next = window.scrollY > 40
      setScrolled((previous) => (previous === next ? previous : next))
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  useEffect(() => {
    document.body.classList.toggle('mobile-nav-open', mobileOpen)
    return () => document.body.classList.remove('mobile-nav-open')
  }, [mobileOpen])

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setCommandOpen((value) => !value)
        setMobileOpen(false)
      }
      if (event.key === 'Escape') {
        handleSelectProject(null)
        setMobileOpen(false)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleSelectProject])

  return (
    <>
      {bootMounted && <BootScreen onReveal={finishBoot} onComplete={unmountBoot} reducedMotion={reducedMotion} />}
      <div
        ref={portfolioShellRef}
        className={`portfolio-shell ${booted ? 'is-hero-entered' : 'is-hero-waiting'}`}
        aria-hidden={collapseState !== 'idle'}
      >
        <CustomCursor />
        <Navigation
          onCommand={() => {
            setCommandOpen(true)
            setMobileOpen(false)
          }}
          scrolled={scrolled}
          mobileOpen={mobileOpen}
          onToggleMobile={() => setMobileOpen((value) => !value)}
          onCloseMobile={() => setMobileOpen(false)}
        />
        <CommandPalette
          open={commandOpen}
          onClose={() => setCommandOpen(false)}
          onSelectProject={handleSelectProject}
        />
        <main className="site-main">
          <Hero
            booted={booted}
            reducedMotion={reducedMotion}
            collapseState={collapseState}
            onCollapse={startCollapse}
            collapseTargetRef={collapseTargetRef}
          />
          <ManifestoSection />
          <JourneySection />
          <WorkSection onSelect={handleSelectProject} reducedMotion={reducedMotion} />
          <ClientSection onSelect={handleSelectProject} />
          <AboutSection />
          <SignalSection />
          <ResearchSection />
          <GraphSection onSelect={handleSelectProject} reducedMotion={reducedMotion} />
          <ContactSection />
        </main>
        <ProjectModal
          project={selectedProject}
          onClose={() => handleSelectProject(null)}
          onSelect={handleSelectProject}
        />
        <SiteFooter />
      </div>
      <SectionSweep reducedMotion={reducedMotion} />
      <CollapseSurface ref={collapseSurfaceRef} />
      <div ref={collapseBlackoutRef} className="collapse-blackout" aria-hidden="true" />
      <div
        ref={voidScreenRef}
        className={`void-screen ${collapseState !== 'idle' ? 'is-active' : ''} ${collapseState === 'collapsed' ? 'is-collapsed' : ''}`}
        data-restore-state={collapseState}
        aria-hidden={collapseState !== 'collapsed'}
      >
        <button
          ref={restoreFocusRef}
          type="button"
          className="restore-reality-button"
          onClick={restore}
          disabled={collapseState !== 'collapsed'}
          aria-label="Restore reality"
        >
          <span className="restore-reality-orbit" aria-hidden="true">
            <span className="restore-reality-core" />
            <span className="restore-reality-sweep" />
          </span>
          <span className="restore-reality-copy">
            <span className="restore-reality-label">RESTORE REALITY</span>
            <span className="restore-reality-status">RETURN TO SURFACE</span>
          </span>
          <span className="restore-reality-arrow" aria-hidden="true">↗</span>
        </button>
      </div>
    </>
  )
}

export default App
