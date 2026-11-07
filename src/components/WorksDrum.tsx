import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { ArrowRight } from 'lucide-react'
import type { Project } from '../data'

/**
 * 3D drum reel. Port of ECHO's WorksWheel to React, tuned for this site:
 * - cards are project images (project.previewImage)
 * - hovering a name in the index, or a side card, turns the drum to it
 * - clicking a card opens the existing project modal via onSelect
 * - drag, arrow keys and Enter work. The page wheel is never captured.
 * - below 760px the drum is replaced by a scroll-snap strip (see CSS)
 */

const CARD_H = 0.4
const CARD_MAX_W = 0.4
const CARD_RATIO = 1.85
const STEP = 40
const DRUM = 2.2
const LENS = 2.7
const BOW = 1.7
const CULL = 1.6
const DRAG_UNITS = 380
const WHEEL_UNITS = 700
const SETTLE = 140
const EASE = 0.12
const HOVER_DELAY = 110
const HOVER_LOCK = 550

type DrumApi = { to: (n: number) => void; nudge: (delta: number) => void; snap: () => void }

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const rad = (deg: number) => (deg * Math.PI) / 180
const bowAt = (deg: number, bow: number) => -bow * (1 - Math.cos(rad(deg)))

type WorksDrumProps = {
  items: Project[]
  onSelect: (project: Project) => void
  reducedMotion: boolean
}

