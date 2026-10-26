import { useEffect, useRef, useState } from 'react'
import {
  siDocker,
  siFigma,
  siFastapi,
  siGithub,
  siJavascript,
  siMongodb,
  siNotion,
  siPostgresql,
  siPrisma,
  siPython,
  siReact,
  siTailwindcss,
  siTensorflow,
  siTypescript,
  siVscodium,
  type SimpleIcon,
} from 'simple-icons'

export type CollapseAnimationState = 'idle' | 'collapsing' | 'collapsed' | 'restoring'

type FallingTechLogosProps = {
  reducedMotion: boolean
  active: boolean
  state: CollapseAnimationState
}

type TechnologyDefinition = {
  id: string
  label: string
  icon: SimpleIcon
}

type StackSlot = {
  x: number
  layer: number
  nudge: number
}

type Tile = {
  id: string
  definitionIndex: number
  slotIndex: number
  spawnedAt: number
  fallDuration: number
  startX: number
  startY: number
  drift: number
  startRotation: number
  targetRotation: number
  landingX: number
  landingY: number
  landedAt?: number
  settled?: boolean
  fadeStart?: number
}

const TECHNOLOGIES: TechnologyDefinition[] = [
  { id: 'github', label: 'GitHub', icon: siGithub },
  { id: 'react', label: 'React', icon: siReact },
  { id: 'python', label: 'Python', icon: siPython },
  { id: 'docker', label: 'Docker', icon: siDocker },
  { id: 'postgresql', label: 'PostgreSQL', icon: siPostgresql },
  { id: 'vscode', label: 'VS Code', icon: siVscodium },
  { id: 'figma', label: 'Figma', icon: siFigma },
  { id: 'notion', label: 'Notion', icon: siNotion },
  { id: 'tensorflow', label: 'TensorFlow', icon: siTensorflow },
  { id: 'tailwind', label: 'Tailwind CSS', icon: siTailwindcss },
  { id: 'prisma', label: 'Prisma', icon: siPrisma },
  { id: 'mongodb', label: 'MongoDB', icon: siMongodb },
  { id: 'typescript', label: 'TypeScript', icon: siTypescript },
  { id: 'javascript', label: 'JavaScript', icon: siJavascript },
  { id: 'fastapi', label: 'FastAPI', icon: siFastapi },
]

// A loose, staggered layout gives the tiles believable support points without a
// physics dependency or the cost of calculating collisions every frame.
const STACK_SLOTS: StackSlot[] = [
  { x: 0.615, layer: 0, nudge: -0.006 },
  { x: 0.705, layer: 0, nudge: 0.004 },
  { x: 0.795, layer: 0, nudge: -0.003 },
  { x: 0.885, layer: 0, nudge: 0.005 },
  { x: 0.58, layer: 1, nudge: 0.004 },
  { x: 0.67, layer: 1, nudge: -0.006 },
  { x: 0.76, layer: 1, nudge: 0.005 },
  { x: 0.85, layer: 1, nudge: -0.004 },
  { x: 0.635, layer: 2, nudge: -0.005 },
  { x: 0.725, layer: 2, nudge: 0.006 },
  { x: 0.815, layer: 2, nudge: -0.004 },
  { x: 0.675, layer: 3, nudge: 0.004 },
  { x: 0.765, layer: 3, nudge: -0.005 },
  { x: 0.705, layer: 4, nudge: -0.003 },
  { x: 0.795, layer: 4, nudge: 0.004 },
]

const STACK_LAYER_GAP = 0.84

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const easeInOut = (value: number) => value * value * (3 - 2 * value)
const easeOut = (value: number) => 1 - (1 - value) * (1 - value)
const easeIn = (value: number) => value * value

