import { ArrowDownRight, ArrowRight, ExternalLink } from 'lucide-react'
import { Architecture } from '../components/Architecture'
import { LabCard } from '../components/LabCard'
import { ProjectRow } from '../components/ProjectRow'
import { SectionLabel } from '../components/SectionLabel'
import { ThreatEmulationPanel } from '../components/ThreatEmulationPanel'
import { WorkGraph } from '../components/WorkGraph'
import { clientProjects, exploring, projects, siteConfig, type Project } from '../data'

type ProjectSelectionProps = {
  onSelect: (project: Project) => void
}

export function ManifestoSection() {
  return (
    <section className="manifesto section-dark" aria-labelledby="manifesto-title">
      <div className="page-grid"><SectionLabel index="01">A SYSTEM FOR MAKING</SectionLabel><div className="manifesto-copy" data-reveal="rise"><h2 id="manifesto-title">Ideas are only<br /><em>the beginning.</em></h2><p>I build intelligent systems and turn experiments into products. The work lives somewhere between a question and a working thing.</p></div><div className="manifesto-aside mono-label">[ PRINCIPLE / 001 ]<br /><span>MAKE THE INVISIBLE<br />LEGIBLE.</span></div></div>
    </section>
  )
}

export function WorkSection({ onSelect, reducedMotion }: ProjectSelectionProps & { reducedMotion: boolean }) {
  return (
    <section className="work-section section-dark" id="work" aria-labelledby="work-title">
      <div className="page-grid"><SectionLabel index="02">THE WORK GRAPH</SectionLabel><div className="section-heading work-heading" data-reveal="rise"><span className="mono-label">RELATIONAL INDEX / 2026</span><h2 id="work-title">Everything<br /><em>connects.</em></h2><p>A map of products, research, and ideas in motion. Select a node to look closer.</p></div><WorkGraph onSelect={onSelect} reducedMotion={reducedMotion} /></div>
      <div className="project-list" data-reveal="rise"><div className="project-list-header mono-label"><span>SELECTED WORK</span><span>ARTIFACT / 05</span></div>{projects.map((project) => <ProjectRow key={project.id} project={project} onSelect={onSelect} />)}</div>
    </section>
  )
}

export function ClientSection({ onSelect }: ProjectSelectionProps) {
  return (
    <section className="client-section section-dark" id="freelance" aria-labelledby="client-title">
      <div className="page-grid"><SectionLabel index="02B">FREELANCE / CLIENT WORK</SectionLabel><div className="client-heading" data-reveal="rise"><span className="mono-label">CLIENT SURFACE / FRONTEND</span><h2 id="client-title">Built for the<br /><em>real world.</em></h2><p>Alongside products and research, I build polished frontend websites for businesses that need their work to be understood.</p></div><div className="client-aside"><span className="detail-label">SEPARATE SIGNAL</span><p>CLIENT PROJECTS<br /><strong>WEB DEVELOPMENT</strong></p><span className="mono-label">NO PUBLIC SOURCE LINKS</span></div></div>
      <div className="project-list client-project-list"><div className="project-list-header mono-label"><span>CLIENT PROJECTS</span><span>WEB / 02</span></div>{clientProjects.map((project) => <ProjectRow key={project.id} project={project} onSelect={onSelect} />)}</div>
    </section>
  )
}

export function ResearchSection() {
  return (
    <section className="research-section section-paper" id="research" aria-labelledby="research-title">
      <div className="page-grid"><SectionLabel index="03" light>RESEARCH / ADAPTIVE STGT</SectionLabel><div className="research-top" data-reveal="rise"><span className="mono-label">PAPER / 001 — IN PROGRESS</span><h2 id="research-title">Supply chains<br />are not only<br /><em>temporal.</em></h2><p className="research-thesis">They are relational.</p></div><div className="research-explainer" data-reveal="fade"><span className="detail-label">THE QUESTION</span><p>When a system forecasts demand, what changes when its relationships become part of the signal?</p></div><Architecture /><ThreatEmulationPanel /><div className="research-foot"><span className="mono-label">ADAPTIVE STGT</span><span className="mono-label">INTERPRETABLE SUPPLY CHAIN DEMAND FORECASTING</span><span className="research-index">[ 01 — 04 ]</span></div><div className="research-bottom-mark" data-reveal="rise"><span className="mono-label">THE NEXT VARIABLE / 004</span><strong>Relations<br /><em>become signal.</em></strong><span className="mono-label">ADAPTIVE STGT / RESEARCH SURFACE</span></div></div>
    </section>
  )
}

