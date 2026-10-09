import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, CornerDownLeft, Search, X } from 'lucide-react'
import { siteConfig } from '../data'

type CommandPaletteProps = {
  open: boolean
  onClose: () => void
}

type Command = {
  label: string
  meta: string
  action: () => void
}

const goTo = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)

  const commands: Command[] = [
    { label: 'Work graph', meta: 'WORK', action: () => goTo('work') },
    { label: 'Research archive', meta: 'RESEARCH', action: () => goTo('research') },
    { label: 'Research lab', meta: 'LAB', action: () => goTo('lab') },
    { label: 'Freelance / client work', meta: 'CLIENT WORK', action: () => goTo('freelance') },
    { label: 'About the system', meta: 'ABOUT', action: () => goTo('about') },
    { label: 'TraceMint', meta: 'EXTERNAL', action: () => window.open(siteConfig.tracemint, '_blank', 'noopener,noreferrer') },
    { label: 'Start a conversation', meta: 'CONTACT', action: () => goTo('contact') },
  ]

  const filtered = commands.filter((command) => `${command.label} ${command.meta}`.toLowerCase().includes(query.toLowerCase()))

  useEffect(() => {
    if (!open) return
    setQuery('')
    setActive(0)
    window.setTimeout(() => inputRef.current?.focus(), 30)
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setActive((value) => Math.min(value + 1, Math.max(filtered.length - 1, 0)))
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setActive((value) => Math.max(value - 1, 0))
      }
      if (event.key === 'Enter' && filtered[active]) {
        filtered[active].action()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [active, filtered, onClose, open])

  if (!open) return null

  return (
    <div className="command-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="command-panel" role="dialog" aria-modal="true" aria-label="Command palette" onMouseDown={(event) => event.stopPropagation()}>
        <div className="command-topline">
          <span>AKIF.SYSTEM / COMMAND</span>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close command palette"><X size={17} /></button>
        </div>
        <div className="command-input-wrap">
          <Search size={20} aria-hidden="true" />
          <input ref={inputRef} value={query} onChange={(event) => { setQuery(event.target.value); setActive(0) }} placeholder="Search the system..." aria-label="Search commands" />
          <span className="command-key">ESC</span>
        </div>
        <div className="command-results" role="listbox" aria-label="Commands">
          {filtered.length ? filtered.map((command, index) => (
            <button key={command.label} className={`command-result ${active === index ? 'is-active' : ''}`} type="button" role="option" aria-selected={active === index} onMouseEnter={() => setActive(index)} onClick={() => { command.action(); onClose() }}>
              <span>{command.label}</span>
              <span className="command-result-meta">{command.meta} {command.meta === 'EXTERNAL' ? <ArrowUpRight size={14} /> : active === index ? <CornerDownLeft size={14} /> : null}</span>
            </button>
          )) : <div className="command-empty">NO SIGNAL FOUND</div>}
        </div>
        <div className="command-footer"><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span><span><kbd>↵</kbd> select</span><span><kbd>esc</kbd> close</span></div>
      </section>
    </div>
  )
}
