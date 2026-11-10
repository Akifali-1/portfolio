// File: src/components/SectionSweep.tsx
import { useEffect } from 'react'
import { circleAt, coverRadius } from '../lib/circle'

/**
 * Ultra-smooth Circular Clip-Path Reveal over outgoing dark sections:
 * - Uses a silky exponential ease-out curve (900ms) instead of an abrupt snap.
 * - Smoothly interpolates window.scrollY to the section top *during* the circle
 *   expansion so when `position: fixed` releases at the end, the section is already
 *   at the exact pixel position in document flow (zero 1-frame jump or hitch).
 */

const REVEAL_MS = 900
const USER_INPUT_WINDOW_MS = 800
const LOCK_KEYS = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '])

const getTriggerLine = () => window.innerHeight * 0.82
const getRearmLine = () => window.innerHeight * 0.92

// Silky quintic ease-out for both scroll alignment and clip-path radius
const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5)
// Smooth ease-in-out for the circular iris expansion
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

export function SectionSweep({ reducedMotion }: { reducedMotion: boolean }) {
  useEffect(() => {
    if (reducedMotion || window.matchMedia('(max-width: 900px)').matches) return

    const papers = () =>
      Array.from(document.querySelectorAll<HTMLElement>('main > section.section-paper:not(#research):not(.no-sweep)'))

    let armed: boolean[] = papers().map((el) => el.getBoundingClientRect().top > getRearmLine())
    let busy = false
    let frame = 0
    let sweepRaf = 0
    let lastUserInput = -Infinity
    let activeSection: HTMLElement | null = null
    let placeholder: HTMLDivElement | null = null

    const cancel = (event: Event) => event.preventDefault()
    const cancelKeys = (event: KeyboardEvent) => {
      if (LOCK_KEYS.has(event.key)) event.preventDefault()
    }

    const setLock = (on: boolean) => {
      if (on) {
        window.addEventListener('wheel', cancel, { passive: false })
        window.addEventListener('touchmove', cancel, { passive: false })
        window.addEventListener('keydown', cancelKeys)
      } else {
        window.removeEventListener('wheel', cancel)
        window.removeEventListener('touchmove', cancel)
        window.removeEventListener('keydown', cancelKeys)
      }
    }

    const markInput = () => {
      lastUserInput = performance.now()
    }

    const markKey = (event: KeyboardEvent) => {
      if (!LOCK_KEYS.has(event.key)) return
      const target = event.target as HTMLElement | null
      if (target?.closest?.('input, textarea, select, [contenteditable="true"]')) return
      markInput()
    }

    const releaseSection = (section: HTMLElement | null, finalScrollY: number | null) => {
      if (!section) return
      if (sweepRaf) {
        window.cancelAnimationFrame(sweepRaf)
        sweepRaf = 0
      }

      const root = document.documentElement
      const previousBehavior = root.style.scrollBehavior
      root.style.scrollBehavior = 'auto'

      section.classList.remove('is-sweeping')
      section.style.clipPath = ''
      section.style.transform = ''

      if (placeholder) {
        placeholder.remove()
        placeholder = null
      }

      if (finalScrollY !== null) {
        window.scrollTo(0, finalScrollY)
      }

      root.style.scrollBehavior = previousBehavior
    }

    const play = (section: HTMLElement) => {
      busy = true
      activeSection = section
      setLock(true)

      const rect = section.getBoundingClientRect()
      const startScrollY = window.scrollY
      const targetScrollY = startScrollY + rect.top

      // 1. Insert placeholder to keep document height and outgoing section stable
      placeholder = document.createElement('div')
      placeholder.style.height = `${rect.height}px`
      placeholder.style.width = '100%'
      placeholder.style.pointerEvents = 'none'
      placeholder.setAttribute('aria-hidden', 'true')
      section.parentNode?.insertBefore(placeholder, section)

      // 2. Fix incoming paper section over the viewport and pre-reveal its items
      section.classList.add('is-sweeping')
      section.style.clipPath = circleAt(0)

      section.querySelectorAll<HTMLElement>('[data-reveal]').forEach((item) => {
        item.classList.add('is-revealed')
      })

      window.dispatchEvent(new Event('resize'))

      const maxRadius = coverRadius()
      const startTime = performance.now()
      const root = document.documentElement
      const prevBehavior = root.style.scrollBehavior
      root.style.scrollBehavior = 'auto'

      // 3. Single RAF loop driving both clip-path and subtle scroll-sync so release is 100% seamless
      const step = (now: number) => {
        const raw = Math.min(1, Math.max(0, (now - startTime) / REVEAL_MS))
        const radiusProgress = easeInOutCubic(raw)
        const scrollProgress = easeOutQuint(raw)

        const currentRadius = radiusProgress * maxRadius
        section.style.clipPath = circleAt(currentRadius)

        // Glide underlying scroll position smoothly toward the section top
        const nextY = startScrollY + (targetScrollY - startScrollY) * scrollProgress
        window.scrollTo(0, nextY)

        if (raw < 1) {
          sweepRaf = window.requestAnimationFrame(step)
        } else {
          sweepRaf = 0
          root.style.scrollBehavior = prevBehavior
          releaseSection(section, targetScrollY)
          activeSection = null
          busy = false
          setLock(false)
          const rearmLine = getRearmLine()
          armed = papers().map((el) => el !== section && el.getBoundingClientRect().top > rearmLine)
          section.dispatchEvent(new CustomEvent('section-sweep-complete', { bubbles: true }))
        }
      }

      sweepRaf = window.requestAnimationFrame(step)
    }

    const check = () => {
      frame = 0
      if (busy) return
      const list = papers()
      const rects = list.map((el) => el.getBoundingClientRect())
      const triggerLine = getTriggerLine()
      const rearmLine = getRearmLine()
      const userDriven = performance.now() - lastUserInput < USER_INPUT_WINDOW_MS

      const crossing = userDriven
        ? rects.findIndex((rect, i) => armed[i] && rect.top <= triggerLine && rect.bottom > 0)
        : -1

      armed = rects.map((rect, i) => {
        if (i === crossing) return false
        if (armed[i]) return rect.top > triggerLine
        return rect.top > rearmLine
      })

      if (crossing >= 0) play(list[crossing])
    }

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(check)
    }

    window.addEventListener('wheel', markInput, { passive: true })
    window.addEventListener('touchstart', markInput, { passive: true })
    window.addEventListener('touchmove', markInput, { passive: true })
    window.addEventListener('touchend', markInput, { passive: true })
    window.addEventListener('keydown', markKey)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      window.removeEventListener('wheel', markInput)
      window.removeEventListener('touchstart', markInput)
      window.removeEventListener('touchmove', markInput)
      window.removeEventListener('touchend', markInput)
      window.removeEventListener('keydown', markKey)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      window.cancelAnimationFrame(frame)
      if (sweepRaf) window.cancelAnimationFrame(sweepRaf)
      setLock(false)
      releaseSection(activeSection, null)
      busy = false
    }
  }, [reducedMotion])

  return null
}
