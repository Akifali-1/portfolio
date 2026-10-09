import { useEffect, useRef } from 'react'

type Point = {
  x: number
  y: number
  z: number
  phase: number
  speed: number
}

type SystemCanvasProps = {
  reducedMotion: boolean
}

function createPoints(count: number): Point[] {
  return Array.from({ length: count }, (_, index) => {
    const a = Math.sin(index * 12.9898) * 43758.5453
    const b = Math.sin(index * 78.233) * 43758.5453
    const c = Math.sin(index * 39.425) * 43758.5453
    return {
      x: (a - Math.floor(a)) * 1.3 - 0.15,
      y: (b - Math.floor(b)) * 1.1 - 0.05,
      z: 0.25 + (c - Math.floor(c)) * 0.75,
      phase: index * 0.83,
      speed: 0.12 + (index % 5) * 0.035,
    }
  })
}

export function SystemCanvas({ reducedMotion }: SystemCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return

    let width = 0
    let height = 0
    let frame = 0
    let time = 0
    const pointer = { x: 0.52, y: 0.43, active: false }
    const points = createPoints(window.innerWidth < 700 ? 34 : 78)

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = width * ratio
      canvas.height = height * ratio
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
    }

    const updatePointer = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect()
      pointer.x = (event.clientX - bounds.left) / bounds.width
      pointer.y = (event.clientY - bounds.top) / bounds.height
      pointer.active = true
    }

    const draw = () => {
      context.clearRect(0, 0, width, height)
      const now = time
      const projected = points.map((point) => {
        const drift = reducedMotion ? 0 : Math.sin(now * point.speed + point.phase) * 0.012
        const proximityX = (pointer.x - point.x) * 0.022 * point.z
        const proximityY = (pointer.y - point.y) * 0.022 * point.z
        return {
          x: (point.x + drift + proximityX) * width,
          y: (point.y + drift * 0.45 + proximityY) * height,
          size: 0.65 + point.z * 1.8,
          depth: point.z,
        }
      })

      context.lineWidth = 0.55
      for (let index = 0; index < projected.length; index += 1) {
        for (let target = index + 1; target < projected.length; target += 1) {
          const start = projected[index]
          const end = projected[target]
          const dx = start.x - end.x
          const dy = start.y - end.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          if (distance > Math.min(width, height) * 0.22) continue
          const alpha = (1 - distance / (Math.min(width, height) * 0.22)) * 0.19 * ((start.depth + end.depth) / 2)
          const gradient = context.createLinearGradient(start.x, start.y, end.x, end.y)
          gradient.addColorStop(0, `rgba(77,124,255,${alpha})`)
          gradient.addColorStop(1, `rgba(124,92,255,${alpha * 0.72})`)
          context.strokeStyle = gradient
          context.beginPath()
          context.moveTo(start.x, start.y)
          context.lineTo(end.x, end.y)
          context.stroke()
        }
      }

      projected.forEach((point, index) => {
        const isNearPointer = Math.hypot(point.x / width - pointer.x, point.y / height - pointer.y) < 0.08
        const alpha = 0.24 + point.depth * 0.42 + (isNearPointer ? 0.2 : 0)
        context.fillStyle = isNearPointer ? `rgba(243,243,240,${alpha})` : `rgba(77,124,255,${alpha})`
        context.beginPath()
        context.arc(point.x, point.y, point.size + (isNearPointer ? 0.8 : 0), 0, Math.PI * 2)
        context.fill()
        if (index % 9 === 0 && point.depth > 0.63) {
          context.strokeStyle = `rgba(243,243,240,${alpha * 0.25})`
          context.lineWidth = 0.5
          context.beginPath()
          context.arc(point.x, point.y, point.size * 4.5, 0, Math.PI * 2)
          context.stroke()
        }
      })

      if (!reducedMotion) {
        time += 0.6
        frame = window.requestAnimationFrame(draw)
      }
    }

    resize()
    draw()
    window.addEventListener('resize', resize)
    canvas.addEventListener('pointermove', updatePointer)
    return () => {
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('pointermove', updatePointer)
      window.cancelAnimationFrame(frame)
    }
  }, [reducedMotion])

  return <canvas ref={canvasRef} className="system-canvas" aria-hidden="true" />
}