function createTile(
  index: number,
  slotIndex: number,
  now: number,
  width: number,
  tileSize: number,
  landingX: number,
  landingY: number,
): Tile {
  const targetRotation = [-9, 6, -5, 10, -12, 5, -7, 11, -4, 8, -10, 4, -6, 9, -3][slotIndex]
  const laneOffset = [-0.14, 0.08, -0.06, 0.12, 0.05, -0.1, 0.1, -0.04, 0.12, -0.08, 0.06, -0.12, 0.08, -0.05, 0.1][slotIndex]
  const drift = [7, -5, 4, -6, 5, -7, 6, -4, 5, -6, 4, -5, 6, -4, 5][slotIndex]
  const entryRotation = [18, -14, 12, -20, 15, -11, 17, -16, 13, -18, 11, -15, 16, -12, 14][slotIndex]
  return {
    id: `tech-tile-${index}`,
    definitionIndex: slotIndex % TECHNOLOGIES.length,
    slotIndex,
    spawnedAt: now,
    fallDuration: 1.85 + (slotIndex % 4) * 0.11,
    startX: landingX + laneOffset * Math.min(18, width * 0.02),
    startY: -tileSize * (0.62 + (slotIndex % 3) * 0.12),
    drift,
    startRotation: targetRotation + entryRotation,
    targetRotation,
    landingX,
    landingY,
  }
}

function createStaticTiles(count: number): Tile[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `tech-static-${index}`,
    definitionIndex: index % TECHNOLOGIES.length,
    slotIndex: index,
    spawnedAt: 0,
    fallDuration: 0,
    startX: 0,
    startY: 0,
    drift: 0,
    startRotation: -8 + (index % 5) * 4,
    targetRotation: -8 + (index % 5) * 4,
    landingX: 0,
    landingY: 0,
    settled: true,
  }))
}

const logoColors: Record<string, string> = {
  github: '#f1f5fb',
  react: '#61dafb',
  python: '#ffd343',
  docker: '#2496ed',
  postgresql: '#699eca',
  vscode: '#45aaf2',
  figma: '#f24e1e',
  notion: '#f1f5fb',
  tensorflow: '#ff9f2f',
  tailwind: '#38bdf8',
  prisma: '#f1f5fb',
  mongodb: '#47a248',
  typescript: '#3178c6',
  javascript: '#f7df1e',
  fastapi: '#16b3a3',
}

function TechnologyMark({ icon }: { icon: SimpleIcon }) {
  const color = logoColors[icon.slug] ?? `#${icon.hex}`
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={icon.path} fill={color} />
    </svg>
  )
}

