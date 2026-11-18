// File: src/components/AkifCalligraphyCanvas.tsx
import { useEffect, useRef } from 'react'
import type { PortfolioTheme } from '../hooks/useTheme'

export type WritingStage = 'load' | 'hint' | 'writing' | 'stamped'

type StrokeSpec = {
  id: string
  /** Spine path used by the progressive reveal mask and the brush-tip follower */
  spine: string
  /** Mask brush width along this spine */
  maskWidth: number
  /** Relative share of the total 0..1 writing progress */
  weight: number
  /** Primary chiseled calligraphy silhouette with angular brush-press entries & tapered exits */
  body: string
  /** Inner tonal brush streaks (gives Light Mode its two-tone indigo ink depth & Dark Mode richness) */
  innerTonePaths?: string[]
  /** Outer dry-brush bristle hairs & feathered exit streaks */
  bristles?: string[]
  /** Internal flying-white (feibai) dry-brush split cutouts */
  drySplits?: string[]
}

/**
 * Chiseled sumi-e brush paths matching Reference 3 & Reference 4 (viewBox 0 0 680 430).
 */
const CALLIGRAPHY_STROKES: StrokeSpec[] = [
  // 1. Letter 'A' — Left diagonal sweep with notched brush-press apex & frayed dry-brush foot
  {
    id: 'a-left',
    weight: 0.12,
    maskWidth: 68,
    spine: 'M 192 80 C 150 154 98 258 32 392',
    body: 'M 182 68 L 194 64 L 204 74 L 200 94 C 158 176 106 274 56 362 L 42 384 L 35 376 L 31 394 L 24 398 L 28 374 L 21 382 L 34 348 C 82 254 134 156 176 82 Z',
    innerTonePaths: [
      'M 188 78 C 146 158 96 258 36 376',
      'M 196 86 C 154 166 104 262 48 364',
    ],
    bristles: [
      'M 184 74 C 142 158 88 268 20 398',
      'M 194 84 C 152 166 100 272 30 402',
      'M 76 306 C 54 344 36 376 18 404',
      'M 90 298 C 68 336 50 368 34 394',
    ],
    drySplits: [
      'M 186 82 C 146 162 94 266 26 392',
      'M 194 94 C 154 172 104 268 42 380',
      'M 68 318 C 48 352 34 378 22 398',
    ],
  },
  // 2. Letter 'A' — Heavy chiseled right vertical-curved spine with sharp basal taper
  {
    id: 'a-right',
    weight: 0.12,
    maskWidth: 66,
    spine: 'M 186 72 C 178 156 176 252 192 354',
    body: 'M 172 64 L 188 58 L 208 72 L 210 92 C 198 176 196 258 202 326 L 198 358 L 191 348 L 188 364 L 180 348 C 160 294 156 232 158 172 C 160 118 162 78 172 64 Z',
    innerTonePaths: [
      'M 182 74 C 174 160 176 254 190 348',
      'M 194 80 C 186 164 186 252 196 338',
    ],
    bristles: [
      'M 178 70 C 170 162 170 260 188 360',
      'M 196 76 C 188 166 188 258 196 350',
    ],
    drySplits: [
      'M 184 80 C 176 168 178 258 190 348',
      'M 192 108 C 186 184 186 264 195 342',
    ],
  },
  // 3. Letter 'A' — Bold projecting horizontal crossbar with notched left brush attack
  {
    id: 'a-bar',
    weight: 0.09,
    maskWidth: 58,
    spine: 'M 34 280 C 104 256 176 236 244 226',
    body: 'M 22 276 L 38 262 C 104 240 174 224 234 220 L 250 226 L 238 234 C 182 248 134 268 86 288 C 54 300 32 296 26 284 L 18 282 Z',
    innerTonePaths: [
      'M 32 278 C 102 256 174 236 238 228',
    ],
    bristles: [
      'M 20 282 C 94 258 176 236 250 224',
      'M 32 292 C 104 268 180 242 242 230',
    ],
    drySplits: [
      'M 36 282 C 106 258 178 238 240 226',
    ],
  },
  // 4. Letter 'K' — Heavy slanted backbone with double-notched top brush press
  {
    id: 'k-spine',
    weight: 0.11,
    maskWidth: 64,
    spine: 'M 258 110 C 244 188 226 270 222 348',
    body: 'M 240 100 L 254 92 L 264 102 L 274 98 L 280 116 C 264 166 246 236 236 300 L 230 342 L 224 358 L 218 346 L 214 354 C 204 324 204 278 214 224 C 224 162 230 114 240 100 Z',
    innerTonePaths: [
      'M 256 108 C 240 188 224 268 220 342',
    ],
    bristles: [
      'M 252 106 C 238 188 222 272 218 354',
      'M 268 114 C 250 192 232 272 228 344',
    ],
    drySplits: [
      'M 258 116 C 242 192 226 270 222 342',
      'M 266 124 C 250 196 234 268 228 334',
    ],
  },
  // 5. Letter 'K' — Flared upper-right wing with multi-forked dry-brush bristle tips
  {
    id: 'k-arm',
    weight: 0.1,
    maskWidth: 64,
    spine: 'M 342 112 C 314 154 274 198 228 234',
    body: 'M 332 92 L 340 104 L 348 96 L 354 112 L 360 108 L 356 128 C 344 150 312 180 276 210 C 244 236 222 244 218 232 C 224 218 246 196 270 172 C 304 140 324 108 332 92 Z',
    innerTonePaths: [
      'M 344 108 C 318 148 280 188 232 228',
    ],
    bristles: [
      'M 336 90 C 320 126 284 172 230 226',
      'M 348 102 C 324 144 286 188 236 232',
      'M 358 114 C 330 154 288 196 242 236',
    ],
    drySplits: [
      'M 344 104 C 318 146 280 188 234 228',
      'M 352 116 C 324 154 286 194 240 232',
    ],
  },
  // 6. Letter 'K' — Sweeping lower-right leg with ragged dry-brush exit tail
  {
    id: 'k-leg',
    weight: 0.11,
    maskWidth: 64,
    spine: 'M 224 220 C 266 256 310 300 352 342',
    body: 'M 214 218 C 216 212 222 210 230 214 C 266 234 302 268 334 306 L 356 336 L 348 338 L 358 352 L 342 346 C 314 334 284 312 254 282 C 224 252 210 232 214 218 Z',
    innerTonePaths: [
      'M 226 224 C 268 260 312 302 348 340',
    ],
    bristles: [
      'M 224 226 C 268 264 314 308 356 352',
      'M 232 218 C 276 256 320 298 360 342',
    ],
    drySplits: [
      'M 230 224 C 274 262 316 304 352 344',
      'M 262 256 C 296 288 326 318 350 346',
    ],
  },
  // 7. Letter 'I' — Diagonal slash stroke with wide chiseled top head & split dry-brush tail
  {
    id: 'i-slash',
    weight: 0.09,
    maskWidth: 60,
    spine: 'M 392 120 C 374 186 354 256 340 328',
    body: 'M 376 106 L 390 100 L 402 110 L 412 124 C 402 158 384 214 366 272 L 350 320 L 342 338 L 338 326 L 332 336 C 328 314 332 272 344 224 C 356 164 366 116 376 106 Z',
    innerTonePaths: [
      'M 390 116 C 372 184 352 256 340 322',
    ],
    bristles: [
      'M 388 112 C 370 184 350 260 338 334',
      'M 400 120 C 380 190 360 262 346 326',
    ],
    drySplits: [
      'M 392 116 C 374 186 354 258 342 326',
    ],
  },
  // 8. Letter 'F' — Tall dramatic slanted spine descending into a long razor-split tail
  {
    id: 'f-spine',
    weight: 0.11,
    maskWidth: 66,
    spine: 'M 444 100 C 416 194 378 298 336 392',
    body: 'M 426 94 L 444 86 L 462 104 L 460 120 C 434 192 404 274 372 338 L 348 384 L 336 402 L 334 390 L 324 404 L 332 378 C 346 348 362 300 382 242 C 402 170 416 110 426 94 Z',
    innerTonePaths: [
      'M 442 104 C 412 196 376 298 338 384',
      'M 450 114 C 420 202 386 298 348 372',
    ],
    bristles: [
      'M 440 100 C 410 196 372 304 328 402',
      'M 452 108 C 422 202 384 304 342 392',
      'M 366 326 C 350 358 336 386 322 408',
    ],
    drySplits: [
      'M 442 106 C 414 198 376 300 334 394',
      'M 450 116 C 422 204 386 300 346 380',
    ],
  },
  // 9. Letter 'F' — Top sweeping dry-brush cap bar with long parallel feibai bristle streaks
  {
    id: 'f-top',
    weight: 0.08,
    maskWidth: 60,
    spine: 'M 418 100 C 474 74 540 64 612 68',
    body: 'M 408 98 C 406 90 414 84 426 80 C 476 62 540 52 594 58 L 622 64 L 606 67 L 626 72 L 602 74 L 616 79 C 562 82 508 94 462 110 C 428 122 410 112 408 98 Z',
    innerTonePaths: [
      'M 426 94 C 484 72 548 64 606 68',
    ],
    bristles: [
      'M 424 90 C 484 68 552 58 624 64',
      'M 430 102 C 490 80 556 70 618 75',
      'M 532 60 C 566 56 598 58 628 63',
      'M 542 70 C 574 68 602 70 624 74',
      'M 552 78 C 578 77 602 78 618 81',
    ],
    drySplits: [
      'M 434 94 C 492 72 556 64 618 68',
      'M 484 84 C 536 72 582 68 620 72',
      'M 526 76 C 562 72 594 74 618 77',
    ],
  },
  // 10. Letter 'F' — Middle horizontal sweep dissolving into dry-brush stipple foam at the brush tip
  {
    id: 'f-mid',
    weight: 0.07,
    maskWidth: 60,
    spine: 'M 388 232 C 442 202 496 202 552 234',
    body: 'M 376 232 L 388 218 C 426 196 472 184 510 200 C 534 210 550 222 556 232 C 550 240 538 242 524 236 C 492 218 458 222 424 238 C 396 250 378 246 376 232 Z',
    innerTonePaths: [
      'M 394 228 C 444 202 496 204 546 232',
    ],
    bristles: [
      'M 392 226 C 444 198 496 200 552 230',
      'M 402 236 C 452 212 502 212 554 236',
      'M 482 210 C 510 216 536 226 556 234',
      'M 492 218 C 518 224 540 232 556 238',
    ],
    drySplits: [
      'M 408 228 C 456 204 504 206 552 232',
      'M 468 212 C 500 216 530 226 552 236',
      'M 488 220 C 514 226 536 234 554 239',
    ],
  },
]

