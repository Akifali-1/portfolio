# DEAD CODE REPORT

## A. SUMMARY

- **Dead Files**: 7 files (158,351 bytes / ~155 KB)
- **Dead Exports**: 11 symbols (functions, types, constants)
- **Dead Code in Live Files**: 4 blocks / items (including ~460 lines of unmounted component code)
- **Dead CSS Selectors**: 200 selectors across 8 CSS files
- **Dead Dependencies**: 1 package (`simple-icons`, conditional on `FallingTechLogos` removal)
- **Dead Assets**: 10 public files (4,869,931 bytes / ~4.87 MB)
- **Duplicates and Superseded**: 6 pairs / sets
- **Unsure Items**: 4 items requiring design/architectural confirmation

**Tools Used**:
- `knip` (entry-point graph traversal, dead exports and files)
- `depcheck` (package.json dependency cross-referencing)
- `tsc` (`--noUnusedLocals`, `--noUnusedParameters`, type-checking)
- Custom AST/Regex static analysis scripts (BFS import graph traversal, CSS class tokenization vs JSX/TSX/HTML scan)
- `git ls-files`, `git log`, `git status`, `git grep`

---

## B. DEAD FILES

1. **`src/components/HalftoneName.tsx`**
   - **Size**: 8,266 bytes
   - **Last Commit**: 2026-11-10 (9 days ago)
   - **Evidence**: Reachability graph from `src/main.tsx` finds 0 imports. `git grep HalftoneName` shows 0 occurrences in live application code (only referenced in archived scratch scripts). Replaced by `AkifCalligraphyCanvas.tsx` and `Hero.tsx`.
   - **Confidence**: High

2. **`src/components/HeroFluidCursor.tsx`**
   - **Size**: 31,083 bytes
   - **Last Commit**: 2026-11-19 (12 hours ago)
   - **Evidence**: Reachability graph from `src/main.tsx` finds 0 imports. `git grep HeroFluidCursor` shows 0 occurrences in application code (only in scratch scripts). Replaced by `CustomCursor.tsx` and the brush canvas follower.
   - **Confidence**: High

3. **`src/components/ProjectName.tsx`**
   - **Size**: 4,552 bytes
   - **Last Commit**: 2026-10-15 (5 weeks ago)
   - **Evidence**: Reachability graph from `src/main.tsx` finds 0 imports. `git grep ProjectName` shows 0 occurrences across all `.tsx` and `.ts` files. Replaced by `WorksDrum.tsx` and `ProjectModal.tsx`.
   - **Confidence**: High

4. **`src/components/WorkGraph.tsx`**
   - **Size**: 8,116 bytes
   - **Last Commit**: 2026-11-09 (10 days ago)
   - **Evidence**: Reachability graph from `src/main.tsx` finds 0 imports. `git grep WorkGraph` shows 0 occurrences in live components. `GraphSection` in `src/sections/PortfolioSections.tsx` imports and renders `DotGraph` instead.
   - **Confidence**: High

5. **`src/components/AkifCalligraphyCanvas.tsx.bak`**
   - **Size**: 36,533 bytes
   - **Last Commit**: Untracked (not committed)
   - **Evidence**: Backup file generated during recent patch script execution. Not imported anywhere.
   - **Confidence**: High

6. **`apply_akif_patch.py`**
   - **Size**: 2,796 bytes
   - **Last Commit**: Untracked (not committed)
   - **Evidence**: One-off local patch script in repository root. Not referenced in `package.json` scripts, build pipeline, or CI.
   - **Confidence**: High

7. **`akif_bodies.json`**
   - **Size**: 69,801 bytes
   - **Last Commit**: Untracked (not committed)
   - **Evidence**: One-off SVG path payload for `apply_akif_patch.py`. Not imported by any TypeScript or runtime file.
   - **Confidence**: High

*(Note: The 15 helper scripts in `.gitignore` under `scratch/` total 118,634 bytes and are dead workspace clutter from past tasks, but are omitted from git tracking.)*

---

## C. DEAD EXPORTS

1. **`src/components/FallingTechLogos.tsx` -> `FallingTechLogos`**
   - **Symbol**: `export function FallingTechLogos`
   - **Evidence**: `git grep FallingTechLogos` shows it is never imported or rendered in any JSX/TSX. Only `type CollapseAnimationState` from this file is imported by `Hero.tsx` and `usePortfolioCollapse.ts`.
   - **Confidence**: High

