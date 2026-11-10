import { useEffect, useRef, useState } from 'react'
import { ArrowDownRight, ArrowRight, ExternalLink } from 'lucide-react'
import { Architecture } from '../components/Architecture'
import { ClientCarousel } from '../components/ClientCarousel'
import { DotGraph } from '../components/DotGraph'
import { SectionLabel } from '../components/SectionLabel'
import { ThreatEmulationPanel } from '../components/ThreatEmulationPanel'
import { WorksDrum } from '../components/WorksDrum'
import { exploring, projects, siteConfig, type Project } from '../data'
import { sound } from '../sound'
import { useReducedMotion } from '../hooks'

type ProjectSelectionProps = {
  onSelect: (project: Project) => void
}

const signalPayloads = [
  {
    step: '01',
    key: 'source',
    label: 'GITHUB / EVIDENCE',
    payload: 'GET /repos/commits -> AST diff extraction, PR review depth, commit granularity, and architectural touchpoints.',
  },
  {
    step: '02',
    key: 'transform',
    label: 'DETERMINISTIC ANALYSIS',
    payload: 'Static dependency graph scoring + entropy checks. Filters out boilerplate and noise commits deterministically.',
  },
  {
    step: '03',
    key: 'interpret',
    label: 'AI / CONTEXT',
    payload: 'Gemini synthesizes verified code evidence into human-legible engineering narratives grounded strictly in diffs.',
  },
  {
    step: '04',
    key: 'output',
    label: 'PROOF-OF-WORK PROFILE',
    payload: 'Cryptographically traceable capability profile: every skill claim links directly to the underlying commit trail.',
  },
]

export function ManifestoSection() {
  return (
    <section className="manifesto section-dark" aria-labelledby="manifesto-title">
      <div className="page-grid">
        <SectionLabel index="01">A SYSTEM FOR MAKING</SectionLabel>
        <div className="manifesto-copy" data-reveal="rise">
          <h2 id="manifesto-title">
            Ideas are only
            <br />
            <em>the beginning.</em>
          </h2>
          <p>
            I build intelligent systems and turn experiments into products. The work lives somewhere between a question
            and a working thing.
          </p>
        </div>
        <div className="manifesto-aside mono-label">
          [ PRINCIPLE / 001 ]<br />
          <span>
            MAKE THE INVISIBLE
            <br />
            LEGIBLE.
          </span>
        </div>
      </div>
    </section>
  )
}

export function WorkSection({ onSelect, reducedMotion }: ProjectSelectionProps & { reducedMotion: boolean }) {
  return (
    <section className="work-section section-paper" id="work" aria-labelledby="work-title">
      <div className="page-grid">
        <SectionLabel index="02" light>
          SELECTED WORK / FIVE SYSTEMS, ONE QUESTION
        </SectionLabel>
        <h2 id="work-title" className="sr-only">
          Selected work
        </h2>
      </div>
      <WorksDrum items={projects} onSelect={onSelect} reducedMotion={reducedMotion} />
    </section>
  )
}

export function ClientSection({ onSelect }: ProjectSelectionProps) {
  return (
    <section className="client-section section-dark" id="freelance" aria-labelledby="client-title">
      <div className="page-grid">
        <SectionLabel index="02B">FREELANCE / CLIENT WORK</SectionLabel>
        <div className="client-heading" data-reveal="rise">
          <span className="mono-label">CLIENT SURFACE / FRONTEND</span>
          <h2 id="client-title">
            Built for the
            <br />
            <em>real world.</em>
          </h2>
          <p>
            Alongside products and research, I build polished frontend websites for businesses that need their work to
            be understood.
          </p>
        </div>
        <div className="client-aside">
          <span className="detail-label">SEPARATE SIGNAL</span>
          <p>
            CLIENT PROJECTS
            <br />
            <strong>WEB DEVELOPMENT</strong>
          </p>
          <span className="mono-label">NO PUBLIC SOURCE LINKS</span>
        </div>
      </div>
      <div className="client-pin">
        <div className="client-pin-sticky">
          <ClientCarousel onSelect={onSelect} />
        </div>
      </div>
    </section>
  )
}

