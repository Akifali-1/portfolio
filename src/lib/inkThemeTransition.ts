// src/lib/inkThemeTransition.ts
// Ink-bleed theme switch using the View Transitions API.
// The NEW theme is revealed through an organic ink blot that grows from the click point.
// Falls back to an instant switch when unsupported or when reduced motion is on.

export type InkOrigin = { x: number; y: number }

type ViewTransitionLike = {
  ready: Promise<void>
  finished: Promise<void>
  skipTransition: () => void
}
type DocWithVT = Document & {
  startViewTransition?: (cb: () => void | Promise<void>) => ViewTransitionLike
}

const DURATION_MS = 1300
const EASING = 'cubic-bezier(0.5, 0.05, 0.3, 1)'

let running: ViewTransitionLike | null = null

/** Random lobed ink blot with rough edge and droplets. Solid core radius stays above ~27 of 50 units. */
function makeInkMaskUrl(): string {
  const n = 14
  const pts: Array<[number, number]> = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    const r = 30 + Math.random() * 18
    pts.push([50 + Math.cos(a) * r, 50 + Math.sin(a) * r])
  }
  const last = pts[n - 1]
  let d = `M ${((last[0] + pts[0][0]) / 2).toFixed(2)} ${((last[1] + pts[0][1]) / 2).toFixed(2)} `
  for (let i = 0; i < n; i++) {
    const p = pts[i]
    const q = pts[(i + 1) % n]
    d += `Q ${p[0].toFixed(2)} ${p[1].toFixed(2)} ${((p[0] + q[0]) / 2).toFixed(2)} ${((p[1] + q[1]) / 2).toFixed(2)} `
  }
  d += 'Z'

  let drops = ''
  for (let i = 0; i < 9; i++) {
    const a = Math.random() * Math.PI * 2
    const r = 48 + Math.random() * 1.8
    const cr = 0.5 + Math.random() * 1.7
    drops += `<circle cx="${(50 + Math.cos(a) * r).toFixed(2)}" cy="${(50 + Math.sin(a) * r).toFixed(2)}" r="${cr.toFixed(2)}"/>`
  }

  const seed = Math.floor(Math.random() * 1000)
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">` +
    `<filter id="r" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.07" numOctaves="3" seed="${seed}" result="n"/>` +
    `<feDisplacementMap in="SourceGraphic" in2="n" scale="3.2" xChannelSelector="R" yChannelSelector="G"/></filter>` +
    `<g fill="#000" filter="url(#r)"><path d="${d}"/>${drops}</g></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

/**
 * @param applyTheme  must change the theme SYNCHRONOUSLY (class or data attribute on html)
 * @param origin      viewport coordinates of the click (usually the toggle button center)
 */
export function runInkThemeTransition(applyTheme: () => void, origin: InkOrigin): void {
  const doc = document as DocWithVT
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (!doc.startViewTransition || reduce || running) {
    applyTheme()
    return
  }

  const { x, y } = origin
  const far = Math.max(
    Math.hypot(x, y),
    Math.hypot(window.innerWidth - x, y),
    Math.hypot(x, window.innerHeight - y),
    Math.hypot(window.innerWidth - x, window.innerHeight - y),
  )
  const size = Math.ceil(far * 3.8) // solid core is ~26 of 100 units, so 3.8x covers the farthest corner
  const root = document.documentElement
  root.style.setProperty('--ink-mask', makeInkMaskUrl())

  const transition = doc.startViewTransition(() => {
    applyTheme()
  })
  running = transition

  transition.ready
    .then(() => {
      const from = { size: '0px 0px', pos: `${x}px ${y}px` }
      const to = { size: `${size}px ${size}px`, pos: `${x - size / 2}px ${y - size / 2}px` }
      root.animate(
        {
          maskSize: [from.size, to.size],
          maskPosition: [from.pos, to.pos],
          webkitMaskSize: [from.size, to.size],
          webkitMaskPosition: [from.pos, to.pos],
        } as PropertyIndexedKeyframes,
        { duration: DURATION_MS, easing: EASING, fill: 'forwards', pseudoElement: '::view-transition-new(root)' },
      )
    })
    .catch(() => {})

  transition.finished.finally(() => {
    running = null
    root.style.removeProperty('--ink-mask')
  })
}
