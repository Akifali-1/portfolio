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
  /** Primary filled calligraphy silhouette with variable thickness & tapered ends */
  body: string
  /** Fine outer bristle hairs & dry-brush streaks */
  bristles?: string[]
  /** Internal flying-white (feibai) dry-brush split lines carved out of the stroke */
  drySplits?: string[]
}

/**
 * High-precision SVG brush paths matching Reference 2 (viewBox 0 0 680 430).
 */
const CALLIGRAPHY_STROKES: StrokeSpec[] = [
  // 1. Letter 'A' — Left diagonal sweep with dry-brush feathered base
  {
    id: 'a-left',
    weight: 0.12,
    maskWidth: 64,
    spine: 'M 192 84 C 154 156 104 258 38 382',
    body: 'M 196 72 C 182 72 168 92 150 126 C 118 188 78 274 28 382 C 32 388 42 378 58 352 C 102 276 152 182 198 102 C 206 86 204 72 196 72 Z',
    bristles: [
      'M 188 78 C 148 160 96 266 26 392',
      'M 196 88 C 156 168 106 270 36 396',
      'M 78 302 C 58 338 40 370 22 398',
      'M 92 296 C 72 332 54 364 40 388',
    ],
    drySplits: [
      'M 186 86 C 150 162 102 262 34 384',
      'M 192 96 C 156 172 110 266 46 374',
    ],
  },
  // 2. Letter 'A' — Heavy vertical-curved right spine
  {
    id: 'a-right',
    weight: 0.12,
    maskWidth: 64,
    spine: 'M 184 74 C 176 154 174 248 190 344',
    body: 'M 174 66 C 164 78 162 122 160 182 C 158 242 164 298 184 352 C 192 362 200 348 199 320 C 196 258 196 176 208 92 C 210 72 186 58 174 66 Z',
    bristles: [
      'M 178 72 C 172 162 172 258 188 356',
      'M 194 78 C 188 166 188 256 196 346',
      'M 178 312 C 182 334 188 352 194 364',
    ],
    drySplits: [
      'M 182 82 C 176 168 178 258 190 344',
    ],
  },
  // 3. Letter 'A' — Sweeping horizontal crossbar extending left of A
  {
    id: 'a-bar',
    weight: 0.09,
    maskWidth: 56,
    spine: 'M 42 276 C 106 254 174 236 238 228',
    body: 'M 32 276 C 34 292 56 298 92 286 C 138 268 186 248 242 230 C 248 227 244 220 228 222 C 172 226 106 242 44 264 C 34 268 30 271 32 276 Z',
    bristles: [
      'M 26 280 C 96 258 174 238 246 226',
      'M 38 290 C 106 268 178 244 236 232',
    ],
    drySplits: [
      'M 42 280 C 108 258 176 238 234 228',
    ],
  },
  // 4. Letter 'K' — Bold tilted backbone
  {
    id: 'k-spine',
    weight: 0.11,
    maskWidth: 62,
    spine: 'M 258 112 C 244 188 226 268 222 342',
    body: 'M 244 102 C 232 114 226 164 216 226 C 206 280 206 324 218 350 C 226 354 232 338 236 298 C 246 236 264 166 278 120 C 282 104 258 92 244 102 Z',
    bristles: [
      'M 252 108 C 238 188 222 270 218 352',
      'M 266 116 C 248 192 232 270 228 340',
    ],
    drySplits: [
      'M 258 118 C 242 192 226 268 222 338',
    ],
  },
  // 5. Letter 'K' — Upper right flared brush wing with dry bristle tip
  {
    id: 'k-arm',
    weight: 0.1,
    maskWidth: 62,
    spine: 'M 338 116 C 312 156 274 198 230 234',
    body: 'M 330 98 C 324 112 302 142 270 174 C 246 198 224 218 218 232 C 222 244 246 234 278 208 C 314 178 346 146 354 124 C 358 108 338 94 330 98 Z',
    bristles: [
      'M 336 94 C 322 128 286 172 232 226',
      'M 346 106 C 324 146 286 188 236 232',
      'M 352 118 C 328 156 288 196 242 236',
    ],
    drySplits: [
      'M 342 108 C 316 148 280 188 234 228',
    ],
  },
  // 6. Letter 'K' — Lower right sweeping leg with heavy taper
  {
    id: 'k-leg',
    weight: 0.11,
    maskWidth: 62,
    spine: 'M 224 222 C 266 256 308 298 348 338',
    body: 'M 214 220 C 210 234 228 256 260 286 C 292 316 322 338 350 348 C 356 348 348 330 330 306 C 298 268 262 234 228 214 C 220 210 216 214 214 220 Z',
    bristles: [
      'M 224 226 C 266 262 310 306 352 348',
      'M 232 218 C 274 254 318 296 356 338',
    ],
    drySplits: [
      'M 230 226 C 272 262 314 302 348 340',
    ],
  },
  // 7. Letter 'I' — Crisp diagonal slash stroke
  {
    id: 'i-slash',
    weight: 0.09,
    maskWidth: 58,
    spine: 'M 392 122 C 374 186 354 256 342 324',
    body: 'M 380 108 C 368 118 356 166 344 226 C 334 274 330 314 338 332 C 344 336 354 314 366 270 C 382 214 398 160 408 128 C 412 114 390 102 380 108 Z',
    bristles: [
      'M 388 114 C 370 184 350 258 340 330',
      'M 398 122 C 380 190 360 260 348 322',
    ],
    drySplits: [
      'M 392 118 C 374 186 354 256 344 322',
    ],
  },
  // 8. Letter 'F' — Tall dramatic slanted spine descending below baseline
  {
    id: 'f-spine',
    weight: 0.11,
    maskWidth: 64,
    spine: 'M 444 102 C 416 194 380 296 340 384',
    body: 'M 432 94 C 420 110 402 174 382 246 C 362 310 344 362 330 394 C 336 398 352 376 372 334 C 402 270 432 188 458 114 C 462 98 442 88 432 94 Z',
    bristles: [
      'M 440 102 C 410 196 374 302 332 396',
      'M 450 110 C 420 202 384 302 344 386',
      'M 366 326 C 352 356 338 382 326 402',
    ],
    drySplits: [
      'M 442 108 C 414 198 378 298 338 386',
      'M 450 118 C 422 204 388 298 350 374',
    ],
  },
  // 9. Letter 'F' — Top sweeping dry-brush cap bar with feathered right tips
  {
    id: 'f-top',
    weight: 0.08,
    maskWidth: 58,
    spine: 'M 420 100 C 474 76 538 66 602 70',
    body: 'M 410 98 C 408 112 428 122 462 110 C 506 94 556 82 606 76 C 614 74 608 66 588 62 C 536 54 472 66 420 88 C 412 91 410 94 410 98 Z',
    bristles: [
      'M 424 92 C 482 70 548 60 614 66',
      'M 430 104 C 488 82 552 72 608 76',
      'M 538 62 C 568 58 596 60 620 65',
      'M 548 72 C 576 70 600 72 618 76',
    ],
    drySplits: [
      'M 436 96 C 492 74 554 66 610 70',
      'M 488 86 C 536 74 578 70 612 74',
    ],
  },
  // 10. Letter 'F' — Middle horizontal sweep terminating in dry-brush stipple & brush tip
  {
    id: 'f-mid',
    weight: 0.07,
    maskWidth: 58,
    spine: 'M 392 230 C 444 204 498 204 550 232',
    body: 'M 382 230 C 380 244 398 250 428 238 C 462 222 496 218 530 236 C 542 241 552 240 556 234 C 554 226 536 214 510 202 C 472 186 426 198 390 220 C 384 223 382 226 382 230 Z',
    bristles: [
      'M 396 226 C 446 200 496 202 550 230',
      'M 406 236 C 454 214 502 214 554 236',
      'M 488 212 C 514 218 538 228 556 234',
    ],
    drySplits: [
      'M 412 228 C 458 206 504 208 550 232',
      'M 476 214 C 506 218 532 228 552 236',
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

const SPATTER = (() => {
  let s = 7
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647
  return Array.from({ length: 46 }, () => {
    const a = r() * Math.PI * 2
    const d = 150 + r() * 150
    return { x: 270 + Math.cos(a) * d * 1.35, y: 215 + Math.sin(a) * d * 0.8, r: 0.9 + r() * 3.2, o: 0.18 + r() * 0.4 }
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
  const inkColor = isDark ? '#EDE7D9' : '#1F2A4D'
  const bgCutoutColor = isDark ? '#0B0E13' : '#DCE3F0'
  const sealColor = isDark ? '#E0583E' : '#C2402A'
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
        if (clampedProgress >= 0.995) {
          tipGroup.style.opacity = '1'
          tipGroup.setAttribute('transform', 'translate(554, 232) rotate(28)')
        } else {
          const dist = Math.max(0, Math.min(activeLen, activeLocalProgress * activeLen))
          const pt = activeSpine.getPointAtLength(dist)
          const tilt = 25 + Math.min(12, velocity * 9)
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

  const dryBrushOpacity = Math.min(1, 0.78 + velocity * 0.22)

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
          <filter id="akifSealRough" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="1.4" xChannelSelector="R" yChannelSelector="G" result="d" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -8 6" result="holes" />
            <feComposite in="d" in2="holes" operator="in" />
          </filter>
          {/* Subtle organic dry-brush edge filter (scale=1.9 so strokes stay crisp, never jagged) */}
          <filter id="akifCrispBrushEdge" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.05 0.2"
              numOctaves="3"
              seed="7"
              result="bristleNoise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="bristleNoise"
              scale="3"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>

          {/* Prominent Smoky Whitish-Charcoal Watercolor / Ink-Wash Cloud Filter matching Reference 2 */}
          <filter id="akifSmokyWashCloud" x="-35%" y="-35%" width="170%" height="170%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.03 0.04"
              numOctaves="4"
              seed="14"
              result="cloudNoise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="cloudNoise"
              scale="78"
              xChannelSelector="R"
              yChannelSelector="G"
              result="warpedCloud"
            />
            <feGaussianBlur in="warpedCloud" stdDeviation="3.5" result="softCloud" />
          </filter>

          {/* Secondary fine watercolor edge texture for outer ink-wash billows */}
          <filter id="akifWashFineEdge" x="-25%" y="-25%" width="150%" height="150%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.032"
              numOctaves="3"
              seed="23"
              result="fineNoise"
            />
            <feDisplacementMap in="SourceGraphic" in2="fineNoise" scale="36" result="warped" />
            <feGaussianBlur in="warped" stdDeviation="3.5" />
          </filter>

          {/* Radial gradients for smoky whitish-gray ink wash in Dark Mode & ice-blue wash in Light Mode */}
          <radialGradient id="akifWashCoreGrad" cx="50%" cy="50%" r="50%">
            <stop
              offset="0%"
              stopColor={isDark ? '#8F9BB0' : '#A8BCE0'}
              stopOpacity={isDark ? '0.42' : '0.52'}
            />
            <stop
              offset="52%"
              stopColor={isDark ? '#4E586B' : '#C2D1EA'}
              stopOpacity={isDark ? '0.28' : '0.38'}
            />
            <stop
              offset="82%"
              stopColor={isDark ? '#272D38' : '#DAE3F2'}
              stopOpacity={isDark ? '0.14' : '0.18'}
            />
            <stop offset="100%" stopColor={isDark ? '#000000' : '#F4F2EC'} stopOpacity="0" />
          </radialGradient>

          <radialGradient id="akifWashHighlightGrad" cx="48%" cy="44%" r="48%">
            <stop
              offset="0%"
              stopColor={isDark ? '#C2CCDC' : '#96B0DC'}
              stopOpacity={isDark ? '0.28' : '0.42'}
            />
            <stop
              offset="60%"
              stopColor={isDark ? '#667185' : '#BCCCE6'}
              stopOpacity={isDark ? '0.16' : '0.24'}
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
            LAYER 1: PROMINENT SMOKY WHITISH-CHARCOAL INK WASH BEHIND AKIF
            Matches the organic smoky clouds around A, K, I, F in Reference 2
            ================================================================= */}
        <g
          className="akif-ink-wash-layer"
          style={{
            opacity: Math.min(1, progress * 1.15),
            transition: 'opacity 0.4s ease-out',
          }}
        >
          {/* Broad smoky outer ink-wash cloud */}
          <g filter="url(#akifSmokyWashCloud)">
            <ellipse cx="260" cy="212" rx="235" ry="155" fill="url(#akifWashCoreGrad)" />
            <ellipse cx="195" cy="185" rx="165" ry="130" fill="url(#akifWashHighlightGrad)" />
            <ellipse cx="355" cy="220" rx="170" ry="128" fill="url(#akifWashCoreGrad)" />
            {/* Upper smoky plumes above A, K, I */}
            <circle
              cx="235"
              cy="92"
              r="72"
              fill={isDark ? '#586275' : '#BDCCE4'}
              fillOpacity={isDark ? '0.26' : '0.35'}
            />
            <circle
              cx="330"
              cy="96"
              r="64"
              fill={isDark ? '#4E5768' : '#C6D4EA'}
              fillOpacity={isDark ? '0.24' : '0.32'}
            />
            <circle
              cx="118"
              cy="152"
              r="76"
              fill={isDark ? '#5C667A' : '#B8C8E2'}
              fillOpacity={isDark ? '0.25' : '0.34'}
            />
            {/* Lower smoky billows beneath A & K */}
            <ellipse
              cx="248"
              cy="332"
              rx="135"
              ry="68"
              fill={isDark ? '#4A5363' : '#C2D0E8'}
              fillOpacity={isDark ? '0.24' : '0.32'}
            />
          </g>

          {/* Textured watercolor billows & organic splatter clouds */}
          <g filter="url(#akifWashFineEdge)">
            <ellipse
              cx="245"
              cy="198"
              rx="145"
              ry="96"
              fill="url(#akifWashHighlightGrad)"
            />
            <circle
              cx="74"
              cy="228"
              r="42"
              fill={isDark ? '#525C6E' : '#C4D2E8'}
              fillOpacity={isDark ? '0.22' : '0.3'}
            />
            <circle
              cx="458"
              cy="238"
              r="48"
              fill={isDark ? '#4D5668' : '#C4D2E8'}
              fillOpacity={isDark ? '0.2' : '0.28'}
            />
          </g>
          <g>
            {SPATTER.map((d, i) => (
              <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={isDark ? '#6B7588' : '#9FB3D8'} fillOpacity={d.o} />
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
              {/* Primary variable-thickness calligraphy body */}
              <path d={stroke.body} fill={inkColor} stroke={inkColor} strokeWidth="1.4" strokeLinejoin="round" />

              {/* Outer tapered bristle hairs */}
              {stroke.bristles?.map((bPath, bIdx) => (
                <path
                  key={`${stroke.id}-bristle-${bIdx}`}
                  d={bPath}
                  fill="none"
                  stroke={inkColor}
                  strokeWidth={bIdx % 2 === 0 ? '2.6' : '1.3'}
                  strokeLinecap="round"
                  strokeOpacity={dryBrushOpacity * 0.55}
                />
              ))}

              {/* Internal flying-white (feibai) dry-brush split streaks */}
              {stroke.drySplits?.slice(0, 1).map((sPath, sIdx) => (
                <path
                  key={`${stroke.id}-split-${sIdx}`}
                  d={sPath}
                  fill="none"
                  stroke={bgCutoutColor}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeDasharray="34 90 14 60 52 120"
                  strokeOpacity={Number(isDark ? '0.82' : '0.72') * 0.6}
                />
              ))}
            </g>
          ))}

          {/* Dry-brush stipple ink spray at the right end of F's middle stroke (revealed at >92%) */}
          <g
            style={{
              opacity: progress > 0.92 ? Math.min(1, (progress - 0.92) / 0.08) : 0,
            }}
          >
            <circle cx="526" cy="231" r="2.3" fill={inkColor} fillOpacity="0.88" />
            <circle cx="533" cy="235" r="1.9" fill={inkColor} fillOpacity="0.78" />
            <circle cx="539" cy="229" r="1.6" fill={inkColor} fillOpacity="0.82" />
            <circle cx="544" cy="234" r="2.2" fill={inkColor} fillOpacity="0.9" />
            <circle cx="549" cy="231" r="1.7" fill={inkColor} fillOpacity="0.75" />
            <circle cx="553" cy="236" r="1.4" fill={inkColor} fillOpacity="0.7" />
          </g>
        </g>

        {/* =================================================================
            LAYER 3: VERMILION AK / IF SEAL (Separate Asset Layer)
            ================================================================= */}
        <g transform="translate(476, 314)"><g className={`akif-seal-layer ${sealStamped ? 'is-stamped' : ''}`} filter="url(#akifSealRough)">
          {/* Vermilion stamp block */}
          <rect
            x="-37"
            y="-37"
            width="74"
            height="74"
            rx="6"
            fill={sealColor}
          />
          {/* Subtle single carved stamp border matching Reference 2 */}
          <rect
            x="-33.5"
            y="-33.5"
            width="67"
            height="67"
            rx="4"
            fill="none"
            stroke={sealTextColor}
            strokeWidth="1.35"
            strokeOpacity="0.78"
          />
          {/* Carved 'AK' top row and 'IF' bottom row */}
          <text
            x="0"
            y="-5"
            textAnchor="middle"
            fill={sealTextColor}
            fontFamily="'Playfair Display', Georgia, serif"
            fontWeight="700"
            fontSize="24"
            letterSpacing="2.5"
          >
            AK
          </text>
          <text
            x="0"
            y="23"
            textAnchor="middle"
            fill={sealTextColor}
            fontFamily="'Playfair Display', Georgia, serif"
            fontWeight="700"
            fontSize="24"
            letterSpacing="3.5"
          >
            IF
          </text>
        </g></g>

        {/* =================================================================
            LAYER 4: BRUSH TIP, COPPER FERRULE & BAMBOO SHAFT (Separate Asset)
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
          {/* Tapered calligraphy brush bristle head (ivory in dark mode, deep indigo in light mode) */}
          <path
            d="M -2 2 C 3 0 9 -5 13 -14 C 14 -18 12 -22 8 -23 C 4 -23 0 -18 -3 -10 C -5 -5 -4 0 -2 2 Z"
            fill={inkColor}
          />
          {/* Warm copper/golden-brown ferrule collar matching Reference 2 */}
          <path
            d="M 6 -21 L 13 -17 L 19 -28 L 12 -32 Z"
            fill="#C87D4B"
          />
          {/* Subtle metallic highlight on copper ferrule */}
          <path
            d="M 8 -22 L 10 -21 L 16 -30 L 14 -31 Z"
            fill="#E6A473"
            fillOpacity="0.75"
          />
          {/* Tapered dark bamboo brush shaft extending upper-right */}
          <path
            d="M 13 -31 L 18 -28 L 48 -88 L 45 -90 Z"
            fill={isDark ? '#7E7D7A' : '#1E2433'}
          />
          {/* Fine hanging loop string near top of brush handle matching Reference 2 */}
          <path
            d="M 46 -87 C 52 -78 48 -66 40 -58"
            fill="none"
            stroke={isDark ? '#8E8D8A' : '#3A4358'}
            strokeWidth="1.1"
            strokeLinecap="round"
            strokeOpacity="0.75"
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
