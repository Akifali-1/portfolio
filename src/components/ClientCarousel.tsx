// File: src/components/ClientCarousel.tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import FlexCarousel, { type FlexCarouselItem } from './flex-carousel/FlexCarousel'
import { clientProjects, clientSlides, projects, type Project } from '../data'

type ClientCarouselProps = { onSelect: (project: Project) => void }

const all = [...projects, ...clientProjects]

function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

export function ClientCarousel({ onSelect }: ClientCarouselProps) {
  const holderRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(true)
  const [webgl] = useState(hasWebGL)
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 760 : false,
  )
  const lastScrollStepRef = useRef(0)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 760px)')
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  // Ensure at least 4 slides in the ring buffer so wrap() has an unambiguous shortest path
  const normalizedSlides = useMemo(() => {
    if (clientSlides.length > 0 && clientSlides.length < 4) {
      return [...clientSlides, ...clientSlides]
    }
    return clientSlides
  }, [])

  const items = useMemo<FlexCarouselItem[]>(
    () =>
      normalizedSlides.map((slide) => ({
        src: slide.src,
        alt: `${slide.title} website screenshot`,
        title: slide.title,
        subtitle: slide.subtitle,
        description: slide.description,
        link: slide.link,
      })),
    [normalizedSlides],
  )

  // Mount WebGL context ahead of viewport entry without layout shift
  useEffect(() => {
    const holder = holderRef.current
    if (!holder) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setMounted(true)
          io.disconnect()
        }
      },
      { rootMargin: '450px 0px' },
    )
    io.observe(holder)
    return () => io.disconnect()
  }, [])

  // Drive carousel steps as user scrolls through .client-pin (desktop & mobile)
  useEffect(() => {
    const holder = holderRef.current
    const pin = holder?.closest<HTMLElement>('.client-pin')
    if (!holder || !pin) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0
    const totalSlides = normalizedSlides.length
    const onScroll = () => {
      frame = 0
      const rect = pin.getBoundingClientRect()
      const span = rect.height - window.innerHeight
      if (span <= 0) return
      const progress = Math.min(1, Math.max(0, -rect.top / span))
      const targetStep = Math.min(totalSlides - 1, Math.floor(progress * totalSlides))
      const diff = targetStep - lastScrollStepRef.current
      if (diff !== 0) {
        const el = holder.querySelector<HTMLElement>('.flex-carousel')
        if (el) {
          const dir = diff > 0 ? 'ArrowRight' : 'ArrowLeft'
          for (let i = 0; i < Math.abs(diff); i++) {
            el.dispatchEvent(new KeyboardEvent('keydown', { key: dir, bubbles: true }))
          }
        }
        lastScrollStepRef.current = targetStep
      }
    }

    const queue = () => {
      if (!frame) frame = window.requestAnimationFrame(onScroll)
    }
    window.addEventListener('scroll', queue, { passive: true })
    return () => {
      window.removeEventListener('scroll', queue)
      window.cancelAnimationFrame(frame)
    }
  }, [normalizedSlides.length])

  const open = (index: number) => {
    const slide = normalizedSlides[index % normalizedSlides.length]
    const project = slide && all.find((p) => p.id === slide.projectId)
    if (project) onSelect(project)
  }

  const step = (dir: 1 | -1) => {
    const el = holderRef.current?.querySelector<HTMLElement>('.flex-carousel')
    el?.focus({ preventScroll: true })
    el?.dispatchEvent(
      new KeyboardEvent('keydown', { key: dir === 1 ? 'ArrowRight' : 'ArrowLeft', bubbles: true }),
    )
  }

  return (
    <div ref={holderRef} className="client-carousel">
      {webgl ? (
        mounted && (
          <FlexCarousel
            items={items}
            preset="liquid"
            intro="rise"
            cardHeight={isMobile ? 0.58 : 0.5}
            lensWidth={isMobile ? 0.9 : undefined}
            gap={isMobile ? 12 : 18}
            radius={6}
            fit="landscape"
            autoplay={isMobile}
            interval={3.6}
            captureWheel={false}
            onSelect={open}
          />
        )
      ) : (
        <div className="client-carousel-fallback">
          {clientSlides.map((slide, index) => (
            <button key={slide.src} type="button" onClick={() => open(index)}>
              <img src={slide.src} alt={`${slide.title} website screenshot`} loading="lazy" />
              <span className="mono-label">{slide.title}</span>
            </button>
          ))}
        </div>
      )}
      <div className="client-carousel-controls">
        <button type="button" onClick={() => step(-1)} aria-label="Previous slide">
          PREV
        </button>
        <button type="button" onClick={() => step(1)} aria-label="Next slide">
          NEXT
        </button>
      </div>
    </div>
  )
}
