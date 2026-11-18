// File: src/components/CustomCursor.tsx
import { useEffect, useRef, useState } from 'react'

type HeroCursorZone = 'default' | 'hidden' | 'hero-cta'

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const [label, setLabel] = useState('')
  const [visible, setVisible] = useState(false)
  const [heroZone, setHeroZone] = useState<HeroCursorZone>('default')

  useEffect(() => {
    const dot = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring || window.matchMedia('(pointer: coarse)').matches) return

    let targetX = -100
    let targetY = -100
    let currentX = targetX
    let currentY = targetY
    let frame = 0

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(animate)
    }

    const move = (event: PointerEvent) => {
      targetX = event.clientX
      targetY = event.clientY

      const targetEl = event.target instanceof Element ? event.target : null
      const inHero = targetEl?.closest<HTMLElement>('.hero--calligraphy')

      if (inHero) {
        // 1. Keep brush cursor on the left side exclusive; never show custom cursor while brush is active or in left canvas
        const inLeftCanvas = targetEl?.closest<HTMLElement>('.hero-calligraphy-left')
        const brushActive = inHero.classList.contains('is-brush-cursor-active')
        const inSkipBtn = targetEl?.closest<HTMLElement>('.hero-skip-intro-btn')

        // 2. Over the two CTA buttons (Explore my work, About me) or their action row:
        //    shrink to a small solid ink dot, and expand into a thin labeled ring on button hover
        const ctaButton = targetEl?.closest<HTMLElement>('.hero-cal-btn-primary, .hero-cal-btn-secondary')
        const inCtaZone = targetEl?.closest<HTMLElement>('.hero-cal-actions')

        if (inLeftCanvas || brushActive) {
          setHeroZone('hidden')
          setLabel('')
          setVisible(false)
          schedule()
          return
        }

        if (ctaButton || inCtaZone || inSkipBtn) {
          setHeroZone('hero-cta')
          setLabel(ctaButton?.dataset.cursor ?? '')
          setVisible(true)
          schedule()
          return
        }

        // 3. Over body text, eyebrow, pillars, and headline on the right side:
        //    hide custom cursor and show normal system cursor
        setHeroZone('hidden')
        setLabel('')
        setVisible(false)
        schedule()
        return
      }

      // Outside hero section: standard portfolio cursor behavior
      setHeroZone('default')
      setVisible(true)
      const element = targetEl?.closest<HTMLElement>('a, button, [data-cursor]')
      setLabel(element?.dataset.cursor ?? '')

      schedule()
    }

    const leave = () => setVisible(false)

    const animate = () => {
      frame = 0
      currentX += (targetX - currentX) * 0.18
      currentY += (targetY - currentY) * 0.18

      dot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`
      ring.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`

      if (Math.abs(targetX - currentX) > 0.1 || Math.abs(targetY - currentY) > 0.1) schedule()
    }

    window.addEventListener('pointermove', move)
    document.documentElement.addEventListener('mouseleave', leave)
    return () => {
      window.removeEventListener('pointermove', move)
      document.documentElement.removeEventListener('mouseleave', leave)
      window.cancelAnimationFrame(frame)
    }
  }, [])

  const zoneClass =
    heroZone === 'hero-cta' ? 'is-hero-cta' : heroZone === 'hidden' ? 'is-hero-hidden' : ''

  return (
    <div
      className={`cursor-layer ${visible && heroZone !== 'hidden' ? 'is-visible' : ''} ${zoneClass}`}
      aria-hidden="true"
    >
      <div className={`cursor-dot ${label ? 'is-expanded-ring' : ''}`} ref={dotRef} />
      <div className={`cursor-ring ${label ? 'has-label' : ''}`} ref={ringRef}>
        {label}
      </div>
    </div>
  )
}
