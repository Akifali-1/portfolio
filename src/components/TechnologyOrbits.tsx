import { useEffect, useRef, type RefObject } from 'react'
import {
  siDocker,
  siFastapi,
  siGit,
  siGithub,
  siJavascript,
  siPostgresql,
  siPython,
  siReact,
  siTypescript,
  type SimpleIcon,
} from 'simple-icons'

export type CollapseAnimationState = 'idle' | 'collapsing' | 'collapsed' | 'restoring'

type TechnologyOrbitsProps = {
  reducedMotion: boolean
  active: boolean
  state: CollapseAnimationState
  containerRef: RefObject<HTMLElement | null>
  blackHoleTargetRef: RefObject<HTMLElement | null>
}

type OrbitPoint = {
  x: number
  y: number
  depth: number
  rotation: number
  consumed?: number
}

type OrbitDefinition = {
  id: string
  label: string
  icon: SimpleIcon
  phase: number
  speed: number
  convergeDelay: number
  path: (progress: number, inward: number) => OrbitPoint
}

const TAU = Math.PI * 2
const ORBIT_SPEED = 0.035
const ORBIT_TILT = -22 * Math.PI / 180
const ORBIT_RADIUS_X = 0.3565
const ORBIT_RADIUS_Y = 0.184
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const rotatePoint = (x: number, y: number, angle: number) => ({
  x: x * Math.cos(angle) - y * Math.sin(angle),
  y: x * Math.sin(angle) + y * Math.cos(angle),
})

const sharedOrbit = (angle: number, rotation: number, radiusScale = 1, warp = 0) => {
  const radialWarp = 1 + Math.sin(angle * 2 + warp) * 0.045 + Math.cos(angle * 3 - warp) * 0.018
  return rotatePoint(
    Math.cos(angle) * ORBIT_RADIUS_X * radialWarp * radiusScale,
    (Math.sin(angle) * ORBIT_RADIUS_Y + Math.sin(angle * 2 + warp) * 0.012) * radialWarp * radiusScale,
    ORBIT_TILT + rotation * 0.08,
  )
}

