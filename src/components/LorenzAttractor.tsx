import { useEffect, useRef } from 'react'
import { clamp, setupCanvas } from '../lib/halftone'

type LorenzProps = { reducedMotion: boolean }

const SIGMA = 10
const BETA = 8 / 3
const RHO_DEFAULT = 28
const RHO_MIN = 25
const RHO_MAX = 36
const DT = 0.006
const TRAIL = 1500
const STEPS_PER_FRAME = 6
const CHUNK = 30
const COLORS = ['77, 124, 255', '124, 92, 255', '243, 243, 240']

type Particle = {
  x: number
  y: number
  z: number
  xs: Float32Array
  ys: Float32Array
  zs: Float32Array
  head: number
  count: number
  color: string
}

function makeParticle(x: number, y: number, z: number, color: string): Particle {
  return {
    x,
    y,
    z,
    xs: new Float32Array(TRAIL),
    ys: new Float32Array(TRAIL),
    zs: new Float32Array(TRAIL),
    head: 0,
    count: 0,
    color,
  }
}

// Midpoint (RK2) step of the Lorenz system.
function advance(p: Particle, rho: number) {
  const k1x = SIGMA * (p.y - p.x)
  const k1y = p.x * (rho - p.z) - p.y
  const k1z = p.x * p.y - BETA * p.z
  const mx = p.x + k1x * DT * 0.5
  const my = p.y + k1y * DT * 0.5
  const mz = p.z + k1z * DT * 0.5
  p.x += SIGMA * (my - mx) * DT
  p.y += (mx * (rho - mz) - my) * DT
  p.z += (mx * my - BETA * mz) * DT
}

function record(p: Particle) {
  p.xs[p.head] = p.x
  p.ys[p.head] = p.y
  p.zs[p.head] = p.z
  p.head = (p.head + 1) % TRAIL
  if (p.count < TRAIL) p.count += 1
}

export function LorenzAttractor({ reducedMotion }: LorenzProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rhoRef = useRef<HTMLElement>(null)

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
    let rho = RHO_DEFAULT
    let rhoTarget = RHO_DEFAULT
    let yaw = 0
    let yawTarget = 0
    let lastReadout = 0

    // Warm up so the full butterfly exists before the first paint.
    for (let i = 0; i < 1200; i++) for (const p of particles) advance(p, rho)
    for (let i = 0; i < TRAIL * 2; i++) {
      for (const p of particles) {
        advance(p, rho)
        if (i % 2 === 0) record(p)
      }
    }

    const draw = (time: number) => {
      const c = ctx
      if (!c) return
      c.clearRect(0, 0, w, h)
      c.lineCap = 'round'
      c.lineJoin = 'round'
      const scale = Math.min(w / 46, h / 62)
      const idle = reducedMotion ? 0 : Math.sin(time * 0.00018) * 0.18
      const angle = yaw + idle
      const ca = Math.cos(angle)
      const sa = Math.sin(angle)
      const cx = w / 2
      const cy = h * 0.46

      for (const p of particles) {
        if (p.count < 2) continue
        const first = p.count < TRAIL ? 0 : p.head
        for (let k = 0; k < p.count - 1; k += CHUNK) {
          const end = Math.min(k + CHUNK + 1, p.count)
          const age = k / p.count
          c.beginPath()
          for (let j = k; j < end; j++) {
            const idx = (first + j) % TRAIL
            const x = p.xs[idx]
            const y = p.ys[idx]
            const z = p.zs[idx]
            const depth = x * sa + y * ca
            const persp = 1 + depth * 0.012
            const px = cx + (x * ca - y * sa) * scale * persp
            const py = cy - (z - 28) * scale * persp
            if (j === k) c.moveTo(px, py)
            else c.lineTo(px, py)
          }
          c.strokeStyle = `rgba(${p.color}, ${(0.05 + 0.8 * age * age).toFixed(3)})`
          c.lineWidth = 0.7 + age * 1.3
          c.stroke()
        }
        const hi = (p.head - 1 + TRAIL) % TRAIL
        const hx = p.xs[hi]
        const hy = p.ys[hi]
        const hz = p.zs[hi]
        const hp = 1 + (hx * sa + hy * ca) * 0.012
        c.beginPath()
        c.fillStyle = `rgb(${p.color})`
        c.shadowColor = `rgb(${p.color})`
        c.shadowBlur = 16
        c.arc(cx + (hx * ca - hy * sa) * scale * hp, cy - (hz - 28) * scale * hp, 3, 0, Math.PI * 2)
        c.fill()
        c.shadowBlur = 0
      }
    }

    const tick = (now: number) => {
      frame = 0
      if (!visible) return
      rho += (rhoTarget - rho) * 0.05
      yaw += (yawTarget - yaw) * 0.05
      for (let s = 0; s < STEPS_PER_FRAME; s++) {
        for (const p of particles) {
          advance(p, rho)
          if (s % 2 === 0) record(p)
        }
      }
      draw(now)
      if (rhoRef.current && now - lastReadout > 120) {
        rhoRef.current.textContent = rho.toFixed(2)
        lastReadout = now
      }
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

    // Cursor x tunes rho (chaos strength), cursor y tilts the view.
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      const u = clamp(event.clientX / Math.max(1, window.innerWidth), 0, 1)
      const v = clamp(event.clientY / Math.max(1, window.innerHeight), 0, 1)
      rhoTarget = RHO_MIN + u * (RHO_MAX - RHO_MIN)
      yawTarget = (v - 0.5) * 0.6
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
      window.addEventListener('pointermove', onPointerMove, { passive: true })
      frame = requestAnimationFrame(tick)
    }

    return () => {
      cancelAnimationFrame(frame)
      ro.disconnect()
      io.disconnect()
      window.removeEventListener('pointermove', onPointerMove)
    }
  }, [reducedMotion])

  return (
    <div ref={wrapRef} className="hero-lorenz" aria-hidden="true">
      <canvas ref={canvasRef} />
      <div className="lorenz-readout mono-label">
        <span>LORENZ SYSTEM</span>
        <span>
          σ 10.00 · β 2.667 · ρ <b ref={rhoRef}>28.00</b>
        </span>
        <span>MOVE THE CURSOR TO TUNE ρ AND TILT</span>
      </div>
    </div>
  )
}
