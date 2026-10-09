export function Architecture() {
  return (
    <div className="architecture" data-reveal="rise" aria-label="Adaptive STGT architecture: temporal, spatial, attention, and forecast">
      <div className="architecture-track" />
      <div className="architecture-step"><span>01</span><i className="arch-signal signal-bars"><b /><b /><b /><b /></i><strong>TEMPORAL</strong><small>TIME SIGNAL</small></div>
      <div className="architecture-plus">+</div>
      <div className="architecture-step"><span>02</span><i className="arch-signal signal-graph"><b /><b /><b /></i><strong>SPATIAL</strong><small>GRAPH RELATIONS</small></div>
      <div className="architecture-plus">+</div>
      <div className="architecture-step"><span>03</span><i className="arch-signal signal-ring"><b /></i><strong>ATTENTION</strong><small>ADAPTIVE FUSION</small></div>
      <div className="architecture-plus">→</div>
      <div className="architecture-step is-final"><span>04</span><i className="arch-signal signal-fusion"><b /><b /></i><strong>FORECAST</strong><small>DEMAND OUTPUT</small></div>
    </div>
  )
}
