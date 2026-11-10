// File: src/components/CustomCursor.tsx
import { useEffect, useRef, useState } from 'react'

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const [label, setLabel] = useState('')
  const [visible, setVisible] = useState(false)
  const [inHeroFluid, setInHeroFluid] = useState(false)

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
      setVisible(true)

      const targetEl = event.target instanceof Element ? event.target : null
      const element = targetEl?.closest<HTMLElement>('a, button, [data-cursor]')
      setLabel(element?.dataset.cursor ?? '')

      const insideHero = Boolean(targetEl?.closest('.hero'))
      const insideHalftone = Boolean(targetEl?.closest('.halftone-name'))
      setInHeroFluid(insideHero && !insideHalftone)

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

  return (
    <div
      className={`cursor-layer ${visible ? 'is-visible' : ''} ${inHeroFluid ? 'is-hero-pointer' : ''}`}
      aria-hidden="true"
    >
      <div className="cursor-dot" ref={dotRef}>
        <svg
          className="cursor-hero-arrow"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.5 3.5L19.5 11.2L12.2 13.4L9.2 20.5L4.5 3.5Z"
            fill="rgba(5, 5, 5, 0.72)"
            stroke="#F2F2F2"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className={`cursor-ring ${label ? 'has-label' : ''}`} ref={ringRef}>
        {label}
      </div>
    </div>
  )
}
