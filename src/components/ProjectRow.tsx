import { ArrowRight } from 'lucide-react'
import type { Project } from '../data'
import { ProjectName } from './ProjectName'

type ProjectRowProps = {
  project: Project
  onSelect: (project: Project) => void
}

export function ProjectRow({ project, onSelect }: ProjectRowProps) {
  return (
    <article className="project-row">
      <div className="project-row-index mono-label">[{project.index}]</div>
      <div className="project-row-title"><span className="project-kicker">{project.category}</span><ProjectName project={project} onSelect={onSelect} /></div>
      <p className="project-row-description">{project.description}</p>
      <button className="text-arrow project-open" type="button" onClick={() => onSelect(project)} data-cursor="EXPLORE">EXPLORE <ArrowRight size={15} /></button>
      <div className="project-row-line" />
    </article>
  )
}
