import { lazy, Suspense, useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react'
import { ArrowRight } from 'lucide-react'
import { TechnologyOrbits, type CollapseAnimationState } from './TechnologyOrbits'
import { siteConfig } from '../data'

const BlackHoleCanvas = lazy(() => import('./BlackHoleCanvas').then(({ BlackHoleCanvas: Canvas }) => ({ default: Canvas })))

type HeroProps = {
  reducedMotion: boolean
  booted: boolean
  collapseState: CollapseAnimationState
  onCollapse: () => void
  blackHoleTargetRef: RefObject<HTMLSpanElement | null>
}

export function Hero({ reducedMotion, booted, collapseState, onCollapse, blackHoleTargetRef }: HeroProps) {
  const letters = 'AKIF'.split('')
  const [clock, setClock] = useState('')
  const [desktopExperience, setDesktopExperience] = useState(() => typeof window === 'undefined' || window.innerWidth > 900)
  const heroRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const updateViewportMode = () => {
      const next = window.innerWidth > 900
      setDesktopExperience((previous) => (previous === next ? previous : next))
    }
    updateViewportMode()
    window.addEventListener('resize', updateViewportMode)
    return () => window.removeEventListener('resize', updateViewportMode)
  }, [])

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const hero = heroRef.current
      if (!hero) return
      const heroHeight = Math.max(window.innerHeight, 700)
      const progress = Math.min(Math.max(window.scrollY / (heroHeight * 0.9), 0), 1)
      hero.style.setProperty('--hero-progress', String(progress))
    }
    const queueUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', queueUpdate, { passive: true })
    window.addEventListener('resize', queueUpdate)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', queueUpdate)
      window.removeEventListener('resize', queueUpdate)
    }
  }, [])

  useEffect(() => {
    const updateClock = () => {
      const now = new Date()
      setClock(
        now.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }) + ' UTC+5:30',
      )
    }
    updateClock()
    const timer = window.setInterval(updateClock, 1000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <section ref={heroRef} className="hero" id="top">
      {booted && (
        <Suspense fallback={null}>
          <BlackHoleCanvas
            reducedMotion={reducedMotion}
            active={collapseState !== 'collapsed'}
            tilt={desktopExperience ? 30 : 0}
          />
        </Suspense>
      )}
      <TechnologyOrbits
        reducedMotion={reducedMotion}
        active={booted && desktopExperience}
        state={collapseState}
        containerRef={heroRef}
        blackHoleTargetRef={blackHoleTargetRef}
      />
      <span ref={blackHoleTargetRef} className="hero-black-hole-target" aria-hidden="true" />
      <div className="hero-noise" />
      <div className="hero-grid" aria-hidden="true" />
      <div className="hero-intro">
        <span className="live-dot" /> SYSTEM ONLINE
        {clock && <span className="hero-clock">// {clock}</span>}
        <span className="hero-location">HYD 17.38° N / 78.48° E</span>
      </div>
      <div className="hero-content">
        <div className="hero-index mono-label">
          [ 00 / 05 ] <span>THE WORKSHOP</span>
        </div>
        <h1 className="hero-title" aria-label="Akif">
          <span className="hero-word" aria-hidden="true">
            {letters.map((letter, index) => (
              <span key={`${letter}-${index}`} style={{ '--letter-index': index } as CSSProperties}>
                {letter}
              </span>
            ))}
          </span>
          <span className="hero-title-suffix">.SYSTEM</span>
        </h1>
        <div className="hero-subline">
          <div className="role-stack">
            <span>ENGINEER</span>
            <span>RESEARCHER</span>
            <span>BUILDER</span>
          </div>
          <div className="hero-statement-column">
            <p className="hero-statement">
              I build systems
              <br />
              <em>that turn ideas</em>
              <br />
              <strong>into reality.</strong>
            </p>
            <div className="hero-actions">
              <a className="hero-cta" href="#contact">
                START A CONVERSATION <ArrowRight size={14} />
              </a>
              <a className="hero-cta-secondary" href={`mailto:${siteConfig.email}`}>
                EMAIL AKIF
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="hero-collapse-control">
        <button
          className="hero-collapse-trigger"
          type="button"
          onClick={onCollapse}
          disabled={collapseState !== 'idle'}
          aria-label="Initiate portfolio collapse"
        >
          <span className="collapse-trigger-orbit" aria-hidden="true">
            <span className="collapse-trigger-core" />
            <span className="collapse-trigger-sweep" />
          </span>
          <span className="collapse-trigger-copy">
            <span className="collapse-trigger-label">INITIATE COLLAPSE</span>
            <span className="collapse-trigger-status">FOLD THE SYSTEM</span>
          </span>
          <ArrowRight className="collapse-trigger-arrow" size={15} aria-hidden="true" />
        </button>
      </div>
      <div className="hero-footer">
        <span className="mono-label">SCROLL TO DECOMPILE</span>
        <span className="scroll-mark">
          <span />
        </span>
        <span className="mono-label hero-footer-right">01 — 07</span>
      </div>
      <div className="hero-words" aria-hidden="true">
        <span>WORK</span>
        <span>RESEARCH</span>
        <span>LAB</span>
        <span>SYSTEM</span>
      </div>
    </section>
  )
}
