import { useEffect, useRef } from 'react'
import { setupCanvas } from '../lib/halftone'

type LorenzProps = { reducedMotion: boolean }

const SIGMA = 10
const RHO = 28
const BETA = 8 / 3
const DT = 0.006
const TRAIL = 1400
const STEPS_PER_FRAME = 6
const RECORD_EVERY = 3
const BANDS = 14
const COLORS = ['77, 124, 255', '124, 92, 255', '243, 243, 240']

// Same cursor feel as the AKIF dots.
const RADIUS = 120
const SPRING = 0.075
const DAMP = 0.84
const PUSH = 2.8
const SWIRL = 0.9

type Particle = {
  x: number
  y: number
  z: number
  xs: Float32Array
  ys: Float32Array
  zs: Float32Array
  ox: Float32Array
  oy: Float32Array
  vx: Float32Array
  vy: Float32Array
  head: number
  count: number
  color: string
  styles: string[]
}

function makeParticle(x: number, y: number, z: number, color: string): Particle {
  const styles: string[] = []
  for (let b = 0; b < BANDS; b++) {
    const u = (b + 1) / BANDS
    styles.push(`rgba(${color}, ${(0.1 + 0.9 * u * u).toFixed(3)})`)
  }
  return {
    x,
    y,
    z,
    xs: new Float32Array(TRAIL),
    ys: new Float32Array(TRAIL),
    zs: new Float32Array(TRAIL),
    ox: new Float32Array(TRAIL),
    oy: new Float32Array(TRAIL),
    vx: new Float32Array(TRAIL),
    vy: new Float32Array(TRAIL),
    head: 0,
    count: 0,
    color,
    styles,
  }
}

// Midpoint (RK2) step of the Lorenz system.
function advance(p: Particle) {
  const k1x = SIGMA * (p.y - p.x)
  const k1y = p.x * (RHO - p.z) - p.y
  const k1z = p.x * p.y - BETA * p.z
  const mx = p.x + k1x * DT * 0.5
  const my = p.y + k1y * DT * 0.5
  const mz = p.z + k1z * DT * 0.5
  p.x += SIGMA * (my - mx) * DT
  p.y += (mx * (RHO - mz) - my) * DT
  p.z += (mx * my - BETA * mz) * DT
}

function record(p: Particle) {
  const i = p.head
  p.xs[i] = p.x
  p.ys[i] = p.y
  p.zs[i] = p.z
  p.ox[i] = 0
  p.oy[i] = 0
  p.vx[i] = 0
  p.vy[i] = 0
  p.head = (i + 1) % TRAIL
  if (p.count < TRAIL) p.count += 1
}

