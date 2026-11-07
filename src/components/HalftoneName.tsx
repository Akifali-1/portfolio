import { useEffect, useRef } from 'react'
import { clamp, setupCanvas, textStipple } from '../lib/halftone'

type HalftoneNameProps = {
  text: string
  /** Start the gather intro when true (pass `booted` from the hero). */
  active: boolean
  reducedMotion: boolean
  /** Dot pitch in CSS px. Smaller = denser. Auto when omitted. */
  spacing?: number
}

const FONT = '"Space Grotesk", Arial, sans-serif'
const RADIUS = 120 // cursor influence radius in px
const SPRING = 0.075 // pull back to home
const DAMP = 0.84 // velocity damping
const PUSH = 2.8 // repel strength
const SWIRL = 0.9 // sideways distortion strength

export function HalftoneName({ text, active, reducedMotion, spacing }: HalftoneNameProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const activeRef = useRef(active)
  activeRef.current = active

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return

    let count = 0
    let hx: Float32Array = new Float32Array(0)
    let hy: Float32Array = new Float32Array(0)
    let size: Float32Array = new Float32Array(0)
    let px = new Float32Array(0)
    let py = new Float32Array(0)
    let vx = new Float32Array(0)
    let vy = new Float32Array(0)
    let delay = new Float32Array(0)
    let maxDelay = 0
    let ctx: CanvasRenderingContext2D | null = null
    let cssW = 0
    let cssH = 0
    let frame = 0
    let waitFrame = 0
    let visible = true
    let disposed = false
    let introStart = 0
    let last = 0
    const pointer = { x: -9999, y: -9999, inside: false }

    const draw = (elapsed: number) => {
      if (!ctx) return
      ctx.clearRect(0, 0, cssW, cssH)
      ctx.fillStyle = '#f3f3f0'
      ctx.beginPath()
      for (let i = 0; i < count; i++) {
        if (!reducedMotion && elapsed < delay[i]) continue
        const s = size[i]
        ctx.rect(px[i] - s / 2, py[i] - s / 2, s, s)
      }
      ctx.fill()
    }

    const tick = (now: number) => {
      frame = 0
      if (!visible) return
      const dt = last ? Math.min(now - last, 40) : 16.7
      last = now
      const k = dt / 16.7
      const elapsed = (now - introStart) / 1000
      const R2 = RADIUS * RADIUS
      let energy = 0
      for (let i = 0; i < count; i++) {
        if (elapsed < delay[i]) continue
        let ax = (hx[i] - px[i]) * SPRING
        let ay = (hy[i] - py[i]) * SPRING
        if (pointer.inside) {
          const dx = px[i] - pointer.x
          const dy = py[i] - pointer.y
          const d2 = dx * dx + dy * dy
          if (d2 < R2) {
            const d = Math.sqrt(d2) || 1
            const f = (1 - d / RADIUS) ** 2
            ax += (dx / d) * f * PUSH - (dy / d) * f * SWIRL
            ay += (dy / d) * f * PUSH + (dx / d) * f * SWIRL
          }
        }
        vx[i] = (vx[i] + ax * k) * DAMP
        vy[i] = (vy[i] + ay * k) * DAMP
        px[i] += vx[i] * k
        py[i] += vy[i] * k
        energy += Math.abs(vx[i]) + Math.abs(vy[i]) + Math.abs(hx[i] - px[i]) + Math.abs(hy[i] - py[i])
      }
      draw(elapsed)
      if (pointer.inside || elapsed < maxDelay + 0.1 || energy > count * 0.06) {
        frame = requestAnimationFrame(tick)
      } else {
        last = 0
      }
    }

    const kick = () => {
      if (!frame && visible && !reducedMotion && introStart) frame = requestAnimationFrame(tick)
    }

    const build = async () => {
      try {
        await document.fonts.load(`700 120px ${FONT}`)
      } catch {
        // Use whatever font is available.
      }
      if (disposed) return
      const width = Math.floor(wrap.clientWidth)
      if (width < 40) return
      const pitch = spacing ?? clamp(width / 285, 2, 2.8)
      const s = textStipple(text, width, FONT, 700, pitch)
      count = s.count
      hx = s.hx
      hy = s.hy
      size = s.size
      cssW = s.width
      cssH = s.height
      px = new Float32Array(count)
      py = new Float32Array(count)
      vx = new Float32Array(count)
      vy = new Float32Array(count)
      delay = new Float32Array(count)
      maxDelay = 0
      const settled = reducedMotion || introStart > 0
      for (let i = 0; i < count; i++) {
        if (settled) {
          px[i] = hx[i]
          py[i] = hy[i]
          delay[i] = 0
        } else {
          px[i] = hx[i] + (Math.random() - 0.5) * cssW * 0.5
          py[i] = hy[i] + (Math.random() - 0.5) * cssH * 1.8
          delay[i] = (hx[i] / cssW) * 0.7 + Math.random() * 0.35
          if (delay[i] > maxDelay) maxDelay = delay[i]
        }
      }
      ctx = setupCanvas(canvas, cssW, cssH)
      wrap.style.aspectRatio = `${cssW} / ${cssH}`
      draw(settled ? 999 : -1)
    }

    const waitForActive = () => {
      if (disposed) return
      if (activeRef.current && count) {
        introStart = performance.now()
        last = 0
        kick()
        return
      }
      waitFrame = requestAnimationFrame(waitForActive)
    }

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      const rect = canvas.getBoundingClientRect()
      const sx = rect.width ? cssW / rect.width : 1
      pointer.x = (event.clientX - rect.left) * sx
      pointer.y = (event.clientY - rect.top) * sx
      pointer.inside = true
      kick()
    }
    const onLeave = () => {
      pointer.inside = false
      kick()
    }

    const ro = new ResizeObserver(() => {
      void build()
    })
    ro.observe(wrap)
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) kick()
    })
    io.observe(wrap)
    if (!reducedMotion) {
      wrap.addEventListener('pointermove', onMove)
      wrap.addEventListener('pointerleave', onLeave)
      waitFrame = requestAnimationFrame(waitForActive)
    }

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      cancelAnimationFrame(waitFrame)
      ro.disconnect()
      io.disconnect()
      wrap.removeEventListener('pointermove', onMove)
      wrap.removeEventListener('pointerleave', onLeave)
    }
  }, [text, reducedMotion, spacing])

  return (
    <div ref={wrapRef} className="halftone-name">
      <canvas ref={canvasRef} aria-hidden="true" />
    </div>
  )
}
