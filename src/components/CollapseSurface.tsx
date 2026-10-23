import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

export type CollapseSurfaceHandle = {
  setSnapshot: (snapshot: HTMLCanvasElement) => void
  setTarget: (x: number, y: number) => void
  setProgress: (progress: number) => void
  setVisible: (visible: boolean) => void
  clear: () => void
}

type SurfaceVertex = { x: number; y: number; z: number }
type SurfaceTriangle = {
  source: [SurfaceVertex, SurfaceVertex, SurfaceVertex]
  destination: [SurfaceVertex, SurfaceVertex, SurfaceVertex]
  z: number
}

const GRID_COLUMNS = 16
const GRID_ROWS = 10
const TAU = Math.PI * 2

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const smoothstep = (edge0: number, edge1: number, value: number) => {
  const normalized = clamp((value - edge0) / (edge1 - edge0), 0, 1)
  return normalized * normalized * (3 - 2 * normalized)
}

function expandPoint(point: SurfaceVertex, centerX: number, centerY: number) {
  const dx = point.x - centerX
  const dy = point.y - centerY
  const length = Math.hypot(dx, dy)
  if (length < 0.001) return point
  const pad = 0.65
  return { ...point, x: point.x + (dx / length) * pad, y: point.y + (dy / length) * pad }
}

function transformTriangle(
  context: CanvasRenderingContext2D,
  snapshot: HTMLCanvasElement,
  source: [SurfaceVertex, SurfaceVertex, SurfaceVertex],
  destination: [SurfaceVertex, SurfaceVertex, SurfaceVertex],
  pixelRatio: number,
) {
  const [sourceA, sourceB, sourceC] = source
  const [destinationA, destinationB, destinationC] = destination
  const sourceABx = sourceB.x - sourceA.x
  const sourceABy = sourceB.y - sourceA.y
  const sourceACx = sourceC.x - sourceA.x
  const sourceACy = sourceC.y - sourceA.y
  const determinant = sourceABx * sourceACy - sourceACx * sourceABy
  if (Math.abs(determinant) < 0.001) return

  const destinationABx = destinationB.x - destinationA.x
  const destinationABy = destinationB.y - destinationA.y
  const destinationACx = destinationC.x - destinationA.x
  const destinationACy = destinationC.y - destinationA.y
  const a = (destinationABx * sourceACy - destinationACx * sourceABy) / determinant
  const c = (sourceABx * destinationACx - sourceACx * destinationABx) / determinant
  const b = (destinationABy * sourceACy - destinationACy * sourceABy) / determinant
  const d = (sourceABx * destinationACy - sourceACx * destinationABy) / determinant
  const e = destinationA.x - a * sourceA.x - c * sourceA.y
  const f = destinationA.y - b * sourceA.x - d * sourceA.y

  const centerX = (destinationA.x + destinationB.x + destinationC.x) / 3
  const centerY = (destinationA.y + destinationB.y + destinationC.y) / 3
  const paddedA = expandPoint(destinationA, centerX, centerY)
  const paddedB = expandPoint(destinationB, centerX, centerY)
  const paddedC = expandPoint(destinationC, centerX, centerY)

  context.save()
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  context.beginPath()
  context.moveTo(paddedA.x, paddedA.y)
  context.lineTo(paddedB.x, paddedB.y)
  context.lineTo(paddedC.x, paddedC.y)
  context.closePath()
  context.clip()
  context.setTransform(pixelRatio * a, pixelRatio * b, pixelRatio * c, pixelRatio * d, pixelRatio * e, pixelRatio * f)
  context.drawImage(snapshot, 0, 0)
  context.restore()
}

function drawCreases(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  target: { x: number; y: number },
  progress: number,
  pixelRatio: number,
) {
  const strength = smoothstep(0.05, 0.38, progress) * (1 - smoothstep(0.82, 0.98, progress))
  if (strength <= 0) return

  const maxDistance = Math.hypot(Math.max(target.x, width - target.x), Math.max(target.y, height - target.y))
  context.save()
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  context.globalCompositeOperation = 'screen'
  context.lineCap = 'round'
  context.lineWidth = Math.max(0.7, 1.5 * (1 - progress * 0.7))

  for (let index = 0; index < 12; index += 1) {
    const angle = (index / 12) * TAU + progress * 1.15
    const directionX = Math.cos(angle)
    const directionY = Math.sin(angle)
    const tangentX = -directionY
    const tangentY = directionX
    const startRadius = 8 + progress * 45
    const endRadius = maxDistance * (1 - progress * 0.72) * (0.65 + (index % 3) * 0.08)
    const bend = Math.sin(index * 2.4 + progress * 8) * (24 + progress * 42) * (1 - progress * 0.6)
    const startX = target.x + directionX * startRadius
    const startY = target.y + directionY * startRadius
    const endX = target.x + directionX * endRadius
    const endY = target.y + directionY * endRadius
    const controlX = target.x + directionX * endRadius * 0.48 + tangentX * bend
    const controlY = target.y + directionY * endRadius * 0.48 + tangentY * bend

    context.beginPath()
    context.moveTo(startX, startY)
    context.quadraticCurveTo(controlX, controlY, endX, endY)
    context.strokeStyle = `rgba(164, 220, 255, ${0.04 + strength * 0.1})`
    context.stroke()
  }
  context.restore()
}

