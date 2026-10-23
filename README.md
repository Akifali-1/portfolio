# AKIF.SYSTEM

Personal portfolio for Akif — Engineer, Researcher, Builder.

## Stack

- React 19 + TypeScript
- Vite 8
- Three.js 0.186 for the procedural black-hole hero
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

## Black-hole hero implementation

`src/components/BlackHoleCanvas.tsx` mounts one persistent WebGL canvas inside the landing hero. A custom GLSL fragment shader combines a restrained procedural starfield, low-contrast atmospheric noise, a cool white/silver accretion disk, asymmetric Doppler-inspired brightness, an event-horizon shadow, and a stable gravitational-lensing approximation. The shader is an art-directed real-time approximation, not a scientifically exact ray tracer.

`src/components/TechnologyOrbits.tsx` keeps the official Simple Icons marks on one shared inclined orbit, with subdued graphite surfaces and blue-white accents. During collapse, cards curve inward, shrink, fade across the apparent horizon while hidden, then re-enter from the outer orbit after a short hold.

The canvas caps pixel ratio, renders only one persistent WebGL surface, pauses when the document is hidden or outside the viewport, honors `prefers-reduced-motion`, cleans up GPU resources, and falls back to a static CSS black-hole mark when WebGL cannot initialize or loses its context. Desktop enables the orbit/collapse presentation; mobile keeps the simpler hero treatment to protect readability and GPU budget.

`src/hooks/usePortfolioCollapse.ts` and `src/components/CollapseSurface.tsx` implement the opt-in reversible collapse: the visible page is captured once, deformed on a small cached mesh, gathered toward the black-hole target, and restored without navigation or a second WebGL scene.
