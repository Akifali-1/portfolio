import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { ArrowUpRight } from 'lucide-react'
import type { Project } from '../data'
import { ProjectArtifact } from './ProjectArtifact'
import { useReducedMotion } from '../hooks'

type ProjectNameProps = {
  project: Project
  onSelect: (project: Project) => void
}

export function ProjectName({ project, onSelect }: ProjectNameProps) {
  const [visible, setVisible] = useState(false)
  const frameRef = useRef<HTMLDivElement>(null)
  const pointerRef = useRef({ x: 0, y: 0 })
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (!visible) return
    let frame = 0
    let positioned = false
    let x = 0
    let y = 0

    const update = () => {
      const preview = frameRef.current
      if (!preview) return
      const { x: pointerX, y: pointerY } = pointerRef.current
      const width = preview.offsetWidth
      const height = preview.offsetHeight
      const inset = 24
      const targetX = Math.min(Math.max(pointerX + 24, inset), window.innerWidth - width - inset)
      const proposedY = pointerY + height + 36 < window.innerHeight ? pointerY + 30 : pointerY - height - 30
      const targetY = Math.min(Math.max(proposedY, inset), window.innerHeight - height - inset)

      x = positioned && !reducedMotion ? x + (targetX - x) * 0.2 : targetX
      y = positioned && !reducedMotion ? y + (targetY - y) * 0.2 : targetY
      positioned = true
      preview.style.transform = `translate3d(${x}px, ${y}px, 0)`

      if (!reducedMotion) frame = window.requestAnimationFrame(update)
    }

    const hide = () => setVisible(false)
    update()
    window.addEventListener('scroll', hide, { passive: true })
    window.addEventListener('resize', hide)
    window.addEventListener('blur', hide)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', hide)
      window.removeEventListener('resize', hide)
      window.removeEventListener('blur', hide)
    }
  }, [visible, reducedMotion])

  const enter = (event: PointerEvent<HTMLSpanElement>) => {
    if (event.pointerType !== 'mouse' || !window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 601px)').matches) return
    pointerRef.current = { x: event.clientX, y: event.clientY }
    setVisible(true)
  }

  const move = (event: PointerEvent<HTMLSpanElement>) => {
    pointerRef.current = { x: event.clientX, y: event.clientY }
  }

  return (
    <>
      <h3 className="project-name-heading">
        <span className="project-title-line">
          <button
            className={`project-title-trigger ${visible ? 'is-previewing' : ''}`}
            type="button"
            onClick={() => {
              setVisible(false)
              onSelect(project)
            }}
          >
            <span
              className="project-name-text"
              onPointerEnter={enter}
              onPointerMove={move}
              onPointerLeave={() => setVisible(false)}
              data-cursor="INSPECT"
            >
              {project.title}
            </span>
          </button>
          {project.link && (
            <a
              className="project-title-link"
              href={project.link}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open ${project.title}`}
              data-cursor="VISIT"
            >
              <ArrowUpRight size={15} strokeWidth={1.5} />
            </a>
          )}
        </span>
      </h3>
      {createPortal(
        <div ref={frameRef} className={`project-preview-layer ${visible ? 'is-visible' : ''}`} aria-hidden="true">
          <div className="project-preview-card">
            <div className="project-preview-meta">
              <span>[{project.index}] / PREVIEW</span>
              <span>{project.kind === 'client' ? 'CLIENT WEB' : 'SELECTED WORK'}</span>
            </div>
            <div className="project-preview-artifact">
              {project.previewImage ? (
                <img className="project-preview-image" src={project.previewImage} alt={`${project.title} website preview`} />
              ) : (
                <ProjectArtifact project={project} compact />
              )}
            </div>
            <div className="project-preview-title">
              <strong>{project.title}</strong>
              <span>{project.shortTitle} / ARTIFACT</span>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
