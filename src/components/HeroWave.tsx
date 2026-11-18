// File: src/components/HeroWave.tsx
import type { PortfolioTheme } from '../hooks/useTheme'

type HeroWaveProps = {
  theme?: PortfolioTheme
}

/**
 * Exact dual-ribbon horizon wave profile from Reference 3 & Reference 4:
 * - Pronounced arch on the left (x: 0..480)
 * - Gentle valley in the center (x: 520..880)
 * - Sweeping rise to the right edge (x: 920..1440)
 */
const WAVE_PRIMARY =
  'M -20,126 C 140,96 310,98 485,122 C 670,148 830,168 1015,152 C 1185,136 1320,86 1460,52'
const WAVE_SECONDARY =
  'M -20,144 C 150,126 320,120 505,138 C 690,156 855,176 1040,160 C 1205,146 1335,104 1460,76'
const WAVE_TERTIARY =
  'M 760,162 C 985,172 1215,112 1460,42'

export function HeroWave({ theme = 'dark' }: HeroWaveProps) {
  const isDark = theme === 'dark'

  return (
    <div className={`hero-bottom-wave ${isDark ? 'is-dark' : 'is-light'}`} aria-hidden="true">
      <svg viewBox="0 0 1440 190" preserveAspectRatio="none" className="hero-bottom-wave-svg">
        <defs>
          <filter id="akifWaveSoftGlow" x="-10%" y="-100%" width="120%" height="300%">
            <feGaussianBlur stdDeviation="3.5" />
          </filter>

          <linearGradient id="akifWaveFill" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={isDark ? '#3276ED' : '#2D5BD6'} stopOpacity={isDark ? '0.07' : '0.08'} />
            <stop offset="50%" stopColor={isDark ? '#3276ED' : '#2D5BD6'} stopOpacity={isDark ? '0.05' : '0.05'} />
            <stop offset="100%" stopColor={isDark ? '#6F9BFF' : '#2D5BD6'} stopOpacity={isDark ? '0.20' : '0.16'} />
          </linearGradient>

          <linearGradient id="akifWaveStrokePrimary" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={isDark ? '#3B7DED' : '#2D5BD6'} stopOpacity="0.65" />
            <stop offset="22%" stopColor={isDark ? '#7AA4FF' : '#1E4FD0'} stopOpacity="0.95" />
            <stop offset="52%" stopColor={isDark ? '#4682F0' : '#2D5BD6'} stopOpacity="0.75" />
            <stop offset="82%" stopColor={isDark ? '#8AB2FF' : '#1E4FD0'} stopOpacity="0.95" />
            <stop offset="94%" stopColor={isDark ? '#E2EEFF' : '#1E4FD0'} stopOpacity="1" />
            <stop offset="100%" stopColor={isDark ? '#7AA4FF' : '#2D5BD6'} stopOpacity="0.8" />
          </linearGradient>

          <linearGradient id="akifWaveStrokeSecondary" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={isDark ? '#3276ED' : '#2D5BD6'} stopOpacity="0.24" />
            <stop offset="50%" stopColor={isDark ? '#4A85F2' : '#2D5BD6'} stopOpacity="0.38" />
            <stop offset="100%" stopColor={isDark ? '#7AA4FF' : '#2D5BD6'} stopOpacity="0.58" />
          </linearGradient>

          <linearGradient id="akifWaveFadeMaskGrad" x1="0" y1="45" x2="0" y2="188" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#000000" />
          </linearGradient>

          <mask id="akifWaveFadeMask" maskUnits="userSpaceOnUse" x="-20" y="0" width="1480" height="190">
            <rect x="-20" y="0" width="1480" height="190" fill="url(#akifWaveFadeMaskGrad)" />
          </mask>
        </defs>

        <g className="akif-wave-drift">
          {/* Restrained blue wash underneath crest */}
          <g mask="url(#akifWaveFadeMask)">
            <path d={`${WAVE_PRIMARY} L 1460,190 L -20,190 Z`} fill="url(#akifWaveFill)" />
          </g>

          {/* Fine secondary and tertiary intersecting ribbon curves */}
          <path
            d={WAVE_SECONDARY}
            fill="none"
            stroke="url(#akifWaveStrokeSecondary)"
            strokeWidth="1.15"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={WAVE_TERTIARY}
            fill="none"
            stroke="url(#akifWaveStrokeSecondary)"
            strokeWidth="0.9"
            vectorEffect="non-scaling-stroke"
          />

          {/* Subtle horizon glow */}
          <path
            d={WAVE_PRIMARY}
            fill="none"
            stroke={isDark ? '#6F9BFF' : '#2D5BD6'}
            strokeWidth="3.5"
            strokeOpacity={isDark ? '0.28' : '0.14'}
            filter="url(#akifWaveSoftGlow)"
            vectorEffect="non-scaling-stroke"
          />

          {/* Main crisp blue horizon curve */}
          <path
            d={WAVE_PRIMARY}
            fill="none"
            stroke="url(#akifWaveStrokePrimary)"
            strokeWidth="1.75"
            vectorEffect="non-scaling-stroke"
          />
        </g>
      </svg>
    </div>
  )
}
