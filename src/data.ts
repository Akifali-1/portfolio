export type ArtifactKind = 'trace' | 'stgt' | 'medgraph' | 'fraud' | 'threat' | 'iot' | 'construction' | 'clinic' | 'spantrace' | 'cafe' | 'waffles'

export type Project = {
  id: string
  index: string
  title: string
  shortTitle: string
  category: string
  description: string
  status: string
  technologies: string[]
  signal: string
  artifact: ArtifactKind
  kind: 'product' | 'research' | 'prototype' | 'client'
  what: string
  why: string
  how: string[]
  actually: string
  baselines?: string[]
  link?: string
  previewImage?: string
}

export const siteConfig = {
  email: 'akifaliparvez@gmail.com',
  github: 'https://github.com/Akifali-1/portfolio',
  linkedin: 'https://www.linkedin.com/in/akifali1001',
  tracemint: 'https://tracemint.tech',
  domain: 'https://akifali.dev',
} as const

export const projects: Project[] = [
  {
    id: 'tracemint',
    index: '001',
    title: 'TraceMint',
    shortTitle: 'TRACE MINT',
    category: 'Developer Intelligence / Product',
    description: 'A proof-of-work platform that turns real developer activity into a verified, interpretable profile.',
    status: 'OPEN SOURCE / IN DEVELOPMENT',
    technologies: ['React', 'FastAPI', 'PostgreSQL', 'Google Gemini'],
    signal: 'GITHUB → EVIDENCE → ANALYSIS → PROFILE',
    artifact: 'trace',
    kind: 'product',
    what: 'A developer intelligence platform that analyzes real GitHub work and presents it as evidence.',
    why: 'Can a developer’s actual work become a stronger representation of their abilities than a résumé?',
    how: ['GITHUB ACTIVITY', 'EVIDENCE EXTRACTION', 'DETERMINISTIC ANALYSIS', 'AI INTERPRETATION', 'PROFILE'],
    actually: 'Designed and built the product surface around traceable proof of work.',
    link: 'https://tracemint.tech',
    previewImage: '/previews/tracemint_hover.jpeg',
  },
  {
    id: 'adaptive-stgt',
    index: '002',
    title: 'Adaptive STGT',
    shortTitle: 'ADAPTIVE STGT',
    category: 'Supply Chain Research',
    description: 'Spatio-temporal graph forecasting for supply-chain demand, combining temporal patterns with relationships between entities.',
    status: 'RESEARCH',
    technologies: ['Spatio-temporal forecasting', 'Graph relationships', 'Attention / fusion'],
    signal: 'TEMPORAL → SPATIAL → ATTENTION → FORECAST',
    artifact: 'stgt',
    kind: 'research',
    what: 'A research model for demand forecasting when both time and relationships between entities matter.',
    why: 'How can temporal dynamics and graph structure be combined without hiding the reasoning?',
    how: ['TEMPORAL SIGNAL', 'SPATIAL RELATIONS', 'ATTENTION / FUSION', 'DEMAND FORECAST'],
    actually: 'Investigated an interpretable architecture that makes temporal and relational signals visible together.',
    previewImage: '/previews/adaptivestgt_hover.jpeg',
  },
  {
    id: 'medgraph',
    index: '003',
    title: 'MedGraph',
    shortTitle: 'MEDGRAPH',
    category: 'Healthcare AI / Research',
    description: 'Graph-based healthcare modeling that connects clinical entities and temporal signals to support patient risk analysis and interpretable medical insights.',
    status: 'RESEARCH',
    technologies: ['Graph modeling', 'Clinical entities', 'Temporal signals'],
    signal: 'CLINICAL ENTITIES → TEMPORAL SIGNALS → RISK ANALYSIS',
    artifact: 'medgraph',
    kind: 'research',
    what: 'A research direction for representing clinical entities and temporal signals as a connected graph.',
    why: 'How can relationships between symptoms, conditions, medications, and time remain inspectable?',
    how: ['CLINICAL ENTITIES', 'GRAPH RELATIONS', 'TEMPORAL SIGNALS', 'RISK ANALYSIS'],
    actually: 'Explored graph-based representations intended to keep medical reasoning structured and interpretable.',
    previewImage: '/previews/medgraph_hober.jpeg',
  },
  {
    id: 'multi-agent-fraud',
    index: '004',
    title: 'Multi-Agent Fraud Detection',
    shortTitle: 'MULTI-AGENT FRAUD',
    category: 'Prototype / Security / AI',
    description: 'An agent-based system for detecting suspicious UPI transactions using multiple complementary signals and behavioral analysis.',
    status: 'PROTOTYPE',
    technologies: ['Agent perspectives', 'UPI transaction signals', 'Behavioral analysis'],
    signal: 'UPI SIGNALS → AGENT VIEWS → BEHAVIOR → FLAG',
    artifact: 'fraud',
    kind: 'prototype',
    what: 'A prototype that gives multiple agents complementary perspectives on suspicious UPI transactions.',
    why: 'Can different behavioral readings make a fraud signal easier to inspect than one opaque decision?',
    how: ['TRANSACTION SIGNALS', 'COMPLEMENTARY AGENTS', 'BEHAVIORAL ANALYSIS', 'SUSPICION SIGNAL'],
    actually: 'Used FIGMENT as the factual basis for a multi-agent fraud-detection interface and system direction.',
    previewImage: '/previews/figment_hover.jpeg',
  },
  {
    id: 'threat-emulation',
    index: '005',
    title: 'Threat Emulation',
    shortTitle: 'THREAT EMULATION',
    category: 'Cybersecurity Research',
    description: 'An autonomous attack-and-defense testbed where an LLM-driven Red Agent executes MITRE ATT&CK techniques through Caldera, while Sysmon and Wazuh detect them and a Blue Agent adapts the defenses.',
    status: 'RESEARCH',
    technologies: ['LLM Red Agent', 'MITRE ATT&CK / Caldera', 'Sysmon / Wazuh', 'Blue Agent'],
    signal: 'RED AGENT → CALDERA → TELEMETRY → BLUE AGENT',
    artifact: 'threat',
    kind: 'research',
    what: 'An autonomous attack-and-defense testbed.',
    why: 'Can a closed-loop Blue Agent improve detection of held-out attack variants without increasing false positives?',
    how: ['LLM RED AGENT → CALDERA', 'WINDOWS 11 / ATT&CK TECHNIQUES', 'SYSMON + WAZUH TELEMETRY', 'BLUE AGENT', 'RULE → DEPLOY → RE-ATTACK → VERIFY'],
    actually: 'Built the research surface around an adaptive attack-and-defense loop; final experimental results are not claimed here.',
    baselines: ['Default Wazuh + script block logging', 'One-shot LLM rules', 'Public Sigma rules', 'Hand-written expert rules'],
    previewImage: '/previews/threatemulation_hover.jpeg',
  },
  {
    id: 'spantrace',
    index: '006',
    title: 'SpanTrace',
    shortTitle: 'SPAN TRACE',
    category: 'Developer Platform / Observability / AI Agents',
    description: 'A local-first developer platform for understanding multi-agent executions, policy incidents, and evidence-backed instrumentation.',
    status: 'OPEN SOURCE / IN DEVELOPMENT',
    technologies: ['OpenTelemetry', 'FastAPI', 'Next.js 15', 'Python SDK', 'SQLite / PostgreSQL'],
    signal: 'CAPTURE → PERSIST → INSPECT → DETECT INCIDENT → REGRESSION VERIFICATION',
    artifact: 'spantrace',
    kind: 'product',
    what: 'A local-first observability and debugging platform for multi-agent workflows that turns runtime traces into verifiable evidence and regression tests.',
    why: 'When multi-agent systems fail or deviate from policy, post-hoc logs and opaque traces make root-cause diagnosis difficult. How can teams inspect agent handoffs, detect incidents, and verify deterministic regressions from real telemetry evidence?',
    how: ['OTEL TELEMETRY', 'RUNTIME CAPTURE', 'INCIDENT DETECTION', 'ROOT CAUSE ANALYSIS', 'REGRESSION SUITE'],
    actually: 'Engineered the modular monolith: standalone Python SDK with OpenTelemetry instrumentation adapters, FastAPI telemetry ingestion API, and Next.js 15 execution dashboard.',
    previewImage: '/previews/spantrace_hover.jpeg',
  },
]

