/**
 * Shared halftone helpers. Used by the hero name and the relation graph so the
 * whole site reads as one dot system. Square-root-free, no glow, no blur.
 */

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
export const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp((x - edge0) / (edge1 - edge0 || 1), 0, 1)
  return t * t * (3 - 2 * t)
}

const SQ2 = Math.SQRT2

/** Chamfer distance transform. Distance in pixels to the nearest `source` pixel. */
function chamfer(w: number, h: number, isSource: (i: number) => boolean): Float32Array {
  const INF = 1e9
  const d = new Float32Array(w * h)
  for (let i = 0; i < d.length; i++) d[i] = isSource(i) ? 0 : INF
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x
      let v = d[i]
      if (v === 0) continue
      if (x > 0) v = Math.min(v, d[i - 1] + 1)
      if (y > 0) {
        v = Math.min(v, d[i - w] + 1)
        if (x > 0) v = Math.min(v, d[i - w - 1] + SQ2)
        if (x < w - 1) v = Math.min(v, d[i - w + 1] + SQ2)
      }
      d[i] = v
    }
  }
  for (let y = h - 1; y >= 0; y--) {
    for (let x = w - 1; x >= 0; x--) {
      const i = y * w + x
      let v = d[i]
      if (v === 0) continue
      if (x < w - 1) v = Math.min(v, d[i + 1] + 1)
      if (y < h - 1) {
        v = Math.min(v, d[i + w] + 1)
        if (x < w - 1) v = Math.min(v, d[i + w + 1] + SQ2)
        if (x > 0) v = Math.min(v, d[i + w - 1] + SQ2)
      }
      d[i] = v
    }
  }
  return d
}

/** Signed distance field from an alpha mask. Positive inside, negative outside, in pixels. */
export function signedDistance(alpha: Uint8ClampedArray, w: number, h: number): Float32Array {
  const inside = (i: number) => alpha[i * 4 + 3] > 127
  const toOutside = chamfer(w, h, (i) => !inside(i))
  const toInside = chamfer(w, h, (i) => inside(i))
  const out = new Float32Array(w * h)
  for (let i = 0; i < out.length; i++) out[i] = inside(i) ? toOutside[i] : -toInside[i]
  return out
}

export type Dot = { x: number; y: number; r: number }

/**
 * Build halftone dots for a text string. Dot radius grows with how deep the dot
 * sits inside the glyph, so edges are soft and the core is dense.
 */
export function textHalftone(
  text: string,
  width: number,
  fontFamily: string,
  fontWeight: number,
  spacing: number,
): { dots: Dot[]; width: number; height: number } {
  const probe = document.createElement('canvas').getContext('2d')!
  probe.font = `${fontWeight} 100px ${fontFamily}`
  const m = probe.measureText(text)
  const fontSize = (100 * (width * 0.97 - spacing * 2)) / Math.max(m.width, 1)
  probe.font = `${fontWeight} ${fontSize}px ${fontFamily}`
  const mm = probe.measureText(text)
  const ascent = mm.actualBoundingBoxAscent
  const descent = mm.actualBoundingBoxDescent
  const pad = Math.ceil(spacing * 2 + fontSize * 0.03)
  const w = Math.ceil(width)
  const h = Math.ceil(ascent + descent + pad * 2)

  const mask = document.createElement('canvas')
  mask.width = w
  mask.height = h
  const mctx = mask.getContext('2d', { willReadFrequently: true })!
  mctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
  mctx.textBaseline = 'alphabetic'
  mctx.fillStyle = '#fff'
  mctx.strokeStyle = '#fff'
  mctx.lineJoin = 'round'
  mctx.lineWidth = fontSize * 0.045
  mctx.fillText(text, (w - mm.width) / 2, pad + ascent)
  mctx.strokeText(text, (w - mm.width) / 2, pad + ascent)
  const image = mctx.getImageData(0, 0, w, h)
  const sd = signedDistance(image.data, w, h)

  const rMax = spacing * 0.5 * 0.98
  const softOutside = spacing * 0.35
  const depthCap = spacing * 2.6
  const rowStep = spacing * 0.866
  const dots: Dot[] = []
  for (let row = 0, y = rowStep / 2; y < h; row++, y += rowStep) {
    const offset = row % 2 ? spacing / 2 : 0
    for (let x = offset + spacing / 2; x < w; x += spacing) {
      const px = Math.min(w - 1, Math.max(0, Math.round(x)))
      const py = Math.min(h - 1, Math.max(0, Math.round(y)))
      const s = sd[py * w + px]
      if (s < -softOutside) continue
      const t = smoothstep(-softOutside, depthCap, s)
      const r = rMax * (0.22 + 0.78 * t)
      if (r < 0.3) continue
      dots.push({ x, y, r })
    }
  }
  return { dots, width: w, height: h }
}

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