const orbitDefinitions: OrbitDefinition[] = [
  {
    id: 'react',
    label: 'React',
    icon: siReact,
    phase: 0.03,
    speed: ORBIT_SPEED,
    convergeDelay: 15,
    path: (progress, inward) => {
      const angle = progress * TAU
      const point = sharedOrbit(angle, -0.08, 1 - inward * 0.88, 0.2)
      return { ...point, depth: Math.sin(angle), rotation: angle * 180 / Math.PI + 12, consumed: inward }
    },
  },
  {
    id: 'javascript',
    label: 'JavaScript',
    icon: siJavascript,
    phase: 0.14,
    speed: ORBIT_SPEED,
    convergeDelay: 13,
    path: (progress, inward) => {
      const angle = progress * TAU
      const point = sharedOrbit(angle, 0.03, 1 - inward * 0.88, 0.7)
      return { ...point, depth: Math.sin(angle), rotation: angle * 180 / Math.PI + 28, consumed: inward }
    },
  },
  {
    id: 'typescript',
    label: 'TypeScript',
    icon: siTypescript,
    phase: 0.25,
    speed: ORBIT_SPEED,
    convergeDelay: 16,
    path: (progress, inward) => {
      const angle = progress * TAU
      const point = sharedOrbit(angle, 0.12, 1 - inward * 0.9, 1.2)
      return { ...point, depth: Math.sin(angle), rotation: angle * 180 / Math.PI - 18, consumed: inward }
    },
  },
  {
    id: 'python',
    label: 'Python',
    icon: siPython,
    phase: 0.36,
    speed: ORBIT_SPEED,
    convergeDelay: 12,
    path: (progress, inward) => {
      const angle = progress * TAU
      const point = sharedOrbit(angle, -0.12, 1 - inward * 0.86, 2.1)
      return {
        ...point,
        depth: Math.sin(angle),
        rotation: angle * 180 / Math.PI + 90,
        consumed: inward,
      }
    },
  },
  {
    id: 'fastapi',
    label: 'FastAPI',
    icon: siFastapi,
    phase: 0.47,
    speed: ORBIT_SPEED,
    convergeDelay: 13.5,
    path: (progress, inward) => {
      const angle = progress * TAU
      const point = sharedOrbit(angle, -0.04, 1 - inward * 0.9, 2.8)
      return { ...point, depth: Math.sin(angle), rotation: angle * 180 / Math.PI - 8, consumed: inward }
    },
  },
  {
    id: 'git',
    label: 'Git',
    icon: siGit,
    phase: 0.58,
    speed: ORBIT_SPEED,
    convergeDelay: 18,
    path: (progress, inward) => {
      const angle = progress * TAU
      const point = sharedOrbit(angle, 0.05, 1 - inward * 0.87, 2.5)
      return { ...point, depth: Math.sin(angle), rotation: angle * 180 / Math.PI - 22, consumed: inward }
    },
  },
  {
    id: 'docker',
    label: 'Docker',
    icon: siDocker,
    phase: 0.69,
    speed: ORBIT_SPEED,
    convergeDelay: 14,
    path: (progress, inward) => {
      const angle = progress * TAU
      const point = sharedOrbit(angle, 0.16, 1 - inward * 0.89, -0.8)
      return { ...point, depth: Math.sin(angle), rotation: angle * 180 / Math.PI + 5, consumed: inward }
    },
  },
  {
    id: 'github',
    label: 'GitHub',
    icon: siGithub,
    phase: 0.8,
    speed: ORBIT_SPEED,
    convergeDelay: 17,
    path: (progress, inward) => {
      const angle = progress * TAU
      const point = sharedOrbit(angle, 0.08, 1 - inward * 0.86, 1.7)
      return { ...point, depth: Math.sin(angle), rotation: angle * 180 / Math.PI + 4, consumed: inward }
    },
  },
  {
    id: 'postgresql',
    label: 'PostgreSQL',
    icon: siPostgresql,
    phase: 0.91,
    speed: ORBIT_SPEED,
    convergeDelay: 14.5,
    path: (progress, inward) => {
      const angle = progress * TAU
      const point = sharedOrbit(angle, -0.1, 1 - inward * 0.84, 3.4)
      return {
        ...point,
        depth: Math.sin(angle),
        rotation: angle * 180 / Math.PI - 30,
        consumed: inward,
      }
    },
  },
]

function TechnologyMark({ icon }: { icon: SimpleIcon }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={icon.path} />
    </svg>
  )
}

function renderOrbitPoint(
  definition: OrbitDefinition,
  elapsed: number,
  collapseInward: number,
  reducedMotion: boolean,
): OrbitPoint {
  const speedBoost = 1 + collapseInward * 2.4
  const progress = reducedMotion
    ? definition.phase
    : (definition.phase + elapsed * definition.speed * speedBoost) % 1
  const normalized = progress < 0 ? progress + 1 : progress
  const inward = clamp(collapseInward, 0, 1)
  return definition.path(normalized, inward)
}

