import { useEffect } from 'react'
import { SWEEP_EASE, circleAt, coverRadius } from '../lib/circle'

/**
 * Seamless Circular Clip-Path Reveal directly over the outgoing dark section:
 * - No black intermediate screen.
 * - When scrolling down into a .section-paper section, the section is fixed over the
 *   current viewport while the outgoing dark section stays visible underneath.
 * - The paper section and its contents expand from the top-center via clip-path: circle().
 * - Once the circle covers 100% of the screen, the scroll position is synced to the
 *   section top and normal document flow resumes seamlessly.
 */
const REVEAL_MS = 680
const USER_INPUT_WINDOW_MS = 800
const LOCK_KEYS = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '])

const getTriggerLine = () => window.innerHeight * 0.85
const getRearmLine = () => window.innerHeight * 0.92

export function SectionSweep({ reducedMotion }: { reducedMotion: boolean }) {
  useEffect(() => {
    if (reducedMotion) return

    const papers = () =>
      Array.from(document.querySelectorAll<HTMLElement>('main > section.section-paper:not(#research):not(.no-sweep)'))

    let armed: boolean[] = papers().map((el) => el.getBoundingClientRect().top > getRearmLine())
    let busy = false
    let frame = 0
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

    const releaseSection = (section: HTMLElement | null, syncScroll: boolean) => {
      if (!section) return
      section.getAnimations().forEach((a) => a.cancel())

      let targetScrollY: number | null = null
      if (syncScroll && placeholder) {
        targetScrollY = window.scrollY + placeholder.getBoundingClientRect().top
      }

      section.classList.remove('is-sweeping')
      section.style.clipPath = ''

      if (placeholder) {
        placeholder.remove()
        placeholder = null
      }

      if (targetScrollY !== null) {
        const root = document.documentElement
        const previous = root.style.scrollBehavior
        root.style.scrollBehavior = 'auto'
        window.scrollTo(0, targetScrollY)
        root.style.scrollBehavior = previous
      }
    }

    const play = (section: HTMLElement) => {
      busy = true
      activeSection = section
      setLock(true)

      // 1. Insert a flow placeholder with the exact height of the section so fixing
      //    the section doesn't shift the outgoing dark section's scroll position.
      const rect = section.getBoundingClientRect()
      placeholder = document.createElement('div')
      placeholder.style.height = `${rect.height}px`
      placeholder.style.width = '100%'
      placeholder.style.pointerEvents = 'none'
      placeholder.setAttribute('aria-hidden', 'true')
      section.parentNode?.insertBefore(placeholder, section)

      // 2. Pin the incoming paper section over the viewport, clipped to 0px at top-center.
      //    The outgoing dark section remains untouched and visible underneath.
      section.classList.add('is-sweeping')
      section.style.clipPath = circleAt(0)

      // 3. Reveal any [data-reveal] elements inside the section so they are visible inside the circle.
      section.querySelectorAll<HTMLElement>('[data-reveal]').forEach((item) => {
        item.classList.add('is-revealed')
      })

      // 4. Fire a resize tick so sticky/measured children (like WorksDrum) size accurately to 100svh.
      window.dispatchEvent(new Event('resize'))

      // 5. Expand the paper section circle over the outgoing dark section.
      const r = coverRadius()
      const reveal = section.animate([{ clipPath: circleAt(0) }, { clipPath: circleAt(r) }], {
        duration: REVEAL_MS,
        easing: SWEEP_EASE,
        fill: 'forwards',
      })

      reveal.onfinish = () => {
        releaseSection(section, true)
        activeSection = null
        busy = false
        setLock(false)
        const rearmLine = getRearmLine()
        armed = papers().map((el) => el !== section && el.getBoundingClientRect().top > rearmLine)
        section.dispatchEvent(new CustomEvent('section-sweep-complete', { bubbles: true }))
      }
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
      setLock(false)
      releaseSection(activeSection, false)
      busy = false
    }
  }, [reducedMotion])

  return null
}