export type Stipple = {
  count: number
  hx: Float32Array
  hy: Float32Array
  size: Float32Array
  width: number
  height: number
}

/**
 * Stipple points for text: jittered, dense inside the glyphs, sparse "dust"
 * outside the edge. Dot size grows with depth inside the letter.
 */
export function textStipple(
  text: string,
  width: number,
  fontFamily: string,
  fontWeight: number,
  pitch: number,
): Stipple {
  const probe = document.createElement('canvas').getContext('2d')!
  probe.font = `${fontWeight} 100px ${fontFamily}`
  const base = probe.measureText(text)
  const fontSize = (100 * width * 0.9) / Math.max(base.width, 1)
  probe.font = `${fontWeight} ${fontSize}px ${fontFamily}`
  const mm = probe.measureText(text)
  const ascent = mm.actualBoundingBoxAscent
  const descent = mm.actualBoundingBoxDescent
  const dust = pitch * 9
  const pad = Math.ceil(dust + fontSize * 0.03)
  const w = Math.ceil(width)
  const h = Math.ceil(ascent + descent + pad * 2)

  const mask = document.createElement('canvas')
  mask.width = w
  mask.height = h
  const mctx = mask.getContext('2d', { willReadFrequently: true })!
  mctx.clearRect(0, 0, w, h)
  mctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
  mctx.textBaseline = 'alphabetic'
  mctx.fillStyle = '#fff'
  mctx.strokeStyle = '#fff'
  mctx.lineJoin = 'round'
  mctx.lineWidth = fontSize * 0.03
  const x0 = (w - mm.width) / 2
  mctx.fillText(text, x0, pad + ascent)
  mctx.strokeText(text, x0, pad + ascent)
  const sd = signedDistance(mctx.getImageData(0, 0, w, h).data, w, h)

  let seed = 11
  const rnd = () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
  const depthCap = pitch * 5
  const xs: number[] = []
  const ys: number[] = []
  const sz: number[] = []
  const margin = Math.max(4, pitch * 2.5)
  for (let y = margin; y < h - margin; y += pitch) {
    for (let x = margin; x < w - margin; x += pitch) {
      const jx = x + (rnd() - 0.5) * pitch * 0.9
      const jy = y + (rnd() - 0.5) * pitch * 0.9
      const gx = Math.min(w - 2, Math.max(1, Math.round(jx)))
      const gy = Math.min(h - 2, Math.max(1, Math.round(jy)))
      const s = sd[gy * w + gx]
      let keep = 0
      let size = 0
      if (s >= 0) {
        const t = smoothstep(0, depthCap, s)
        keep = 0.8 + 0.2 * t
        size = 1 + 0.9 * t
      } else if (s > -dust) {
        const f = 1 + s / dust
        keep = f * f * 0.45
        size = 0.8 + 0.6 * f
      } else {
        continue
      }
      if (rnd() > keep) continue
      xs.push(jx)
      ys.push(jy)
      sz.push(size)
    }
  }
  return {
    count: xs.length,
    hx: new Float32Array(xs),
    hy: new Float32Array(ys),
    size: new Float32Array(sz),
    width: w,
    height: h,
  }
}
