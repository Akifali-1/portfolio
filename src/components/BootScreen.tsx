import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { ArrowRight } from 'lucide-react'
import { sound } from '../sound'

const bootLines = [
  'INITIALIZING AKIF.SYSTEM',
  'LOADING / CORE',
  'MAPPING / RESEARCH',
  'OPENING / WORKSHOP',
]

// AGENT NOTE: If the user previously set a custom duration in BootScreen.tsx,
// set BOOT_INIT_DURATION_MS to that exact value. Every animation scales proportionally!
const STANDBY_DURATION_MS = 1450
const BOOT_INIT_DURATION_MS = 3800
const SHATTER_DURATION_MS = 1150

// 14 Seamless Voronoi-style Polygon Shards covering 100% of the viewport (0..100% X/Y)
// Each shard has its own 3D velocity vector (tx, ty, tz) and rotation (rx, ry, rz)
const SHARDS = [
  { clip: 'polygon(0% 0%, 32% 0%, 24% 28%, 0% 22%)', tx: -28, ty: -24, tz: 180, rx: 28, ry: -34, rz: -18 },
  { clip: 'polygon(32% 0%, 68% 0%, 54% 32%, 24% 28%)', tx: -4, ty: -32, tz: 240, rx: 42, ry: 12, rz: -8 },
  { clip: 'polygon(68% 0%, 100% 0%, 100% 26%, 76% 30%, 54% 32%)', tx: 30, ty: -26, tz: 190, rx: 32, ry: 38, rz: 22 },
  { clip: 'polygon(0% 22%, 24% 28%, 36% 48%, 14% 58%, 0% 52%)', tx: -36, ty: -6, tz: 220, rx: 14, ry: -46, rz: -25 },
  // Center Core Shards (detonate fastest & closest to camera)
  { clip: 'polygon(24% 28%, 54% 32%, 50% 50%, 36% 48%)', tx: -16, ty: -14, tz: 420, rx: -48, ry: -32, rz: -35 },
  { clip: 'polygon(54% 32%, 76% 30%, 66% 52%, 50% 50%)', tx: 18, ty: -12, tz: 440, rx: -42, ry: 44, rz: 28 },
  { clip: 'polygon(36% 48%, 50% 50%, 46% 70%, 26% 68%)', tx: -18, ty: 16, tz: 390, rx: 46, ry: -38, rz: 24 },
  { clip: 'polygon(50% 50%, 66% 52%, 72% 72%, 46% 70%)', tx: 20, ty: 18, tz: 410, rx: 52, ry: 36, rz: -30 },
  // Outer Flank & Bottom Shards
  { clip: 'polygon(76% 30%, 100% 26%, 100% 60%, 84% 58%, 66% 52%)', tx: 38, ty: 4, tz: 210, rx: -18, ry: 48, rz: 19 },
  { clip: 'polygon(0% 52%, 14% 58%, 26% 68%, 18% 82%, 0% 78%)', tx: -34, ty: 18, tz: 170, rx: -28, ry: -35, rz: 16 },
  { clip: 'polygon(66% 52%, 84% 58%, 100% 60%, 100% 84%, 72% 72%)', tx: 34, ty: 22, tz: 200, rx: -26, ry: 40, rz: -22 },
  { clip: 'polygon(0% 78%, 18% 82%, 34% 100%, 0% 100%)', tx: -26, ty: 32, tz: 150, rx: -36, ry: -24, rz: 28 },
  { clip: 'polygon(18% 82%, 26% 68%, 46% 70%, 68% 100%, 34% 100%)', tx: -6, ty: 36, tz: 260, rx: -44, ry: -10, rz: 12 },
  { clip: 'polygon(46% 70%, 72% 72%, 100% 84%, 100% 100%, 68% 100%)', tx: 28, ty: 34, tz: 230, rx: -38, ry: 30, rz: -20 },
]

type BootScreenProps = {
  onComplete: () => void
  reducedMotion: boolean
}

