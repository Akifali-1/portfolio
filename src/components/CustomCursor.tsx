import { useEffect, useRef, useState } from 'react'

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const [label, setLabel] = useState('')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const dot = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring || window.matchMedia('(pointer: coarse)').matches) return

    let targetX = -100
    let targetY = -100
    let currentX = targetX
    let currentY = targetY
    let frame = 0
    const move = (event: PointerEvent) => {
      targetX = event.clientX
      targetY = event.clientY
      setVisible(true)
      const element = (event.target as HTMLElement).closest<HTMLElement>('a, button, [data-cursor]')
      setLabel(element?.dataset.cursor ?? '')
    }
    const leave = () => setVisible(false)
    const animate = () => {
      currentX += (targetX - currentX) * 0.16
      currentY += (targetY - currentY) * 0.16
      dot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`
      ring.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`
      frame = window.requestAnimationFrame(animate)
    }
    window.addEventListener('pointermove', move)
    document.documentElement.addEventListener('mouseleave', leave)
    frame = window.requestAnimationFrame(animate)
    return () => {
      window.removeEventListener('pointermove', move)
      document.documentElement.removeEventListener('mouseleave', leave)
      window.cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div className={`cursor-layer ${visible ? 'is-visible' : ''}`} aria-hidden="true">
      <div className="cursor-dot" ref={dotRef} />
      <div className={`cursor-ring ${label ? 'has-label' : ''}`} ref={ringRef}>
        {label}
      </div>
    </div>
  )
}