export const clientProjects: Project[] = [
  {
    id: 'buildcraft',
    index: 'C01',
    title: 'BuildCraft',
    shortTitle: 'BUILDCRAFT',
    category: 'Client / frontend web project',
    description: 'A business and construction-oriented frontend website created as client work.',
    status: 'CLIENT / WEB DEVELOPMENT',
    technologies: ['Frontend development', 'Interface design'],
    signal: 'BUSINESS WEBSITE → CONSTRUCTION SECTOR → FRONTEND / DESIGN',
    artifact: 'construction',
    kind: 'client',
    what: 'A business and construction-oriented website.',
    why: 'Present the company, services, and work with clarity.',
    how: ['BUSINESS CONTEXT', 'SERVICES', 'WORK', 'FRONTEND / DESIGN'],
    actually: 'Built the frontend web experience as client work.',
    link: 'https://build-craft-lilac.vercel.app/',
    previewImage: '/previews/buildcraft_hover.png',
  },
  {
    id: 'bright-clinic',
    index: 'C02',
    title: 'Bright Clinic',
    shortTitle: 'BRIGHT CLINIC',
    category: 'Client / frontend web project',
    description: 'A clinic website focused on a clear, considered frontend and an approachable digital presence.',
    status: 'CLIENT / WEB DEVELOPMENT',
    technologies: ['Frontend development', 'Interface design'],
    signal: 'HEALTHCARE WEBSITE → CLINIC INFORMATION → FRONTEND / DESIGN',
    artifact: 'clinic',
    kind: 'client',
    what: 'A healthcare/clinic website.',
    why: 'Communicate clinic information and services through a clear frontend.',
    how: ['CLINIC CONTEXT', 'SERVICES', 'INFORMATION', 'FRONTEND / DESIGN'],
    actually: 'Built the frontend and design surface as client work.',
    link: 'https://dental-puce-theta.vercel.app/',
    previewImage: '/previews/clinic_hover.png',
  },
  {
    id: 'demo-waffles',
    index: 'C03',
    title: 'Demo Waffles',
    shortTitle: 'DEMO WAFFLES',
    category: 'Client / artisanal food brand',
    description: 'An artisanal Belgian waffle brand website featuring dual-buffer seamless video hero loops, dynamic background color sampling, and an interactive custom Waffle Lab builder.',
    status: 'CLIENT / WEB DEVELOPMENT',
    technologies: ['Vite / Vanilla JS', 'GSAP ScrollTrigger', 'Interactive Waffle Lab', 'Dual-buffer Video Loop'],
    signal: 'SEAMLESS VIDEO LOOP → PALETTE SAMPLING → WAFFLE LAB → ORDER MANAGEMENT',
    artifact: 'waffles',
    kind: 'client',
    what: 'An artisanal Belgian waffle brand website and interactive custom ordering experience.',
    why: 'Elevate culinary brand storytelling with high-impact visual media and an engaging interactive builder that converts visitors into customers.',
    how: ['DUAL-BUFFER VIDEO HERO', 'DYNAMIC PALETTE SAMPLING', 'CUSTOM WAFFLE BUILDER', 'SLIDE-OVER BAG / CART'],
    actually: 'Built the client-side SPA, seamless video loop, GSAP 3D tilt effects, dynamic color sampling engine, and the interactive Waffle Lab builder.',
    previewImage: '/previews/waffle_hover.jpeg',
  },
  {
    id: 'demo-cafe',
    index: 'C04',
    title: 'Demo Cafe',
    shortTitle: 'DEMO CAFE',
    category: 'Client / specialty cafe website',
    description: 'A high-performance editorial single-page website for an independent specialty cafe and roastery, featuring GSAP scroll-linked animations, Lenis momentum scrolling, and custom Leaflet maps.',
    status: 'CLIENT / WEB DEVELOPMENT',
    technologies: ['Vite', 'GSAP 3 / ScrollTrigger', 'Lenis Smooth Scroll', 'Leaflet Maps'],
    signal: 'WARM EDITORIAL DESIGN → GSAP TIMELINE → LENIS MOMENTUM → INTERACTIVE MAP',
    artifact: 'cafe',
    kind: 'client',
    what: 'A specialty cafe and espresso roastery website crafted with an editorial publication aesthetic.',
    why: 'Communicate the tactile atmosphere, seasonal drink roasts, and physical roastery locations through fluid physics-based motion and custom maps.',
    how: ['EDITORIAL LAYOUT', 'GSAP SCROLLTRIGGER', 'LENIS RAF TICKER', 'LEAFLET TILES & PINS'],
    actually: 'Engineered the zero-framework single-page experience, GSAP scroll-linked animation timeline, transparent drink assets with editorial grading, and custom styled Leaflet map.',
    previewImage: '/previews/cafe_hover.jpeg',
  },
]