type AkifCalligraphyCanvasProps = {
  theme: PortfolioTheme
  stage: WritingStage
  progress: number
  velocity: number
  hintVisible: boolean
  sealStamped: boolean
  isMobile: boolean
  pointerInside: boolean
  pointerPos: { x: number; y: number }
}

/** Deterministic dry-brush foam stipple cluster between F's middle bar and the brush bristles */
const DRY_BRUSH_FOAM = (() => {
  let seed = 19
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  return Array.from({ length: 42 }, (_, idx) => {
    const t = idx / 41
    const baseX = 488 + t * 66 + (rand() - 0.5) * 8
    const baseY = 208 + t * 26 + (rand() - 0.5) * 14
    return {
      x: baseX,
      y: baseY,
      r: 0.7 + rand() * 2.1,
      o: 0.35 + rand() * 0.6,
    }
  })
})()

/** Deterministic fine watercolor spatter droplets around the outer ink wash cloud */
const WASH_SPATTER = (() => {
  let s = 11
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647
  return Array.from({ length: 36 }, () => {
    const a = r() * Math.PI * 2
    const d = 145 + r() * 140
    return {
      x: 265 + Math.cos(a) * d * 1.32,
      y: 212 + Math.sin(a) * d * 0.78,
      r: 1.1 + r() * 3.4,
      o: 0.16 + r() * 0.32,
    }
  })
})()

