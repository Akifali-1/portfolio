// src/lib/colorReveal.ts
// Soft circular "lens" that follows the mouse over a host element.
// It only sets three CSS variables (--rx, --ry, --rr) on the layer; the CSS mask does the rest.
// The loop runs only while something is moving, so idle cost is zero.

export type ColorRevealOptions = {
  radius?: number // lens radius in px when the mouse is inside
  follow?: number // 0..1, how quickly the lens catches up with the mouse
}

export function createColorReveal(host: HTMLElement, layer: HTMLElement, opts: ColorRevealOptions = {}): () => void {
  const R = opts.radius ?? 118
  const follow = opts.follow ?? 0.2
  let tx = -9999
  let ty = -9999
  let x = -9999
  let y = -9999
  let r = 0
  let tr = 0
  let raf = 0

  const apply = () => {
    layer.style.setProperty('--rx', `${x.toFixed(1)}px`)
    layer.style.setProperty('--ry', `${y.toFixed(1)}px`)
    layer.style.setProperty('--rr', `${r.toFixed(1)}px`)
  }

  const frame = () => {
    raf = 0
    x += (tx - x) * follow
    y += (ty - y) * follow
    r += (tr - r) * 0.14
    if (r < 0.4 && tr === 0) r = 0
    apply()
    if (Math.abs(tx - x) > 0.3 || Math.abs(ty - y) > 0.3 || Math.abs(tr - r) > 0.3) raf = requestAnimationFrame(frame)
  }
  const kick = () => {
    if (!raf) raf = requestAnimationFrame(frame)
  }

  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return
    const b = host.getBoundingClientRect()
    const lx = e.clientX - b.left
    const ly = e.clientY - b.top
    const inside = lx >= 0 && ly >= 0 && lx <= b.width && ly <= b.height
    if (inside) {
      if (x < -9000) {
        x = lx
        y = ly
      }
      tx = lx
      ty = ly
      tr = R
    } else {
      tr = 0
    }
    kick()
  }
  const onLeave = () => {
    tr = 0
    kick()
  }

  window.addEventListener('pointermove', onMove, { passive: true })
  document.addEventListener('pointerleave', onLeave)
  return () => {
    window.removeEventListener('pointermove', onMove)
    document.removeEventListener('pointerleave', onLeave)
    if (raf) cancelAnimationFrame(raf)
    layer.style.removeProperty('--rx')
    layer.style.removeProperty('--ry')
    layer.style.removeProperty('--rr')
  }
}
