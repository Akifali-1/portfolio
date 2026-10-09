export function ThreatEmulationPanel() {
  return (
    <div className="threat-panel" data-reveal="rise" aria-label="Threat Emulation visualization showing a closed-loop Red Agent, telemetry, Blue Agent, and rule verification">
      <div className="threat-copy"><span className="mono-label">RESEARCH / 005</span><h3>Threat Emulation</h3><p>An autonomous attack-and-defense testbed where a Red Agent attacks, telemetry is observed, and a Blue Agent adapts the defense.</p><span className="mono-label">CLOSED LOOP / NO RESULTS CLAIMED</span></div>
      <div className="threat-visual" data-parallax="0.08"><div className="threat-visual-topline"><span>THREAT EMULATION / CLOSED LOOP</span><span>RESEARCH / 005</span></div><div className="threat-display"><div className="threat-wordmark"><span>RED</span><i>→</i><span className="threat-wordmark-muted">TELEMETRY</span><i>→</i><span>BLUE</span></div><div className="threat-display-rule" /><div className="threat-display-detail"><span>ATTACK</span><span>OBSERVE</span><span>ADAPT</span></div></div><div className="threat-visual-bottom"><span>CALDERA → SYSMON / WAZUH → DEFENSE</span><span>NO RESULTS CLAIMED</span></div></div>
    </div>
  )
}
