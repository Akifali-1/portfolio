import { useEffect, useRef, useState } from 'react'
import { sound } from '../sound'
import { SWEEP_EASE, circleAt, coverRadius } from '../lib/circle'

const BOOT_INIT_DURATION_MS = 2200 // counter duration (unchanged)
const ARM_MS = 160
const COVER_MS = 700
const REVEAL_MS = 820

type BootScreenProps = {
  onReveal: () => void // hero starts entering as the paper circle recedes
  onComplete: () => void // unmount the boot layer
  reducedMotion: boolean
}

type Phase = 'loading' | 'arming' | 'covering' | 'revealing'

export function BootScreen({ onReveal, onComplete, reducedMotion }: BootScreenProps) {
  const [phase, setPhase] = useState<Phase>('loading')
  const [progress, setProgress] = useState(0)
  const lastTickRef = useRef(0)
  const paperRef = useRef<HTMLDivElement>(null)

  // Keep the latest callbacks without restarting the animation effects.
  const callbacks = useRef({ onReveal, onComplete })
  callbacks.current = { onReveal, onComplete }

  // PHASE 1: counter (unchanged)
  useEffect(() => {
    if (reducedMotion) {
      callbacks.current.onReveal()
      callbacks.current.onComplete()
      return
    }

    let raf = 0
    const startTime = performance.now()

    const tick = (now: number) => {
      const elapsed = now - startTime
      const raw = Math.min(elapsed / BOOT_INIT_DURATION_MS, 1)
      const eased = raw < 0.5 ? 2 * raw * raw : 1 - Math.pow(-2 * raw + 2, 2) / 2
      setProgress(eased)

      const milestone = Math.floor(eased * 4)
      if (milestone > lastTickRef.current && milestone <= 4) {
        lastTickRef.current = milestone
        sound.playClick(420 + milestone * 90, 0.012)
      }

      if (raw < 1) {
        raf = window.requestAnimationFrame(tick)
      } else {
        setPhase('arming')
      }
    }

    raf = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(raf)
  }, [reducedMotion])

  // PHASE 2: short pause, then the paper circle starts at the top centre
  useEffect(() => {
    if (phase !== 'arming') return
    const t = window.setTimeout(() => setPhase('covering'), ARM_MS)
    return () => window.clearTimeout(t)
  }, [phase])

  // PHASE 3: the circle grows until the whole viewport is paper
  useEffect(() => {
    if (phase !== 'covering') return
    const el = paperRef.current
    if (!el) return
    sound.playCurtainReveal()
    const r = coverRadius()
    const cover = el.animate([{ clipPath: circleAt(0) }, { clipPath: circleAt(r) }], {
      duration: COVER_MS,
      easing: SWEEP_EASE,
      fill: 'forwards',
    })
    cover.onfinish = () => setPhase('revealing')
  }, [phase])

  // PHASE 4: the same circle recedes to the top and uncovers the hero
  useEffect(() => {
    if (phase !== 'revealing') return
    const el = paperRef.current
    callbacks.current.onReveal()
    if (!el) {
      callbacks.current.onComplete()
      return
    }
    const r = coverRadius()
    const reveal = el.animate([{ clipPath: circleAt(r) }, { clipPath: circleAt(0) }], {
      duration: REVEAL_MS,
      easing: SWEEP_EASE,
      fill: 'forwards',
    })
    reveal.onfinish = () => callbacks.current.onComplete()
  }, [phase])

  const percent = Math.round(progress * 100)

  return (
    <div className={`boot-curtain-stage is-${phase}`} aria-label="Loading portfolio">
      {/* Centered 0-100% loader (unchanged) */}
      <div className={`boot-minimal-loader ${phase !== 'loading' ? 'is-hidden' : ''}`}>
        <div className="boot-minimal-header">
          <span className="boot-minimal-tag">SYS.LOAD</span>
          <span className="boot-minimal-percent">{String(percent).padStart(3, '0')}%</span>
        </div>
        <div className="boot-minimal-track">
          <span className="boot-minimal-fill" style={{ transform: `scaleX(${progress.toFixed(4)})` }} />
        </div>
      </div>

      {/* Paper circle: covers from the top, then recedes to reveal the hero */}
      <div ref={paperRef} className="boot-paper" aria-hidden="true" />
    </div>
  )
}
