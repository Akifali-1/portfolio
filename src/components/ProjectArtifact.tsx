import type { Project } from '../data'

type ProjectArtifactProps = {
  project: Project
  compact?: boolean
}

export function ProjectArtifact({ project, compact = false }: ProjectArtifactProps) {
  return (
    <div className={`project-artifact artifact-${project.artifact} ${compact ? 'is-compact' : ''}`} aria-label={`Abstract ${project.title} project artifact`}>
      <div className="artifact-grid" />
      <div className="artifact-caption"><span>ARTIFACT / {project.index}</span><i /></div>
      {project.artifact === 'trace' && <>
        <div className="trace-profile"><span className="trace-avatar">T</span><span><b>proof / developer</b><small>verified activity</small></span></div>
        <div className="trace-bars"><i /><i /><i /><i /><i /><i /><i /></div>
        <div className="artifact-chip">EVIDENCE → PROFILE</div>
      </>}
      {project.artifact === 'stgt' && <>
        <div className="stgt-stream"><i /><i /><i /><i /><i /></div>
        <div className="stgt-graph"><b /><b /><b /><b /><b /><span /><span /><span /></div>
        <div className="artifact-chip">TIME + RELATION</div>
      </>}
      {project.artifact === 'medgraph' && <>
        <div className="medgraph-lines"><i /><i /><i /><i /><i /></div>
        <div className="medgraph-node patient">P</div><div className="medgraph-node symptom">S</div><div className="medgraph-node condition">C</div><div className="medgraph-node medication">M</div>
        <div className="artifact-chip">CLINICAL GRAPH / TEMPORAL</div>
      </>}
      {project.artifact === 'fraud' && <>
        <div className="fraud-agents"><span>AGENT / 01</span><span>AGENT / 02</span><span>AGENT / 03</span></div>
        <div className="fraud-signal"><b /><b /><b /><b /><b /></div>
        <div className="artifact-chip">MULTIPLE SIGNALS / UPI</div>
      </>}
      {project.artifact === 'threat' && <>
        <div className="threat-loop"><span className="red">RED</span><i>→</i><span className="telemetry">SYS / WAZUH</span><i>→</i><span className="blue">BLUE</span></div>
        <div className="threat-ring"><b /><b /><b /></div>
        <div className="artifact-chip">CLOSED LOOP / RESEARCH</div>
      </>}
      {project.artifact === 'iot' && <>
        <div className="iot-device"><span /><b>ESP32</b></div>
        <div className="iot-waves"><i /><i /><i /></div>
        <div className="artifact-chip">EDGE → WEBSOCKET → DEVICE</div>
      </>}
      {project.artifact === 'construction' && <>
        <div className="client-blueprint"><span /><span /><span /><b>BUILD</b></div>
        <div className="artifact-chip">CLIENT / FRONTEND</div>
      </>}
      {project.artifact === 'clinic' && <>
        <div className="client-clinic-mark">+</div>
        <div className="clinic-lines"><i /><i /><i /></div>
        <div className="artifact-chip">CLIENT / FRONTEND</div>
      </>}
    </div>
  )
}
