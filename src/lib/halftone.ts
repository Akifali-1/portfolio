/**
 * Shared halftone helpers. Used by the hero name and the relation graph so the
 * whole site reads as one dot system. Square-root-free, no glow, no blur.
 */

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp((x - edge0) / (edge1 - edge0 || 1), 0, 1)
  return t * t * (3 - 2 * t)
}

export type Dot = { x: number; y: number; r: number }

/** Dots for a soft disc, radius falls off from the centre. Used for graph nodes. */
export function discHalftone(radius: number, spacing: number): Dot[] {
  const dots: Dot[] = []
  const rowStep = spacing * 0.866
  const rMax = spacing * 0.5 * 0.94
  for (let row = -Math.ceil(radius / rowStep), y = row * rowStep; y <= radius; row++, y = row * rowStep) {
    const offset = Math.abs(row) % 2 ? spacing / 2 : 0
    for (let x = -radius + offset; x <= radius; x += spacing) {
      const d = Math.hypot(x, y)
      if (d > radius) continue
      const t = 1 - d / radius
      const r = rMax * (0.55 + 0.45 * smoothstep(0, 0.3, t))
      if (r < 0.28) continue
      dots.push({ x, y, r })
    }
  }
  return dots
}

export function setupCanvas(canvas: HTMLCanvasElement, cssW: number, cssH: number) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.max(1, Math.round(cssW * dpr))
  canvas.height = Math.max(1, Math.round(cssH * dpr))
  canvas.style.width = `${cssW}px`
  canvas.style.height = `${cssH}px`
  const ctx = canvas.getContext('2d')!
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return ctx
}
