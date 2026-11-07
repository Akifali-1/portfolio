import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { journey } from '../data'

/**
 * Full-screen horizontal journey. Vertical scroll drives a sticky track
 * sideways, one panel per screen. Ghost words behind each panel move slower
 * than the panel for depth. Native scroll is never blocked. Below 900px or
 * with reduced motion the panels stack vertically and nothing is pinned.
 */
export function JourneySection() {
  const sectionRef = useRef<HTMLElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLSpanElement>(null)
  const [compact, setCompact] = useState(false)
  const [active, setActive] = useState(0)
  const activeRef = useRef(0)
  const count = journey.length

  useEffect(() => {
    const query = window.matchMedia('(max-width: 900px), (prefers-reduced-motion: reduce)')
    const update = () => setCompact(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const section = sectionRef.current
    const viewport = viewportRef.current
    const track = trackRef.current
    if (!section || !viewport || !track) return

    if (compact) {
      section.style.height = ''
      track.style.transform = ''
      track.style.removeProperty('--focus')
      return
    }

    let travel = 0
    let target = 0
    let current = 0
    let frame = 0
    let lastTime = 0

    function render(now = performance.now()) {
      frame = 0
      const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 1 / 60
      lastTime = now
      const alpha = 1 - Math.exp(-9.5 * dt)
      current += (target - current) * alpha
      if (Math.abs(target - current) < 0.0004) {
        current = target
        lastTime = 0
      }
      track!.style.transform = `translate3d(${(-current * travel).toFixed(2)}px, 0, 0)`
      track!.style.setProperty('--focus', (current * (count - 1)).toFixed(3))
      if (barRef.current) barRef.current.style.transform = `scaleX(${current.toFixed(4)})`
      const next = Math.min(count - 1, Math.round(current * (count - 1)))
      if (next !== activeRef.current) {
        activeRef.current = next
        setActive(next)
      }
      if (current !== target) frame = requestAnimationFrame(render)
    }
    function readScroll() {
      const rect = section!.getBoundingClientRect()
      const total = Math.max(1, section!.offsetHeight - window.innerHeight)
      target = Math.min(Math.max(-rect.top / total, 0), 1)
      if (!frame) frame = requestAnimationFrame(render)
    }
    function measure() {
      travel = Math.max(0, track!.offsetWidth - viewport!.clientWidth)
      section!.style.height = `${window.innerHeight + travel}px`
      readScroll()
    }

    measure()
    current = target
    render()
    window.addEventListener('scroll', readScroll, { passive: true })
    window.addEventListener('resize', measure)
    void document.fonts?.ready.then(measure)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', readScroll)
      window.removeEventListener('resize', measure)
      section.style.height = ''
    }
  }, [compact, count])

  const jump = (index: number) => {
    const section = sectionRef.current
    if (!section) return
    if (compact) {
      section.querySelectorAll('.journey-panel')[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    const total = section.offsetHeight - window.innerHeight
    const p = count > 1 ? index / (count - 1) : 0
    const top = section.getBoundingClientRect().top + window.scrollY + p * total
    window.scrollTo({ top, behavior: 'smooth' })
  }

  return (
    <section
      ref={sectionRef}
      className={`journey-section section-dark ${compact ? 'is-stacked' : ''}`}
      id="journey"
      aria-labelledby="journey-title"
    >
      <div className="journey-pin">
        <div className="journey-topbar">
          <span className="journey-topbar-index">01B</span>
          <h2 id="journey-title" className="journey-topbar-title">
            THE JOURNEY / HOW I GOT HERE
          </h2>
          <span className="journey-topbar-now">
            [{journey[active].index}] {journey[active].label}
          </span>
          <div className="journey-bar" aria-hidden="true">
            <span ref={barRef} />
          </div>
        </div>

        <div ref={viewportRef} className="journey-viewport">
          <div ref={trackRef} className="journey-track" style={{ '--n': count } as CSSProperties}>
            {journey.map((stop, i) => (
              <article
                key={stop.id}
                className={`journey-panel ${i === active ? 'is-active' : ''}`}
                style={{ '--i': i } as CSSProperties}
              >
                <div className="journey-ghost" aria-hidden="true">
                  <span>{stop.ghost[0]}</span>
                  <span>{stop.ghost[1]}</span>
                </div>
                <div className="journey-content">
                  <div className="journey-meta-row">
                    <b>[{stop.index}]</b>
                    <i />
                    <strong>{stop.label}</strong>
                    <span className="journey-pill">{stop.pill}</span>
                  </div>
                  <h3 className="journey-headline">
                    <span>{stop.headline[0]}</span>
                    <span>{stop.headline[1]}</span>
                  </h3>
                  <p className="journey-body">{stop.body}</p>
                  <dl className="journey-details">
                    {stop.details.map((d) => (
                      <div key={d.k}>
                        <dt>{d.k}</dt>
                        <dd>{d.v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="journey-tabs">
          {journey.map((stop, i) => (
            <button
              key={stop.id}
              type="button"
              className={i === active ? 'is-current' : ''}
              onClick={() => jump(i)}
              data-cursor="JUMP"
            >
              {stop.index} {stop.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