export function LorenzAttractor({ reducedMotion }: LorenzProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return

    const particles = [
      makeParticle(1, 1, 1, COLORS[0]),
      makeParticle(1.01, 1, 1, COLORS[1]),
      makeParticle(1, 1.01, 1, COLORS[2]),
    ]

    let ctx: CanvasRenderingContext2D | null = null
    let w = 0
    let h = 0
    let frame = 0
    let visible = true
    let lastTime = 0
    const pointer = { x: -9999, y: -9999, inside: false }

    // Warm up so the full butterfly exists before the first paint.
    for (let i = 0; i < 1200; i++) for (const p of particles) advance(p)
    for (let i = 0; i < TRAIL * RECORD_EVERY; i++) {
      for (const p of particles) {
        advance(p)
        if (i % RECORD_EVERY === 0) record(p)
      }
    }

    const draw = (time: number) => {
      const c = ctx
      if (!c) return
      const k = lastTime ? Math.min((time - lastTime) / 16.7, 2.5) : 1
      lastTime = time
      c.clearRect(0, 0, w, h)

      const scale = Math.min(w / 46, h / 62)
      const sway = reducedMotion ? 0 : Math.sin(time * 0.00018) * 0.18
      const ca = Math.cos(sway)
      const sa = Math.sin(sway)
      const cx = w / 2
      const cy = h * 0.46
      const R2 = RADIUS * RADIUS
      const live = pointer.inside && !reducedMotion

      for (const p of particles) {
        if (p.count < 2) continue
        const first = p.count < TRAIL ? 0 : p.head
        for (let b = 0; b < BANDS; b++) {
          const from = Math.floor((b / BANDS) * p.count)
          const to = Math.floor(((b + 1) / BANDS) * p.count)
          const r = 0.6 + ((b + 1) / BANDS) * 1.2
          c.fillStyle = p.styles[b]
          c.beginPath()
          for (let j = from; j < to; j++) {
            const idx = (first + j) % TRAIL
            const x = p.xs[idx]
            const y = p.ys[idx]
            const persp = 1 + (x * sa + y * ca) * 0.012
            const bx = cx + (x * ca - y * sa) * scale * persp
            const by = cy - (p.zs[idx] - 28) * scale * persp

            let ox = p.ox[idx]
            let oy = p.oy[idx]
            let vx = p.vx[idx]
            let vy = p.vy[idx]
            if (live) {
              const dx = bx + ox - pointer.x
              const dy = by + oy - pointer.y
              const d2 = dx * dx + dy * dy
              if (d2 < R2) {
                const d = Math.sqrt(d2) || 1
                const f = (1 - d / RADIUS) ** 2
                vx += (dx / d) * f * PUSH - (dy / d) * f * SWIRL
                vy += (dy / d) * f * PUSH + (dx / d) * f * SWIRL
              }
            }
            vx = (vx - ox * SPRING * k) * DAMP
            vy = (vy - oy * SPRING * k) * DAMP
            ox += vx * k
            oy += vy * k
            p.ox[idx] = ox
            p.oy[idx] = oy
            p.vx[idx] = vx
            p.vy[idx] = vy

            c.moveTo(bx + ox + r, by + oy)
            c.arc(bx + ox, by + oy, r, 0, Math.PI * 2)
          }
          c.fill()
        }

        // Head dot at the newest bead.
        const hi = (p.head - 1 + TRAIL) % TRAIL
        const hx = p.xs[hi]
        const hy = p.ys[hi]
        const hp = 1 + (hx * sa + hy * ca) * 0.012
        c.fillStyle = `rgb(${p.color})`
        c.beginPath()
        c.arc(
          cx + (hx * ca - hy * sa) * scale * hp + p.ox[hi],
          cy - (p.zs[hi] - 28) * scale * hp + p.oy[hi],
          2.6,
          0,
          Math.PI * 2,
        )
        c.fill()
      }
    }

    const tick = (now: number) => {
      frame = 0
      if (!visible) return
      for (let s = 0; s < STEPS_PER_FRAME; s++) {
        for (const p of particles) {
          advance(p)
          if (s % RECORD_EVERY === 0) record(p)
        }
      }
      draw(now)
      frame = requestAnimationFrame(tick)
    }

    const resize = () => {
      const rect = wrap.getBoundingClientRect()
      w = Math.floor(rect.width)
      h = Math.floor(rect.height)
      if (w < 20 || h < 20) return
      ctx = setupCanvas(canvas, w, h)
      draw(performance.now())
    }

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      const rect = canvas.getBoundingClientRect()
      pointer.x = event.clientX - rect.left
      pointer.y = event.clientY - rect.top
      pointer.inside = true
    }
    const onLeave = () => {
      pointer.inside = false
    }

    const ro = new ResizeObserver(resize)
    ro.observe(wrap)
    resize()

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible && !reducedMotion && !frame) frame = requestAnimationFrame(tick)
    })
    io.observe(wrap)

    if (!reducedMotion) {
      wrap.addEventListener('pointermove', onMove)
      wrap.addEventListener('pointerleave', onLeave)
      frame = requestAnimationFrame(tick)
    }

    return () => {
      cancelAnimationFrame(frame)
      ro.disconnect()
      io.disconnect()
      wrap.removeEventListener('pointermove', onMove)
      wrap.removeEventListener('pointerleave', onLeave)
    }
  }, [reducedMotion])

  return (
    <div ref={wrapRef} className="hero-lorenz" aria-hidden="true">
      <canvas ref={canvasRef} />
      <div className="lorenz-readout mono-label">
        <span>LORENZ SYSTEM</span>
        <span>σ 10.00 · β 2.667 · ρ 28.00</span>
        <span>MOVE THE CURSOR THROUGH THE DOTS</span>
      </div>
    </div>
  )
}