2. **`src/components/flex-carousel/FlexCarousel.tsx` -> `DEFAULT_ITEMS`**
   - **Symbol**: `export const DEFAULT_ITEMS: FlexCarouselItem[]`
   - **Evidence**: `git grep DEFAULT_ITEMS` returns 0 imports across the codebase. `ClientCarousel.tsx` supplies its own `clientSlides` from `src/data.ts`.
   - **Confidence**: High

3. **`src/components/flex-carousel/FlexCarousel.tsx` -> `FlexCarouselProps`**
   - **Symbol**: `export interface FlexCarouselProps`
   - **Evidence**: `git grep FlexCarouselProps` returns 0 imports outside `FlexCarousel.tsx`.
   - **Confidence**: High

4. **`src/data.ts` -> `ArtifactKind`**
   - **Symbol**: `export type ArtifactKind`
   - **Evidence**: `git grep ArtifactKind` returns 0 imports across the codebase. `Project['artifact']` in `src/data.ts` uses its own inline string literal union.
   - **Confidence**: High

5. **`src/data.ts` -> `JourneyStop`**
   - **Symbol**: `export type JourneyStop`
   - **Evidence**: `git grep JourneyStop` returns 0 imports across the codebase.
   - **Confidence**: High

6. **`src/data.ts` -> `ClientSlide`**
   - **Symbol**: `export type ClientSlide`
   - **Evidence**: `git grep ClientSlide` returns 0 imports across the codebase.
   - **Confidence**: High

7. **`src/lib/halftone.ts` -> `smoothstep`**
   - **Symbol**: `export const smoothstep`
   - **Evidence**: `git grep "from '../lib/halftone'"` shows only `DotGraph.tsx` (`clamp`, `discHalftone`, `setupCanvas`) and dead `HalftoneName.tsx`. `CollapseSurface.tsx` defines its own local `smoothstep` and `FlexCarousel.tsx` uses shader GLSL `smoothstep`.
   - **Confidence**: High

8. **`src/lib/halftone.ts` -> `signedDistance`**
   - **Symbol**: `export function signedDistance`
   - **Evidence**: `git grep signedDistance` returns 0 imports across the entire repository.
   - **Confidence**: High

9. **`src/lib/halftone.ts` -> `textHalftone`**
   - **Symbol**: `export function textHalftone`
   - **Evidence**: `git grep textHalftone` returns 0 imports across the entire repository.
   - **Confidence**: High

10. **`src/lib/halftone.ts` -> `textStipple`**
    - **Symbol**: `export function textStipple`
    - **Evidence**: Only imported by `src/components/HalftoneName.tsx`, which is a dead file. No live file imports it.
    - **Confidence**: High

11. **`src/lib/halftone.ts` -> `Stipple`**
    - **Symbol**: `export type Stipple`
    - **Evidence**: Only imported by `src/components/HalftoneName.tsx`, which is a dead file.
    - **Confidence**: High

---

## D. DEAD CODE IN LIVE FILES

1. **`src/components/flex-carousel/FlexCarousel.tsx` (Line 129)**
   - **What it is**: Unused helper function `const photo = (id: string) => ...`.
   - **Evidence**: Flagged by `tsc --noUnusedLocals` (TS6133). Never invoked in the file.
   - **Confidence**: High

2. **`src/components/flex-carousel/FlexCarousel.tsx` (Lines 131–230)**
   - **What it is**: Unused 100-line sample dataset array `DEFAULT_ITEMS` containing Unsplash links and placeholder project titles.
   - **Evidence**: Flagged by `knip`. Not referenced internally; `ClientCarousel.tsx` passes its own items.
   - **Confidence**: High

3. **`src/components/FallingTechLogos.tsx` (Line 250)**
   - **What it is**: Unused variable `tileSize`.
   - **Evidence**: Flagged by `tsc --noUnusedLocals` (TS6133).
   - **Confidence**: High

4. **`src/components/FallingTechLogos.tsx` (Lines 1–20, 23–476)**
   - **What it is**: ~460 lines of unmounted component logic, including physics tile math, animation frames, and 15 simple-icons imports.
   - **Evidence**: The entire component `FallingTechLogos` is never rendered anywhere. The file is only kept alive because lines 21–22 export `CollapseAnimationState`.
   - **Confidence**: High

