import { useCallback, useEffect, useState } from 'react'
import { BootScreen } from './components/BootScreen'
import { CommandPalette } from './components/CommandPalette'
import { CustomCursor } from './components/CustomCursor'
import { Hero } from './components/Hero'
import { Navigation } from './components/Navigation'
import { ProjectModal } from './components/ProjectModal'
import { AboutSection, ClientSection, ContactSection, LabSection, ManifestoSection, ResearchSection, SignalSection, SiteFooter, WorkSection } from './sections/PortfolioSections'
import { type Project } from './data'
import { useReducedMotion } from './hooks'
import './styles.css'
import './project-preview.css'
import './ui-overrides.css'

function App() {
  const reducedMotion = useReducedMotion()
  const [booted, setBooted] = useState(() => {
    try {
      return window.sessionStorage.getItem('akif-system-initialized') === '1'
    } catch {
      return false
    }
  })
  const [commandOpen, setCommandOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [scrolled, setScrolled] = useState(false)

  const finishBoot = useCallback(() => {
    try {
      window.sessionStorage.setItem('akif-system-initialized', '1')
    } catch {
      // Continue normally when storage is unavailable.
    }
    setBooted(true)
  }, [])

  useEffect(() => {
    const revealItems = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'))
    const parallaxItems = Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'))
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduced) {
      revealItems.forEach((item) => item.classList.add('is-revealed'))
      return
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' })
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
      const heroHeight = Math.max(window.innerHeight, 700)
      setScrollProgress(Math.min(Math.max(window.scrollY / (heroHeight * 0.9), 0), 1))
      setScrolled(window.scrollY > 40)
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
        setSelectedProject(null)
        setMobileOpen(false)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  return (
    <>
      {!booted && <BootScreen onComplete={finishBoot} reducedMotion={reducedMotion} />}
      <CustomCursor />
      <Navigation onCommand={() => { setCommandOpen(true); setMobileOpen(false) }} scrolled={scrolled} mobileOpen={mobileOpen} onToggleMobile={() => setMobileOpen((value) => !value)} onCloseMobile={() => setMobileOpen(false)} />
      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />
      <main className="site-main">
        <Hero scrollProgress={scrollProgress} reducedMotion={reducedMotion} />
        <ManifestoSection />
        <WorkSection onSelect={setSelectedProject} reducedMotion={reducedMotion} />
        <ClientSection onSelect={setSelectedProject} />
        <ResearchSection />
        <LabSection onSelect={setSelectedProject} />
        <SignalSection />
        <AboutSection />
        <ContactSection />
      </main>
      <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />
      <SiteFooter />
    </>
  )
}

export default App
