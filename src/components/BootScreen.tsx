import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'

const bootLines = ['INITIALIZING AKIF.SYSTEM', 'LOADING / CORE', 'MAPPING / RESEARCH', 'OPENING / WORKSHOP']

type BootScreenProps = {
  onComplete: () => void
  reducedMotion: boolean
}

export function BootScreen({ onComplete, reducedMotion }: BootScreenProps) {
  const [started, setStarted] = useState(false)
  const [line, setLine] = useState(0)

  useEffect(() => {
    if (!started) return
    const timers = bootLines.map((_, index) => window.setTimeout(() => setLine(index + 1), 240 + index * 520))
    const done = window.setTimeout(onComplete, 3200)
    return () => {
      timers.forEach(window.clearTimeout)
      window.clearTimeout(done)
    }
  }, [onComplete, started])

  if (!started) {
    return (
      <div className="boot-screen boot-offline" aria-label="Akif system offline">
        <div className="offline-core">
          <div className="offline-status"><span className="offline-dot" /> SYSTEM / STANDBY</div>
          <div className="offline-title">SYSTEM<br /><em>OFFLINE</em></div>
          <p>Click to turn the system on.</p>
          <div className="offline-action">
            <button className="offline-button" type="button" onClick={() => { if (reducedMotion) onComplete(); setStarted(true) }}>
              <span className="power-mark">↗</span><span>TURN SYSTEM ON</span><ArrowRight size={14} />
            </button>
            <span className="offline-hint">[ PRESS TO INITIALIZE ]</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`boot-screen ${line >= bootLines.length ? 'is-ready' : ''}`} aria-label="Loading Akif system">
      <div className="boot-core">
        <div className="boot-mark"><span /> <span /> <span /></div>
        <div className="boot-lines">
          {bootLines.map((item, index) => <div key={item} className={line > index ? 'is-visible' : ''}><span className="mono-label">[{String(index + 1).padStart(2, '0')}]</span>{item}</div>)}
        </div>
        <div className="boot-progress"><span style={{ width: `${Math.min(line / bootLines.length, 1) * 100}%` }} /></div>
        <button className="boot-skip" type="button" onClick={onComplete}>ENTER SYSTEM <ArrowRight size={14} /></button>
      </div>
    </div>
  )
}