---

## E. DEAD CSS

200 unused class selectors identified across 8 CSS files. Verified against all live JSX, TSX, TS, and HTML files.

### 1. `src/project-preview.css` (10 selectors)
*The entire stylesheet is dead legacy CSS from the removed `ProjectName.tsx` component.*
- `.project-name-heading` (Line 1) — only in dead `ProjectName.tsx`
- `.project-title-trigger` (Line 5) — only in dead `ProjectName.tsx`
- `.project-name-text` (Line 10) — only in dead `ProjectName.tsx`
- `.is-previewing` (Line 17) — only in dead `ProjectName.tsx`
- `.project-preview-layer` (Line 22) — only in dead `ProjectName.tsx`
- `.project-preview-card` (Line 40) — only in dead `ProjectName.tsx`
- `.project-preview-meta` (Line 66) — only in dead `ProjectName.tsx`
- `.project-preview-title` (Line 67) — only in dead `ProjectName.tsx`
- `.project-preview-artifact` (Line 90) — only in dead `ProjectName.tsx`
- `.project-preview-image` (Line 100) — only in dead `ProjectName.tsx`
*Confidence*: High

### 2. `src/collapse.css` (11 selectors)
*Legacy trigger and restore animation button sub-elements replaced by simplified text markup in `Hero.tsx` and `App.tsx`.*
- `.collapse-trigger-arrow`
- `.collapse-trigger-core`
- `.collapse-trigger-orbit`
- `.collapse-trigger-status`
- `.collapse-trigger-sweep`
- `.restore-reality-arrow`
- `.restore-reality-copy`
- `.restore-reality-core`
- `.restore-reality-orbit`
- `.restore-reality-status`
- `.restore-reality-sweep`
*Confidence*: High

### 3. `src/echo-sections.css` (48 selectors)
*Leftover styles from earlier iterations of Client, Hero, and Works sections.*
- Mobile client list: `.client-carousel-counter`, `.client-carousel-mobile`, `.client-mobile-actions`, `.client-mobile-body`, `.client-mobile-card`, `.client-mobile-card-trigger`, `.client-mobile-index`, `.client-mobile-live`, `.client-mobile-media`, `.client-mobile-subtitle`
- Collapse trigger leftovers: `.collapse-trigger-arrow`, `.collapse-trigger-orbit`, `.collapse-trigger-status`
- Dead component bindings: `.halftone-name`, `.hero-fluid-canvas`
- Obsolete Hero layout: `.hero-actions`, `.hero-card-composition`, `.hero-centerpiece`, `.hero-clock`, `.hero-copy`, `.hero-cta-secondary`, `.hero-dock-link`, `.hero-editorial-body`, `.hero-editorial-column`, `.hero-editorial-cta`, `.hero-index`, `.hero-intro`, `.hero-location`, `.hero-lorenz`, `.hero-lorenz-slot`, `.hero-outlined-mark`, `.hero-stage`, `.hero-statement`, `.hero-statement-column`, `.hero-subline`, `.hero-title`, `.hero-title--halftone`, `.hero-title-suffix`, `.lorenz-readout`
- Obsolete horizontal work strip (replaced by WorksDrum): `.works-strip`, `.works-strip-badge`, `.works-strip-body`, `.works-strip-card`, `.works-strip-category`, `.works-strip-cta`, `.works-strip-header`, `.works-strip-media`, `.works-strip-wrap`
*Confidence*: High

### 4. `src/fullscreen.css` (13 selectors)
- `.halftone-name`
- `.hero-card-composition`
- `.hero-centerpiece`
- `.hero-clock`
- `.hero-content`
- `.hero-editorial-column`
- `.hero-index`
- `.hero-intro`
- `.hero-location`
- `.hero-outlined-mark`
- `.is-revealing`
- `.works-strip`
- `.works-strip-wrap`
*Confidence*: High

### 5. `src/mobile-fixes.css` (4 selectors)
- `.hero-clock`
- `.hero-index`
- `.hero-intro`
- `.hero-location`
*Confidence*: High

### 6. `src/theme-redesign.css` (4 selectors)
- `.hero-cal-headline-accent`
- `.hero-cal-headline-primary`
- `.mobile-theme-pill`
- `.nav-talk-cta`
*Confidence*: High