const ABOUT_LINE1 = 'I like building'
const ABOUT_LINE2 = "things I don't"
const ABOUT_LINE3 = 'fully understand yet.'
const TOTAL_ABOUT_CHARS = ABOUT_LINE1.length + ABOUT_LINE2.length + ABOUT_LINE3.length

export function AboutSection() {
  const reducedMotion = useReducedMotion()
  const sectionRef = useRef<HTMLElement>(null)
  const [started, setStarted] = useState(false)
  const [charCount, setCharCount] = useState(0)
  const [finished, setFinished] = useState(false)
  const startedRef = useRef(false)

  // Trigger typing after sweep completion or when scrolled into view
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    if (reducedMotion) {
      setStarted(true)
      setCharCount(TOTAL_ABOUT_CHARS)
      setFinished(true)
      startedRef.current = true
      return
    }

    const trigger = () => {
      if (startedRef.current) return
      startedRef.current = true
      window.setTimeout(() => {
        setStarted(true)
      }, 100)
    }

    const onSweepComplete = () => trigger()
    section.addEventListener('section-sweep-complete', onSweepComplete)

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !section.classList.contains('is-sweeping')) {
          trigger()
          io.disconnect()
        }
      },
      { threshold: 0.25 },
    )
    io.observe(section)

    return () => {
      section.removeEventListener('section-sweep-complete', onSweepComplete)
      io.disconnect()
    }
  }, [reducedMotion])

  // Typewriter effect
  useEffect(() => {
    if (!started || finished || reducedMotion) return

    let timer: number
    const nextChar = () => {
      setCharCount((prev) => {
        const next = prev + 1
        if (next >= TOTAL_ABOUT_CHARS) {
          window.setTimeout(() => setFinished(true), 400)
          return TOTAL_ABOUT_CHARS
        }

        let charAtCursor = ''
        let isEndOfLine = false
        if (next <= ABOUT_LINE1.length) {
          charAtCursor = ABOUT_LINE1[next - 1]
          isEndOfLine = next === ABOUT_LINE1.length
        } else if (next <= ABOUT_LINE1.length + ABOUT_LINE2.length) {
          const idx = next - ABOUT_LINE1.length - 1
          charAtCursor = ABOUT_LINE2[idx]
          isEndOfLine = next === ABOUT_LINE1.length + ABOUT_LINE2.length
        } else {
          const idx = next - ABOUT_LINE1.length - ABOUT_LINE2.length - 1
          charAtCursor = ABOUT_LINE3[idx]
        }

        let delay = 32
        if (isEndOfLine) {
          delay = 180
        } else if (charAtCursor === ' ') {
          delay = 85
        } else if (charAtCursor === "'") {
          delay = 45
        }

        if (sound.enabled && next % 2 === 0) {
          sound.playClick(680 + (next % 5) * 40, 0.007)
        }

        timer = window.setTimeout(nextChar, delay)
        return next
      })
    }

    timer = window.setTimeout(nextChar, 40)
    return () => window.clearTimeout(timer)
  }, [started, finished, reducedMotion])

  const l1Count = Math.min(charCount, ABOUT_LINE1.length)
  const l2Count = Math.min(Math.max(0, charCount - ABOUT_LINE1.length), ABOUT_LINE2.length)
  const l3Count = Math.min(Math.max(0, charCount - ABOUT_LINE1.length - ABOUT_LINE2.length), ABOUT_LINE3.length)

  const typedLine1 = ABOUT_LINE1.slice(0, l1Count)
  const ghostLine1 = ABOUT_LINE1.slice(l1Count)

  const typedLine2 = ABOUT_LINE2.slice(0, l2Count)
  const ghostLine2 = ABOUT_LINE2.slice(l2Count)

  const typedLine3 = ABOUT_LINE3.slice(0, l3Count)
  const ghostLine3 = ABOUT_LINE3.slice(l3Count)

  const isDone = charCount >= TOTAL_ABOUT_CHARS
  const activeLine = !started
    ? 0
    : isDone
    ? 0
    : charCount <= ABOUT_LINE1.length
    ? 1
    : charCount <= ABOUT_LINE1.length + ABOUT_LINE2.length
    ? 2
    : 3

  return (
    <section
      ref={sectionRef}
      className={`about-section section-paper ${started ? 'is-started' : ''} ${finished ? 'is-finished' : ''}`}
      id="about"
      aria-labelledby="about-title"
    >
      <div className="page-grid">
        <SectionLabel index="03" light>
          ABOUT THE BUILDER
        </SectionLabel>
        <div className="about-copy">
          <span className="mono-label">A SHORT OPERATING MANUAL</span>
          <h2 id="about-title" aria-label="I like building things I don't fully understand yet.">
            <span className="typing-line">
              <span className="typing-visible">{typedLine1}</span>
              {activeLine === 1 && <span className="typing-caret" aria-hidden="true" />}
              <span className="typing-ghost" aria-hidden="true">{ghostLine1}</span>
            </span>
            <br />
            <span className="typing-line">
              <span className="typing-visible">{typedLine2}</span>
              {activeLine === 2 && <span className="typing-caret" aria-hidden="true" />}
              <span className="typing-ghost" aria-hidden="true">{ghostLine2}</span>
            </span>
            <br />
            <span className="typing-line">
              <em className="typing-visible">{typedLine3}</em>
              {(activeLine === 3 || (isDone && !finished)) && (
                <span className="typing-caret" aria-hidden="true" />
              )}
              <em className="typing-ghost" aria-hidden="true">{ghostLine3}</em>
            </span>
          </h2>
          <p>
            I work across software engineering, AI systems, research, and experimentation. I like taking difficult
            questions, turning them into systems, and seeing what happens.
          </p>
        </div>
        <div className="exploring">
          <span className="detail-label">CURRENTLY EXPLORING</span>
          <div className="exploring-list">
            {exploring.map((item, index) => (
              <span key={item}>
                <small>{String(index + 1).padStart(2, '0')}</small>
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export function SignalSection() {
  const graphProject = projects.find((project) => project.id === 'tracemint')
  const [activeStage, setActiveStage] = useState(0)
  const consoleRef = useRef<HTMLDivElement>(null)
  const lastStep = useRef(-1)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let frame = 0
    const update = () => {
      frame = 0
      const el = consoleRef.current
      if (!el) return
      const vh = window.innerHeight
      const t = (vh * 0.9 - el.getBoundingClientRect().top) / (vh * 0.6)
      const step = Math.min(signalPayloads.length - 1, Math.max(0, Math.floor(t * signalPayloads.length)))
      if (step !== lastStep.current) {
        lastStep.current = step
        setActiveStage(step)
      }
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <section className="signal-section section-dark" aria-labelledby="signal-title">
      <div className="page-grid signal-grid">
        <SectionLabel index="04">LIVE SIGNAL</SectionLabel>
        <div className="signal-title-wrap">
          <span className="mono-label">PUBLIC WORK / TRACEABLE BY DESIGN</span>
          <h2 id="signal-title">
            Proof lives
            <br />
            <em>in the trail.</em>
          </h2>
        </div>
        <div className="signal-console" ref={consoleRef}>
          <div className="console-head">
            <span>
              <i className="live-dot" /> SIGNAL CHANNEL // CLICK STAGE TO INSPECT
            </span>
            <span>INTERACTIVE</span>
          </div>
          <div className="console-lines">
            {signalPayloads.map((item, idx) => (
              <button
                key={item.step}
                type="button"
                className={`console-line-btn ${activeStage === idx ? 'is-selected' : ''}`}
                onClick={() => {
                  setActiveStage(idx)
                }}
              >
                <b>{item.step}</b>
                <span>{item.key}</span>
                <strong>{item.label}</strong>
              </button>
            ))}
          </div>
          <div className="console-inspector mono-label">
            <span>// STAGE {signalPayloads[activeStage].step} PAYLOAD</span>
            <p>{signalPayloads[activeStage].payload}</p>
          </div>
          <div className="console-foot">
            <span>NO UNVERIFIED METRICS DISPLAYED</span>
            <span>TRACE MINT / 001</span>
          </div>
        </div>
        <a
          className="text-arrow signal-link"
          href={graphProject?.link}
          target="_blank"
          rel="noreferrer"
          data-cursor="VISIT"
        >
          FOLLOW THE SIGNAL <ArrowRight size={15} />
        </a>
      </div>
    </section>
  )
}

export function ResearchSection() {
  return (
    <section className="research-section section-paper no-sweep" id="research" aria-labelledby="research-title">
      <div className="page-grid">
        <SectionLabel index="05" light>
          RESEARCH / ADAPTIVE STGT
        </SectionLabel>
        <div className="research-top" data-reveal="rise">
          <span className="mono-label">PAPER / 001 — IN PROGRESS</span>
          <h2 id="research-title">
            Supply chains
            <br />
            are not only
            <br />
            <em>temporal.</em>
          </h2>
          <p className="research-thesis">They are relational.</p>
        </div>
        <div className="research-explainer" data-reveal="fade">
          <span className="detail-label">THE QUESTION</span>
          <p>When a system forecasts demand, what changes when its relationships become part of the signal?</p>
        </div>
        <Architecture />

        <ThreatEmulationPanel />
      </div>
    </section>
  )
}

export function ContactSection() {
  return (
    <section className="contact-section section-dark" id="contact" aria-labelledby="contact-title">
      <div className="contact-grid">
        <SectionLabel index="07">OPEN CHANNEL</SectionLabel>
        <div className="contact-title">
          <span className="mono-label">NO PITCH DECK REQUIRED</span>
          <h2 id="contact-title">
            Let's build
            <br />
            <em>something.</em>
          </h2>
          <a className="contact-primary-cta" href={`mailto:${siteConfig.email}`}>
            EMAIL AKIF <ArrowRight size={15} />
          </a>
        </div>
        <div className="contact-links">
          <a href={`mailto:${siteConfig.email}`} data-cursor="EMAIL">
            <span>EMAIL AKIF</span>
            <span className="contact-link-detail">{siteConfig.email}</span>
          </a>
          <a href={siteConfig.linkedin} target="_blank" rel="noreferrer" data-cursor="LINKEDIN">
            <span>LINKEDIN</span>
            <ExternalLink size={16} />
          </a>
        </div>
        <div className="contact-line" />
      </div>
    </section>
  )
}

export function GraphSection({ onSelect, reducedMotion }: ProjectSelectionProps & { reducedMotion: boolean }) {
  return (
    <section className="graph-section section-dark" id="graph" aria-labelledby="graph-title">
      <div className="page-grid">
        <SectionLabel index="06">THE WORK GRAPH</SectionLabel>
        <div className="section-heading graph-heading" data-reveal="rise">
          <span className="mono-label">RELATIONAL INDEX / 2026</span>
          <h2 id="graph-title">
            Everything
            <br />
            <em>connects.</em>
          </h2>
          <p>Six projects and the ideas they share. Hover a node to look closer.</p>
        </div>
        <DotGraph onSelect={onSelect} reducedMotion={reducedMotion} />
      </div>
    </section>
  )
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <a className="wordmark" href="#top">
        AKIF<span>.SYSTEM</span>
      </a>
      <span>BUILT WITH CURIOSITY.</span>
      <span>© 2026</span>
      <a href="#contact">
        OPEN CHANNEL <ArrowDownRight size={14} />
      </a>
    </footer>
  )
}
