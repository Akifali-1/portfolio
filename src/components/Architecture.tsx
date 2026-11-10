// File: src/components/Architecture.tsx
import { useEffect, useRef, useState } from 'react'

const stages = [
  {
    index: '01',
    title: 'TEMPORAL',
    sub: 'TIME SIGNAL',
    signalClass: 'signal-bars',
    formula: 'X_t ∈ ℝ^{N × F} // Captures seasonality, lead-time lag, and demand velocity across time horizons.',
  },
  {
    index: '02',
    title: 'SPATIAL',
    sub: 'GRAPH RELATIONS',
    signalClass: 'signal-graph',
    formula: 'G = (V, E, A_t) // Encodes supplier-warehouse-retailer dependency edges and cross-entity spillover.',
  },
  {
    index: '03',
    title: 'ATTENTION',
    sub: 'ADAPTIVE FUSION',
    signalClass: 'signal-ring',
    formula: 'α_{ij} = Softmax(Q_t K_s^T / √d) // Dynamically weights which relational edge matters at timestep t.',
  },
  {
    index: '04',
    title: 'FORECAST',
    sub: 'DEMAND OUTPUT',
    signalClass: 'signal-fusion',
    isFinal: true,
    formula: 'Ŷ_{t+1:t+H} // Interpretable multi-step demand trajectory with inspectable temporal + spatial attribution.',
  },
]

export function Architecture() {
  const [activeStep, setActiveStep] = useState(3)
  const [revealedSteps, setRevealedSteps] = useState<number[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  // Sequential staggered reveal as the section scrolls into view
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          stages.forEach((_, idx) => {
            window.setTimeout(() => {
              setRevealedSteps((prev) => (prev.includes(idx) ? prev : [...prev, idx]))
            }, idx * 420) // 420ms stagger per step: 01 -> 02 -> 03 -> 04
          })
          observer.disconnect()
        }
      },
      { threshold: 0.2 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Scroll-driven stage progression on mobile/touch viewports
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let frame = 0
    let userInteracted = false
    const el = containerRef.current
    if (!el) return

    const markTouch = () => {
      userInteracted = true
    }
    el.addEventListener('pointerdown', markTouch, { passive: true })

    const update = () => {
      frame = 0
      if (userInteracted || window.innerWidth > 900) return
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight
      const progress = (vh * 0.78 - rect.top) / (vh * 0.55)
      const step = Math.min(stages.length - 1, Math.max(0, Math.floor(progress * stages.length)))
      setActiveStep(step)
    }

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      el.removeEventListener('pointerdown', markTouch)
      window.removeEventListener('scroll', onScroll)
      window.cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div ref={containerRef} className="architecture-interactive-wrap" data-reveal="rise">
      <div className="architecture" aria-label="Adaptive STGT architecture: temporal, spatial, attention, and forecast">
        <div className="architecture-track" />
        {stages.map((stage, idx) => {
          const isVisible = revealedSteps.includes(idx)
          return (
            <div key={stage.index} className="architecture-fragment">
              <button
                type="button"
                className={`architecture-step ${stage.isFinal ? 'is-final' : ''} ${
                  activeStep === idx ? 'is-inspected' : ''
                } ${isVisible ? 'is-stagger-revealed' : ''}`}
                style={{ transitionDelay: `${idx * 80}ms` }}
                onMouseEnter={() => setActiveStep(idx)}
                onClick={() => setActiveStep(idx)}
                data-cursor="STAGE"
              >
                <span>{stage.index}</span>
                <i className={`arch-signal ${stage.signalClass}`}>
                  <b />
                  <b />
                  <b />
                  {stage.signalClass === 'signal-bars' && <b />}
                </i>
                <strong>{stage.title}</strong>
                <small>{stage.sub}</small>
              </button>
              {idx < stages.length - 1 && (
                <div className={`architecture-plus ${isVisible ? 'is-stagger-revealed' : ''}`}>{idx === 2 ? '=' : '+'}</div>
              )}
            </div>
          )
        })}
      </div>
      <div className="architecture-readout mono-label">
        <span>[ STAGE {stages[activeStep].index} // {stages[activeStep].title} TELEMETRY ]</span>
        <code>{stages[activeStep].formula}</code>
      </div>
    </div>
  )
}
