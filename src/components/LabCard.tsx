import { ArrowUpRight } from 'lucide-react'
import type { Project } from '../data'

type LabCardProps = {
  project: Project
  onSelect: (project: Project) => void
}

export function LabCard({ project, onSelect }: LabCardProps) {
  return <button type="button" className="lab-card" onClick={() => onSelect(project)} data-cursor="INSPECT"><span className="lab-card-top"><span>[{project.index}]</span><span className="lab-status"><i />{project.status}</span></span><span className="lab-card-title">{project.title}</span><span className="lab-card-tag">{project.category}</span><span className="lab-card-description">{project.description}</span><span className="lab-card-bottom"><span>EXPLORE PROJECT</span><ArrowUpRight size={15} /></span></button>
}
