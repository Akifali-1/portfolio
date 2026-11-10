import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { graphLines, projects, type Project } from '../data'
import { clamp, discHalftone, setupCanvas } from '../lib/halftone'

type Node = { id: string; label: string; x: number; y: number; project?: Project; core?: boolean }
type Edge = [string, string]

// Six projects around the core. Positions are percentages of the graph box.
const NODE_POS: Record<string, [number, number]> = {
  tracemint: [15, 32],
  spantrace: [15, 64],
  'adaptive-stgt': [50, 14],
  medgraph: [85, 38],
  'threat-emulation': [72, 80],
  'multi-agent-fraud': [36, 82],
}

// Direct relations that used to hang off the GRAPH ML and SECURITY topic nodes.
const RELATIONS: Edge[] = [
  ['tracemint', 'spantrace'],
  ['spantrace', 'multi-agent-fraud'],
  ['tracemint', 'adaptive-stgt'],
  ['adaptive-stgt', 'medgraph'],
  ['multi-agent-fraud', 'threat-emulation'],
]

type DotGraphProps = {
  onSelect: (project: Project) => void
  reducedMotion: boolean
}

export function DotGraph({ onSelect, reducedMotion }: DotGraphProps) {
  const boxRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [active, setActive] = useState<string | null>(null)
  const activeRef = useRef<string | null>(null)
  const leaveTimer = useRef(0)
  const pointerType = useRef('mouse')
  const redraw = useRef<() => void>(() => {})

  const nodes = useMemo<Node[]>(() => {
    const list: Node[] = [{ id: 'core', label: 'AKIF', x: 50, y: 50, core: true }]
    projects.forEach((project) => {
      const pos = NODE_POS[project.id]
      if (pos) list.push({ id: project.id, label: project.shortTitle, x: pos[0], y: pos[1], project })
    })
    return list
  }, [])

  const edges = useMemo<Edge[]>(() => {
    const spokes: Edge[] = nodes.filter((n) => !n.core).map((n) => ['core', n.id])
    return [...spokes, ...RELATIONS]
  }, [nodes])

  const setActiveNode = useCallback((id: string | null) => {
    activeRef.current = id
    setActive(id)
  }, [])

  const hold = () => window.clearTimeout(leaveTimer.current)
  const release = () => {
    window.clearTimeout(leaveTimer.current)
    leaveTimer.current = window.setTimeout(() => setActiveNode(null), 240)
  }

  useEffect(() => () => window.clearTimeout(leaveTimer.current), [])

  // Auto-cycle active project node on mobile/coarse screens while in view until user taps
  useEffect(() => {
    if (reducedMotion) return
    const isCoarse = window.matchMedia('(pointer: coarse), (max-width: 760px)').matches
    if (!isCoarse) return
    const box = boxRef.current
    if (!box) return

    const projectNodes = nodes.filter((n) => !n.core)
    let idx = 0
    let timer = 0
    let userTouched = false

    const stopCycle = () => {
      userTouched = true
      if (timer) window.clearInterval(timer)
      timer = 0
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !userTouched) {
          setActiveNode(projectNodes[idx]?.id ?? null)
          timer = window.setInterval(() => {
            idx = (idx + 1) % projectNodes.length
            setActiveNode(projectNodes[idx]?.id ?? null)
          }, 2600)
        } else {
          if (timer) window.clearInterval(timer)
          timer = 0
        }
      },
      { threshold: 0.35 },
    )

    io.observe(box)
    box.addEventListener('pointerdown', stopCycle, { passive: true })
    return () => {
      io.disconnect()
      box.removeEventListener('pointerdown', stopCycle)
      if (timer) window.clearInterval(timer)
    }
  }, [nodes, reducedMotion, setActiveNode])

  useEffect(() => {
    const box = boxRef.current
    const canvas = canvasRef.current
    if (!box || !canvas) return

    let w = 0
    let h = 0
    let ctx: CanvasRenderingContext2D | null = null
    let frame = 0
    let visible = true
    const byId = new Map(nodes.map((n) => [n.id, n]))
    const discs = new Map<number, ReturnType<typeof discHalftone>>()
    const pos = (n: Node): [number, number] => [(n.x / 100) * w, (n.y / 100) * h]

    const disc = (radius: number, spacing: number) => {
      const key = Math.round(radius * 10) * 100 + Math.round(spacing * 10)
      let d = discs.get(key)
      if (!d) {
        d = discHalftone(radius, spacing)
        discs.set(key, d)
      }
      return d
    }

    const curve = (a: Node, b: Node, index: number): [number, number, number, number, number, number] => {
      const [ax, ay] = pos(a)
      const [bx, by] = pos(b)
      const mx = (ax + bx) / 2
      const my = (ay + by) / 2
      const bend = ((index % 3) - 1) * 0.07
      return [ax, ay, mx + (by - ay) * (0.1 + bend), my - (bx - ax) * (0.1 + bend), bx, by]
    }
    const bez = (c: ReturnType<typeof curve>, t: number): [number, number] => {
      const u = 1 - t
      return [u * u * c[0] + 2 * u * t * c[2] + t * t * c[4], u * u * c[1] + 2 * u * t * c[3] + t * t * c[5]]
    }

    const draw = (now: number) => {
      frame = 0
      if (!ctx) return
      ctx.clearRect(0, 0, w, h)
      const focus = activeRef.current
      const near = new Set<string>()
      if (focus) {
        near.add(focus)
        edges.forEach(([a, b]) => {
          if (a === focus) near.add(b)
          if (b === focus) near.add(a)
        })
      }
      const time = reducedMotion ? 0 : now / 1000
      const scale = Math.min(w, h)

      // Soft background rings, drawn as very faint dots instead of lines.
      ctx.fillStyle = 'rgba(243,243,240,0.07)'
      ctx.beginPath()
      for (const ringR of [0.3, 0.52]) {
        const rx = ringR * w * 0.82
        const ry = ringR * h * 0.95
        const n = Math.round((Math.PI * 2 * Math.max(rx, ry)) / 9)
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2
          const x = w / 2 + Math.cos(a) * rx
          const y = h / 2 + Math.sin(a) * ry
          ctx.moveTo(x + 0.9, y)
          ctx.arc(x, y, 0.9, 0, Math.PI * 2)
        }
      }
      ctx.fill()

      // Dotted edges.
      edges.forEach(([from, to], index) => {
        const a = byId.get(from)!
        const b = byId.get(to)!
        const c = curve(a, b, index)
        const lit = focus ? near.has(from) && near.has(to) && (from === focus || to === focus) : false
        const dim = focus && !lit
        const length = Math.hypot(c[4] - c[0], c[5] - c[1])
        const count = Math.max(8, Math.round(length / 8))
        ctx!.fillStyle = lit ? 'rgba(243,243,240,0.62)' : dim ? 'rgba(243,243,240,0.1)' : 'rgba(243,243,240,0.26)'
        ctx!.beginPath()
        for (let i = 1; i < count; i++) {
          const [x, y] = bez(c, i / count)
          const r = lit ? 1.25 : 0.95
          ctx!.moveTo(x + r, y)
          ctx!.arc(x, y, r, 0, Math.PI * 2)
        }
        ctx!.fill()
        if (!reducedMotion && (lit || !focus)) {
          const t = (time * 0.12 + index * 0.17) % 1
          const [x, y] = bez(c, t)
          ctx!.fillStyle = lit ? '#f3f3f0' : 'rgba(243,243,240,0.7)'
          ctx!.beginPath()
          ctx!.arc(x, y, lit ? 2.4 : 1.8, 0, Math.PI * 2)
          ctx!.fill()
        }
      })

      // Halftone node discs.
      nodes.forEach((node) => {
        const [x, y] = pos(node)
        const isFocus = focus === node.id
        const inFocus = !focus || near.has(node.id)
        const base = node.core ? scale * 0.075 : scale * 0.055
        const pulse = reducedMotion ? 0 : Math.sin(time * 1.6 + x * 0.01) * 0.25
        const radius = base * (isFocus ? 1.22 : 1) + pulse
        const spacing = clamp(scale / 100, 3.2, 5)
        ctx!.fillStyle = inFocus ? '#f3f3f0' : 'rgba(243,243,240,0.28)'
        ctx!.beginPath()
        for (const d of disc(Math.round(radius), spacing)) {
          ctx!.moveTo(x + d.x + d.r, y + d.y)
          ctx!.arc(x + d.x, y + d.y, d.r, 0, Math.PI * 2)
        }
        ctx!.fill()
      })

      if (!reducedMotion && visible) frame = requestAnimationFrame(draw)
    }

    const render = () => {
      if (frame) cancelAnimationFrame(frame)
      frame = requestAnimationFrame(draw)
    }

    const resize = () => {
      const rect = box.getBoundingClientRect()
      w = Math.floor(rect.width)
      h = Math.floor(rect.height)
      if (w < 20 || h < 20) return
      ctx = setupCanvas(canvas, w, h)
      render()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(box)
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) render()
    })
    io.observe(box)
    resize()
    redraw.current = render

    return () => {
      cancelAnimationFrame(frame)
      ro.disconnect()
      io.disconnect()
    }
  }, [nodes, edges, reducedMotion])

  // Static (reduced motion) redraw when focus changes.
  useEffect(() => {
    if (reducedMotion) redraw.current()
  }, [active, reducedMotion])

  const activeNode = nodes.find((n) => n.id === active && n.project)
  const activeProject = activeNode?.project

  return (
    <div className="dot-graph" data-reveal="rise">
      <div ref={boxRef} className="dot-graph-box" onPointerLeave={release}>
        <canvas ref={canvasRef} aria-hidden="true" />
        {nodes.map((node) => {
          const project = node.project
          return (
            <button
              key={node.id}
              type="button"
              className={`dot-node ${node.core ? 'is-core' : ''} ${active === node.id ? 'is-active' : ''} ${
                active && active !== node.id && !node.core ? 'is-dim' : ''
              }`}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
              onPointerDown={(event) => {
                pointerType.current = event.pointerType
              }}
              onPointerEnter={(event) => {
                if (event.pointerType !== 'mouse') return
                hold()
                setActiveNode(project ? node.id : null)
              }}
              onFocus={() => setActiveNode(project ? node.id : null)}
              onBlur={release}
              onClick={() => {
                if (!project) return
                if (pointerType.current === 'mouse') onSelect(project)
                else setActiveNode(node.id)
              }}
              aria-label={project ? `${project.title}, open project` : node.label}
              data-cursor={project ? 'OPEN' : 'CORE'}
            >
              <span className="dot-node-label">{node.label}</span>
            </button>
          )
        })}

        {activeProject && activeNode && (
          <div
            className={`dot-card ${activeNode.x > 60 ? 'is-left' : activeNode.x < 40 ? 'is-right' : 'is-center'} ${
              activeNode.y > 60 ? 'is-above' : 'is-below'
            }`}
            style={{ left: `${activeNode.x}%`, top: `${activeNode.y}%` }}
            onPointerEnter={hold}
            onPointerLeave={release}
          >
            <span className="mono-label">
              [{activeProject.index}] {activeProject.status}
            </span>
            <strong>{activeProject.title}</strong>
            <p>{graphLines[activeProject.id] ?? activeProject.description}</p>
            <div className="dot-card-actions">
              <button type="button" onClick={() => onSelect(activeProject)}>
                CASE STUDY <ArrowRight size={13} />
              </button>
              {activeProject.link && (
                <a href={activeProject.link} target="_blank" rel="noreferrer">
                  VISIT <ArrowUpRight size={13} />
                </a>
              )}
            </div>
          </div>
        )}
        <div className="dot-axis dot-axis-x mono-label">SYSTEM RELATION</div>
        <div className="dot-axis dot-axis-y mono-label">IDEA DENSITY</div>
      </div>
      <p className="dot-graph-caption mono-label">
        {activeProject ? `${activeProject.signal}` : 'HOVER A NODE. LINES ARE SHARED IDEAS: GRAPHS, AGENTS, EVIDENCE.'}
      </p>
    </div>
  )
}

