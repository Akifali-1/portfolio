export type ArtifactKind = 'trace' | 'stgt' | 'medgraph' | 'fraud' | 'threat' | 'iot' | 'construction' | 'clinic'

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
  },
]

export const exploring = [
  'AI SYSTEMS',
  'GRAPH ML',
  'AGENTIC SYSTEMS',
  'CYBERSECURITY',
  'DEVELOPER TOOLS',
  'FULL-STACK SYSTEMS',
]
