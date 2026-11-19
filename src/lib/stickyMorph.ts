// src/lib/stickyMorph.ts
// Pure helpers for a cursor ring that morphs onto interactive elements.

export type RingState = { x: number; y: number; w: number; h: number; r: number; stuck: boolean }

export const STICKY_SELECTOR = 'a[href], button, [role="button"], summary, [data-cursor="sticky"]'

export function findStickyElement(target: EventTarget | null): HTMLElement | null {
  const el = target instanceof Element ? target : null
  return (el?.closest(STICKY_SELECTOR) as HTMLElement | null) ?? null
}

/** Where the ring wants to be: a small circle on the pointer, or a rounded box around the hovered element. */
export function computeRingTarget(
  pointer: { x: number; y: number },
  el: HTMLElement | null,
  restSize = 34,
  pad = 8,
): RingState {
  if (!el) return { x: pointer.x, y: pointer.y, w: restSize, h: restSize, r: restSize / 2, stuck: false }
  const b = el.getBoundingClientRect()
  const cx = b.left + b.width / 2
  const cy = b.top + b.height / 2
  // slight magnetic pull toward the pointer so it feels alive
  const x = cx + (pointer.x - cx) * 0.16
  const y = cy + (pointer.y - cy) * 0.16
  const w = b.width + pad * 2
  const h = b.height + pad * 2
  const cr = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 10
  return { x, y, w, h, r: Math.min(Math.max(cr + pad * 0.6, 10), Math.min(w, h) / 2), stuck: true }
}

export function stepRing(cur: RingState, tgt: RingState, k = 0.22): RingState {
  const lerp = (a: number, b: number) => a + (b - a) * k
  return {
    x: lerp(cur.x, tgt.x),
    y: lerp(cur.y, tgt.y),
    w: lerp(cur.w, tgt.w),
    h: lerp(cur.h, tgt.h),
    r: lerp(cur.r, tgt.r),
    stuck: tgt.stuck,
  }
}

export function ringIsSettled(a: RingState, b: RingState): boolean {
  return (
    Math.abs(a.x - b.x) < 0.3 &&
    Math.abs(a.y - b.y) < 0.3 &&
    Math.abs(a.w - b.w) < 0.3 &&
    Math.abs(a.h - b.h) < 0.3
  )
}
