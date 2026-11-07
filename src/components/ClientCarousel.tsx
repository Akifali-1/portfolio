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
  const [mounted, setMounted] = useState(false)
  const [webgl] = useState(hasWebGL)

  const items = useMemo<FlexCarouselItem[]>(
    () =>
      clientSlides.map((slide) => ({
        src: slide.src,
        alt: `${slide.title} website screenshot`,
        title: slide.title,
        subtitle: slide.subtitle,
        description: slide.description,
        link: slide.link,
      })),
    [],
  )

  // Only create the WebGL context when the section nears the viewport.
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
      { rootMargin: '300px 0px' },
    )
    io.observe(holder)
    return () => io.disconnect()
  }, [])

  const open = (index: number) => {
    const slide = clientSlides[index]
    const project = slide && all.find((p) => p.id === slide.projectId)
    if (project) onSelect(project)
  }

  const step = (dir: 1 | -1) => {
    const el = holderRef.current?.querySelector<HTMLElement>('.flex-carousel')
    el?.focus()
    el?.dispatchEvent(
      new KeyboardEvent('keydown', { key: dir === 1 ? 'ArrowRight' : 'ArrowLeft', bubbles: true }),
    )
  }

  return (
    <div ref={holderRef} className="client-carousel" data-reveal="rise">
      {webgl ? (
        mounted && (
          <FlexCarousel
            items={items}
            preset="liquid"
            intro="rise"
            cardHeight={0.5}
            gap={14}
            radius={6}
            fit="landscape"
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
        <button type="button" onClick={() => step(-1)} aria-label="Previous slide">PREV</button>
        <button type="button" onClick={() => step(1)} aria-label="Next slide">NEXT</button>
      </div>
    </div>
  )
}

