// File: src/components/Hero.tsx
import { useEffect, useRef, useState, type RefObject } from 'react'
import { ArrowRight } from 'lucide-react'
import type { CollapseAnimationState } from './FallingTechLogos'
import { HalftoneName } from './HalftoneName'
import { siteConfig } from '../data'

type HeroProps = {
  booted?: boolean
  reducedMotion: boolean
  collapseState: CollapseAnimationState
  onCollapse: () => void
  collapseTargetRef: RefObject<HTMLSpanElement | null>
}

export function Hero({
  booted = true,
  reducedMotion,
  collapseState,
  onCollapse,
  collapseTargetRef,
}: HeroProps) {
  const [clock, setClock] = useState('')
  const heroRef = useRef<HTMLElement>(null)

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
    <section ref={heroRef} className="hero hero--cards" id="top">
      <div className="hero-noise" />

      {/* Top Telemetry Bar */}
      <div className="hero-intro">
        <span className="live-dot" /> SYSTEM ONLINE
        {clock && <span className="hero-clock">// {clock}</span>}
        <span className="hero-location">HYD 17.38° N / 78.48° E</span>
      </div>

      {/* Collapse Trigger */}
      <div className={`hero-collapse-control ${collapseState !== 'idle' ? 'is-collapse-active' : ''}`}>
        <button
          className={`hero-collapse-trigger ${collapseState !== 'idle' ? 'is-collapsed-trigger' : ''}`}
          type="button"
          onClick={onCollapse}
          disabled={collapseState !== 'idle'}
          aria-hidden={collapseState !== 'idle'}
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
        <span ref={collapseTargetRef} className="hero-collapse-target" aria-hidden="true" />
      </div>

      {/* Layered Metallic Card Architecture */}
      <div className="hero-card-composition">
        {/* Card 1: Wide Metallic Base Surface */}
        <div className="hero-card-base" aria-hidden="true" />

        {/* Card 2: Tall Metallic Pillar (Clean top, drops from top edge) */}
        <div className="hero-card-pillar" aria-hidden="true" />

        {/* Outlined Bottom-Left Display Watermark: DEVELOPER */}
        <div className="hero-outlined-mark" aria-hidden="true">
          <span>DEVEL</span>
          <span>OPER</span>
        </div>

        {/* Centerpiece: Halftone AKIF Centered Horizontally on the Pillar */}
        <div className="hero-centerpiece">
          <div className="hero-index mono-label">
            [ 00 / 05 ] <span>THE WORKSHOP</span>
          </div>
          <h1 className="hero-title hero-title--halftone" aria-label="Akif">
            <HalftoneName text="AKIF" active={booted} reducedMotion={reducedMotion} />
          </h1>
          <span className="hero-title-suffix mono-label">AKIF.SYSTEM // LIVING ARCHIVE</span>
        </div>

        {/* Right Editorial Copy Column (Scaled down headline) */}
        <div className="hero-subline hero-editorial-column">
          <p className="hero-statement">
            I build systems
            <br />
            <em>that turn ideas</em>
            <br />
            <strong>into reality.</strong>
          </p>
          <p className="hero-editorial-body">
            Building intelligent systems, developer tools, and experimental research — turning difficult questions into
            inspectable, working software.
          </p>
          <div className="hero-actions">
            <a className="hero-editorial-cta" href="#contact" data-cursor="CONTACT">
              START A CONVERSATION <ArrowRight size={14} />
            </a>
            <a className="hero-cta-secondary" href={`mailto:${siteConfig.email}`} data-cursor="EMAIL">
              EMAIL AKIF
            </a>
          </div>
        </div>

        {/* Bottom-Right Metallic Dock Bar: ENGINEER / BUILDER / RESEARCHER */}
        <div className="hero-footer hero-card-dock" aria-label="Core roles">
          <span className="hero-dock-link">
            <span>ENGINEER</span>
          </span>
          <span className="hero-dock-link">
            <span>BUILDER</span>
          </span>
          <span className="hero-dock-link">
            <span>RESEARCHER</span>
          </span>
        </div>
      </div>
    </section>
  )
}
