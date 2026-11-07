import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { sound } from '../sound'

const BOOT_INIT_DURATION_MS = 2200
const CURTAIN_ARM_MS = 160
const CURTAIN_SLIDE_MS = 900
const COLUMN_STAGGER_MS = 90
const COLUMN_COUNT = 5

type BootScreenProps = {
  onComplete: () => void
  reducedMotion: boolean
}

export function BootScreen({ onComplete, reducedMotion }: BootScreenProps) {
  const [phase, setPhase] = useState<'loading' | 'arming' | 'opening'>('loading')
  const [progress, setProgress] = useState(0)
  const lastTickRef = useRef<number>(0)

  // PHASE 1: Smooth 0 -> 100% Loading Bar
  useEffect(() => {
    if (reducedMotion) {
      onComplete()
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
  }, [onComplete, reducedMotion])

  // PHASE 2: Flash to white curtains, then pull all columns UP from left to right
  useEffect(() => {
    if (phase === 'arming') {
      const t = window.setTimeout(() => {
        if ('playCurtainReveal' in sound && typeof sound.playCurtainReveal === 'function') {
          sound.playCurtainReveal()
        }
        setPhase('opening')
      }, CURTAIN_ARM_MS)
      return () => window.clearTimeout(t)
    }

    if (phase === 'opening') {
      // Trigger onComplete right as the curtains finish pulling up so the Hero slides in
      const totalWait = CURTAIN_SLIDE_MS + (COLUMN_COUNT - 1) * COLUMN_STAGGER_MS - 120
      const done = window.setTimeout(onComplete, totalWait)
      return () => window.clearTimeout(done)
    }
  }, [onComplete, phase])

  const percent = Math.round(progress * 100)

  return (
    <div
      className={`boot-curtain-stage is-${phase}`}
      aria-label="Loading portfolio"
      style={
        {
          '--curtain-slide-ms': `${CURTAIN_SLIDE_MS}ms`,
          '--curtain-stagger-ms': `${COLUMN_STAGGER_MS}ms`,
        } as CSSProperties
      }
    >
      {/* 5 Vertical Curtain Columns — All Pull UP Left-to-Right */}
      <div className="boot-curtain-grid" aria-hidden="true">
        {Array.from({ length: COLUMN_COUNT }).map((_, index) => (
          <div
            key={index}
            className="boot-curtain-col"
            style={{ '--col-index': index } as CSSProperties}
          />
        ))}
      </div>

      {/* Centered Minimalist 0-100% Loader */}
      <div className={`boot-minimal-loader ${phase !== 'loading' ? 'is-hidden' : ''}`}>
        <div className="boot-minimal-header">
          <span className="boot-minimal-tag">SYS.LOAD</span>
          <span className="boot-minimal-percent">{String(percent).padStart(3, '0')}%</span>
        </div>
        <div className="boot-minimal-track">
          <span
            className="boot-minimal-fill"
            style={{ transform: `scaleX(${progress.toFixed(4)})` }}
          />
        </div>
      </div>
    </div>
  )
}
