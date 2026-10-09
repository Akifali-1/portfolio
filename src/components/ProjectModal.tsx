import { ExternalLink, X } from 'lucide-react'
import type { Project } from '../data'

type ProjectModalProps = {
  project: Project | null
  onClose: () => void
}

export function ProjectModal({ project, onClose }: ProjectModalProps) {
  if (!project) return null

  return (
    <div className="detail-backdrop" onMouseDown={onClose}>
      <article className="detail-panel" role="dialog" aria-modal="true" aria-label={`${project.title} case study`} onMouseDown={(event) => event.stopPropagation()}>
        <button className="detail-close" type="button" onClick={onClose} aria-label="Close project detail"><X size={18} /></button>
        <div className="detail-eyebrow"><span>PROJECT {project.index}</span><span>{project.status}</span></div>
        <div className="detail-heading"><span className="detail-category">{project.category}</span><h2>{project.title}</h2><p>{project.description}</p></div>
        <div className="detail-grid"><div><span className="detail-label">WHAT IS IT?</span><p className="detail-question">{project.what}</p></div><div><span className="detail-label">WHY?</span><p className="detail-answer">{project.why}</p></div></div>
        <div className="detail-how"><div><span className="detail-label">HOW DOES IT WORK?</span><div className="detail-signal">{project.signal.split(' → ').map((item, index) => <span key={item}><b>{item}</b>{index < project.signal.split(' → ').length - 1 && <i>↓</i>}</span>)}</div></div><div className="detail-method">{project.how.map((step, index) => <span key={step}><small>{String(index + 1).padStart(2, '0')}</small>{step}</span>)}</div></div>
        <div className="detail-bottom"><div><span className="detail-label">WHAT I ACTUALLY DID</span><p className="detail-actually">{project.actually}</p><span className="detail-label detail-tech-label">{project.kind === 'client' ? 'WORK TYPE' : 'TECHNOLOGY'}</span><div className="tech-list">{project.technologies.map((tech) => <span key={tech}>{tech}</span>)}</div></div>{project.link && <a className="text-arrow detail-link" href={project.link} target="_blank" rel="noreferrer" data-cursor="VISIT">OPEN PROJECT <ExternalLink size={15} /></a>}</div>
        {project.baselines && <div className="detail-baselines"><span className="detail-label">COMPARISON BASELINES</span><div>{project.baselines.map((baseline) => <span key={baseline}>{baseline}</span>)}</div><p>Research question: {project.why}</p></div>}
      </article>
    </div>
  )
}