export function LabSection({ onSelect }: ProjectSelectionProps) {
  return (
    <section className="lab-section section-dark" id="lab" aria-labelledby="lab-title">
      <div className="page-grid"><SectionLabel index="04">RESEARCH LAB</SectionLabel><div className="lab-heading"><div><span className="mono-label">// OPEN QUESTIONS</span><h2 id="lab-title">Not everything<br />needs to be <em>finished.</em></h2></div><p>Some systems are shipped. Some are watched. The lab keeps the uncertain parts visible.</p></div><div className="lab-grid">{projects.filter((project) => project.kind === 'research').map((project) => <LabCard key={project.id} project={project} onSelect={onSelect} />)}</div></div>
    </section>
  )
}

export function SignalSection() {
  const graphProject = projects.find((project) => project.id === 'tracemint')

  return (
    <section className="signal-section section-dark" aria-labelledby="signal-title">
      <div className="page-grid signal-grid"><SectionLabel index="05">LIVE SIGNAL</SectionLabel><div className="signal-title-wrap"><span className="mono-label">PUBLIC WORK / TRACEABLE BY DESIGN</span><h2 id="signal-title">Proof lives<br /><em>in the trail.</em></h2></div><div className="signal-console"><div className="console-head"><span><i className="live-dot" /> SIGNAL CHANNEL</span><span>READ ONLY</span></div><div className="console-lines"><p><b>01</b><span>source</span><strong>GITHUB / EVIDENCE</strong></p><p><b>02</b><span>transform</span><strong>DETERMINISTIC ANALYSIS</strong></p><p><b>03</b><span>interpret</span><strong>AI / CONTEXT</strong></p><p><b>04</b><span>output</span><strong>PROOF-OF-WORK PROFILE</strong></p></div><div className="console-foot"><span>NO UNVERIFIED METRICS DISPLAYED</span><span>TRACE MINT / 001</span></div></div><a className="text-arrow signal-link" href={graphProject?.link} target="_blank" rel="noreferrer" data-cursor="VISIT">FOLLOW THE SIGNAL <ArrowRight size={15} /></a></div>
    </section>
  )
}

export function AboutSection() {
  return (
    <section className="about-section section-paper" id="about" aria-labelledby="about-title">
      <div className="page-grid"><SectionLabel index="06" light>ABOUT THE BUILDER</SectionLabel><div className="about-copy"><span className="mono-label">A SHORT OPERATING MANUAL</span><h2 id="about-title">I like building<br />things I don't<br /><em>fully understand yet.</em></h2><p>I work across software engineering, AI systems, research, and experimentation. I like taking difficult questions, turning them into systems, and seeing what happens.</p></div><div className="exploring"><span className="detail-label">CURRENTLY EXPLORING</span><div className="exploring-list">{exploring.map((item, index) => <span key={item}><small>{String(index + 1).padStart(2, '0')}</small>{item}</span>)}</div></div></div>
    </section>
  )
}

export function ContactSection() {
  return (
    <section className="contact-section section-dark" id="contact" aria-labelledby="contact-title">
      <div className="contact-grid"><SectionLabel index="07">OPEN CHANNEL</SectionLabel><div className="contact-title"><span className="mono-label">NO PITCH DECK REQUIRED</span><h2 id="contact-title">Let's build<br /><em>something.</em></h2><a className="contact-primary-cta" href={`mailto:${siteConfig.email}`}>EMAIL AKIF <ArrowRight size={15} /></a></div><div className="contact-links"><a href={siteConfig.tracemint} target="_blank" rel="noreferrer" data-cursor="VISIT"><span>TRACEMINT</span><ExternalLink size={16} /></a><a href={`mailto:${siteConfig.email}`} data-cursor="EMAIL"><span>EMAIL AKIF</span><span className="contact-link-detail">{siteConfig.email}</span></a><a href={siteConfig.linkedin} target="_blank" rel="noreferrer" data-cursor="LINKEDIN"><span>LINKEDIN</span><ExternalLink size={16} /></a></div><div className="contact-line" /></div>
    </section>
  )
}

export function SiteFooter() {
  return <footer className="site-footer"><a className="wordmark" href="#top">AKIF<span>.SYSTEM</span></a><span>BUILT WITH CURIOSITY.</span><span>© 2026</span><a href="#contact">OPEN CHANNEL <ArrowDownRight size={14} /></a></footer>
}
