// src/components/StickyRing.tsx
import { useEffect, useRef } from 'react'
import { computeRingTarget, findStickyElement, ringIsSettled, stepRing, type RingState } from '../lib/stickyMorph'
import type { PortfolioTheme } from '../hooks/useTheme'

type Props = {
  theme: PortfolioTheme
  /** The ring hides over these areas (the hero already has its own brush cursor) unless a sticky element is hovered */
  hideWithin?: string
}

/** Global ring. Mount once near the app root. Never blocks the mouse. Mouse only. */
export function StickyRing({ theme, hideWithin = '.akif-canvas-stage' }: Props) {
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ring = ringRef.current
    if (!ring) return
    const noHover = window.matchMedia('(hover: none), (pointer: coarse)').matches
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (noHover) return

    let pointer = { x: -100, y: -100 }
    let target: RingState = { x: -100, y: -100, w: 34, h: 34, r: 17, stuck: false }
    let cur: RingState = { ...target }
    let raf = 0
    let seen = false

    const paint = () => {
      ring.style.width = `${cur.w.toFixed(1)}px`
      ring.style.height = `${cur.h.toFixed(1)}px`
      ring.style.borderRadius = `${cur.r.toFixed(1)}px`
      ring.style.transform = `translate3d(${(cur.x - cur.w / 2).toFixed(1)}px, ${(cur.y - cur.h / 2).toFixed(1)}px, 0)`
    }
    const frame = () => {
      raf = 0
      cur = reduce ? { ...target } : stepRing(cur, target)
      paint()
      if (!ringIsSettled(cur, target)) raf = requestAnimationFrame(frame)
    }
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame)
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      pointer = { x: e.clientX, y: e.clientY }
      const el = findStickyElement(e.target)
      const overHidden = !el && (e.target as Element | null)?.closest?.(hideWithin)
      target = computeRingTarget(pointer, el)
      if (!seen) {
        cur = { ...target }
        seen = true
      }
      ring.dataset.stuck = el ? 'true' : 'false'
      ring.style.opacity = overHidden ? '0' : '1'
      kick()
    }
    const onLeave = () => {
      ring.style.opacity = '0'
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [hideWithin])

  const color = theme === 'dark' ? '237,231,217' : '32,51,89'
  return (
    <div
      ref={ringRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: 34,
        height: 34,
        borderRadius: 17,
        border: `1.5px solid rgba(${color},0.75)`,
        background: `rgba(${color},0.04)`,
        pointerEvents: 'none',
        opacity: 0,
        zIndex: 9998,
        transition: 'opacity 0.2s ease, border-color 0.2s ease, background 0.2s ease',
        willChange: 'transform, width, height',
      }}
    />
  )
}
