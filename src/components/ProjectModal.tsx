import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, ExternalLink, X } from 'lucide-react'
import { clientProjects, projects, type Project } from '../data'
import { ProjectArtifact } from './ProjectArtifact'

type ProjectModalProps = {
  project: Project | null
  onClose: () => void
  onSelect: (project: Project) => void
}

export function ProjectModal({ project, onClose, onSelect }: ProjectModalProps) {
  const [viewMode, setViewMode] = useState<'preview' | 'schematic'>('preview')
  const allProjects = [...projects, ...clientProjects]

  useEffect(() => {
    if (!project) return
    setViewMode(project.previewImage ? 'preview' : 'schematic')
  }, [project])

  useEffect(() => {
    if (!project) return
    const currentIndex = allProjects.findIndex((p) => p.id === project.id)
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') {
        const next = allProjects[(currentIndex + 1) % allProjects.length]
        onSelect(next)
      }
      if (event.key === 'ArrowLeft') {
        const prev = allProjects[(currentIndex - 1 + allProjects.length) % allProjects.length]
        onSelect(prev)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [allProjects, onSelect, project])

  if (!project) return null

  const currentIndex = allProjects.findIndex((p) => p.id === project.id)
  const prevProject = allProjects[(currentIndex - 1 + allProjects.length) % allProjects.length]
  const nextProject = allProjects[(currentIndex + 1) % allProjects.length]

  return (
    <div className="detail-backdrop" onMouseDown={onClose}>
      <article
        className="detail-panel"
        role="dialog"
        aria-modal="true"
        aria-label={`${project.title} case study`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="detail-close" type="button" onClick={onClose} aria-label="Close project detail">
          <X size={18} />
        </button>
        <div className="detail-eyebrow">
          <span>PROJECT {project.index}</span>
          <span>{project.status}</span>
        </div>
        <div className="detail-heading">
          <span className="detail-category">{project.category}</span>
          <h2>{project.title}</h2>
          <p>{project.description}</p>
        </div>

        {/* Visual Artifact / Surface Switcher */}
        <div className="detail-visual-stage">
          <div className="detail-visual-toolbar mono-label">
            <span>ARTIFACT SURFACE // {project.shortTitle}</span>
            {project.previewImage && (
              <div className="detail-visual-tabs">
                <button
                  type="button"
                  className={viewMode === 'preview' ? 'is-active' : ''}
                  onClick={() => setViewMode('preview')}
                >
                  SURFACE PREVIEW
                </button>
                <button
                  type="button"
                  className={viewMode === 'schematic' ? 'is-active' : ''}
                  onClick={() => setViewMode('schematic')}
                >
                  SYSTEM SCHEMATIC
                </button>
              </div>
            )}
          </div>
          <div className="detail-visual-frame">
            {viewMode === 'preview' && project.previewImage ? (
              <img className="detail-preview-img" src={project.previewImage} alt={`${project.title} surface`} />
            ) : (
              <ProjectArtifact project={project} />
            )}
          </div>
        </div>

        <div className="detail-grid">
          <div>
            <span className="detail-label">WHAT IS IT?</span>
            <p className="detail-question">{project.what}</p>
          </div>
          <div>
            <span className="detail-label">WHY?</span>
            <p className="detail-answer">{project.why}</p>
          </div>
        </div>
        <div className="detail-how">
          <div>
            <span className="detail-label">HOW DOES IT WORK?</span>
            <div className="detail-signal">
              {project.signal.split(' · ').map((item, index, arr) => (
                <span key={item}>
                  <b>{item}</b>
                  {index < arr.length - 1 && <i>→</i>}
                </span>
              ))}
            </div>
          </div>
          <div className="detail-method">
            {project.how.map((step, index) => (
              <span key={step}>
                <small>{String(index + 1).padStart(2, '0')}</small>
                {step}
              </span>
            ))}
          </div>
        </div>
        <div className="detail-bottom">
          <div>
            <span className="detail-label">WHAT I ACTUALLY DID</span>
            <p className="detail-actually">{project.actually}</p>
            <span className="detail-label detail-tech-label">
              {project.kind === 'client' ? 'WORK TYPE' : 'TECHNOLOGY'}
            </span>
            <div className="tech-list">
              {project.technologies.map((tech) => (
                <span key={tech}>{tech}</span>
              ))}
            </div>
          </div>
          {project.link && (
            <a className="text-arrow detail-link" href={project.link} target="_blank" rel="noreferrer" data-cursor="VISIT">
              OPEN PROJECT <ExternalLink size={15} />
            </a>
          )}
        </div>
        {project.baselines && (
          <div className="detail-baselines">
            <span className="detail-label">COMPARISON BASELINES</span>
            <div>
              {project.baselines.map((baseline) => (
                <span key={baseline}>{baseline}</span>
              ))}
            </div>
            <p>Research question: {project.why}</p>
          </div>
        )}

        {/* Next / Previous Project Cycling */}
        <div className="detail-cycle-bar mono-label">
          <button
            type="button"
            className="detail-cycle-btn"
            onClick={() => {
              onSelect(prevProject)
            }}
          >
            <ArrowLeft size={13} /> [{prevProject.index}] {prevProject.shortTitle}
          </button>
          <span className="detail-cycle-hint">USE ← / → KEYS</span>
          <button
            type="button"
            className="detail-cycle-btn"
            onClick={() => {
              onSelect(nextProject)
            }}
          >
            [{nextProject.index}] {nextProject.shortTitle} <ArrowRight size={13} />
          </button>
        </div>
      </article>
    </div>
  )
}
