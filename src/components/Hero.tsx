import { ArrowRight } from 'lucide-react'
import type { CSSProperties } from 'react'
import { SystemCanvas } from './SystemCanvas'
import { siteConfig } from '../data'

type HeroProps = {
  scrollProgress: number
  reducedMotion: boolean
}

export function Hero({ scrollProgress, reducedMotion }: HeroProps) {
  const letters = 'AKIF'.split('')
  const heroStyle = { '--hero-progress': scrollProgress } as CSSProperties

  return (
    <section className="hero" id="top" style={heroStyle}>
      <SystemCanvas reducedMotion={reducedMotion} />
      <div className="hero-noise" />
      <div className="hero-grid" aria-hidden="true" />
      <div className="hero-intro"><span className="live-dot" /> SYSTEM ONLINE <span className="hero-location">LAT 40.71 / LON -74.00</span></div>
      <div className="hero-content">
        <div className="hero-index mono-label">[ 00 / 05 ] <span>THE WORKSHOP</span></div>
        <h1 className="hero-title" aria-label="Akif">
          <span className="hero-word" aria-hidden="true">{letters.map((letter, index) => <span key={`${letter}-${index}`} style={{ '--letter-index': index } as CSSProperties}>{letter}</span>)}</span>
          <span className="hero-title-suffix">.SYSTEM</span>
        </h1>
        <div className="hero-subline">
          <div className="role-stack"><span>ENGINEER</span><span>RESEARCHER</span><span>BUILDER</span></div>
          <div className="hero-statement-column">
            <p className="hero-statement">I build systems<br /><em>that turn ideas</em><br /><strong>into reality.</strong></p>
            <div className="hero-actions">
              <a className="hero-cta" href="#contact">START A CONVERSATION <ArrowRight size={14} /></a>
              <a className="hero-cta-secondary" href={`mailto:${siteConfig.email}`}>EMAIL AKIF</a>
            </div>
          </div>
        </div>
      </div>
      <div className="hero-footer">
        <span className="mono-label">SCROLL TO DECOMPILE</span>
        <span className="scroll-mark"><span /></span>
        <span className="mono-label hero-footer-right">01 — 05</span>
      </div>
      <div className="hero-words" aria-hidden="true"><span>WORK</span><span>RESEARCH</span><span>LAB</span><span>SYSTEM</span></div>
    </section>
  )
}
