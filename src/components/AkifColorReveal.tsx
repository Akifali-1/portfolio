// src/components/AkifColorReveal.tsx
import { useEffect, useRef } from 'react'
import { createColorReveal } from '../lib/colorReveal'
import type { PortfolioTheme } from '../hooks/useTheme'

type Props = {
  /** Pass the existing CALLIGRAPHY_STROKES array (only id and body are used) */
  strokes: ReadonlyArray<{ id: string; body: string }>
  /** true only when the AKIF lettering is fully written (progress >= 0.995) */
  enabled: boolean
  theme: PortfolioTheme
}

/**
 * Hidden second layer: the same AKIF letter shapes in vermilion (the seal color),
 * visible only inside a soft lens that follows the mouse. Mount it inside the same
 * container as the calligraphy SVG so both use the same box.
 */
export function AkifColorReveal({ strokes, enabled, theme }: Props) {
  const ref = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const layer = ref.current
    const host = layer?.parentElement
    if (!enabled || !layer || !host) return
    const noHover = window.matchMedia('(hover: none), (pointer: coarse)').matches
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (noHover || reduce) return
    return createColorReveal(host, layer as unknown as HTMLElement)
  }, [enabled])

  const fill = theme === 'dark' ? '#E0583E' : '#C8432C'
  const mask =
    'radial-gradient(circle var(--rr, 0px) at var(--rx, -999px) var(--ry, -999px), #000 0%, #000 58%, transparent 100%)'

  return (
    <svg
      ref={ref}
      className="akif-calligraphy-svg akif-reveal-layer"
      viewBox="0 0 680 430"
      fill="none"
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        WebkitMaskImage: mask,
        maskImage: mask,
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
      }}
    >
      <defs>
        <filter id="akifRevealEdge" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04 0.16" numOctaves="3" seed="11" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="2.0" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <g filter="url(#akifRevealEdge)">
        {strokes.map((s) => (
          <path key={s.id} d={s.body} fill={fill} fillRule="evenodd" />
        ))}
      </g>
    </svg>
  )
}
