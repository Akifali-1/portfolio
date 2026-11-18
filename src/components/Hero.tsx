import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type RefObject } from 'react'
import { ArrowRight, Code2, Layers, Share2 } from 'lucide-react'
import { gsap } from 'gsap'
import type { CollapseAnimationState } from './FallingTechLogos'
import { AkifCalligraphyCanvas, type WritingStage } from './AkifCalligraphyCanvas'
import { HeroWave } from './HeroWave'
import type { PortfolioTheme } from '../hooks/useTheme'

type HeroProps = {
  booted?: boolean
  reducedMotion: boolean
  collapseState: CollapseAnimationState
  onCollapse: () => void
  collapseTargetRef: RefObject<HTMLSpanElement | null>
  theme: PortfolioTheme
}

/** Total accumulated pointer distance (in CSS pixels) to finish writing AKIF */
const DESKTOP_WRITE_DISTANCE_PX = 920
/** Auto-complete after 3 seconds of pointer inactivity once writing has started */
const INACTIVITY_AUTOCOMPLETE_MS = 3000
/** Auto-start writing if visitor never interacts with the canvas */
const NO_INTERACTION_FALLBACK_MS = 4200

export function Hero({
  booted = true,
  reducedMotion,
  collapseState: _collapseState,
  onCollapse: _onCollapse,
  collapseTargetRef,
  theme,
}: HeroProps) {
  const heroTrackRef = useRef<HTMLElement>(null)
  const canvasWrapRef = useRef<HTMLDivElement>(null)

  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 900px), (pointer: coarse)').matches : false,
  )
  const [stage, setStage] = useState<WritingStage>(() => (reducedMotion ? 'stamped' : 'load'))
  const [hintVisible, setHintVisible] = useState(false)
  const [writeProgress, setWriteProgress] = useState<number>(() => (reducedMotion ? 1 : 0))
  const [velocity, setVelocity] = useState(0)
  const [sealStamped, setSealStamped] = useState<boolean>(() => reducedMotion)
  const [introProgress, setIntroProgress] = useState<number>(() => (reducedMotion ? 1 : 0))
  const [pointerInside, setPointerInside] = useState(false)
  const [pointerPos, setPointerPos] = useState({ x: 0, y: 0 })

  const targetProgressRef = useRef<number>(reducedMotion ? 1 : 0)
  const currentProgressRef = useRef<number>(reducedMotion ? 1 : 0)
  const lastPointerRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const velocityRef = useRef(0)
  const rafRef = useRef(0)
  const inactivityTimerRef = useRef<number | null>(null)
  const noInteractionTimerRef = useRef<number | null>(null)
  const autoCompletingRef = useRef(false)
  const completedOnceRef = useRef<boolean>(reducedMotion)
  const maxIntroProgressRef = useRef<number>(reducedMotion ? 1 : 0)
  const autoTweenRef = useRef<gsap.core.Tween | null>(null)
  const rightRevealTweenRef = useRef<gsap.core.Tween | null>(null)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px), (pointer: coarse)')
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const clearTimers = useCallback(() => {
    if (inactivityTimerRef.current) {
      window.clearTimeout(inactivityTimerRef.current)
      inactivityTimerRef.current = null
    }
    if (noInteractionTimerRef.current) {
      window.clearTimeout(noInteractionTimerRef.current)
      noInteractionTimerRef.current = null
    }
  }, [])

  // Cascade the 8 right-column introduction items sequentially line-by-line
  const startRightColumnCascade = useCallback((delaySeconds = 0.25, durationSeconds = 1.65) => {
    if (maxIntroProgressRef.current >= 0.99 || rightRevealTweenRef.current) return
    const proxy = { p: maxIntroProgressRef.current }
    rightRevealTweenRef.current = gsap.to(proxy, {
      p: 1,
      delay: delaySeconds,
      duration: durationSeconds * (1 - maxIntroProgressRef.current),
      ease: 'power2.out',
      onUpdate: () => {
        if (proxy.p > maxIntroProgressRef.current) {
          maxIntroProgressRef.current = proxy.p
          setIntroProgress(proxy.p)
        }
      },
    })
  }, [])

  // Trigger Stage 5: Seal Stamp completion moment + sequential right-column reveal
  const completeAndStamp = useCallback(() => {
    if (completedOnceRef.current) return
    completedOnceRef.current = true
    clearTimers()
    targetProgressRef.current = 1
    currentProgressRef.current = 1
    setWriteProgress(1)
    setHintVisible(false)
    setStage('stamped')
    setSealStamped(true)
    if (!isMobile) {
      startRightColumnCascade(0.32, 1.65)
    }
  }, [clearTimers, isMobile, startRightColumnCascade])

  // Smoothly auto-complete remaining calligraphy strokes using GSAP
  const triggerAutoCompleteWriting = useCallback(
    (durationSeconds = 1.55) => {
      if (completedOnceRef.current || autoCompletingRef.current) return
      autoCompletingRef.current = true
      setHintVisible(false)
      setStage('writing')

      const proxy = { p: currentProgressRef.current }
      autoTweenRef.current?.kill()
      autoTweenRef.current = gsap.to(proxy, {
        p: 1,
        duration: Math.max(0.45, durationSeconds * (1 - currentProgressRef.current)),
        ease: 'power2.inOut',
        onUpdate: () => {
          targetProgressRef.current = proxy.p
          currentProgressRef.current = proxy.p
          setWriteProgress(proxy.p)
          setVelocity(0.35)
        },
        onComplete: () => {
          autoCompletingRef.current = false
          completeAndStamp()
        },
      })
    },
    [completeAndStamp],
  )

  // Instant Skip Intro handler
  const skipIntro = useCallback(() => {
    autoTweenRef.current?.kill()
    rightRevealTweenRef.current?.kill()
    clearTimers()
    completedOnceRef.current = true
    targetProgressRef.current = 1
    currentProgressRef.current = 1
    setWriteProgress(1)
    setHintVisible(false)
    setStage('stamped')
    setSealStamped(true)
    maxIntroProgressRef.current = 1
    setIntroProgress(1)
  }, [clearTimers])

  useEffect(() => {
    if (reducedMotion) {
      skipIntro()
    }
  }, [reducedMotion, skipIntro])

  // Desktop Stage 1 (Load) -> Stage 2 (Hint at 500ms) -> No-interaction fallback
  useEffect(() => {
    if (!booted || reducedMotion || isMobile || completedOnceRef.current) return

    const hintTimer = window.setTimeout(() => {
      if (!completedOnceRef.current && currentProgressRef.current < 0.02) {
        setStage('hint')
        setHintVisible(true)
      }
    }, 500)

    noInteractionTimerRef.current = window.setTimeout(() => {
      if (!completedOnceRef.current && currentProgressRef.current < 0.05) {
        triggerAutoCompleteWriting(2.0)
      }
    }, NO_INTERACTION_FALLBACK_MS)

    return () => {
      window.clearTimeout(hintTimer)
      clearTimers()
    }
  }, [booted, reducedMotion, isMobile, clearTimers, triggerAutoCompleteWriting])

  // Mobile Automatic 0–8000ms Timeline
  useEffect(() => {
    if (!booted || reducedMotion || !isMobile) return

    const heroEl = heroTrackRef.current
    if (!heroEl) return

    let started = false
    const timers: number[] = []
    let writeTween: gsap.core.Tween | null = null
    let revealTween: gsap.core.Tween | null = null

    const startMobileSequence = () => {
      if (started) return
      started = true

      setStage('load')
      setHintVisible(false)

      // 500–2000ms: Hint brush stroke
      timers.push(
        window.setTimeout(() => {
          setStage('hint')
          setHintVisible(true)
        }, 500),
      )

      // 2000–4000ms: AKIF writes itself
      timers.push(
        window.setTimeout(() => {
          setHintVisible(false)
          setStage('writing')
          const proxy = { p: 0 }
          writeTween = gsap.to(proxy, {
            p: 1,
            duration: 2.0,
            ease: 'power1.inOut',
            onUpdate: () => {
              currentProgressRef.current = proxy.p
              targetProgressRef.current = proxy.p
              setWriteProgress(proxy.p)
            },
          })
        }, 2000),
      )

      // 4000–4600ms: Seal stamps
      timers.push(
        window.setTimeout(() => {
          completeAndStamp()
        }, 4000),
      )

      // 4600–8000ms: Eyebrow, headline, description, CTA appear
      timers.push(
        window.setTimeout(() => {
          const introProxy = { p: 0 }
          revealTween = gsap.to(introProxy, {
            p: 1,
            duration: 3.4,
            ease: 'none',
            onUpdate: () => {
              maxIntroProgressRef.current = Math.max(maxIntroProgressRef.current, introProxy.p)
              setIntroProgress(maxIntroProgressRef.current)
            },
          })
        }, 4600),
      )
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          startMobileSequence()
          observer.disconnect()
        }
      },
      { threshold: 0.15 },
    )

    observer.observe(heroEl)

    return () => {
      observer.disconnect()
      timers.forEach((id) => window.clearTimeout(id))
      writeTween?.kill()
      revealTween?.kill()
    }
  }, [booted, reducedMotion, isMobile, completeAndStamp])

  // Desktop Pointer Writing Loop
  const stepWritingAnimation = useCallback(() => {
    rafRef.current = 0
    if (completedOnceRef.current || autoCompletingRef.current) return

    const curr = currentProgressRef.current
    const target = targetProgressRef.current
    const next = curr + (target - curr) * 0.18
    currentProgressRef.current = next
    velocityRef.current *= 0.88

    setWriteProgress(next)
    setVelocity(velocityRef.current)

    if (next >= 0.992 && target >= 0.995) {
      completeAndStamp()
      return
    }

    if (Math.abs(target - next) > 0.001 || velocityRef.current > 0.02) {
      rafRef.current = window.requestAnimationFrame(stepWritingAnimation)
    }
  }, [completeAndStamp])

  const handleCanvasPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (isMobile || reducedMotion) return

      const rect = canvasWrapRef.current?.getBoundingClientRect()
      if (rect) {
        setPointerPos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        })
      }

      if (completedOnceRef.current || autoCompletingRef.current) return

      if (noInteractionTimerRef.current) {
        window.clearTimeout(noInteractionTimerRef.current)
        noInteractionTimerRef.current = null
      }

      const now = performance.now()
      const prev = lastPointerRef.current
      lastPointerRef.current = { x: e.clientX, y: e.clientY, time: now }

      if (!prev) {
        setStage('writing')
        setHintVisible(false)
        return
      }

      const dx = e.clientX - prev.x
      const dy = e.clientY - prev.y
      const dist = Math.min(58, Math.hypot(dx, dy))
      const dt = Math.max(8, now - prev.time)

      if (dist < 0.5) return

      setStage('writing')
      setHintVisible(false)

      const instVel = Math.min(1.8, (dist / dt) * 0.55)
      velocityRef.current = velocityRef.current * 0.65 + instVel * 0.35

      const deltaProgress = dist / DESKTOP_WRITE_DISTANCE_PX
      targetProgressRef.current = Math.min(1, targetProgressRef.current + deltaProgress)

      if (inactivityTimerRef.current) {
        window.clearTimeout(inactivityTimerRef.current)
      }
      inactivityTimerRef.current = window.setTimeout(() => {
        if (!completedOnceRef.current) {
          triggerAutoCompleteWriting(1.3)
        }
      }, INACTIVITY_AUTOCOMPLETE_MS)

      if (!rafRef.current) {
        rafRef.current = window.requestAnimationFrame(stepWritingAnimation)
      }
    },
    [isMobile, reducedMotion, stepWritingAnimation, triggerAutoCompleteWriting],
  )

  // Scroll-Driven Right-Side Introduction Reveal (Desktop)
  useEffect(() => {
    if (isMobile || reducedMotion) return

    let scrollRaf = 0
    const updateScrollReveal = () => {
      scrollRaf = 0
      const track = heroTrackRef.current
      if (!track) return

      const scrollY = window.scrollY
      const trackHeight = track.offsetHeight
      const viewportH = window.innerHeight
      const scrollable = Math.max(220, trackHeight - viewportH)

      if (scrollY > 160 && !completedOnceRef.current && !autoCompletingRef.current) {
        triggerAutoCompleteWriting(1.1)
      }

      const rawScrollProgress = Math.max(0, Math.min(1, scrollY / (scrollable * 0.78)))

      if (rawScrollProgress > maxIntroProgressRef.current) {
        maxIntroProgressRef.current = rawScrollProgress
        setIntroProgress(rawScrollProgress)
      }
    }

    const onScroll = () => {
      if (!scrollRaf) scrollRaf = window.requestAnimationFrame(updateScrollReveal)
    }

    updateScrollReveal()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.cancelAnimationFrame(scrollRaf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [isMobile, reducedMotion, triggerAutoCompleteWriting])

  useEffect(() => {
    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current)
      autoTweenRef.current?.kill()
      rightRevealTweenRef.current?.kill()
      clearTimers()
    }
  }, [clearTimers])

  // Sequential progress [0..1] for each of the 8 right-column items
  const itemProgress = (start: number, end: number) =>
    Math.max(0, Math.min(1, (introProgress - start) / Math.max(0.01, end - start)))

  const inkReveal = (p: number): CSSProperties => {
    if (p >= 1) return { opacity: 1, WebkitMaskImage: 'none', maskImage: 'none' }
    const edge = p * 112
    const m = `linear-gradient(90deg, #000 ${edge - 14}%, transparent ${edge}%)`
    return { opacity: p > 0.01 ? 1 : 0, WebkitMaskImage: m, maskImage: m }
  }

  const p1Eyebrow = itemProgress(0.0, 0.14)
  const p2Underline = itemProgress(0.08, 0.22)
  const p3HeadlineLine1 = itemProgress(0.16, 0.42)
  const p4HeadlineLine2 = itemProgress(0.34, 0.62)
  const p5Description = itemProgress(0.54, 0.72)
  const p6Pillars = itemProgress(0.66, 0.84)
  const p7PrimaryCta = itemProgress(0.78, 0.94)
  const p8SecondaryCta = itemProgress(0.86, 1.0)

  const showSkipButton = !reducedMotion && (writeProgress < 0.99 || introProgress < 0.95)

  return (
    <section
      ref={heroTrackRef}
      className={`hero hero--calligraphy ${isMobile ? 'is-mobile' : 'is-desktop'} ${
        pointerInside && !isMobile && !sealStamped ? 'is-brush-cursor-active' : ''
      }`}
      id="top"
      aria-label="Introduction"
    >
      {/* Preserved collapse target ref for App.tsx compatibility */}
      <span ref={collapseTargetRef} className="hero-collapse-target" aria-hidden="true" />

      {/* Sticky Viewport Stage */}
      <div className="hero-calligraphy-viewport">
        {showSkipButton && (
          <button
            type="button"
            className="hero-skip-intro-btn"
            onClick={skipIntro}
            aria-label="Skip introduction animation"
          >
            Skip Intro
          </button>
        )}

        {/* Two-Column Desktop / Stacked Mobile Composition */}
        <div
          ref={canvasWrapRef}
          className="hero-calligraphy-grid"
          onPointerEnter={() => !isMobile && setPointerInside(true)}
          onPointerLeave={() => setPointerInside(false)}
          onPointerMove={handleCanvasPointerMove}
        >
          {/* LEFT COLUMN: AKIF Brush Calligraphy + Smoky Ink Wash + Vermilion Seal + Brush Tip */}
          <div className="hero-calligraphy-left">
            <AkifCalligraphyCanvas
              theme={theme}
              stage={stage}
              progress={writeProgress}
              velocity={velocity}
              hintVisible={hintVisible}
              sealStamped={sealStamped}
              isMobile={isMobile}
              pointerInside={pointerInside && !sealStamped}
              pointerPos={pointerPos}
            />
          </div>

          {/* Thin understated vertical divider line between Left Calligraphy and Right Introduction */}
          <div
            className="hero-calligraphy-divider"
            style={{
              opacity: isMobile ? 0 : Math.max(0.25, p1Eyebrow),
            }}
            aria-hidden="true"
          />

          {/* RIGHT COLUMN: Scroll-Driven Progressive Introduction */}
          <div className="hero-calligraphy-right">
            {/* 1. ENGINEER / BUILDER / RESEARCHER Eyebrow & 2. Blue Underline */}
            <div className="hero-cal-kicker-group">
              <span
                className="hero-cal-eyebrow"
                style={{
                  opacity: p1Eyebrow,
                  transform: `translate3d(0, ${(1 - p1Eyebrow) * 8}px, 0)`,
                }}
              >
                ENGINEER &nbsp;/&nbsp; BUILDER &nbsp;/&nbsp; RESEARCHER
              </span>
              <span
                className="hero-cal-underline"
                style={{
                  opacity: p2Underline,
                  transform: `scaleX(${p2Underline})`,
                }}
                aria-hidden="true"
              />
            </div>

            {/* 3. "I build systems" & 4. "that make ideas real." (Strict 2-line brush script) */}
            <h1 className="hero-cal-headline">
              <span
                className="hero-cal-headline-line hero-cal-headline-primary"
                style={inkReveal(p3HeadlineLine1)}
              >
                I build systems
              </span>
              <em
                className="hero-cal-headline-line hero-cal-headline-accent"
                style={inkReveal(p4HeadlineLine2)}
              >
                that make ideas real.
              </em>
            </h1>

            {/* 5. Supporting Description */}
            <p
              className="hero-cal-description"
              style={{
                opacity: p5Description,
                transform: `translate3d(0, ${(1 - p5Description) * 10}px, 0)`,
              }}
            >
              Building intelligent systems, developer tools,
              <br className="hero-cal-desc-br" /> and experimental research.
            </p>

            {/* 6. Three Feature Labels: Build / Research / Ship */}
            <div
              className="hero-cal-pillars"
              aria-label="Core disciplines"
              style={{
                opacity: p6Pillars,
                transform: `translate3d(0, ${(1 - p6Pillars) * 10}px, 0)`,
              }}
            >
              <div className="hero-cal-pillar">
                <Code2 size={22} strokeWidth={1.6} aria-hidden="true" />
                <span>Build</span>
              </div>
              <div className="hero-cal-pillar">
                <Layers size={22} strokeWidth={1.6} aria-hidden="true" />
                <span>Research</span>
              </div>
              <div className="hero-cal-pillar">
                <Share2 size={22} strokeWidth={1.6} aria-hidden="true" />
                <span>Ship</span>
              </div>
            </div>

            {/* 7. Primary CTA (Explore my work ->) & 8. Secondary CTA (About me) */}
            <div className="hero-cal-actions">
              <a
                className="hero-cal-btn-primary"
                href="#work"
                data-cursor="WORK"
                style={{
                  opacity: p7PrimaryCta,
                  transform: `translate3d(0, ${(1 - p7PrimaryCta) * 10}px, 0)`,
                  pointerEvents: p7PrimaryCta > 0.15 ? 'auto' : 'none',
                }}
              >
                <span>Explore my work</span>
                <ArrowRight size={15} strokeWidth={2.1} aria-hidden="true" />
              </a>

              <a
                className="hero-cal-btn-secondary"
                href="#about"
                data-cursor="ABOUT"
                style={{
                  opacity: p8SecondaryCta,
                  transform: `translate3d(0, ${(1 - p8SecondaryCta) * 8}px, 0)`,
                  pointerEvents: p8SecondaryCta > 0.15 ? 'auto' : 'none',
                }}
              >
                About me
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Subtle Flowing Blue Wave */}
        <HeroWave theme={theme} />
      </div>
    </section>
  )
}
