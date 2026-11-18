import type { PortfolioTheme } from '../hooks/useTheme'

type HeroWaveProps = {
  theme?: PortfolioTheme
}

const WAVE_PRIMARY =
  'M -20,132 C 180,104 380,114 610,148 C 860,184 1140,122 1460,54'
const WAVE_SECONDARY =
  'M -20,146 C 210,122 410,132 640,162 C 890,192 1160,136 1460,72'
const WAVE_TERTIARY =
  'M 720,164 C 960,178 1210,118 1460,42'

export function HeroWave({ theme = 'dark' }: HeroWaveProps) {
  const isDark = theme === 'dark'

  return (
    <div className={`hero-bottom-wave ${isDark ? 'is-dark' : 'is-light'}`} aria-hidden="true">
      <svg viewBox="0 0 1440 190" preserveAspectRatio="none" className="hero-bottom-wave-svg">
        <defs>
          <linearGradient id="akifWaveFill" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={isDark ? '#3276ED' : '#2D5BD6'} stopOpacity={isDark ? '0.05' : '0.07'} />
            <stop offset="55%" stopColor={isDark ? '#3276ED' : '#2D5BD6'} stopOpacity={isDark ? '0.04' : '0.05'} />
            <stop offset="100%" stopColor={isDark ? '#6F9BFF' : '#2D5BD6'} stopOpacity={isDark ? '0.16' : '0.14'} />
          </linearGradient>

          <linearGradient id="akifWaveStrokePrimary" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={isDark ? '#3276ED' : '#2D5BD6'} stopOpacity="0.35" />
            <stop offset="35%" stopColor={isDark ? '#6F9BFF' : '#2D5BD6'} stopOpacity="0.72" />
            <stop offset="75%" stopColor={isDark ? '#6F9BFF' : '#2D5BD6'} stopOpacity="0.88" />
            <stop offset="94%" stopColor={isDark ? '#DCE8FF' : '#2D5BD6'} stopOpacity="0.95" />
            <stop offset="100%" stopColor={isDark ? '#6F9BFF' : '#2D5BD6'} stopOpacity="0.6" />
          </linearGradient>

          <linearGradient id="akifWaveStrokeSecondary" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={isDark ? '#3276ED' : '#2D5BD6'} stopOpacity="0.12" />
            <stop offset="50%" stopColor={isDark ? '#3276ED' : '#2D5BD6'} stopOpacity="0.28" />
            <stop offset="100%" stopColor={isDark ? '#6F9BFF' : '#2D5BD6'} stopOpacity="0.45" />
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

          {/* Fine secondary and tertiary curves */}
          <path
            d={WAVE_SECONDARY}
            fill="none"
            stroke="url(#akifWaveStrokeSecondary)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={WAVE_TERTIARY}
            fill="none"
            stroke="url(#akifWaveStrokeSecondary)"
            strokeWidth="0.85"
            vectorEffect="non-scaling-stroke"
          />

          {/* Main crisp blue horizon curve */}
          <path
            d={WAVE_PRIMARY}
            fill="none"
            stroke="url(#akifWaveStrokePrimary)"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        </g>
      </svg>
    </div>
  )
}