export function BootScreen({ onComplete, reducedMotion }: BootScreenProps) {
  const [phase, setPhase] = useState<'standby' | 'cursor-moving' | 'impact' | 'booting' | 'shattering'>('standby')
  const [progress, setProgress] = useState(0) // 0.0 to 1.0 proportional progress
  const screenRef = useRef<HTMLDivElement>(null)
  const coreRef = useRef<HTMLDivElement>(null)
  const playedLineRef = useRef<number>(0)

  // PHASE 1: Proportional Standby -> Phantom Cursor -> Click Impact Tremor
  useEffect(() => {
    if (reducedMotion) {
      onComplete()
      return
    }
    const moveAt = STANDBY_DURATION_MS * 0.16
    const impactAt = STANDBY_DURATION_MS * 0.72

    const t1 = window.setTimeout(() => setPhase('cursor-moving'), moveAt)
    const t2 = window.setTimeout(() => {
      setPhase('impact')
      sound.playRelayImpact()
    }, impactAt)
    const t3 = window.setTimeout(() => setPhase('booting'), STANDBY_DURATION_MS)

    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.clearTimeout(t3)
    }
  }, [onComplete, reducedMotion])

  // PHASE 2: Proportional Boot Progress (0.0 -> 1.0) + Continuous Physics Shake Escalation
  useEffect(() => {
    if (phase !== 'booting') return
    let raf = 0
    const startTime = performance.now()

    const tick = (now: number) => {
      const elapsed = now - startTime
      const p = Math.min(elapsed / BOOT_INIT_DURATION_MS, 1)
      setProgress(p)

      // Trigger mechanical audio clicks as each proportional line threshold is crossed
      const thresholds = [0.06, 0.3, 0.55, 0.78]
      thresholds.forEach((t, idx) => {
        if (p >= t && playedLineRef.current <= idx) {
          playedLineRef.current = idx + 1
          sound.playClick(500 + idx * 140, 0.016)
        }
      })

      // Continuous Physics Earthquake Calculation:
      // Starts with residual click tremor (p < 0.12), settles briefly, then ramps exponentially (p^2.2)
      if (coreRef.current && screenRef.current) {
        const clickResidual = p < 0.14 ? (1 - p / 0.14) * 7 : 0
        const buildup = Math.pow(p, 2.25) * 20 // Escalates from 0px to 20px peak seismic shake
        const amplitude = clickResidual + buildup

        // High-frequency seismic jitter
        const angle = now * 0.095
        const dx = Math.sin(angle * 1.7) * amplitude + (Math.random() - 0.5) * amplitude * 0.65
        const dy = Math.cos(angle * 2.3) * amplitude * 0.85 + (Math.random() - 0.5) * amplitude * 0.65
        const rot = Math.sin(angle * 1.1) * (amplitude * 0.11)

        coreRef.current.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0) rotate(${rot.toFixed(2)}deg) scale(${1 + p * 0.035})`
        screenRef.current.style.setProperty('--quake-intensity', p.toFixed(3))
      }

      if (p < 1) {
        raf = window.requestAnimationFrame(tick)
      } else {
        // 100% reached -> Detonate 3D Voronoi Glass Shatter!
        sound.playShatter()
        setPhase('shattering')
      }
    }

    raf = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(raf)
  }, [phase])

  // PHASE 3: Complete & unmount after 3D shards finish flying past camera
  useEffect(() => {
    if (phase !== 'shattering') return
    const done = window.setTimeout(onComplete, SHATTER_DURATION_MS)
    return () => window.clearTimeout(done)
  }, [onComplete, phase])

  const handleManualOverride = () => {
    sound.playRelayImpact()
    if (reducedMotion) {
      onComplete()
      return
    }
    if (phase === 'standby' || phase === 'cursor-moving') {
      setPhase('impact')
      window.setTimeout(() => setPhase('booting'), 260)
    } else if (phase === 'booting') {
      sound.playShatter()
      setPhase('shattering')
    }
  }

  // STANDBY & INITIAL CLICK IMPACT SCREEN
  if (phase === 'standby' || phase === 'cursor-moving' || phase === 'impact') {
    return (
      <div
        className={`boot-screen boot-offline ${phase === 'impact' ? 'is-impact-quake' : ''}`}
        aria-label="Akif system initializing"
      >
        <div className="offline-core">
          <div className="offline-status">
            <span className="offline-dot" /> SYSTEM / STANDBY — AUTO-ENGAGING
          </div>
          <div className="offline-title">
            SYSTEM
            <br />
            <em>OFFLINE</em>
          </div>
          <p>Autonomous ignition sequence active. Click to engage immediately.</p>
          <div className="offline-action">
            <button
              className={`offline-button is-pulsing ${phase === 'impact' ? 'is-pressed' : ''}`}
              type="button"
              onClick={handleManualOverride}
            >
              <span className="power-mark">⏻</span>
              <span>TURN SYSTEM ON</span>
              <ArrowRight size={14} />
              {phase === 'impact' && <span className="impact-shockwave" aria-hidden="true" />}
            </button>
            <span className="offline-hint">
              {phase === 'impact' ? '[ SEISMIC RELAY LOCKED // IGNITING ]' : '[ AUTONOMOUS TRIGGER INBOUND ]'}
            </span>
          </div>

          {/* Autonomous Phantom Cursor */}
          <div
            className={`phantom-cursor ${phase === 'cursor-moving' || phase === 'impact' ? 'is-arrived' : ''} ${
              phase === 'impact' ? 'is-clicking' : ''
            }`}
            aria-hidden="true"
            style={{ '--glide-ms': `${Math.round(STANDBY_DURATION_MS * 0.52)}ms` } as CSSProperties}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 3L11.5 20L14.2 13.2L21 10.5L4 3Z"
                fill="#F3F3F0"
                stroke="#4D7CFF"
                strokeWidth="1.5"
              />
            </svg>
            <span className="phantom-cursor-tag">SYS.AGENT // ENGAGE</span>
          </div>
        </div>
      </div>
    )
  }

  // 3D VORONOI GLASS SHATTER OVERLAY (Reveals Hero underneath!)
  if (phase === 'shattering') {
    return (
      <div
        className="shatter-viewport"
        aria-hidden="true"
        style={{ '--shatter-ms': `${SHATTER_DURATION_MS}ms` } as CSSProperties}
      >
        <div className="shatter-flash" />
        {SHARDS.map((shard, index) => (
          <div
            key={index}
            className="shatter-shard"
            style={
              {
                clipPath: shard.clip,
                '--tx': `${shard.tx}vw`,
                '--ty': `${shard.ty}vh`,
                '--tz': `${shard.tz}px`,
                '--rx': `${shard.rx}deg`,
                '--ry': `${shard.ry}deg`,
                '--rz': `${shard.rz}deg`,
              } as CSSProperties
            }
          >
            <div className="shard-inner-surface" />
          </div>
        ))}
      </div>
    )
  }

  // PROGRESSIVE EARTHQUAKE LOADING & FRACTURE BUILDUP
  const thresholds = [0.06, 0.3, 0.55, 0.78]
  const showCracks = progress > 0.62
  const crackOpacity = showCracks ? Math.min((progress - 0.62) / 0.38, 1) : 0

  return (
    <div
      ref={screenRef}
      className={`boot-screen is-quaking ${progress > 0.75 ? 'is-critical-overload' : ''}`}
      aria-label="Loading Akif system"
    >
      {/* Dual-Layer Jagged Stress Fractures (Radiating from behind the core text) */}
      <svg
        className="fracture-overlay"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
        style={{ opacity: crackOpacity }}
        aria-hidden="true"
      >
        {/* Primary high-tension jagged fault lines */}
        <g className="fracture-primary">
          <path d="M370,440 L310,415 L255,340 L240,280 L285,140 L320,0" />
          <path d="M520,390 L535,345 L540,320 L595,190 L635,95 L680,0" />
          <path d="M620,490 L660,520 L715,430 L760,300 L875,285 L1000,260" />
          <path d="M410,585 L355,635 L260,680 L195,620 L140,580 L65,555 L0,520" />
          <path d="M590,565 L660,520 L690,615 L720,720 L850,775 L1000,840" />
          <path d="M465,615 L460,700 L555,835 L610,910 L680,1000" />
          <path d="M260,680 L215,745 L180,820 L255,905 L340,1000" />
          <path d="M240,280 L145,255 L75,230 L0,220" />
        </g>

        {/* Secondary razor-thin micro-splinters & stress branches */}
        <g className="fracture-micro">
          <path d="M310,415 L220,435 L135,410 L40,430" />
          <path d="M255,340 L180,335 L110,295" />
          <path d="M535,345 L475,265 L430,175 L445,80" />
          <path d="M595,190 L690,155 L770,105" />
          <path d="M715,430 L810,445 L915,415 L1000,435" />
          <path d="M760,300 L795,205 L865,130" />
          <path d="M690,615 L795,595 L890,630 L975,610" />
          <path d="M555,835 L485,915 L450,1000" />
          <path d="M355,635 L365,745 L325,830" />
          <path d="M195,620 L105,685 L25,720" />
        </g>
      </svg>

      <div ref={coreRef} className="boot-core">
        <div className="boot-mark">
          <span /> <span /> <span />
        </div>
        <div className="boot-lines">
          {bootLines.map((item, index) => (
            <div key={item} className={progress >= thresholds[index] ? 'is-visible' : ''}>
              <span className="mono-label">[{String(index + 1).padStart(2, '0')}]</span>
              {item}
            </div>
          ))}
        </div>
        <div className="boot-progress">
          <span style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
        <div className="boot-telemetry-row mono-label">
          <span>CORE RESONANCE // {Math.round(progress * 100)}%</span>
          <button className="boot-skip" type="button" onClick={handleManualOverride}>
            FRACTURE & ENTER <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