export function TechnologyOrbits({ reducedMotion, active, state, containerRef, blackHoleTargetRef }: TechnologyOrbitsProps) {
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const stateRef = useRef(state)
  const activeRef = useRef(active)
  const elapsedRef = useRef(0)
  const collapseInwardRef = useRef(0)
  const collapsedReturnDelayRef = useRef(0)

  useEffect(() => {
    const previousState = stateRef.current
    stateRef.current = state
    if (state === 'collapsed' && previousState !== 'collapsed') {
      collapseInwardRef.current = 1
      collapsedReturnDelayRef.current = reducedMotion ? 0 : 1.15
    } else if (state === 'restoring') {
      collapsedReturnDelayRef.current = 0
    }
  }, [reducedMotion, state])

  useEffect(() => {
    activeRef.current = active
  }, [active])

  useEffect(() => {
    let lastTime = performance.now()
    let frame = 0
    let width = 0
    let height = 0
    let centerX = 0
    let centerY = 0
    let unit = 1
    let isVisible = true

    const measure = () => {
      const container = containerRef.current
      const target = blackHoleTargetRef.current
      if (!container || !target) return false

      const containerRect = container.getBoundingClientRect()
      const targetRect = target.getBoundingClientRect()
      width = containerRect.width
      height = containerRect.height
      centerX = targetRect.left + targetRect.width / 2 - containerRect.left
      centerY = targetRect.top + targetRect.height / 2 - containerRect.top
      unit = Math.min(width, height)
      return unit > 0
    }

    const render = () => {
      if (!width || !height) return

      orbitDefinitions.forEach((definition, index) => {
        const item = itemRefs.current[definition.id]
        if (!item) return

        const stagger = index * 0.04
        const iconInward = clamp((collapseInwardRef.current - stagger) / (1 - stagger), 0, 1)
        const point = renderOrbitPoint(definition, elapsedRef.current, iconInward, reducedMotion)
        const distance = Math.hypot(point.x, point.y)
        const horizon = Math.min(1, Math.max(0, (0.15 - distance) / 0.11))
        const consumed = Math.min(1, Math.max(horizon, point.consumed ?? 0))
        const depth = Math.min(1, Math.max(0, (point.depth + 1) / 2))
        const opacity = consumed > 0.98 ? 0 : (0.42 + depth * 0.58) * (1 - consumed)
        const scale = (0.78 + depth * 0.26) * (1 - consumed * 0.88)
        const blur = consumed > 0.2 ? consumed * 2.2 : 0
        const zIndex = Math.round(8 + depth * 8 - consumed * 6)
        const x = centerX + point.x * unit
        const y = centerY + point.y * unit

        item.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${scale}) rotate(${point.rotation}deg)`
        item.style.opacity = String(opacity)
        item.style.filter = blur > 0 ? `blur(${blur}px)` : ''
        item.style.zIndex = String(zIndex)
        item.setAttribute('aria-hidden', opacity < 0.03 ? 'true' : 'false')
      })
    }

    const shouldAnimate = () =>
      activeRef.current &&
      !reducedMotion &&
      isVisible &&
      document.visibilityState === 'visible'
    const stop = () => {
      if (frame) window.cancelAnimationFrame(frame)
      frame = 0
    }
    const tick = (now: number) => {
      frame = 0
      const delta = Math.min((now - lastTime) / 1000, 0.1)
      lastTime = now
      if (shouldAnimate()) {
        elapsedRef.current += delta
        if (stateRef.current === 'collapsing') {
          collapseInwardRef.current = clamp(collapseInwardRef.current + delta * 1.15, 0, 1)
        } else if (stateRef.current === 'restoring') {
          collapseInwardRef.current = clamp(collapseInwardRef.current - delta * 0.85, 0, 1)
        } else if (stateRef.current === 'collapsed' && collapseInwardRef.current > 0) {
          if (collapsedReturnDelayRef.current > 0) {
            collapsedReturnDelayRef.current = Math.max(0, collapsedReturnDelayRef.current - delta)
          } else {
            collapseInwardRef.current = clamp(collapseInwardRef.current - delta * 0.52, 0, 1)
          }
        } else {
          collapseInwardRef.current = 0
        }
        render()
        frame = window.requestAnimationFrame(tick)
      }
    }
    const start = () => {
      if (!frame && shouldAnimate()) frame = window.requestAnimationFrame(tick)
    }
    const onResize = () => {
      measure()
      render()
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') stop()
      else start()
    }

    measure()
    render()
    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVisibilityChange)
    const observer = 'IntersectionObserver' in window
      ? new IntersectionObserver(([entry]) => {
          isVisible = entry.isIntersecting
          if (isVisible) start()
          else stop()
        }, { threshold: 0 })
      : null
    const container = containerRef.current
    if (observer && container) observer.observe(container)
    start()

    return () => {
      stop()
      observer?.disconnect()
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [blackHoleTargetRef, containerRef, reducedMotion])

  return (
    <div className="technology-overlay" aria-hidden="true">
      {orbitDefinitions.map((definition) => (
        <div
          key={definition.id}
          ref={(element) => {
            itemRefs.current[definition.id] = element
          }}
          className={`technology-orbit-item technology-orbit-item-${definition.id}`}
          title={definition.label}
        >
          <TechnologyMark icon={definition.icon} />
          <span>{definition.label}</span>
        </div>
      ))}
    </div>
  )
}