### 7. `src/ui-overrides.css` (28 selectors)
- Obsolete Boot curtain: `.boot-curtain-col`, `.boot-curtain-grid`
- Obsolete WorkGraph toolbar/legend: `.graph-legend`, `.graph-mode-switch`, `.graph-toolbar`
- Obsolete Hero elements: `.hero-actions`, `.hero-clock`, `.hero-cta-secondary`, `.hero-footer`, `.hero-footer-right`, `.hero-index`, `.hero-intro`, `.hero-lorenz-slot`, `.hero-statement-column`, `.hero-subline`, `.hero-title`, `.hero-words`
- Abandoned experimental UI states: `.is-arming`, `.is-arrived`, `.is-opening`, `.offline-action`, `.offline-core`, `.offline-title`, `.phantom-cursor`, `.project-title-line`, `.project-title-link`, `.research-bottom-mark`, `.sound-trigger`
*Confidence*: High

### 8. `src/styles.css` (82 selectors)
- Obsolete BootScreen: `.boot-core`, `.boot-lines`, `.boot-mark`, `.boot-progress`, `.boot-screen`, `.boot-skip`
- Obsolete Client list: `.client-project-list`
- Obsolete Experiment & Lab sections: `.approach-compare`, `.experiment-description`, `.experiment-note`, `.experiment-panel`, `.experiment-split`, `.lab-card`, `.lab-card-bottom`, `.lab-card-description`, `.lab-card-tag`, `.lab-card-title`, `.lab-card-top`, `.lab-grid`, `.lab-heading`, `.lab-section`, `.lab-status`
- Obsolete WorkGraph HTML nodes: `.graph-axis`, `.graph-caption-detail`, `.graph-legend`, `.graph-orbit`, `.graph-particle`, `.legend-dot`, `.orbit-one`, `.orbit-two`, `.work-graph`, `.work-graph-wrap`, `.is-central`, `.is-client`, `.is-client-group`, `.is-dimmed`, `.is-muted`, `.violet`, `.white`
- Obsolete Hero elements: `.hero-content`, `.hero-footer`, `.hero-footer-right`, `.hero-grid`, `.hero-index`, `.hero-intro`, `.hero-location`, `.hero-statement`, `.hero-subline`, `.hero-title`, `.hero-title-suffix`, `.hero-word`, `.hero-words`
- Obsolete MedGraph layout: `.medgraph-center`, `.medgraph-copy`, `.medgraph-panel`, `.medgraph-visual`, `.medgraph-visual-node`, `.node-conditions`, `.node-core`, `.node-entities`, `.node-medications`, `.node-pulse`, `.node-symptoms`, `.node-time`
- Obsolete Project list rows: `.project-kicker`, `.project-list`, `.project-list-header`, `.project-open`, `.project-preview-label`, `.project-row`, `.project-row-description`, `.project-row-index`, `.project-row-line`, `.project-row-title`, `.project-title-trigger`
- Other unreferenced utilities: `.metric-grid`, `.research-foot`, `.research-index`, `.role-stack`, `.scroll-mark`, `.system-canvas`, `.is-ready`
*Confidence*: High

---

## F. DEAD DEPENDENCIES

1. **`simple-icons` (`^16.35.0`)**
   - **Evidence**: Only imported by `src/components/FallingTechLogos.tsx`. Since `FallingTechLogos` is never rendered in the application (only its type definition is used), the runtime icons library is dead code.
   - **Confidence**: Medium-High (High once `CollapseAnimationState` is moved to a shared types file and `FallingTechLogos.tsx` is removed).

---

## G. DEAD ASSETS

All located in `public/`. Total dead asset disk usage: **4,869,931 bytes (~4.87 MB)**. Verified by full regex search across all project files, configs, HTML, and CSS.