export function AkifCalligraphyCanvas({
  theme,
  stage,
  progress,
  velocity,
  hintVisible,
  sealStamped,
  isMobile,
  pointerInside,
  pointerPos,
}: AkifCalligraphyCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const spineRefs = useRef<(SVGPathElement | null)[]>([])
  const maskRefs = useRef<(SVGPathElement | null)[]>([])
  const lengthsRef = useRef<number[]>([])
  const brushTipGroupRef = useRef<SVGGElement>(null)
  const trailPathRef = useRef<SVGPathElement>(null)
  const trailPointsRef = useRef<Array<{ x: number; y: number }>>([])

  const isDark = theme === 'dark'
  const inkColor = isDark ? '#EDE7D9' : '#182342'
  const innerToneColor = isDark ? '#DFD7C4' : '#4A6396'
  const bgCutoutColor = isDark ? '#12161E' : '#DCE4F2'
  const sealColor = isDark ? '#E0583E' : '#C8432C'
  const sealTextColor = isDark ? '#F5EFE2' : '#FAF6EE'

  // Measure exact SVG path lengths on mount
  useEffect(() => {
    lengthsRef.current = CALLIGRAPHY_STROKES.map((_, idx) => {
      const el = spineRefs.current[idx]
      if (!el) return 300
      try {
        return el.getTotalLength()
      } catch {
        return 300
      }
    })
  }, [])

  // Update stroke-dashoffset masks & brush tip position via direct DOM updates
  useEffect(() => {
    const clampedProgress = Math.max(0, Math.min(1, progress))
    let accumulatedWeight = 0
    let activeIdx = CALLIGRAPHY_STROKES.length - 1
    let activeLocalProgress = 1

    for (let i = 0; i < CALLIGRAPHY_STROKES.length; i++) {
      const spec = CALLIGRAPHY_STROKES[i]
      const start = accumulatedWeight
      const end = start + spec.weight
      accumulatedWeight = end

      const local =
        clampedProgress <= start
          ? 0
          : clampedProgress >= end
            ? 1
            : (clampedProgress - start) / spec.weight

      if (clampedProgress >= start && clampedProgress <= end) {
        activeIdx = i
        activeLocalProgress = local
      }

      const maskEl = maskRefs.current[i]
      const len = lengthsRef.current[i] || 300
      if (maskEl) {
        maskEl.style.strokeDasharray = `${len + 28}`
        maskEl.style.strokeDashoffset = `${(1 - local) * (len + 28)}`
        const velocityWidthMod = 1 - Math.min(0.2, velocity * 0.14)
        maskEl.style.strokeWidth = `${(spec.maskWidth * velocityWidthMod).toFixed(1)}`
      }
    }

    const tipGroup = brushTipGroupRef.current
    if (!tipGroup) return

    if (clampedProgress <= 0.002) {
      tipGroup.style.opacity = '0'
      trailPointsRef.current = []
      if (trailPathRef.current) trailPathRef.current.setAttribute('d', '')
      return
    }

    const activeSpine = spineRefs.current[activeIdx]
    const activeLen = lengthsRef.current[activeIdx] || 300

    if (activeSpine) {
      try {
        // When complete, rest the brush tip at (554, 234) angled steeply (~28 deg local = ~60 deg shaft angle matching Reference 3 & 4)
        if (clampedProgress >= 0.995) {
          tipGroup.style.opacity = '1'
          tipGroup.setAttribute('transform', 'translate(554, 234) rotate(0)')
        } else {
          const dist = Math.max(0, Math.min(activeLen, activeLocalProgress * activeLen))
          const pt = activeSpine.getPointAtLength(dist)
          const tilt = Math.min(12, velocity * 8)
          tipGroup.style.opacity = '1'
          tipGroup.setAttribute(
            'transform',
            `translate(${pt.x.toFixed(1)}, ${pt.y.toFixed(1)}) rotate(${tilt.toFixed(1)})`,
          )

          const pts = trailPointsRef.current
          pts.push({ x: pt.x, y: pt.y })
          if (pts.length > 10) pts.shift()
          if (trailPathRef.current && pts.length > 1) {
            const d = pts
              .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
              .join(' ')
            trailPathRef.current.setAttribute('d', d)
          }
        }
      } catch {
        // Fallback if SVG path is not ready
      }
    }
  }, [progress, velocity])

  const dryBrushOpacity = Math.min(1, 0.8 + velocity * 0.2)

  return (
    <div className="akif-canvas-stage">
      <svg
        ref={svgRef}
        className="akif-calligraphy-svg"
        viewBox="0 0 680 430"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="AKIF interactive brush calligraphy artwork"
      >
        <defs>
          {/* Distressed carved stamp filter for the vermilion AK / IF seal */}
          <filter id="akifSealRough" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="3" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="1.5" xChannelSelector="R" yChannelSelector="G" result="d" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -7 5.6" result="holes" />
            <feComposite in="d" in2="holes" operator="in" />
          </filter>

          {/* Crisp directional sumi-e dry-brush bristle edge filter */}
          <filter id="akifCrispBrushEdge" x="-6%" y="-6%" width="112%" height="112%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.045 0.18"
              numOctaves="3"
              seed="9"
              result="bristleNoise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="bristleNoise"
              scale="3.6"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>

          {/* Structured Watercolor / Sumi-e Cloud Filter with distinct organic paper-bleed lobes */}
          <filter id="akifSmokyWashCloud" x="-35%" y="-35%" width="170%" height="170%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.028 0.036"
              numOctaves="4"
              seed="17"
              result="cloudNoise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="cloudNoise"
              scale="82"
              xChannelSelector="R"
              yChannelSelector="G"
              result="warpedCloud"
            />
            <feGaussianBlur in="warpedCloud" stdDeviation="2.2" result="softCloud" />
          </filter>

          {/* Secondary crisp watercolor bloom filter for inner smoky mottling */}
          <filter id="akifWashFineEdge" x="-25%" y="-25%" width="150%" height="150%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.042"
              numOctaves="3"
              seed="29"
              result="fineNoise"
            />
            <feDisplacementMap in="SourceGraphic" in2="fineNoise" scale="44" result="warped" />
            <feGaussianBlur in="warped" stdDeviation="1.8" />
          </filter>

          {/* Radial gradients for smoky whitish-gray ink wash in Dark Mode & ice-blue watercolor in Light Mode */}
          <radialGradient id="akifWashCoreGrad" cx="50%" cy="50%" r="50%">
            <stop
              offset="0%"
              stopColor={isDark ? '#9BA7BC' : '#96B0DC'}
              stopOpacity={isDark ? '0.46' : '0.58'}
            />
            <stop
              offset="54%"
              stopColor={isDark ? '#545F73' : '#B8CAE6'}
              stopOpacity={isDark ? '0.32' : '0.42'}
            />
            <stop
              offset="85%"
              stopColor={isDark ? '#2A303C' : '#D5E0F2'}
              stopOpacity={isDark ? '0.16' : '0.22'}
            />
            <stop offset="100%" stopColor={isDark ? '#000000' : '#F4F2EC'} stopOpacity="0" />
          </radialGradient>

          <radialGradient id="akifWashHighlightGrad" cx="48%" cy="44%" r="48%">
            <stop
              offset="0%"
              stopColor={isDark ? '#CDD6E6' : '#88A6D8'}
              stopOpacity={isDark ? '0.32' : '0.48'}
            />
            <stop
              offset="62%"
              stopColor={isDark ? '#6D798E' : '#B4C6E4'}
              stopOpacity={isDark ? '0.18' : '0.28'}
            />
            <stop offset="100%" stopColor={isDark ? '#000000' : '#F4F2EC'} stopOpacity="0" />
          </radialGradient>

          {/* Hidden spine geometry paths used for getPointAtLength measurements */}
          {CALLIGRAPHY_STROKES.map((stroke, idx) => (
            <path
              key={`spine-${stroke.id}`}
              ref={(el) => {
                spineRefs.current[idx] = el
              }}
              d={stroke.spine}
              fill="none"
            />
          ))}

          {/* Individual progressive drawing mask for each calligraphy stroke */}
          {CALLIGRAPHY_STROKES.map((stroke, idx) => (
            <mask
              key={`mask-${stroke.id}`}
              id={`akif-stroke-mask-${stroke.id}`}
              maskUnits="userSpaceOnUse"
              x="0"
              y="0"
              width="680"
              height="430"
            >
              <path
                ref={(el) => {
                  maskRefs.current[idx] = el
                }}
                d={stroke.spine}
                fill="none"
                stroke="#ffffff"
                strokeWidth={stroke.maskWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  strokeDasharray: 600,
                  strokeDashoffset: 600,
                }}
              />
            </mask>
          ))}
        </defs>

        {/* =================================================================
            LAYER 1: STRUCTURED SUMI-E / WATERCOLOR INK-WASH CLOUD BEHIND AKIF
            Matches the distinct billowing lobes in Reference 3 & Reference 4
            ================================================================= */}
        <g
          className="akif-ink-wash-layer"
          style={{
            opacity: Math.min(1, progress * 1.15),
            transition: 'opacity 0.4s ease-out',
          }}
        >
          {/* Multi-lobed watercolor cloud base */}
          <g filter="url(#akifSmokyWashCloud)">
            <ellipse cx="262" cy="210" rx="242" ry="158" fill="url(#akifWashCoreGrad)" />
            <ellipse cx="192" cy="182" rx="170" ry="134" fill="url(#akifWashHighlightGrad)" />
            <ellipse cx="358" cy="218" rx="175" ry="130" fill="url(#akifWashCoreGrad)" />
            {/* Distinct upper-left & top billowing plumes above A, K, I */}
            <circle
              cx="232"
              cy="88"
              r="76"
              fill={isDark ? '#626D82' : '#B2C4E2'}
              fillOpacity={isDark ? '0.3' : '0.42'}
            />
            <circle
              cx="332"
              cy="94"
              r="68"
              fill={isDark ? '#566073' : '#BCCCE6'}
              fillOpacity={isDark ? '0.28' : '0.38'}
            />
            <circle
              cx="114"
              cy="148"
              r="82"
              fill={isDark ? '#667186' : '#AEC2E0'}
              fillOpacity={isDark ? '0.28' : '0.4'}
            />
            <circle
              cx="64"
              cy="208"
              r="58"
              fill={isDark ? '#586376' : '#B8CAE6'}
              fillOpacity={isDark ? '0.26' : '0.36'}
            />
            {/* Lower smoky billows beneath A, K, I */}
            <ellipse
              cx="248"
              cy="336"
              rx="142"
              ry="72"
              fill={isDark ? '#525C6E' : '#B8CAE6'}
              fillOpacity={isDark ? '0.28' : '0.38'}
            />
          </g>

          {/* Crisp inner watercolor blooms & mottled smoky highlights */}
          <g filter="url(#akifWashFineEdge)">
            <ellipse cx="242" cy="196" rx="152" ry="102" fill="url(#akifWashHighlightGrad)" />
            <circle
              cx="222"
              cy="132"
              r="54"
              fill={isDark ? '#8E9BB0' : '#9EB6DF'}
              fillOpacity={isDark ? '0.22' : '0.32'}
            />
            <circle
              cx="296"
              cy="258"
              r="52"
              fill={isDark ? '#8A96AC' : '#A4BCE2'}
              fillOpacity={isDark ? '0.22' : '0.32'}
            />
            <circle
              cx="458"
              cy="236"
              r="50"
              fill={isDark ? '#545E70' : '#BCCCE6'}
              fillOpacity={isDark ? '0.22' : '0.3'}
            />
          </g>

          {/* Subtle organic ink-wash edge droplets */}
          <g filter="url(#akifWashFineEdge)">
            {WASH_SPATTER.map((d, i) => (
              <circle
                key={i}
                cx={d.x}
                cy={d.y}
                r={d.r}
                fill={isDark ? '#6D788C' : '#9EB4DC'}
                fillOpacity={d.o}
              />
            ))}
          </g>
        </g>

        {/* =================================================================
            STAGE 2 HINT: SINGLE IVORY BRUSH STROKE + "Move to write"
            ================================================================= */}
        <g
          className={`akif-hint-layer ${hintVisible && progress < 0.04 ? 'is-visible' : 'is-hidden'}`}
          aria-hidden="true"
        >
          <path
            className="akif-hint-stroke"
            d="M 190 226 C 244 202 324 196 408 214"
            fill="none"
            stroke={inkColor}
            strokeWidth="11"
            strokeLinecap="round"
            filter="url(#akifCrispBrushEdge)"
          />
          <path
            className="akif-hint-feather"
            d="M 198 231 C 254 209 332 204 416 218"
            fill="none"
            stroke={inkColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeOpacity="0.65"
          />
          {!isMobile && (
            <text
              x="302"
              y="268"
              textAnchor="middle"
              className="akif-hint-caption"
              fill={inkColor}
              fillOpacity="0.72"
            >
              Move to write
            </text>
          )}
        </g>

        {/* =================================================================
            LAYER 2: AKIF CALLIGRAPHY LETTERING WITH DRY-BRUSH FEIBAI STREAKS
            ================================================================= */}
        <g className="akif-lettering-layer" filter="url(#akifCrispBrushEdge)">
          {CALLIGRAPHY_STROKES.map((stroke) => (
            <g key={stroke.id} mask={`url(#akif-stroke-mask-${stroke.id})`}>
              {/* Primary variable-thickness chiseled calligraphy silhouette */}
              <path
                d={stroke.body}
                fill={inkColor}
                stroke={inkColor}
                strokeWidth="1.2"
                strokeLinejoin="round"
              />

              {/* Inner tonal wash streaks (provides realistic two-tone indigo brush depth in Light Mode) */}
              {stroke.innerTonePaths?.map((tPath, tIdx) => (
                <path
                  key={`${stroke.id}-tone-${tIdx}`}
                  d={tPath}
                  fill="none"
                  stroke={innerToneColor}
                  strokeWidth={tIdx % 2 === 0 ? '8.5' : '5.5'}
                  strokeLinecap="round"
                  strokeDasharray="42 18 26 14 54 20"
                  strokeOpacity={isDark ? '0.28' : '0.68'}
                />
              ))}

              {/* Outer tapered dry-brush bristle hairs */}
              {stroke.bristles?.map((bPath, bIdx) => (
                <path
                  key={`${stroke.id}-bristle-${bIdx}`}
                  d={bPath}
                  fill="none"
                  stroke={inkColor}
                  strokeWidth={bIdx % 2 === 0 ? '2.8' : '1.5'}
                  strokeLinecap="round"
                  strokeDasharray={bIdx % 2 === 0 ? '28 5 16 4 36 6' : '18 6 24 4'}
                  strokeOpacity={dryBrushOpacity * 0.78}
                />
              ))}

              {/* Internal flying-white (feibai) dry-brush split cutouts */}
              {stroke.drySplits?.map((sPath, sIdx) => (
                <path
                  key={`${stroke.id}-split-${sIdx}`}
                  d={sPath}
                  fill="none"
                  stroke={bgCutoutColor}
                  strokeWidth={sIdx === 0 ? '2.1' : '1.4'}
                  strokeLinecap="round"
                  strokeDasharray="28 46 18 38 36 64"
                  strokeOpacity={isDark ? '0.78' : '0.68'}
                />
              ))}
            </g>
          ))}

          {/* Dry-brush stipple foam at the right end of F's middle stroke leading into the brush tip */}
          <g
            style={{
              opacity: progress > 0.9 ? Math.min(1, (progress - 0.9) / 0.1) : 0,
            }}
          >
            {DRY_BRUSH_FOAM.map((dot, idx) => (
              <circle
                key={`foam-${idx}`}
                cx={dot.x}
                cy={dot.y}
                r={dot.r}
                fill={inkColor}
                fillOpacity={dot.o}
              />
            ))}
          </g>
        </g>

        {/* =================================================================
            LAYER 3: VERMILION AK / IF SEAL (Separate Asset Layer)
            Matches the bold carved serif glyphs & stamp border in Reference 3 & 4
            ================================================================= */}
        <g transform="translate(476, 314)">
          <g className={`akif-seal-layer ${sealStamped ? 'is-stamped' : ''}`} filter="url(#akifSealRough)">
            {/* Outer vermilion stamp block */}
            <rect x="-39" y="-39" width="78" height="78" rx="7" fill={sealColor} />
            {/* Carved inner stamp frame */}
            <rect
              x="-34.5"
              y="-34.5"
              width="69"
              height="69"
              rx="4.5"
              fill="none"
              stroke={sealTextColor}
              strokeWidth="1.75"
              strokeOpacity="0.88"
            />
            {/* Bold carved serif 'AK' top row and 'IF' bottom row filling the seal square */}
            <text
              x="0"
              y="-4"
              textAnchor="middle"
              fill={sealTextColor}
              fontFamily="Georgia, 'Times New Roman', serif"
              fontWeight="700"
              fontSize="27"
              letterSpacing="2.5"
            >
              AK
            </text>
            <text
              x="0"
              y="26"
              textAnchor="middle"
              fill={sealTextColor}
              fontFamily="Georgia, 'Times New Roman', serif"
              fontWeight="700"
              fontSize="27"
              letterSpacing="3.8"
            >
              IF
            </text>
          </g>
        </g>

        {/* =================================================================
            LAYER 4: STEEP-ANGLED (~60°) 3D BRUSH TIP, WOOD/COPPER FERRULE & SHAFT
            Matches the exact angle, scale, and shading in Reference 3 & Reference 4
            ================================================================= */}
        <path
          ref={trailPathRef}
          className="akif-brush-trail"
          d=""
          fill="none"
          stroke={inkColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeOpacity={stage === 'writing' ? '0.26' : '0'}
        />

        <g
          ref={brushTipGroupRef}
          className={`akif-brush-tip-layer ${pointerInside ? 'is-suppressed' : ''}`}
          style={{ opacity: 0 }}
        >
          {/* Soft drop shadow under brush tip */}
          <ellipse
            cx="10"
            cy="-12"
            rx="16"
            ry="6"
            transform="rotate(-58 10 -12)"
            fill="#000000"
            fillOpacity={isDark ? '0.45' : '0.18'}
          />

          {/* Full-bodied calligraphy bristle cone (ivory in dark mode, warm ivory/indigo tip in light mode) */}
          <path
            d="M -4 3 C 2 3 10 -1 16 -12 C 19 -17 18 -24 13 -27 C 8 -29 2 -23 -2 -14 C -5 -7 -6 1 -4 3 Z"
            fill={isDark ? '#F3EDE0' : '#DFC8A8'}
          />
          {/* Ink-loaded bristle tip blending into the stroke */}
          <path
            d="M -4 3 C 0 3 6 0 11 -7 C 7 -9 2 -8 -2 -3 C -4 0 -5 2 -4 3 Z"
            fill={inkColor}
          />

          {/* 3D Shaded Warm Wood / Copper Ferrule Collar */}
          <path
            d="M 8 -24 L 18 -18 L 26 -33 L 16 -39 Z"
            fill="#B87346"
          />
          {/* Left specular highlight along ferrule */}
          <path
            d="M 9 -25 L 13 -23 L 21 -36 L 17 -38 Z"
            fill="#E5A575"
            fillOpacity="0.85"
          />
          {/* Dark ring seam between ferrule and shaft */}
          <path
            d="M 16 -39 L 26 -33 L 28 -36 L 18 -42 Z"
            fill="#3A2214"
          />

          {/* Steep-angled (~60°) Tapered Glossy Bamboo Brush Shaft */}
          <path
            d="M 18 -41 L 26 -36 L 64 -112 L 60 -114 Z"
            fill={isDark ? '#2B2D33' : '#141821'}
          />
          {/* Specular rim highlight along the bamboo shaft */}
          <path
            d="M 19 -41 L 22 -39 L 62 -113 L 60 -114 Z"
            fill={isDark ? '#9EA4B0' : '#687285'}
            fillOpacity="0.75"
          />

          {/* Secondary hanging loop cord near top of brush handle matching Reference 3 & 4 */}
          <path
            d="M 52 -88 C 56 -76 48 -62 39 -52"
            fill="none"
            stroke={isDark ? '#8C929E' : '#3A4358'}
            strokeWidth="1.35"
            strokeLinecap="round"
            strokeOpacity="0.82"
          />
        </g>
      </svg>

      {/* Floating Custom 28px Brush Cursor when hovering interactive desktop canvas */}
      {!isMobile && pointerInside && (
        <div
          className="akif-floating-brush-cursor"
          style={{
            transform: `translate3d(${pointerPos.x}px, ${pointerPos.y}px, 0)`,
          }}
          aria-hidden="true"
        >
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path
              d="M 3 25 C 6 23 10 19 13 13 C 14 10 12 8 10 8 C 7 8 5 12 3 18 C 2 21 2 24 3 25 Z"
              fill={inkColor}
            />
            <path
              d="M 10 8 L 13 10 L 23 2 L 21 0 Z"
              fill="#C87D4B"
            />
          </svg>
        </div>
      )}
    </div>
  )
}
