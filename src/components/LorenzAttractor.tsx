import { useEffect, useRef } from 'react'
import { setupCanvas } from '../lib/halftone'

type LorenzProps = { reducedMotion: boolean }

const SIGMA = 10
const RHO = 28
const BETA = 8 / 3
type V3 = [number, number, number]

function deriv(p: V3): V3 {
  return [SIGMA * (p[1] - p[0]), p[0] * (RHO - p[2]) - p[1], p[0] * p[1] - BETA * p[2]]
}
function rk4(p: V3, dt: number): V3 {
  const k1 = deriv(p)
  const k2 = deriv([p[0] + (dt / 2) * k1[0], p[1] + (dt / 2) * k1[1], p[2] + (dt / 2) * k1[2]])
  const k3 = deriv([p[0] + (dt / 2) * k2[0], p[1] + (dt / 2) * k2[1], p[2] + (dt / 2) * k2[2]])
  const k4 = deriv([p[0] + dt * k3[0], p[1] + dt * k3[1], p[2] + dt * k3[2]])
  return [
    p[0] + (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]),
    p[1] + (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]),
    p[2] + (dt / 6) * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]),
  ]
}

const TRAIL = 2200 // beads kept
const SPACING = 0.85 // distance between beads in Lorenz units
const SUBSTEPS = 4 // integration steps per frame (speed)
const DT = 0.007
const BANDS = 14 // age bands for colour and size
const mix = (a: number, b: number, t: number) => a + (b - a) * t

function bandColor(u: number): string {
  // dark navy (old) -> site blue -> light blue (newest)
  const alpha = 0.45 + 0.55 * u
  if (u < 0.8) {
    const t = u / 0.8
    return `rgba(${mix(24, 77, t) | 0},${mix(38, 124, t) | 0},${mix(88, 255, t) | 0},${alpha})`
  }
  const t = (u - 0.8) / 0.2
  return `rgba(${mix(77, 170, t) | 0},${mix(124, 195, t) | 0},${mix(255, 255, t) | 0},${alpha})`
}

export function LorenzAttractor({ reducedMotion }: LorenzProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return

    const tx = new Float32Array(TRAIL)
    const ty = new Float32Array(TRAIL)
    const tz = new Float32Array(TRAIL)
    let head = 0
    let count = 0
    let p: V3 = [0.1, 0, 0]
    for (let i = 0; i < 600; i++) p = rk4(p, 0.006)
    let lastBead: V3 = p

    const advance = (steps: number) => {
      for (let s = 0; s < steps; s++) {
        p = rk4(p, DT)
        const d = Math.hypot(p[0] - lastBead[0], p[1] - lastBead[1], p[2] - lastBead[2])
        if (d >= SPACING) {
          tx[head] = p[0]
          ty[head] = p[1]
          tz[head] = p[2]
          head = (head + 1) % TRAIL
          count = Math.min(count + 1, TRAIL)
          lastBead = p
        }
      }
    }
    // Prefill so a full trail is visible immediately.
    for (let guard = 0; count < TRAIL && guard < 80000; guard++) advance(1)

    let ctx: CanvasRenderingContext2D | null = null
    let w = 0
    let h = 0
    let frame = 0
    let visible = true

    const draw = (time: number) => {
      if (!ctx) return
      ctx.clearRect(0, 0, w, h)
      const scale = Math.min(w / 46, h / 56)
      const a = reducedMotion ? 0 : Math.sin(time * 0.00012) * 0.22
      const ca = Math.cos(a)
      const sa = Math.sin(a)
      const cx = w / 2
      const cy = h / 2
      for (let b = 0; b < BANDS; b++) {
        const from = Math.floor((b / BANDS) * count)
        const to = Math.floor(((b + 1) / BANDS) * count)
        const u = b / (BANDS - 1)
        const size = 1.1 + u * 1.5
        ctx.fillStyle = bandColor(u)
        ctx.beginPath()
        for (let k = from; k < to; k++) {
          const idx = (head - count + k + TRAIL * 2) % TRAIL
          const x = tx[idx]
          const y = ty[idx]
          const z = tz[idx] - 25
          const rx = x * ca - y * sa
          const depth = x * sa + y * ca
          const persp = 1 + depth * 0.01
          ctx.rect(cx + rx * scale * persp - size / 2, cy - z * scale * persp - size / 2, size, size)
        }
        ctx.fill()
      }
      // Head: white dot at the newest bead.
      const hi = (head - 1 + TRAIL) % TRAIL
      const hxr = tx[hi] * ca - ty[hi] * sa
      const hd = tx[hi] * sa + ty[hi] * ca
      const hp = 1 + hd * 0.01
      ctx.fillStyle = '#f3f3f0'
      ctx.beginPath()
      ctx.arc(cx + hxr * scale * hp, cy - (tz[hi] - 25) * scale * hp, 2.8, 0, Math.PI * 2)
      ctx.fill()
    }

    const tick = (now: number) => {
      frame = 0
      if (!visible) return
      advance(SUBSTEPS)
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
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)
    resize()

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible && !reducedMotion && !frame) frame = requestAnimationFrame(tick)
    })
    io.observe(wrap)
    if (!reducedMotion) frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      ro.disconnect()
      io.disconnect()
    }
  }, [reducedMotion])

  return (
    <div ref={wrapRef} className="hero-lorenz" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  )
}
