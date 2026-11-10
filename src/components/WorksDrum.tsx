// File: src/components/WorksDrum.tsx
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'
import { ArrowRight } from 'lucide-react'
import { Renderer, Program, Mesh, Plane, Texture, Transform } from 'ogl'
import type { Project } from '../data'

/**
 * Spark & Riot style Curved Vertical Reel + Cursor-Side Scroll Tilt:
 * 1. Concave vertical curvature: top & bottom edges stay straight while the left
 *    and right vertical edges curve gently inward (concave hourglass/cylinder profile).
 * 2. Cohesive reel tilt on scroll: while scrolling, if cursor is on the LEFT half,
 *    the entire vertical reel banks counter-clockwise (\). If cursor is on the RIGHT
 *    half, the entire vertical reel banks clockwise (/). Settles upright when scroll stops.
 * 3. No dark vignette or black boundary boxes.
 */

const CARD_H = 0.54
const CARD_RATIO = 1.62
const STEP_GAP = 1.24 // Vertical spacing between card centers in cardH units
const CULL = 1.85
const DRAG_UNITS = 360
const HOVER_DELAY = 110
const HOVER_LOCK = 520

type DrumApi = {
  to: (n: number) => void
  nudge: (delta: number) => void
  snap: () => void
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

const drumVertexShader = `
  attribute vec3 position;
  attribute vec2 uv;

  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;

  uniform float uCardW;
  uniform float uCardH;
  uniform float uOffset;       // (i - turn): 0 = center, -1 = above, +1 = below
  uniform float uStepPx;       // Vertical distance between card centers in px
  uniform float uReelTilt;     // Whole-reel Z rotation angle (radians)
  uniform float uCurveAmount;  // Subtle inward side-edge curvature

  varying vec2 vUv;
  varying vec2 vLocal;

  void main() {
    vUv = uv;
    vLocal = position.xy; // [-0.5, 0.5]

    // Normalized card coordinates in [-1, 1]
    float nx = position.x * 2.0;
    float ny = position.y * 2.0;

    // 1. Subtle inward concave curve on the LEFT and RIGHT vertical edges
    //    (at ny = 0 the card is slightly narrower; at ny = +/-1 corners flare out,
    //     while top & bottom edges remain straight, matching Spark & Riot Image 1)
    float sidePinch = 1.0 - uCurveAmount * 0.0468 * (1.0 - ny * ny);
    float localX = position.x * uCardW * sidePinch;
    float localY = position.y * uCardH;

    // 2. Position card along the vertical reel strip
    //    uOffset > 0 is below center (negative Y in WebGL), uOffset < 0 is above center (+Y)
    float stripY = -uOffset * uStepPx + localY;
    float stripX = localX;

    // 3. Cylindrical Z depth across the vertical viewport so cards curve smoothly in 3D space
    float normScreenY = clamp(stripY / (uCardH * 1.65), -1.4, 1.4);
    float worldZ = -uCardH * 0.238 * (normScreenY * normScreenY) * uCurveAmount;

    // Slight pitch follow along the vertical curve
    float radialPullY = stripY * (1.0 - 0.038 * normScreenY * normScreenY * uCurveAmount);

    // 4. Rotate the ENTIRE vertical reel as one cohesive column around Z
    //    when scrolling with cursor on left or right (matches Images 2 & 3)
    float c = cos(uReelTilt);
    float s = sin(uReelTilt);
    float worldX = stripX * c - radialPullY * s;
    float worldY = stripX * s + radialPullY * c;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(worldX, worldY, worldZ, 1.0);
  }
`

const drumFragmentShader = `
  precision highp float;

  uniform sampler2D tMap;
  uniform vec2 uSize;
  uniform vec2 uImageSize;
  uniform float uOpacity;
  uniform float uReady;

  varying vec2 vUv;
  varying vec2 vLocal;

  void main() {
    if (uOpacity <= 0.002) discard;

    // Crisp anti-aliased edge mask (no black border or dark vignette)
    vec2 halfSize = uSize * 0.5;
    vec2 px = abs(vLocal * uSize) - halfSize;
    float edgeDist = max(px.x, px.y);
    float mask = clamp(0.5 - edgeDist, 0.0, 1.0);
    if (mask <= 0.002) discard;

    // Cover-fit image UVs cleanly
    float cardAspect = uSize.x / max(uSize.y, 1.0);
    float imgAspect = uImageSize.x / max(uImageSize.y, 1.0);
    vec2 scale = imgAspect > cardAspect
      ? vec2(cardAspect / imgAspect, 1.0)
      : vec2(1.0, imgAspect / cardAspect);

    vec2 uv = (vUv - 0.5) * scale + 0.5;
    vec3 texColor = texture2D(tMap, uv).rgb;
    vec3 placeholder = vec3(0.12, 0.12, 0.12);
    vec3 color = mix(placeholder, texColor, uReady);

    float alpha = mask * uOpacity;
    gl_FragColor = vec4(color * alpha, alpha);
  }
`

type WorksDrumProps = {
  items: Project[]
  onSelect: (project: Project) => void
  reducedMotion: boolean
}

export function WorksDrum({ items, onSelect, reducedMotion }: WorksDrumProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const stickyRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const wheelRef = useRef<HTMLDivElement>(null)
  const webglHostRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Array<HTMLDivElement | null>>([])
  const [active, setActive] = useState(0)
  const activeRef = useRef(0)
  const api = useRef<DrumApi>({ to: () => {}, nudge: () => {}, snap: () => {} })

  const ui = useRef({
    down: false,
    captured: false,
    lastY: 0,
    drag: 0,
    pointerType: 'mouse',
    lockUntil: 0,
    hoverTimer: 0,
    cursorSide: 1, // -1 when cursor is on left half of screen, +1 when on right half
    cursorXNorm: 0.35, // Continuous [-1, 1] horizontal position
  })

  const count = items.length
  const last = Math.max(count - 1, 0)

  // Track global pointer X so even when scrolling via mouse wheel anywhere over the section,
  // the left/right cursor side is always known accurately.
  useEffect(() => {
    const onGlobalMove = (e: globalThis.PointerEvent) => {
      if (e.pointerType === 'touch') return
      const nx = (e.clientX / Math.max(1, window.innerWidth)) * 2 - 1
      ui.current.cursorXNorm = clamp(nx, -1, 1)
      ui.current.cursorSide = nx < 0 ? -1 : 1
    }
    window.addEventListener('pointermove', onGlobalMove, { passive: true })
    return () => window.removeEventListener('pointermove', onGlobalMove)
  }, [])

  useEffect(() => {
    const stage = stageRef.current
    const wheel = wheelRef.current
    const root = rootRef.current
    const webglHost = webglHostRef.current
    if (!stage || !wheel || !root || !webglHost) return

    let turn = 0
    let target = 0
    let vel = 0
    let reelTiltRad = 0
    let reelTiltVel = 0
    let frame = 0
    let lastTime = 0
    let visible = true
    let alive = true
    let metrics = { w: 800, h: 600, cardW: 480, cardH: 296, stepPx: 367, centerXOffset: 0 }

    let renderer: Renderer | null = null
    let gl: Renderer['gl'] | null = null
    const scene = new Transform()

    try {
      renderer = new Renderer({
        dpr: Math.min(window.devicePixelRatio || 1, 2),
        alpha: true,
        premultipliedAlpha: true,
        antialias: true,
        depth: true,
      })
      gl = renderer.gl
      gl.clearColor(0, 0, 0, 0)
      gl.canvas.className = 'drum-webgl-canvas'
      gl.canvas.setAttribute('aria-hidden', 'true')
      webglHost.prepend(gl.canvas)
    } catch {
      renderer = null
      gl = null
    }

    type CardSlot = {
      mesh: Mesh
      program: Program
      texture: Texture
      ready: number
      imageSize: [number, number]
      dispose: () => void
    }

    const slots: CardSlot[] = []

    if (gl && renderer) {
      const sharedGeometry = new Plane(gl, {
        width: 1,
        height: 1,
        widthSegments: 36,
        heightSegments: 36,
      })

      items.forEach((project) => {
        const texture = new Texture(gl!, {
          generateMipmaps: true,
          minFilter: gl!.LINEAR_MIPMAP_LINEAR,
          magFilter: gl!.LINEAR,
        })

        const program = new Program(gl!, {
          vertex: drumVertexShader,
          fragment: drumFragmentShader,
          transparent: true,
          depthTest: true,
          depthWrite: true,
          cullFace: false,
          uniforms: {
            tMap: { value: texture },
            uCardW: { value: 480 },
            uCardH: { value: 296 },
            uOffset: { value: 0 },
            uStepPx: { value: 367 },
            uReelTilt: { value: 0 },
            uCurveAmount: { value: reducedMotion ? 0 : 1.0 },
            uSize: { value: [480, 296] },
            uImageSize: { value: [1600, 900] },
            uOpacity: { value: 1 },
            uReady: { value: 0 },
          },
        })
        program.setBlendFunc(gl!.ONE, gl!.ONE_MINUS_SRC_ALPHA)

        const mesh = new Mesh(gl!, { geometry: sharedGeometry, program })
        mesh.setParent(scene)

        const slot: CardSlot = {
          mesh,
          program,
          texture,
          ready: 0,
          imageSize: [1600, 900],
          dispose: () => {},
        }

        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.decoding = 'async'
        img.onload = () => {
          if (!alive) return
          texture.image = img
          texture.needsUpdate = true
          slot.imageSize = [img.naturalWidth || 1600, img.naturalHeight || 900]
          slot.ready = 1
          request()
        }
        if (project.previewImage) img.src = project.previewImage

        slot.dispose = () => {
          img.onload = null
          gl!.deleteTexture(texture.texture)
        }

        slots.push(slot)
      })
    }

    const updateCameraMatrices = (fovPx: number, w: number, h: number, xOffset: number) => {
      const near = 10
      const far = 5000
      const f = (2 * fovPx) / h
      const aspect = w / h
      const nf = 1 / (near - far)

      const proj = new Float32Array([
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (far + near) * nf, -1,
        0, 0, 2 * far * near * nf, 0,
      ])

      const view = new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        xOffset, 0, -fovPx, 1,
      ])

      slots.forEach((slot) => {
        slot.mesh.program.uniforms.projectionMatrix = { value: proj }
        slot.mesh.program.uniforms.modelViewMatrix = { value: view }
      })
    }

    const measure = () => {
      const w = stage.clientWidth || 800
      const h = stage.clientHeight || 600
      const isMobile = w <= 760
      const cardW = isMobile
        ? clamp(w * 0.84, 240, 380)
        : Math.min(h * CARD_H * CARD_RATIO, w - clamp(w * 0.25, 220, 400) * 2)
      const cardH = cardW / CARD_RATIO
      const stepPx = cardH * STEP_GAP
      const centerXOffset = !isMobile && w > 1100 ? clamp(w * 0.035, 32, 60) : 0

      metrics = { w, h, cardW, cardH, stepPx, centerXOffset }

      const fovPx = cardH * (isMobile ? 2.5 : 2.8)
      stage.style.perspective = `${fovPx}px`
      root.style.setProperty('--drum-card-w', `${cardW}px`)

      if (renderer && gl) {
        renderer.dpr = Math.min(window.devicePixelRatio || 1, 2)
        renderer.setSize(w, h)
        updateCameraMatrices(fovPx, w, h, centerXOffset)
      }

      cardRefs.current.forEach((card) => {
        if (!card) return
        card.style.width = `${cardW}px`
        card.style.height = `${cardH}px`
        card.style.marginLeft = `${-cardW / 2}px`
        card.style.marginTop = `${-cardH / 2}px`
      })
      request()
    }

    const draw = (now: number) => {
      frame = 0
      const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 1 / 60
      lastTime = now

      // 1. Critically-damped spring for smooth, seamless scroll position (`turn`)
      if (reducedMotion) {
        turn = target
        vel = 0
      } else {
        const stiffness = 115
        const damping = 2 * Math.sqrt(stiffness) * 0.98
        const steps = Math.max(1, Math.ceil(dt / (1 / 180)))
        const h = dt / steps
        for (let s = 0; s < steps; s++) {
          const force = stiffness * (target - turn) - damping * vel
          vel += force * h
          turn += vel * h
        }
        if (Math.abs(target - turn) < 0.0003 && Math.abs(vel) < 0.002) {
          turn = target
          vel = 0
        }
      }

      // 2. Spark & Riot Scroll-Driven Cursor-Side Tilt:
      //    - Only tilts while scrolling/moving (proportional to scroll speed `Math.abs(vel)`).
      //    - Direction of tilt depends on whether cursor is on the LEFT or RIGHT side:
      //      * Cursor on RIGHT (`cursorXNorm > 0`): tilts clockwise (`uReelTilt < 0` in WebGL -> `/` angle like Image 2)
      //      * Cursor on LEFT (`cursorXNorm < 0`): tilts counter-clockwise (`uReelTilt > 0` in WebGL -> `\` angle like Image 3)
      //    - When scroll stops (`vel -> 0`), smoothly springs back to 0 (upright like Image 1).
      const scrollActivity = clamp(Math.abs(vel) / 1.65, 0, 1)
      const sideBias =
        Math.abs(ui.current.cursorXNorm) > 0.08
          ? Math.sign(ui.current.cursorXNorm) * (0.55 + 0.45 * Math.abs(ui.current.cursorXNorm))
          : ui.current.cursorSide * 0.65

      const maxTiltRad = (14.5 * Math.PI) / 180 // ~14.5 degrees max tilt matching reference
      const targetTiltRad = reducedMotion ? 0 : -sideBias * scrollActivity * maxTiltRad

      const tiltStiffness = 95
      const tiltDamping = 2 * Math.sqrt(tiltStiffness) * 0.92
      reelTiltVel += (tiltStiffness * (targetTiltRad - reelTiltRad) - tiltDamping * reelTiltVel) * dt
      reelTiltRad += reelTiltVel * dt
      if (Math.abs(targetTiltRad - reelTiltRad) < 0.0003 && Math.abs(reelTiltVel) < 0.001) {
        reelTiltRad = targetTiltRad
        reelTiltVel = 0
      }

      const { cardW, cardH, stepPx } = metrics
      const tiltDegDom = (-reelTiltRad * 180) / Math.PI
      wheel.style.transform = `rotateZ(${tiltDegDom.toFixed(2)}deg)`

      for (let i = 0; i < count; i++) {
        const d = i - turn
        const absD = Math.abs(d)
        const visibleCard = absD <= CULL
        const opacity = visibleCard ? clamp(1 - Math.max(0, absD - 1.25) * 1.65, 0, 1) : 0

        // Sync invisible interactive DOM hitbox 1:1 with the WebGL card position
        const card = cardRefs.current[i]
        if (card) {
          const domY = d * stepPx
          card.style.transform = `translate3d(0, ${domY.toFixed(1)}px, 0)`
          card.style.opacity = String(opacity)
          card.style.pointerEvents = visibleCard ? 'auto' : 'none'
          card.style.zIndex = String(Math.round(100 - absD * 10))
        }

        const slot = slots[i]
        if (slot) {
          slot.mesh.visible = opacity > 0.005
          const u = slot.program.uniforms
          u.uCardW.value = cardW
          u.uCardH.value = cardH
          u.uOffset.value = d
          u.uStepPx.value = stepPx
          u.uReelTilt.value = reelTiltRad
          u.uSize.value = [cardW, cardH]
          u.uImageSize.value = slot.imageSize
          u.uOpacity.value = opacity
          u.uReady.value = slot.ready
        }
      }

      if (renderer && gl) {
        scene.children.sort((a, b) => {
          const ia = slots.findIndex((s) => s.mesh === a)
          const ib = slots.findIndex((s) => s.mesh === b)
          return Math.abs(ib - turn) - Math.abs(ia - turn)
        })
        renderer.render({ scene })
      }

      const near = clamp(Math.round(turn), 0, last)
      if (near !== activeRef.current) {
        activeRef.current = near
        setActive(near)
      }

      const stillMoving =
        Math.abs(target - turn) > 0.0003 ||
        Math.abs(vel) > 0.002 ||
        Math.abs(targetTiltRad - reelTiltRad) > 0.0004 ||
        Math.abs(reelTiltVel) > 0.001

      if (stillMoving) request()
      else lastTime = 0
    }

    function request() {
      if (!frame && visible && alive) frame = requestAnimationFrame(draw)
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
      alive = false
      cancelAnimationFrame(frame)
      window.clearTimeout(state.hoverTimer)
      ro.disconnect()
      io.disconnect()
      slots.forEach((slot) => slot.dispose())
      if (gl) {
        gl.getExtension('WEBGL_lose_context')?.loseContext()
        if (gl.canvas.parentNode) gl.canvas.parentNode.removeChild(gl.canvas)
      }
    }
  }, [count, items, last, reducedMotion])

  // Pinned page scroll drives the drum
  useEffect(() => {
    const pin = pinRef.current
    const sticky = stickyRef.current
    if (reducedMotion || !pin || !sticky) return
    let frame = 0
    const update = () => {
      frame = 0
      const pinRect = pin.getBoundingClientRect()
      const span = pinRect.height - sticky.getBoundingClientRect().height
      if (span <= 0) return
      const progress = clamp(-pinRect.top / span, 0, 1)
      api.current.to(progress * last)
    }
    const queue = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', queue, { passive: true })
    window.addEventListener('resize', queue)
    return () => {
      window.removeEventListener('scroll', queue)
      window.removeEventListener('resize', queue)
      window.cancelAnimationFrame(frame)
    }
  }, [last, reducedMotion])

  const to = useCallback((n: number) => api.current.to(n), [])

  const updateStageCursor = (event: PointerEvent<HTMLDivElement>) => {
    const stage = stageRef.current
    if (!stage) return
    const rect = stage.getBoundingClientRect()
    const nx = ((event.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1
    ui.current.cursorXNorm = clamp(nx, -1, 1)
    ui.current.cursorSide = nx < 0 ? -1 : 1
  }

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    updateStageCursor(event)
    const s = ui.current
    s.down = true
    s.captured = false
    s.drag = 0
    s.lastY = event.clientY
    s.pointerType = event.pointerType
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    updateStageCursor(event)
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
    <div
      ref={pinRef}
      className={`works-pin ${reducedMotion ? 'is-static' : ''}`}
      style={{ '--works-n': count } as CSSProperties}
    >
      <div ref={stickyRef} className="works-pin-sticky">
        <div ref={rootRef} className="works-drum is-webgl-curved" data-reveal="rise">
          <div ref={webglHostRef} className="drum-webgl-host" aria-hidden="true" />
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
          <div className="drum-hint mono-label">
            <span>SCROLL, DRAG OR HOVER A NAME</span>
            <span>CLICK A CARD TO OPEN</span>
          </div>
        </div>
      </div>
    </div>
  )
}
