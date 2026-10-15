import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Check, CornerDownLeft, Search, X } from 'lucide-react'
import { clientProjects, projects, siteConfig, type Project } from '../data'

type CommandPaletteProps = {
  open: boolean
  onClose: () => void
  onSelectProject: (project: Project) => void
}

type Command = {
  id: string
  label: string
  keywords: string
  meta: string
  action: () => void
}

const goTo = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

export function CommandPalette({ open, onClose, onSelectProject }: CommandPaletteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [copied, setCopied] = useState(false)

  const projectCommands: Command[] = [...projects, ...clientProjects].map((project) => ({
    id: `project-${project.id}`,
    label: `${project.title} — ${project.category}`,
    keywords: `${project.title} ${project.technologies.join(' ')} ${project.signal} ${project.description}`,
    meta: `PROJECT / ${project.index}`,
    action: () => {
      onSelectProject(project)
      onClose()
    },
  }))

  const baseCommands: Command[] = [
    { id: 'nav-work', label: 'Work graph & selected artifacts', keywords: 'work graph projects', meta: 'SECTION / 02', action: () => { goTo('work'); onClose() } },
    { id: 'nav-research', label: 'Research monograph (Adaptive STGT & Threat Emulation)', keywords: 'research paper stgt threat emulation', meta: 'SECTION / 03', action: () => { goTo('research'); onClose() } },
    { id: 'nav-lab', label: 'Research lab & open questions', keywords: 'lab experiments', meta: 'SECTION / 04', action: () => { goTo('lab'); onClose() } },
    { id: 'nav-client', label: 'Freelance / client web surface', keywords: 'client freelance web', meta: 'SECTION / 02B', action: () => { goTo('freelance'); onClose() } },
    { id: 'nav-about', label: 'About the builder', keywords: 'about bio', meta: 'SECTION / 06', action: () => { goTo('about'); onClose() } },
    {
      id: 'act-copy-email',
      label: copied ? `Copied ${siteConfig.email} to buffer` : `Copy email (${siteConfig.email})`,
      keywords: 'copy email contact address',
      meta: copied ? 'COPIED' : 'ACTION',
      action: () => {
        navigator.clipboard?.writeText(siteConfig.email)
        setCopied(true)
        window.setTimeout(() => {
          setCopied(false)
          onClose()
        }, 650)
      },
    },
    {
      id: 'ext-tracemint',
      label: 'Launch TraceMint Live Platform',
      keywords: 'tracemint external live',
      meta: 'EXTERNAL',
      action: () => {
        window.open(siteConfig.tracemint, '_blank', 'noopener,noreferrer')
        onClose()
      },
    },
  ]

  const allCommands = [...projectCommands, ...baseCommands]
  const filtered = allCommands.filter((command) =>
    `${command.label} ${command.meta} ${command.keywords}`.toLowerCase().includes(query.toLowerCase()),
  )

  useEffect(() => {
    if (!open) return
    setQuery('')
    setActive(0)
    setCopied(false)
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
        event.preventDefault()
        filtered[active].action()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [active, filtered, onClose, open])

  if (!open) return null

  return (
    <div className="command-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="command-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="command-topline">
          <span>AKIF.SYSTEM / COMMAND TERMINAL</span>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close command palette">
            <X size={17} />
          </button>
        </div>
        <div className="command-input-wrap">
          <Search size={20} aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setActive(0)
            }}
            placeholder="Search projects, research, or type 'copy email'..."
            aria-label="Search commands"
          />
          <span className="command-key">ESC</span>
        </div>
        <div className="command-results" role="listbox" aria-label="Commands">
          {filtered.length ? (
            filtered.map((command, index) => (
              <button
                key={command.id}
                className={`command-result ${active === index ? 'is-active' : ''}`}
                type="button"
                role="option"
                aria-selected={active === index}
                onMouseEnter={() => setActive(index)}
                onClick={() => command.action()}
              >
                <span>{command.label}</span>
                <span className="command-result-meta">
                  {command.meta}{' '}
                  {command.meta === 'COPIED' ? (
                    <Check size={14} />
                  ) : command.meta === 'EXTERNAL' ? (
                    <ArrowUpRight size={14} />
                  ) : active === index ? (
                    <CornerDownLeft size={14} />
                  ) : null}
                </span>
              </button>
            ))
          ) : (
            <div className="command-empty">NO SIGNAL FOUND FOR "{query.toUpperCase()}"</div>
          )}
        </div>
        <div className="command-footer">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> navigate
          </span>
          <span>
            <kbd>↵</kbd> execute
          </span>
          <span>
            <kbd>esc</kbd> close
          </span>
        </div>
      </section>
    </div>
  )
}
