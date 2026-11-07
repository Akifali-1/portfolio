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
            cardHeight={0.5}
            gap={18}
            radius={6}
            fit="landscape"
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