export function FallingTechLogos({ reducedMotion, active, state }: FallingTechLogosProps) {
  const fieldRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const tilesRef = useRef<Tile[]>([])
  const activeRef = useRef(active)
  const stateRef = useRef(state)
  const startAnimationRef = useRef<() => void>(() => undefined)
  const stopAnimationRef = useRef<() => void>(() => undefined)
  const tileSequenceRef = useRef(0)
  const nextSlotRef = useRef(0)
  const nextSpawnAtRef = useRef(0)
  const phaseRef = useRef<'building' | 'clearing' | 'pause'>('building')
  const pauseUntilRef = useRef(0)
  const maxTilesRef = useRef(15)
  const dimensionsRef = useRef({ width: 0, height: 0, tileSize: 56 })
  const [tiles, setTiles] = useState<Tile[]>([])

  useEffect(() => {
    activeRef.current = active
    if (active) startAnimationRef.current()
    else stopAnimationRef.current()
  }, [active])

  useEffect(() => {
    stateRef.current = state
    if (state === 'idle') startAnimationRef.current()
    else stopAnimationRef.current()
  }, [state])

  useEffect(() => {
    const field = fieldRef.current
    if (!field) return

    let frame = 0
    let visible = true
    let width = 0
    let height = 0
    let pausedAt: number | null = null

    const measure = () => {
      const rect = field.getBoundingClientRect()
      width = rect.width
      height = rect.height
      const mobile = width < 520
      maxTilesRef.current = mobile ? 10 : STACK_SLOTS.length
      dimensionsRef.current = {
        width,
        height,
        tileSize: clamp(width * (mobile ? 0.12 : 0.092), mobile ? 36 : 46, mobile ? 48 : 62),
      }
      field.style.setProperty('--falling-tile-size', `${dimensionsRef.current.tileSize}px`)
    }

    const targetFor = (slotIndex: number) => {
      const { width: currentWidth, height: currentHeight, tileSize } = dimensionsRef.current
      const slot = STACK_SLOTS[slotIndex] ?? STACK_SLOTS[STACK_SLOTS.length - 1]
      const bottomInset = currentWidth < 520 ? 72 : 86
      return {
        x: currentWidth * (slot.x + slot.nudge),
        y: currentHeight - tileSize * 0.52 - bottomInset - slot.layer * tileSize * STACK_LAYER_GAP,
      }
    }

    const updateLandingTargets = () => {
      tilesRef.current.forEach((tile) => {
        const target = targetFor(tile.slotIndex)
        tile.landingX = target.x
        tile.landingY = target.y
      })
    }

    const render = (now: number) => {
      const { width: currentWidth, tileSize } = dimensionsRef.current
      if (!currentWidth) return

      const expiredIds: string[] = []
      tilesRef.current.forEach((tile) => {
        const item = itemRefs.current[tile.id]
        if (!item) return

        const target = { x: tile.landingX, y: tile.landingY }
        let x = target.x
        let y = target.y
        let rotation = tile.targetRotation
        let opacity = 1
        let zIndex = 10 + tile.slotIndex
        let itemPhase = tile.settled ? 'stacked' : 'falling'

        if (phaseRef.current === 'clearing' && tile.fadeStart !== undefined) {
          const progress = clamp((now - tile.fadeStart) / 1450, 0, 1)
          const eased = easeIn(progress)
          if (progress >= 1) {
            expiredIds.push(tile.id)
            item.style.opacity = '0'
            return
          }
          x = target.x + Math.sin(progress * Math.PI) * 3
          y = target.y + eased * 16
          rotation = tile.targetRotation + Math.sin(progress * Math.PI) * 3
          opacity = 1 - eased
          itemPhase = 'fading'
        } else if (!tile.settled) {
          const fallProgress = clamp((now - tile.spawnedAt) / (tile.fallDuration * 1000), 0, 1)
          const fallingEase = easeInOut(fallProgress)
          x = tile.startX + Math.sin(fallProgress * Math.PI) * tile.drift
          y = tile.startY + (target.y - tile.startY) * fallingEase
          rotation = tile.startRotation + (tile.targetRotation - tile.startRotation) * easeOut(fallProgress)
          opacity = clamp(0.25 + fallProgress * 0.75, 0, 1)
          itemPhase = 'falling'

          if (fallProgress >= 1) {
            tile.landedAt ??= now
            const settleProgress = clamp((now - tile.landedAt) / 480, 0, 1)
            const settleEase = easeOut(settleProgress)
            y = target.y - Math.sin(settleProgress * Math.PI) * 7 * (1 - settleEase)
            rotation = tile.targetRotation + Math.sin(settleProgress * Math.PI) * 2.5 * (1 - settleEase)
            itemPhase = 'settling'
            if (settleProgress >= 1) tile.settled = true
          }
        }

        item.style.left = `${x}px`
        item.style.top = `${y}px`
        item.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`
        item.style.opacity = String(opacity)
        item.style.zIndex = String(zIndex)
        item.dataset.phase = itemPhase
        item.setAttribute('aria-hidden', opacity < 0.03 ? 'true' : 'false')
      })

      if (expiredIds.length) {
        const expired = new Set(expiredIds)
        tilesRef.current = tilesRef.current.filter((tile) => !expired.has(tile.id))
        setTiles(tilesRef.current.slice())
      }

      if (phaseRef.current === 'building' && nextSlotRef.current >= maxTilesRef.current && tilesRef.current.length > 0) {
        const stackSettled = tilesRef.current.every((tile) => tile.settled)
        if (stackSettled) {
          phaseRef.current = 'clearing'
          const clearStart = now + 3600
          tilesRef.current.forEach((tile) => {
            tile.fadeStart = clearStart + tile.slotIndex * 220
          })
        }
      }

      if (phaseRef.current === 'clearing' && tilesRef.current.length === 0) {
        phaseRef.current = 'pause'
        pauseUntilRef.current = now + 420
        nextSlotRef.current = 0
        tileSequenceRef.current = 0
      }

      if (phaseRef.current === 'pause' && now >= pauseUntilRef.current) {
        phaseRef.current = 'building'
        nextSpawnAtRef.current = now + 160
      }
    }

    const spawn = (now: number) => {
      if (phaseRef.current !== 'building' || nextSlotRef.current >= maxTilesRef.current) return
      const { width: currentWidth, tileSize } = dimensionsRef.current
      const slotIndex = nextSlotRef.current
      const landing = targetFor(slotIndex)
      const tile = createTile(
        tileSequenceRef.current,
        slotIndex,
        now,
        currentWidth,
        tileSize,
        landing.x,
        landing.y,
      )
      tileSequenceRef.current += 1
      nextSlotRef.current += 1
      tilesRef.current = [...tilesRef.current, tile]
      setTiles(tilesRef.current.slice())
      nextSpawnAtRef.current = now + (currentWidth < 520 ? 900 : 720)
    }

    const shouldAnimate = () =>
      activeRef.current &&
      stateRef.current === 'idle' &&
      !reducedMotion &&
      visible &&
      document.visibilityState === 'visible'

    const stop = () => {
      if (frame) window.cancelAnimationFrame(frame)
      frame = 0
      pausedAt ??= performance.now()
    }

    const tick = (now: number) => {
      frame = 0
      if (!shouldAnimate()) return
      if (phaseRef.current === 'building' && now >= nextSpawnAtRef.current) spawn(now)
      render(now)
      frame = window.requestAnimationFrame(tick)
    }

    const start = () => {
      if (!shouldAnimate()) return
      if (pausedAt !== null) {
        const pausedDuration = performance.now() - pausedAt
        tilesRef.current.forEach((tile) => {
          tile.spawnedAt += pausedDuration
          if (tile.landedAt !== undefined) tile.landedAt += pausedDuration
          if (tile.fadeStart !== undefined) tile.fadeStart += pausedDuration
        })
        nextSpawnAtRef.current += pausedDuration
        pauseUntilRef.current += pausedDuration
        pausedAt = null
      }
      if (!frame) frame = window.requestAnimationFrame(tick)
    }

    const reset = () => {
      stop()
      tilesRef.current = []
      setTiles([])
      nextSlotRef.current = 0
      phaseRef.current = 'building'
      nextSpawnAtRef.current = performance.now() + (reducedMotion ? 0 : 0.18) * 1000
    }

    startAnimationRef.current = start
    stopAnimationRef.current = stop
    measure()
    reset()

    if (reducedMotion) {
      const staticCount = Math.min(maxTilesRef.current, 10)
      const staticTiles = createStaticTiles(staticCount)
      tilesRef.current = staticTiles
      updateLandingTargets()
      setTiles(staticTiles)
      window.requestAnimationFrame(() => render(performance.now()))
    } else {
      start()
    }

    const onResize = () => {
      measure()
      updateLandingTargets()
      render(performance.now())
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') stop()
      else start()
    }

    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVisibilityChange)
    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onResize) : null
    resizeObserver?.observe(field)
    const intersectionObserver = typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting
          if (visible) start()
          else stop()
        }, { threshold: 0 })
      : null
    intersectionObserver?.observe(field)

    return () => {
      stop()
      startAnimationRef.current = () => undefined
      stopAnimationRef.current = () => undefined
      resizeObserver?.disconnect()
      intersectionObserver?.disconnect()
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      tilesRef.current = []
    }
  }, [reducedMotion])

  return (
    <div ref={fieldRef} className="falling-tech-logo-field" aria-hidden="true">
      <div className="falling-tech-logo-floor" />
      {tiles.map((tile) => {
        const definition = TECHNOLOGIES[tile.definitionIndex]
        return (
          <div
            key={tile.id}
            ref={(element) => {
              itemRefs.current[tile.id] = element
            }}
            className={`falling-tech-tile falling-tech-tile-${definition.id}`}
            data-tech={definition.label}
          >
            <TechnologyMark icon={definition.icon} />
          </div>
        )
      })}
    </div>
  )
}
