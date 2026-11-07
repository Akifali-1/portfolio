import { useEffect, useRef } from 'react'
import { setupCanvas } from '../lib/halftone'

type LorenzProps = { reducedMotion: boolean }

const SIGMA = 10
const RHO = 28
const BETA = 8 / 3
const DT = 0.0038
const TRAIL = 1600
const STEPS_PER_FRAME = 4
const RECORD_EVERY = 2
const BANDS = 16
const COLORS = ['77, 124, 255', '124, 92, 255', '243, 243, 240']

// Cursor interaction physics matching HalftoneName
const RADIUS = 125
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
    styles.push(`rgba(${color}, ${(0.08 + 0.92 * u * u).toFixed(3)})`)
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

// RK2 Midpoint integration step of the Lorenz system
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

    // Seed particles across both wings for immediate symmetry
    const particles = [
      makeParticle(-8.2, -8.5, 25.0, COLORS[0]),
      makeParticle(8.2, 8.5, 25.0, COLORS[1]),
      makeParticle(0.8, -1.1, 21.0, COLORS[2]),
    ]
    let ctx: CanvasRenderingContext2D | null = null
    let w = 0
    let h = 0
    let frame = 0
    let visible = true
    let lastTime = 0
    const pointer = { x: -9999, y: -9999, inside: false }

    // Warm up attractor onto the manifold and populate full trail
    for (let i = 0; i < 1000; i++) for (const p of particles) advance(p)
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

      // -0.68 rad (~-39 deg) opens the x=y diagonal butterfly wings perpendicular to camera
      const baseAngle = -0.68
      const sway = reducedMotion ? baseAngle : baseAngle + Math.sin(time * 0.00032) * 0.24
      const ca = Math.cos(sway)
      const sa = Math.sin(sway)

      // 3D pitch tilt to give volumetric separation between upper and lower trajectories
      const pitch = 0.22
      const cp = Math.cos(pitch)
      const sp = Math.sin(pitch)

      const scale = Math.min(w / 48, h / 50)
      const cx = w * 0.5
      const cy = h * 0.48
      const R2 = RADIUS * RADIUS
      const live = pointer.inside && !reducedMotion

      for (const p of particles) {
        if (p.count < 2) continue
        const first = p.count < TRAIL ? 0 : p.head

        for (let b = 0; b < BANDS; b++) {
          const from = Math.floor((b / BANDS) * p.count)
          const to = Math.floor(((b + 1) / BANDS) * p.count)
          const baseRadius = 0.55 + ((b + 1) / BANDS) * 1.15
          c.fillStyle = p.styles[b]
          c.beginPath()

          for (let j = from; j < to; j++) {
            const idx = (first + j) % TRAIL
            const x = p.xs[idx]
            const y = p.ys[idx]
            const z = p.zs[idx] - 25.0 // True geometric Z centroid of Lorenz butterfly

            // 3D rotation: yaw around Z (sway), then pitch around X
            const rx = x * ca - y * sa
            const depthY = x * sa + y * ca
            const ry = z * cp - depthY * sp
            const rz = z * sp + depthY * cp

            const persp = 1 / (1 - rz * 0.0085)
            const bx = cx + rx * scale * persp
            const by = cy - ry * scale * persp

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

            const depthScale = Math.max(0.6, Math.min(1.4, persp))
            const r = baseRadius * depthScale
            c.moveTo(bx + ox + r, by + oy)
            c.arc(bx + ox, by + oy, r, 0, Math.PI * 2)
          }
          c.fill()
        }

        // Bright leading head bead
        const hi = (p.head - 1 + TRAIL) % TRAIL
        const hx = p.xs[hi]
        const hy = p.ys[hi]
        const hz = p.zs[hi] - 25.0
        const hrx = hx * ca - hy * sa
        const hDepthY = hx * sa + hy * ca
        const hry = hz * cp - hDepthY * sp
        const hrz = hz * sp + hDepthY * cp
        const hp = 1 / (1 - hrz * 0.0085)

        c.fillStyle = `rgb(${p.color})`
        c.beginPath()
        c.arc(
          cx + hrx * scale * hp + p.ox[hi],
          cy - hry * scale * hp + p.oy[hi],
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
