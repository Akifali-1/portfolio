# AKIF.SYSTEM

Personal portfolio for Akif — Engineer, Researcher, Builder.

## Stack

- React 19 + TypeScript
- Vite 8
- Simple Icons for the falling technology-logo hero
- GSAP for the reversible portfolio-collapse timeline
- Global CSS and the existing section components/animations

## Local setup

Requires Node `22.23.3` (the version is pinned in `.nvmrc`).

```bash
npm ci
npm run dev
```

Open `http://localhost:5173`.

## Checks

The single offline-friendly project check is:

```bash
npm test
```

It runs the TypeScript build check and the production Vite build.

## Production preview

```bash
npm run build
npm run preview -- --host 0.0.0.0
```

Or build and run the reproducible container:

```bash
docker build -t akif-system .
docker run --rm -p 4173:4173 akif-system
```

## Falling technology-logo hero

`src/components/FallingTechLogos.tsx` renders official Simple Icons on lightweight DOM tiles. A deterministic stack layout gives each tile a support point, while a single requestAnimationFrame loop handles staggered spawning, eased falling, settling, a 15-tile capacity, bottom-up fading, and automatic restart. The loop pauses off-screen or when the document is hidden, cleans up on unmount, and presents a compact static pile for reduced-motion users.

`src/hooks/usePortfolioCollapse.ts` and `src/components/CollapseSurface.tsx` preserve the reversible portfolio collapse: the visible page is captured once, deformed on a small cached mesh, gathered toward the hero collapse control, and restored without navigation or a second rendering scene.
