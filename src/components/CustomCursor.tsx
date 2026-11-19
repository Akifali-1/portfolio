// File: src/components/CustomCursor.tsx
import { useEffect, useRef, useState } from 'react'

type HeroCursorZone = 'default' | 'hidden' | 'hero-cta'

const CTA_SELECTOR = '.hero-cal-btn-primary, .hero-cal-btn-secondary'
/** Distance (px) around a CTA button where the small ink dot starts to appear */
const CTA_NEAR_PX = 28

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

    const root = document.documentElement
    let targetX = -100
    let targetY = -100
    let currentX = targetX
    let currentY = targetY
    let frame = 0

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(animate)
    }

    const apply = (zone: HeroCursorZone, nextLabel: string, show: boolean) => {
      setHeroZone(zone)
      setLabel(nextLabel)
      setVisible(show)
      // Lets CSS hide the system cursor only while the CTA dot/ring is the active cursor
      root.classList.toggle('is-hero-cta-cursor', zone === 'hero-cta')
    }

    const isNearCta = (hero: HTMLElement) =>
      Array.from(hero.querySelectorAll<HTMLElement>(CTA_SELECTOR)).some((btn) => {
        if (btn.style.pointerEvents === 'none') return false // CTA not revealed yet
        const r = btn.getBoundingClientRect()
        return (
          targetX >= r.left - CTA_NEAR_PX &&
          targetX <= r.right + CTA_NEAR_PX &&
          targetY >= r.top - CTA_NEAR_PX &&
          targetY <= r.bottom + CTA_NEAR_PX
        )
      })

    const resolve = (targetEl: Element | null) => {
      const hero = targetEl?.closest<HTMLElement>('.hero--calligraphy') ?? null

      // Outside the hero: standard portfolio cursor
      if (!hero) {
        const element = targetEl?.closest<HTMLElement>('a, button, [data-cursor]')
        apply('default', element?.dataset.cursor ?? '', true)
        return
      }

      // Brush is the only cursor on the left canvas and while it is active
      const inLeftCanvas = targetEl?.closest('.hero-calligraphy-left')
      const brushActive = hero.classList.contains('is-brush-cursor-active')
      if (inLeftCanvas || brushActive) {
        apply('hidden', '', false)
        return
      }

      // CTA buttons: ring + label on the button, small ink dot just around it
      const ctaButton = targetEl?.closest<HTMLElement>(CTA_SELECTOR)
      if (ctaButton) {
        apply('hero-cta', ctaButton.dataset.cursor ?? '', true)
        return
      }
      if (isNearCta(hero)) {
        apply('hero-cta', '', true)
        return
      }

      // Headline, body text, pillars and everything else: system cursor
      apply('hidden', '', false)
    }

    const move = (event: PointerEvent) => {
      targetX = event.clientX
      targetY = event.clientY
      resolve(event.target instanceof Element ? event.target : null)
      schedule()
    }

    // Re-check when the page scrolls under a still pointer
    const scroll = () => {
      if (targetX < 0) return
      resolve(document.elementFromPoint(targetX, targetY))
    }

    const leave = () => {
      setVisible(false)
      root.classList.remove('is-hero-cta-cursor')
    }

    const animate = () => {
      frame = 0
      currentX += (targetX - currentX) * 0.18
      currentY += (targetY - currentY) * 0.18

      dot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`
      ring.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`

      if (Math.abs(targetX - currentX) > 0.1 || Math.abs(targetY - currentY) > 0.1) schedule()
    }

    window.addEventListener('pointermove', move)
    window.addEventListener('scroll', scroll, { passive: true })
    document.documentElement.addEventListener('mouseleave', leave)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('scroll', scroll)
      document.documentElement.removeEventListener('mouseleave', leave)
      window.cancelAnimationFrame(frame)
      root.classList.remove('is-hero-cta-cursor')
    }
  }, [])

  const zoneClass =
    heroZone === 'hero-cta' ? 'is-hero-cta' : heroZone === 'hidden' ? 'is-hero-hidden' : ''

  return (
    <div className={`cursor-layer ${visible ? 'is-visible' : ''} ${zoneClass}`} aria-hidden="true">
      <div className={`cursor-dot ${label ? 'is-expanded-ring' : ''}`} ref={dotRef} />
      <div className={`cursor-ring ${label ? 'has-label' : ''}`} ref={ringRef}>
        {label}
      </div>
    </div>
  )
}
