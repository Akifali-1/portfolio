import { useEffect, useState } from 'react'

const loopPhases = [
  {
    phase: 'RED',
    action: 'ATTACK',
    log: 'CALDERA // EXECUTING MITRE ATT&CK T1059.001 (PowerShell Encoded Command)',
  },
  {
    phase: 'TELEMETRY',
    action: 'OBSERVE',
    log: 'SYSMON EVENT ID 1 + 4104 -> WAZUH STREAM // ANOMALOUS PROCESS CREATION CAPTURED',
  },
  {
    phase: 'BLUE',
    action: 'ADAPT',
    log: 'BLUE AGENT // SYNTHESIZING SIGMA DETECTION RULE -> DEPLOYING & RE-VERIFYING',
  },
]

export function ThreatEmulationPanel() {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStep((prev) => (prev + 1) % loopPhases.length)
    }, 2800)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div
      className="threat-panel"
      data-reveal="rise"
      aria-label="Threat Emulation visualization showing a closed-loop Red Agent, telemetry, Blue Agent, and rule verification"
    >
      <div className="threat-copy">
        <span className="mono-label">RESEARCH / 005</span>
        <h3>Threat Emulation</h3>
        <p>
          An autonomous attack-and-defense testbed where a Red Agent attacks, telemetry is observed, and a Blue Agent
          adapts the defense.
        </p>
        <span className="mono-label">CLOSED LOOP / NO RESULTS CLAIMED</span>
      </div>
      <div className="threat-visual" data-parallax="0.08">
        <div className="threat-visual-topline">
          <span>THREAT EMULATION / CLOSED LOOP</span>
          <span>PHASE 0{step + 1} / 03</span>
        </div>
        <div className="threat-display">
          <div className="threat-wordmark">
            <span className={step === 0 ? 'is-loop-active red-glow' : ''}>RED</span>
            <i>→</i>
            <span className={`threat-wordmark-muted ${step === 1 ? 'is-loop-active' : ''}`}>TELEMETRY</span>
            <i>→</i>
            <span className={step === 2 ? 'is-loop-active blue-glow' : ''}>BLUE</span>
          </div>
          <div className="threat-display-rule" />
          <div className="threat-display-detail">
            <span className={step === 0 ? 'is-step-lit' : ''}>ATTACK</span>
            <span className={step === 1 ? 'is-step-lit' : ''}>OBSERVE</span>
            <span className={step === 2 ? 'is-step-lit' : ''}>ADAPT</span>
          </div>
          <div className="threat-live-log mono-label">{loopPhases[step].log}</div>
        </div>
        <div className="threat-visual-bottom">
          <span>CALDERA → SYSMON / WAZUH → DEFENSE</span>
          <span>NO RESULTS CLAIMED</span>
        </div>
      </div>
    </div>
  )
}
