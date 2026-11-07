import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { journey } from '../data'
import { SectionLabel } from './SectionLabel'

/**
 * Horizontal scroll journey. Vertical scroll drives a sticky track sideways.
 * Native scrolling is never blocked. Below 760px or with reduced motion, the
 * stops stack vertically and nothing is pinned.
 */
export function JourneySection() {
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [compact, setCompact] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const query = window.matchMedia('(max-width: 760px), (prefers-reduced-motion: reduce)')
    const update = () => setCompact(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const section = sectionRef.current
    const track = trackRef.current
    if (!section || !track) return
    if (compact) {
      section.style.height = ''
      track.style.transform = ''
      return
    }

    let travel = 0
    let target = 0
    let current = 0
    let frame = 0
    let lastReported = -1

    const measure = () => {
      travel = Math.max(0, track.scrollWidth - window.innerWidth)
      section.style.height = `${window.innerHeight + travel}px`
      readScroll()
    }
    function readScroll() {
      const rect = section!.getBoundingClientRect()
      const total = Math.max(1, section!.offsetHeight - window.innerHeight)
      target = Math.min(Math.max(-rect.top / total, 0), 1)
      if (!frame) frame = requestAnimationFrame(render)
    }
    function render() {
      frame = 0
      current += (target - current) * 0.12
      if (Math.abs(target - current) < 0.0005) current = target
      track!.style.transform = `translate3d(${(-current * travel).toFixed(2)}px,0,0)`
      const rounded = Math.round(current * 100) / 100
      if (rounded !== lastReported) {
        lastReported = rounded
        setProgress(rounded)
      }
      if (current !== target) frame = requestAnimationFrame(render)
    }

    measure()
    window.addEventListener('scroll', readScroll, { passive: true })
    window.addEventListener('resize', measure)
    const fonts = document.fonts?.ready.then(measure)
    void fonts
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', readScroll)
      window.removeEventListener('resize', measure)
      section.style.height = ''
    }
  }, [compact])

  const jump = (index: number) => {
    const section = sectionRef.current
    if (!section) return
    if (compact) {
      section.querySelectorAll('.journey-stop')[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    const total = section.offsetHeight - window.innerHeight
    const p = journey.length > 1 ? index / (journey.length - 1) : 0
    const top = section.getBoundingClientRect().top + window.scrollY + p * total
    window.scrollTo({ top, behavior: 'smooth' })
  }

  const activeIndex = Math.min(journey.length - 1, Math.round(progress * (journey.length - 1)))

  return (
    <section
      ref={sectionRef}
      className={`journey-section section-dark ${compact ? 'is-stacked' : ''}`}
      id="journey"
      aria-labelledby="journey-title"
    >
      <div className="journey-pin">
        <div className="journey-head page-grid">
          <SectionLabel index="01B">THE JOURNEY</SectionLabel>
          <div className="journey-title-wrap">
            <h2 id="journey-title">
              How I got
              <br />
              <em>here.</em>
            </h2>
          </div>
        </div>
        <div className="journey-viewport">
          <div ref={trackRef} className="journey-track">
            <div className="journey-rail" aria-hidden="true" />
            {journey.map((stop, i) => (
              <article
                key={stop.id}
                className={`journey-stop ${i === activeIndex ? 'is-active' : ''}`}
                style={{ '--stop-i': i } as CSSProperties}
              >
                <span className="journey-numeral" aria-hidden="true">
                  {stop.index}
                </span>
                <span className="journey-dot" aria-hidden="true" />
                <span className="mono-label journey-label">
                  [{stop.index}] {stop.label}
                </span>
                <h3>{stop.title}</h3>
                <p>{stop.body}</p>
                <ul className="journey-meta mono-label">
                  {stop.meta.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
        <div className="journey-hud">
          <div className="journey-bar" aria-hidden="true">
            <span style={{ transform: `scaleX(${progress})` }} />
          </div>
          <div className="journey-jumps">
            {journey.map((stop, i) => (
              <button
                key={stop.id}
                type="button"
                className={i === activeIndex ? 'is-current' : ''}
                onClick={() => jump(i)}
                data-cursor="JUMP"
              >
                {stop.index} {stop.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

