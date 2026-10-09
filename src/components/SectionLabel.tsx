import type { ReactNode } from 'react'

type SectionLabelProps = {
  index: string
  children: ReactNode
  light?: boolean
}

export function SectionLabel({ index, children, light = false }: SectionLabelProps) {
  return <div className={`section-label ${light ? 'is-light' : ''}`} data-reveal="fade"><span className="label-index">{index}</span><span>{children}</span><span className="label-line" /></div>
}