export const exploring = [
  'AI SYSTEMS',
  'LANDING PAGES',
  'AGENTIC SYSTEMS',
  'CYBERSECURITY',
  'DEVELOPER TOOLS',
  'FULL-STACK SYSTEMS',
]


/* ---------- Redesign additions ---------- */

export type JourneyStop = {
  id: string
  index: string
  label: string
  pill: string
  headline: [string, string]
  ghost: [string, string]
  body: string
  details: { k: string; v: string }[]
}

// EDIT: keep these factual. Add dates once you are happy with the wording.
export const journey: JourneyStop[] = [
  {
    id: 'education',
    index: '01',
    label: 'EDUCATION',
    pill: 'FOUNDATION',
    headline: ['COMPUTER', 'SCIENCE'],
    ghost: ['KMIT', 'HYDERABAD'],
    body: 'Studying computer science at KMIT. The degree is the base layer: data structures, systems, and the habit of asking how things actually work.',
    details: [
      { k: 'WHERE', v: 'KMIT, Hyderabad' },
      { k: 'STUDY', v: 'Computer science' },
      { k: 'BASE LAYER', v: 'Data structures, systems, and how things actually work' },
    ],
  },
  {
    id: 'first-projects',
    index: '02',
    label: 'FIRST PROJECTS',
    pill: 'CLIENT WORK',
    headline: ['REAL', 'CLIENTS'],
    ghost: ['FREELANCE', 'WEB'],
    body: 'Started by building web experiences for food brands, clinics, and businesses. Real clients, real deadlines, and a clear lesson in storytelling, motion, and clarity.',
    details: [
      { k: 'BUILT', v: 'Demo Waffles & Demo Cafe (specialty food & drink web experiences)' },
      { k: 'AND', v: 'BuildCraft & Bright Clinic (construction & healthcare sites)' },
      { k: 'LESSON', v: 'Make information easy to understand and interact with' },
    ],
  },
  {
    id: 'current-work',
    index: '03',
    label: 'CURRENT WORK',
    pill: 'PRODUCT / RESEARCH',
    headline: ['PRODUCTS', '& RESEARCH'],
    ghost: ['BUILDING', 'RESEARCH'],
    body: 'Now building TraceMint and SpanTrace, and researching graph forecasting, clinical graphs, multi-agent fraud detection, and autonomous attack and defense.',
    details: [
      { k: 'PRODUCTS', v: 'TraceMint & SpanTrace, verified developer profiles and multi-agent observability' },
      { k: 'RESEARCH', v: 'Adaptive STGT and MedGraph, graph models for forecasting and clinical data' },
      { k: 'SECURITY', v: 'Multi-agent fraud detection and an adaptive attack and defense testbed' },
    ],
  },
  {
    id: 'next',
    index: '04',
    label: 'NEXT',
    pill: 'OPEN',
    headline: ['AI', 'ENGINEERING'],
    ghost: ['NEXT', 'CHAPTER'],
    body: 'Looking for AI engineering roles and internships where systems, research, and shipping meet.',
    details: [
      { k: 'LOOKING FOR', v: 'AI engineering roles and internships' },
      { k: 'WHERE', v: 'Where systems, research, and shipping meet' },
      { k: 'EXPLORING', v: 'Agents, graph ML, cybersecurity, developer tools' },
    ],
  },
]

