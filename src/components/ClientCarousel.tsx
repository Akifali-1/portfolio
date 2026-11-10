import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
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
  const mobileStripRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(true)
  const [webgl] = useState(hasWebGL)
  const [isMobileView, setIsMobileView] = useState(false)
  const [mobileActive, setMobileActive] = useState(0)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)')
    const update = () => setIsMobileView(mq.matches)
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

  useEffect(() => {
    const strip = mobileStripRef.current
    if (!isMobileView || !strip) return
    const onScroll = () => {
      const maxScroll = Math.max(1, strip.scrollWidth - strip.clientWidth)
      const progress = Math.min(1, Math.max(0, strip.scrollLeft / maxScroll))
      const idx = Math.min(
        clientSlides.length - 1,
        Math.max(0, Math.round(progress * (clientSlides.length - 1))),
      )
      setMobileActive(idx)
    }
    strip.addEventListener('scroll', onScroll, { passive: true })
    return () => strip.removeEventListener('scroll', onScroll)
  }, [isMobileView])

  const open = (index: number) => {
    const slide = normalizedSlides[index % normalizedSlides.length]
    const project = slide && all.find((p) => p.id === slide.projectId)
    if (project) onSelect(project)
  }

  const openDirect = (projectId: string) => {
    const project = all.find((p) => p.id === projectId)
    if (project) onSelect(project)
  }

  const step = (dir: 1 | -1) => {
    if (isMobileView && mobileStripRef.current) {
      const strip = mobileStripRef.current
      const cards = strip.querySelectorAll<HTMLElement>('.client-mobile-card')
      const nextIdx = (mobileActive + dir + clientSlides.length) % clientSlides.length
      const target = cards[nextIdx]
      if (target) {
        strip.scrollTo({ left: target.offsetLeft - strip.offsetLeft, behavior: 'smooth' })
      }
      return
    }
    const el = holderRef.current?.querySelector<HTMLElement>('.flex-carousel')
    el?.focus({ preventScroll: true })
    el?.dispatchEvent(
      new KeyboardEvent('keydown', { key: dir === 1 ? 'ArrowRight' : 'ArrowLeft', bubbles: true }),
    )
  }

  return (
    <div ref={holderRef} className="client-carousel">
      {!isMobileView && webgl ? (
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
        <div ref={mobileStripRef} className="client-carousel-mobile" role="region" aria-label="Client projects carousel">
          {clientSlides.map((slide, index) => (
            <article key={slide.projectId} className="client-mobile-card">
              <button
                type="button"
                className="client-mobile-card-trigger"
                onClick={() => openDirect(slide.projectId)}
              >
                <div className="client-mobile-media">
                  <img src={slide.src} alt={`${slide.title} website screenshot`} loading="lazy" />
                  <span className="client-mobile-index mono-label">
                    [C0{index + 1}]
                  </span>
                </div>
                <div className="client-mobile-body">
                  <span className="mono-label client-mobile-subtitle">{slide.subtitle}</span>
                  <strong>{slide.title}</strong>
                  <p>{slide.description}</p>
                  <div className="client-mobile-actions">
                    <span className="text-arrow">
                      INSPECT WORK <ArrowRight size={13} />
                    </span>
                    {slide.link && (
                      <span className="client-mobile-live mono-label">
                        LIVE SITE <ArrowUpRight size={12} />
                      </span>
                    )}
                  </div>
                </div>
              </button>
            </article>
          ))}
        </div>
      )}
      <div className="client-carousel-controls">
        <button type="button" onClick={() => step(-1)} aria-label="Previous slide">
          PREV
        </button>
        {isMobileView && (
          <span className="client-carousel-counter mono-label">
            0{mobileActive + 1} / 0{clientSlides.length}
          </span>
        )}
        <button type="button" onClick={() => step(1)} aria-label="Next slide">
          NEXT
        </button>
      </div>
    </div>
  )
}