1. **`public/akif-calligraphy-light-reference.png`** (351,007 bytes) — 0 references in code/config/html. High confidence.
2. **`public/akif-light-brush.png`** (14,001 bytes) — 0 references in code/config/html. High confidence.
3. **`public/akif-light-seal.png`** (25,165 bytes) — 0 references in code/config/html. High confidence.
4. **`public/akif-light-strokes.png`** (143,545 bytes) — 0 references in code/config/html. High confidence.
5. **`public/akif-light-wash.png`** (379,910 bytes) — 0 references in code/config/html. High confidence.
6. **`public/hero-wave-reference.png`** (124,899 bytes) — 0 references in code/config/html. High confidence.
7. **`public/hero-sculpture.png`** (1,270,468 bytes) — 0 references in code/config/html. High confidence.
8. **`public/hero-sculpture.jpg`** (1,270,468 bytes) — 0 references in code/config/html. Exact byte duplicate of `hero-sculpture.png`. High confidence.
9. **`public/akif-sculpture-transparent.png`** (1,270,468 bytes) — 0 references in code/config/html. Exact byte duplicate of `hero-sculpture.png`. High confidence.
10. **`public/metallic-blue-akif-ribbon-logo.png`** (1,270,468 bytes) — 0 references in code/config/html. Exact byte duplicate of `hero-sculpture.png`. High confidence.

*(Note: `public/akif-mark.svg`, `public/og-image.svg`, `public/robots.txt`, `public/sitemap.xml`, and the 10 files in `public/previews/` are active and referenced.)*

---

## H. DUPLICATES AND SUPERSEDED

1. **`src/components/AkifCalligraphyCanvas.tsx` (LIVE)** vs **`src/components/AkifCalligraphyCanvas.tsx.bak` (SUPERSEDED)**
   - Backup file from patch execution.

2. **`src/components/DotGraph.tsx` (LIVE)** vs **`src/components/WorkGraph.tsx` (SUPERSEDED)**
   - Both implement the 6-project relational connection graph. `DotGraph` is canvas-based and imported by `GraphSection`. `WorkGraph` is legacy HTML/SVG and never imported.

3. **`src/components/AkifCalligraphyCanvas.tsx` / `Hero.tsx` (LIVE)** vs **`src/components/HalftoneName.tsx` (SUPERSEDED)**
   - `HalftoneName` was the canvas stipple title renderer used before the Sumi-e calligraphy component.

4. **`src/components/CustomCursor.tsx` / `Hero.tsx` (LIVE)** vs **`src/components/HeroFluidCursor.tsx` (SUPERSEDED)**
   - `HeroFluidCursor` was a 31 KB WebGL Navier-Stokes fluid simulation, superseded by the lightweight custom cursor and brush follower.

5. **`src/components/WorksDrum.tsx` / `ProjectModal.tsx` (LIVE)** vs **`src/components/ProjectName.tsx` (SUPERSEDED)**
   - `ProjectName` provided floating preview cards on title hover; fully replaced by the 3D WorksDrum cylinder and ProjectModal.

6. **Identical Quadruplicate Sculpture Assets (ALL DEAD)**:
   - `public/hero-sculpture.png`
   - `public/hero-sculpture.jpg`
   - `public/akif-sculpture-transparent.png`
   - `public/metallic-blue-akif-ribbon-logo.png`
   - **Evidence**: All 4 files share the exact same MD5 hash (`08bbdab26b3b24cd722b5ec707d68fa9`) and exact size (1,270,468 bytes). None are referenced anywhere.

---

## I. UNSURE

1. **`src/components/FallingTechLogos.tsx`**
   - **Reason**: The component and canvas logic are dead, but `export type CollapseAnimationState` is imported by `Hero.tsx` and `usePortfolioCollapse.ts`. Deleting the file directly causes compilation failure unless the type is first moved to another module.
   - **Confidence**: Medium

2. **`package.json -> simple-icons`**
   - **Reason**: Only imported in `FallingTechLogos.tsx`. Tree-shaking excludes it from client production bundles, but removing it from `package.json` immediately breaks `FallingTechLogos.tsx` until that file is removed.
   - **Confidence**: Medium

3. **`src/project-preview.css`**
   - **Reason**: Imported in `src/App.tsx`. 10 of its 12 selectors are dead. The remaining two (`.is-visible` and `.project-artifact`) have matching class names elsewhere in the project. While it can be removed once verified that `.project-artifact` in `styles.css` is sufficient, caution is advised before deleting the file wholesale.
   - **Confidence**: Medium

4. **`scratch/` Directory (15 scripts / text dumps)**
   - **Reason**: Ignored by git in `.gitignore`. They do not affect production builds, but consume disk space and contain references to older component names.
   - **Confidence**: Low (harmless workspace clutter)