export type ClientSlide = {
  projectId: string
  src: string
  title: string
  subtitle: string
  description: string
  link?: string
}

// EDIT: add 3 to 4 slides per client. Put new screenshots in /public/clients/ and
// point `src` at them, for example '/clients/buildcraft-02.png'.
export const clientSlides: ClientSlide[] = [
  {
    projectId: 'demo-waffles',
    src: '/previews/waffle_hover.jpeg',
    title: 'Demo Waffles',
    subtitle: 'Artisanal Belgian Waffle Co.',
    description: 'Dual-buffer video loop hero, dynamic color extraction, and interactive Waffle Lab builder.',
  },
  {
    projectId: 'demo-cafe',
    src: '/previews/cafe_hover.jpeg',
    title: 'Demo Cafe',
    subtitle: 'Specialty cafe & espresso roastery',
    description: 'Warm editorial layout with GSAP physics-based scroll animations and Lenis momentum.',
  },
  {
    projectId: 'buildcraft',
    src: '/previews/buildcraft_hover.png',
    title: 'BuildCraft',
    subtitle: 'Construction business website',
    description: 'A business and construction-oriented frontend built as client work.',
    link: 'https://build-craft-lilac.vercel.app/',
  },
  {
    projectId: 'bright-clinic',
    src: '/previews/clinic_hover.png',
    title: 'Bright Clinic',
    subtitle: 'Dental clinic website',
    description: 'A clear, approachable clinic website built as client work.',
    link: 'https://dental-puce-theta.vercel.app/',
  },
]

export const graphLines: Record<string, string> = {
  tracemint: 'Turns real GitHub activity into a verified developer profile.',
  'adaptive-stgt': 'Spatio-temporal graph forecasting for supply-chain demand.',
  medgraph: 'Graph modeling of clinical entities and temporal signals.',
  'multi-agent-fraud': 'Multiple agents reading suspicious UPI transactions.',
  'threat-emulation': 'A Red Agent attacks while a Blue Agent adapts the defenses.',
  spantrace: 'Local-first multi-agent trace capture, incident inspection, and regression verification.',
}