const CollapseSurface = forwardRef<CollapseSurfaceHandle>(function CollapseSurface(_, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)
  const snapshotRef = useRef<HTMLCanvasElement | null>(null)
  const verticesRef = useRef<SurfaceVertex[][]>([])
  const trianglesRef = useRef<SurfaceTriangle[]>([])
  const targetRef = useRef({ x: 0, y: 0 })
  const progressRef = useRef(0)
  const visibleRef = useRef(false)
  const renderFrameRef = useRef(0)
  const viewportRef = useRef({ width: 0, height: 0, pixelRatio: 1 })

  const buildTopology = (snapshot: HTMLCanvasElement) => {
    const vertices: SurfaceVertex[][] = []
    for (let row = 0; row <= GRID_ROWS; row += 1) {
      const vertexRow: SurfaceVertex[] = []
      for (let column = 0; column <= GRID_COLUMNS; column += 1) {
        vertexRow.push({ x: 0, y: 0, z: 0 })
      }
      vertices.push(vertexRow)
    }

    const triangles: SurfaceTriangle[] = []
    for (let row = 0; row < GRID_ROWS; row += 1) {
      for (let column = 0; column < GRID_COLUMNS; column += 1) {
        const sourceX0 = (column / GRID_COLUMNS) * snapshot.width
        const sourceX1 = ((column + 1) / GRID_COLUMNS) * snapshot.width
        const sourceY0 = (row / GRID_ROWS) * snapshot.height
        const sourceY1 = ((row + 1) / GRID_ROWS) * snapshot.height
        const topLeft = vertices[row][column]
        const topRight = vertices[row][column + 1]
        const bottomLeft = vertices[row + 1][column]
        const bottomRight = vertices[row + 1][column + 1]
        const sourceTopLeft = { x: sourceX0, y: sourceY0, z: 0 }
        const sourceTopRight = { x: sourceX1, y: sourceY0, z: 0 }
        const sourceBottomLeft = { x: sourceX0, y: sourceY1, z: 0 }
        const sourceBottomRight = { x: sourceX1, y: sourceY1, z: 0 }

        triangles.push({
          source: [sourceTopLeft, sourceTopRight, sourceBottomLeft],
          destination: [topLeft, topRight, bottomLeft],
          z: 0,
        })
        triangles.push({
          source: [sourceTopRight, sourceBottomRight, sourceBottomLeft],
          destination: [topRight, bottomRight, bottomLeft],
          z: 0,
        })
      }
    }

    verticesRef.current = vertices
    trianglesRef.current = triangles
  }

  const render = () => {
    const canvas = canvasRef.current
    const snapshot = snapshotRef.current
    if (!canvas || !snapshot) return
    const context = contextRef.current ?? canvas.getContext('2d')
    if (!context) return
    contextRef.current = context

    const { width, height, pixelRatio } = viewportRef.current
    if (!width || !height) return
    const progress = clamp(progressRef.current, 0, 1)
    const { x: targetX, y: targetY } = targetRef.current
    const maxDistance = Math.max(1, Math.hypot(Math.max(targetX, width - targetX), Math.max(targetY, height - targetY)))
    const fade = smoothstep(0.94, 1, progress)
    if (!verticesRef.current.length || !trianglesRef.current.length) buildTopology(snapshot)
    const vertices = verticesRef.current
    const triangles = trianglesRef.current

    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
    context.clearRect(0, 0, width, height)

    for (let row = 0; row <= GRID_ROWS; row += 1) {
      const vertexRow = vertices[row]
      const v = row / GRID_ROWS
      for (let column = 0; column <= GRID_COLUMNS; column += 1) {
        const u = column / GRID_COLUMNS
        const originalX = u * width
        const originalY = v * height
        const deltaX = originalX - targetX
        const deltaY = originalY - targetY
        const distance = Math.hypot(deltaX, deltaY)
        const normalizedDistance = clamp(distance / maxDistance, 0, 1)
        const radialX = distance > 0 ? deltaX / distance : 0
        const radialY = distance > 0 ? deltaY / distance : 0
        const tangentX = -radialY
        const tangentY = radialX
        const pullStart = normalizedDistance * 0.16
        const pullEnd = 0.68 + normalizedDistance * 0.24
        const rawPull = clamp((progress - pullStart) / Math.max(0.001, pullEnd - pullStart), 0, 1)
        const globalTug = progress * 0.12 * (1 - rawPull)
        const localPull = clamp(rawPull * rawPull * (2.6 - 1.6 * rawPull) + globalTug, 0, 1)
        const tension = Math.sin(localPull * Math.PI)
        const pleatWave = Math.sin((u * 6.5 - v * 4.2) * TAU + progress * 10)
        const curtainSag = tension * (18 + (1 - normalizedDistance) * 34) * (1 - localPull * 0.5)
        const fold = pleatWave * tension * (22 + normalizedDistance * 48) * (1 - localPull * 0.85)
        const vortex = smoothstep(0.1, 0.95, progress)
        const twist = vortex * (0.25 + Math.pow(1 - normalizedDistance, 1.4) * 2.15) * localPull
        const cosTwist = Math.cos(twist)
        const sinTwist = Math.sin(twist)
        const twistedX = deltaX * cosTwist - deltaY * sinTwist
        const twistedY = deltaX * sinTwist + deltaY * cosTwist
        const radialScale = Math.max(0, 1 - localPull)
        const creaseDepth = pleatWave * (fold * 0.05) + (1 - normalizedDistance) * localPull * 16

        const vertex = vertexRow[column]
        vertex.x = targetX + twistedX * radialScale + tangentX * fold
        vertex.y = targetY + twistedY * radialScale + tangentY * fold + curtainSag * radialY
        vertex.z = creaseDepth
      }
    }

    triangles.forEach((triangle) => {
      triangle.z = (triangle.destination[0].z + triangle.destination[1].z + triangle.destination[2].z) / 3
    })
    triangles.sort((first, second) => first.z - second.z)
    context.globalAlpha = 1 - fade
    context.globalCompositeOperation = 'source-over'
    triangles.forEach((triangle) => transformTriangle(context, snapshot, triangle.source, triangle.destination, pixelRatio))
    drawCreases(context, width, height, targetRef.current, progress, pixelRatio)

    if (progress > 0.12) {
      const horizonGrowth = Math.pow(smoothstep(0.12, 0.92, progress), 2.1)
      const coreRadius = 20 + horizonGrowth * maxDistance * 0.42
      const horizon = context.createRadialGradient(targetX, targetY, coreRadius * 0.62, targetX, targetY, coreRadius * 1.35)
      horizon.addColorStop(0, `rgba(0, 0, 0, ${clamp(progress * 1.2, 0, 1)})`)
      horizon.addColorStop(0.7, `rgba(5, 16, 38, ${clamp(progress * 0.46, 0, 0.48)})`)
      horizon.addColorStop(0.82, `rgba(166, 222, 255, ${0.14 * Math.sin(progress * Math.PI)})`)
      horizon.addColorStop(1, 'rgba(0, 0, 0, 0)')
      context.fillStyle = horizon
      context.fillRect(0, 0, width, height)
    }
  }

  const queueRender = () => {
    if (!renderFrameRef.current) {
      renderFrameRef.current = window.requestAnimationFrame(() => {
        renderFrameRef.current = 0
        render()
      })
    }
  }

  const resize = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const width = window.innerWidth
    const height = window.innerHeight
    const pixelRatio = 1
    viewportRef.current = { width, height, pixelRatio }
    canvas.width = width
    canvas.height = height
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    if (visibleRef.current) render()
  }

  useImperativeHandle(ref, () => ({
    setSnapshot(snapshot) {
      snapshotRef.current = snapshot
      buildTopology(snapshot)
    },
    setTarget(x, y) {
      targetRef.current = { x, y }
    },
    setProgress(progress) {
      progressRef.current = progress
      queueRender()
    },
    setVisible(visible) {
      visibleRef.current = visible
      const canvas = canvasRef.current
      canvas?.classList.toggle('is-visible', visible)
      if (visible) queueRender()
    },
    clear() {
      if (renderFrameRef.current) window.cancelAnimationFrame(renderFrameRef.current)
      renderFrameRef.current = 0
      snapshotRef.current = null
      progressRef.current = 0
      visibleRef.current = false
      const canvas = canvasRef.current
      const context = contextRef.current
      if (canvas && context) context.clearRect(0, 0, canvas.width, canvas.height)
      canvas?.classList.remove('is-visible')
    },
  }), [])

  useEffect(() => {
    contextRef.current = canvasRef.current?.getContext('2d') ?? null
    resize()
    window.addEventListener('resize', resize)
    return () => {
      window.removeEventListener('resize', resize)
      if (renderFrameRef.current) window.cancelAnimationFrame(renderFrameRef.current)
      contextRef.current = null
    }
  }, [])

  return <canvas ref={canvasRef} className="collapse-surface" aria-hidden="true" />
})

export { CollapseSurface }