export function WorksDrum({ items, onSelect, reducedMotion }: WorksDrumProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const wheelRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Array<HTMLDivElement | null>>([])
  const [active, setActive] = useState(0)
  const activeRef = useRef(0)
  const api = useRef<DrumApi>({ to: () => {}, nudge: () => {}, snap: () => {} })
  const ui = useRef({ down: false, captured: false, lastY: 0, drag: 0, pointerType: 'mouse', lockUntil: 0, hoverTimer: 0 })
  const count = items.length
  const last = Math.max(count - 1, 0)

  useEffect(() => {
    const stage = stageRef.current
    const wheel = wheelRef.current
    const root = rootRef.current
    if (!stage || !wheel || !root) return

    let turn = 0
    let target = 0
    let frame = 0
    let visible = true
    let metrics = { cardW: 0, cardH: 0, drumR: 0, bow: 0 }

    const measure = () => {
      const w = stage.clientWidth || 800
      const h = stage.clientHeight || 600
      const cardW = Math.min(h * CARD_H * CARD_RATIO, w * CARD_MAX_W)
      const cardH = cardW / CARD_RATIO
      metrics = { cardW, cardH, drumR: cardH * DRUM, bow: cardH * BOW }
      stage.style.perspective = `${cardH * LENS}px`
      root.style.setProperty('--drum-card-w', `${cardW}px`)
      cardRefs.current.forEach((card) => {
        if (!card) return
        card.style.width = `${cardW}px`
        card.style.height = `${cardH}px`
        card.style.marginLeft = `${-cardW / 2}px`
        card.style.marginTop = `${-cardH / 2}px`
      })
      request()
    }

    const draw = () => {
      frame = 0
      const gap = target - turn
      if (Math.abs(gap) < 0.0005) turn = target
      else turn += gap * (reducedMotion ? 1 : EASE)

      const { drumR, bow } = metrics
      wheel.style.transform = `translateZ(${-drumR}px)`
      for (let i = 0; i < count; i++) {
        const card = cardRefs.current[i]
        if (!card) continue
        const d = i - turn
        const deg = d * STEP
        card.style.transform = `translateX(${bowAt(deg, bow)}px) rotateX(${deg}deg) translateZ(${drumR}px)`
        card.style.opacity = Math.abs(d) > CULL ? '0' : '1'
        card.style.pointerEvents = Math.abs(d) > CULL ? 'none' : 'auto'
        card.style.zIndex = String(Math.round(100 - Math.abs(d) * 2))
        card.style.setProperty('--shade', String(clamp(Math.abs(d) * 0.5, 0, 0.78)))
      }
      const near = clamp(Math.round(turn), 0, last)
      if (near !== activeRef.current) {
        activeRef.current = near
        setActive(near)
      }
      if (turn !== target) request()
    }

    function request() {
      if (!frame && visible) frame = requestAnimationFrame(draw)
    }

    api.current = {
      to: (next) => {
        target = clamp(next, 0, last)
        request()
      },
      nudge: (delta) => {
        target = clamp(target + delta, 0, last)
        request()
      },
      snap: () => {
        target = clamp(Math.round(target), 0, last)
        request()
      },
    }

    let settle = 0
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return
      const unit = event.deltaMode === 1 ? 16 : 1
      const next = target + (event.deltaY * unit) / WHEEL_UNITS
      // Inside the range the drum takes the scroll. At either end the page scrolls on.
      if (next > 0 && next < last) event.preventDefault()
      target = clamp(next, 0, last)
      request()
      window.clearTimeout(settle)
      settle = window.setTimeout(() => {
        target = clamp(Math.round(target), 0, last)
        request()
      }, SETTLE)
    }
    stage.addEventListener('wheel', onWheel, { passive: false })

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(stage)
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) request()
    })
    io.observe(stage)
    const state = ui.current

    return () => {
      stage.removeEventListener('wheel', onWheel)
      window.clearTimeout(settle)
      cancelAnimationFrame(frame)
      window.clearTimeout(state.hoverTimer)
      ro.disconnect()
      io.disconnect()
    }
  }, [count, last, reducedMotion])

  const to = useCallback((n: number) => api.current.to(n), [])

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const s = ui.current
    s.down = true
    s.captured = false
    s.drag = 0
    s.lastY = event.clientY
    s.pointerType = event.pointerType
  }
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const s = ui.current
    if (!s.down) return
    const diff = s.lastY - event.clientY
    s.drag += Math.abs(diff)
    if (s.drag > 6 && !s.captured) {
      s.captured = true
      try {
        stageRef.current?.setPointerCapture(event.pointerId)
      } catch {
        // Pointer capture is optional.
      }
    }
    if (s.captured) {
      api.current.nudge(diff / DRAG_UNITS)
      s.lastY = event.clientY
    }
  }
  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    const s = ui.current
    if (!s.down) return
    s.down = false
    if (s.captured) {
      try {
        stageRef.current?.releasePointerCapture(event.pointerId)
      } catch {
        // Ignore.
      }
      api.current.snap()
    }
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault()
      to(activeRef.current + 1)
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault()
      to(activeRef.current - 1)
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      const item = items[activeRef.current]
      if (item) onSelect(item)
    }
  }

  const hoverCard = (i: number, event: PointerEvent<HTMLDivElement>) => {
    const s = ui.current
    if (event.pointerType !== 'mouse' || s.down || i === activeRef.current) return
    if (performance.now() < s.lockUntil) return
    window.clearTimeout(s.hoverTimer)
    s.hoverTimer = window.setTimeout(() => {
      s.lockUntil = performance.now() + HOVER_LOCK
      to(i)
    }, HOVER_DELAY)
  }

  const clickCard = (i: number) => {
    const s = ui.current
    if (s.drag > 6) return
    if (s.pointerType === 'mouse' || i === activeRef.current) onSelect(items[i])
    else to(i)
  }

  const current = items[active]

  return (
    <>
      <div ref={rootRef} className="works-drum" data-reveal="rise">
        <div
          ref={stageRef}
          className="drum-stage"
          tabIndex={0}
          role="listbox"
          aria-label="Selected work"
          aria-activedescendant={`drum-card-${active}`}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <div ref={wheelRef} className="drum-wheel">
            {items.map((project, i) => (
              <div
                key={project.id}
                id={`drum-card-${i}`}
                ref={(el) => {
                  cardRefs.current[i] = el
                }}
                role="option"
                aria-selected={i === active}
                aria-label={project.title}
                className="drum-card"
                onClick={() => clickCard(i)}
                onPointerEnter={(event) => hoverCard(i, event)}
                onPointerLeave={() => window.clearTimeout(ui.current.hoverTimer)}
                data-cursor="OPEN"
              >
                <div className="drum-face">
                  <img src={project.previewImage} alt="" draggable={false} loading="eager" />
                  <span className="drum-shade" />
                  <span className="drum-card-meta">
                    <b>{project.index}</b>
                    <span>{project.title}</span>
                    <i>OPEN</i>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="drum-title" aria-live="polite">
          <span className="mono-label">
            [{current.index}] {current.category}
          </span>
          <strong key={current.id}>{current.title}</strong>
          <p>{current.description}</p>
          <button className="text-arrow" type="button" onClick={() => onSelect(current)} data-cursor="EXPLORE">
            OPEN CASE STUDY <ArrowRight size={15} />
          </button>
        </div>

        <ol className="drum-index" aria-label="Project index">
          {items.map((project, i) => (
            <li key={project.id}>
              <button
                type="button"
                className={i === active ? 'is-active' : ''}
                onPointerEnter={(event) => {
                  if (event.pointerType === 'mouse') to(i)
                }}
                onFocus={() => to(i)}
                onClick={() => (ui.current.pointerType === 'mouse' && i === active ? onSelect(project) : to(i))}
                onPointerDown={(event) => {
                  ui.current.pointerType = event.pointerType
                }}
              >
                <small>{project.index}</small>
                {project.title}
              </button>
            </li>
          ))}
        </ol>

        <div className="drum-counter mono-label">
          {String(active + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
        </div>
        <div className="drum-hint mono-label">SCROLL, HOVER A NAME OR DRAG / CLICK A CARD TO OPEN</div>
      </div>

      <div className="works-strip" data-reveal="rise">
        {items.map((project) => (
          <button key={project.id} type="button" className="works-strip-card" onClick={() => onSelect(project)}>
            <img src={project.previewImage} alt="" loading="lazy" />
            <span className="mono-label">
              [{project.index}] {project.category}
            </span>
            <strong>{project.title}</strong>
          </button>
        ))}
      </div>
    </>
  )
}

