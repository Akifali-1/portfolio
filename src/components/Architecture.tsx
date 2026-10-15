import { useState } from 'react'

const stages = [
  {
    index: '01',
    title: 'TEMPORAL',
    sub: 'TIME SIGNAL',
    signalClass: 'signal-bars',
    formula: 'X_t ∈ ℝ^{N × T × F} // Captures seasonality, lead-time lag, and demand velocity across time horizons.',
  },
  {
    index: '02',
    title: 'SPATIAL',
    sub: 'GRAPH RELATIONS',
    signalClass: 'signal-graph',
    formula: 'G = (V, E, A_t) // Encodes supplier-warehouse-retailer dependency edges and cross-entity spillover.',
  },
  {
    index: '03',
    title: 'ATTENTION',
    sub: 'ADAPTIVE FUSION',
    signalClass: 'signal-ring',
    formula: 'α_{ij} = Softmax(Q_t · K_s^T / √d) // Dynamically weights which relational edge matters at timestep t.',
  },
  {
    index: '04',
    title: 'FORECAST',
    sub: 'DEMAND OUTPUT',
    signalClass: 'signal-fusion',
    isFinal: true,
    formula: 'Ŷ_{t+1:t+H} // Interpretable multi-step demand trajectory with inspectable temporal + spatial attribution.',
  },
]

export function Architecture() {
  const [activeStep, setActiveStep] = useState(3)

  return (
    <div className="architecture-interactive-wrap" data-reveal="rise">
      <div className="architecture" aria-label="Adaptive STGT architecture: temporal, spatial, attention, and forecast">
        <div className="architecture-track" />
        {stages.map((stage, idx) => (
          <div key={stage.index} className="architecture-fragment">
            <button
              type="button"
              className={`architecture-step ${stage.isFinal ? 'is-final' : ''} ${activeStep === idx ? 'is-inspected' : ''}`}
              onMouseEnter={() => {
                setActiveStep(idx)
              }}
              onClick={() => setActiveStep(idx)}
              data-cursor="STAGE"
            >
              <span>{stage.index}</span>
              <i className={`arch-signal ${stage.signalClass}`}>
                <b />
                <b />
                <b />
                {stage.signalClass === 'signal-bars' && <b />}
              </i>
              <strong>{stage.title}</strong>
              <small>{stage.sub}</small>
            </button>
            {idx < stages.length - 1 && (
              <div className="architecture-plus">{idx === 2 ? '→' : '+'}</div>
            )}
          </div>
        ))}
      </div>
      <div className="architecture-readout mono-label">
        <span>[ STAGE {stages[activeStep].index} // {stages[activeStep].title} TELEMETRY ]</span>
        <code>{stages[activeStep].formula}</code>
      </div>
    </div>
  )
}
