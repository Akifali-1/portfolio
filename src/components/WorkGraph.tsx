import { useState } from 'react'
import type { Project } from '../data'
import { clientProjects, projects } from '../data'

type GraphNode = { id: string; x: number; y: number; label: string; project?: string; central?: boolean; clientGroup?: boolean }

const systemGraphNodes: GraphNode[] = [
  { id: 'core', x: 50, y: 50, label: 'AKIF', central: true },
  { id: 'trace', x: 20, y: 28, label: 'TRACE MINT', project: 'tracemint' },
  { id: 'adaptive', x: 73, y: 20, label: 'ADAPTIVE STGT', project: 'adaptive-stgt' },
  { id: 'medgraph', x: 84, y: 47, label: 'MEDGRAPH', project: 'medgraph' },
  { id: 'fraud', x: 25, y: 71, label: 'MULTI-AGENT FRAUD', project: 'multi-agent-fraud' },
  { id: 'threat', x: 73, y: 73, label: 'THREAT EMULATION', project: 'threat-emulation' },
  { id: 'graph', x: 50, y: 12, label: 'GRAPH ML' },
  { id: 'security', x: 51, y: 86, label: 'SECURITY' },
]

const clientGraphNodes: GraphNode[] = [
  { id: 'core', x: 50, y: 50, label: 'AKIF', central: true },
  { id: 'client-work', x: 72, y: 50, label: 'CLIENT WORK', clientGroup: true },
  { id: 'buildcraft', x: 88, y: 29, label: 'BUILDCRAFT', project: 'buildcraft' },
  { id: 'bright-clinic', x: 88, y: 71, label: 'BRIGHT CLINIC', project: 'bright-clinic' },
]

const systemGraphEdges: [string, string][] = [
  ['core', 'trace'], ['core', 'adaptive'], ['core', 'medgraph'], ['core', 'fraud'], ['core', 'threat'],
  ['trace', 'graph'], ['adaptive', 'graph'], ['medgraph', 'graph'], ['fraud', 'security'], ['threat', 'security'],
]

const clientGraphEdges: [string, string][] = [
  ['core', 'client-work'], ['client-work', 'buildcraft'], ['client-work', 'bright-clinic'],
]

function curvePath(start: GraphNode, end: GraphNode, index: number) {
  const midpointX = (start.x + end.x) / 2
  const midpointY = (start.y + end.y) / 2
  const bend = ((index % 3) - 1) * 5
  const controlX = midpointX + (end.y - start.y) * 0.12 + bend
  const controlY = midpointY - (end.x - start.x) * 0.12 - bend * 0.35
  return `M ${start.x} ${start.y} Q ${controlX} ${controlY} ${end.x} ${end.y}`
}

type WorkGraphProps = {
  onSelect: (project: Project) => void
  reducedMotion: boolean
}

export function WorkGraph({ onSelect, reducedMotion }: WorkGraphProps) {
  const [mode, setMode] = useState<'systems' | 'client'>('systems')
  const [active, setActive] = useState('core')
  const graphNodes = mode === 'systems' ? systemGraphNodes : clientGraphNodes
  const graphEdges = mode === 'systems' ? systemGraphEdges : clientGraphEdges
  const activeProject = graphNodes.find((node) => node.id === active)?.project
  const allProjects = [...projects, ...clientProjects]
  const changeMode = (nextMode: 'systems' | 'client') => {
    setMode(nextMode)
    setActive('core')
  }

  return (
    <div className="work-graph-wrap" data-reveal="rise">
      <div className="graph-toolbar">
        <div className="graph-mode-switch" role="tablist" aria-label="Work graph view">
          <button type="button" className={mode === 'systems' ? 'is-active' : ''} onClick={() => changeMode('systems')} role="tab" aria-selected={mode === 'systems'}>SYSTEMS / RESEARCH</button>
          <button type="button" className={mode === 'client' ? 'is-active' : ''} onClick={() => changeMode('client')} role="tab" aria-selected={mode === 'client'}>CLIENT WEB</button>
        </div>
        <div className="graph-legend">{mode === 'systems' ? <><span><i className="legend-dot blue" /> PRODUCT</span><span><i className="legend-dot violet" /> RESEARCH</span></> : <span><i className="legend-dot client" /> CLIENT WEB</span>}<span><i className="legend-dot white" /> CORE</span></div>
      </div>
      <div className="work-graph" onMouseLeave={() => setActive('core')}>
        <svg className="graph-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {graphEdges.map(([from, to], index) => {
            const start = graphNodes.find((node) => node.id === from)!
            const end = graphNodes.find((node) => node.id === to)!
            const isActive = active === from || active === to || active === 'core'
            const path = curvePath(start, end, index)
            return <g key={`${from}-${to}`}><path d={path} className={isActive ? 'is-active' : 'is-muted'} />{!reducedMotion && index % 2 === 0 && <circle r=".42" className={isActive ? 'graph-particle is-active' : 'graph-particle'}><animateMotion dur={`${4.5 + index * .35}s`} begin={`${index * .28}s`} repeatCount="indefinite" path={path} /></circle>}</g>
          })}
        </svg>
        <div className="graph-orbit orbit-one" /><div className="graph-orbit orbit-two" />
        {graphNodes.map((node) => {
          const project = node.project ? allProjects.find((item) => item.id === node.project) : undefined
          return <button key={node.id} type="button" className={`graph-node ${node.central ? 'is-central' : ''} ${node.clientGroup ? 'is-client-group' : ''} ${project?.kind === 'client' ? 'is-client' : ''} ${active === node.id ? 'is-selected' : ''} ${activeProject && activeProject !== node.project && node.id !== 'core' ? 'is-dimmed' : ''}`} style={{ left: `${node.x}%`, top: `${node.y}%` }} onMouseEnter={() => setActive(node.id)} onFocus={() => setActive(node.id)} onClick={() => project && onSelect(project)} aria-label={`${node.label}${project ? ', open project' : ''}`} data-cursor={project ? 'OPEN' : 'NODE'}>
            <span className="node-pulse" /><span className="node-core" /><span className="node-label">{node.label}</span>
          </button>
        })}
        <div className="graph-axis axis-x">SYSTEM RELATION / X</div><div className="graph-axis axis-y">IDEA DENSITY / Y</div>
      </div>
      <div className="graph-caption"><span className="mono-label">HOVER A NODE TO FOCUS THE SYSTEM</span><span className="graph-caption-detail">{active === 'core' ? `SELECTED / ${mode === 'systems' ? 'SYSTEMS' : 'CLIENT WEB'}` : `FOCUS / ${graphNodes.find((node) => node.id === active)?.label}`}</span></div>
    </div>
  )
}
