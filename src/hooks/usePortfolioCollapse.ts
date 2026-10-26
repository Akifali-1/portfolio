import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { gsap } from 'gsap'
import type { CollapseAnimationState } from '../components/FallingTechLogos'
import type { CollapseSurfaceHandle } from '../components/CollapseSurface'

type UsePortfolioCollapseOptions = {
  shellRef: RefObject<HTMLElement | null>
  collapseTargetRef: RefObject<HTMLElement | null>
  surfaceRef: RefObject<CollapseSurfaceHandle | null>
  blackoutRef: RefObject<HTMLElement | null>
  voidScreenRef: RefObject<HTMLElement | null>
  restoreFocusRef: RefObject<HTMLElement | null>
  reducedMotion: boolean
}

type SurfaceProgress = {
  value: number
}

function getCollapseTargetCenter(target: HTMLElement | null) {
  if (target) {
    const rect = target.getBoundingClientRect()
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
  }

  return {
    x: window.innerWidth > 900 ? window.innerWidth * 0.76 : window.innerWidth * 0.82,
    y: window.innerHeight * 0.72,
  }
}

function getSurfaceSourceElements(shell: HTMLElement) {
  const selectors = [
    '.site-nav',
    'main > section:not(.hero)',
    '.site-footer',
    '.hero > :not(.falling-tech-logo-field):not(.hero-collapse-control)',
    '.cursor-layer',
    '.command-backdrop',
    '.detail-backdrop',
  ]

  return Array.from(
    new Set(selectors.flatMap((selector) => Array.from(shell.querySelectorAll<HTMLElement>(selector)))),
  )
}

async function captureViewport(shell: HTMLElement, center: { x: number; y: number }) {
  const { default: html2canvas } = await import('html2canvas')
  const width = window.innerWidth
  const height = window.innerHeight
  const scrollY = window.scrollY

  const offscreenElements = new Set<Element>()
  shell.querySelectorAll<HTMLElement>('main > section, .site-footer').forEach((section) => {
    const rect = section.getBoundingClientRect()
    if (rect.bottom < -50 || rect.top > height + 50) offscreenElements.add(section)
  })

  const captured = await html2canvas(shell, {
    backgroundColor: null,
    allowTaint: false,
    imageTimeout: 1500,
    logging: false,
    scale: 1,
    useCORS: true,
    width,
    height,
    windowWidth: width,
    windowHeight: height,
    x: 0,
    y: scrollY,
    scrollX: 0,
    scrollY,
    onclone: (clonedDocument) => {
      const style = clonedDocument.createElement('style')
      style.textContent = `
        .hero { background: transparent !important; }
        .hero::after { background: transparent !important; }
      `
      clonedDocument.head.appendChild(style)
    },
    ignoreElements: (element) =>
      offscreenElements.has(element) ||
      element.classList.contains('hero-collapse-target') ||
      element.classList.contains('hero-collapse-control') ||
      element.classList.contains('cursor-layer') ||
      element.classList.contains('hero-noise') ||
      element.classList.contains('command-backdrop') ||
      element.classList.contains('detail-backdrop'),
  })

  // Normalize a possible full-page capture to the current viewport. Keeping
  // the temporary surface at viewport size prevents restore from pushing a
  // tall portfolio bitmap through every deformation frame.
  const snapshot = document.createElement('canvas')
  snapshot.width = width
  snapshot.height = height
  const context = snapshot.getContext('2d')
  if (!context) return captured

  const scale = captured.width / Math.max(1, width)
  const capturedCssHeight = captured.height / scale
  const sourceY = capturedCssHeight > height + 1 ? Math.min(scrollY, capturedCssHeight - height) : 0
  context.drawImage(captured, 0, -sourceY * scale, captured.width / scale, captured.height / scale)

  const holeRadius = Math.min(76, Math.max(38, Math.min(width, height) * 0.055))
  const holeGradient = context.createRadialGradient(center.x, center.y, holeRadius * 0.22, center.x, center.y, holeRadius)
  holeGradient.addColorStop(0, 'rgba(0, 0, 0, 1)')
  holeGradient.addColorStop(0.58, 'rgba(0, 0, 0, .82)')
  holeGradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
  context.save()
  context.globalCompositeOperation = 'destination-out'
  context.fillStyle = holeGradient
  context.beginPath()
  context.arc(center.x, center.y, holeRadius, 0, Math.PI * 2)
  context.fill()
  context.restore()

  return snapshot
}

export function usePortfolioCollapse({
  shellRef,
  collapseTargetRef,
  surfaceRef,
  blackoutRef,
  voidScreenRef,
  restoreFocusRef,
  reducedMotion,
}: UsePortfolioCollapseOptions) {
  const [state, setState] = useState<CollapseAnimationState>('idle')
  const stateRef = useRef<CollapseAnimationState>('idle')
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const progressRef = useRef<SurfaceProgress>({ value: 0 })
  const blackoutProgressRef = useRef<SurfaceProgress>({ value: 0 })
  const sourceElementsRef = useRef<HTMLElement[]>([])
  const surfaceResizeRef = useRef<(() => void) | null>(null)
  const scrollYRef = useRef(0)
  const activeElementRef = useRef<HTMLElement | null>(null)
  const previousOverflowRef = useRef('')

  useEffect(() => {
    stateRef.current = state
  }, [state])

  const restoreSource = useCallback(() => {
    if (sourceElementsRef.current.length > 0) {
      gsap.set(sourceElementsRef.current, { clearProps: 'opacity,pointerEvents' })
    }
  }, [])

  const finishRestore = useCallback(() => {
    if (surfaceResizeRef.current) {
      window.removeEventListener('resize', surfaceResizeRef.current)
      surfaceResizeRef.current = null
    }
    restoreSource()
    surfaceRef.current?.clear()
    blackoutProgressRef.current.value = 0
    if (blackoutRef.current) {
      gsap.set(blackoutRef.current, { clearProps: 'opacity' })
      blackoutRef.current.style.removeProperty('--collapse-x')
      blackoutRef.current.style.removeProperty('--collapse-y')
      blackoutRef.current.style.removeProperty('--collapse-radius')
      blackoutRef.current.style.removeProperty('--collapse-scale')
    }
    document.body.style.overflow = previousOverflowRef.current
    window.scrollTo({ top: scrollYRef.current, behavior: 'auto' })
    stateRef.current = 'idle'
    setState('idle')

    window.requestAnimationFrame(() => {
      const focusTarget = activeElementRef.current ?? restoreFocusRef.current
      if (focusTarget && document.contains(focusTarget)) focusTarget.focus()
    })
  }, [blackoutRef, restoreFocusRef, restoreSource, surfaceRef])

  const startCollapse = useCallback(async () => {
    if (stateRef.current !== 'idle') return

    const shell = shellRef.current
    const surface = surfaceRef.current
    if (!shell || !surface) return

    const activeElement = document.activeElement
    activeElementRef.current = activeElement instanceof HTMLElement ? activeElement : restoreFocusRef.current
    scrollYRef.current = window.scrollY
    previousOverflowRef.current = document.body.style.overflow
    stateRef.current = 'collapsing'
    setState('collapsing')
    document.body.style.overflow = 'hidden'

    // Let the button state, orbit layer, and overflow lock commit before the
    // unavoidable html2canvas clone begins its main-thread work.
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()))

    const sourceElements = getSurfaceSourceElements(shell)
    sourceElementsRef.current = sourceElements
    let center = getCollapseTargetCenter(collapseTargetRef.current)
    const voidScreen = voidScreenRef.current
    const blackout = blackoutRef.current
    const applyBlackout = (value: number) => {
      if (!blackout) return

      const reveal = Math.min(1, Math.max(0, value))
      blackout.style.setProperty('--collapse-x', `${center.x}px`)
      blackout.style.setProperty('--collapse-y', `${center.y}px`)
      blackout.style.setProperty('--collapse-radius', '0px')
      blackout.style.setProperty('--collapse-scale', String(reveal <= 0.001 ? 0 : 0.82 + reveal * 0.18))
      blackout.style.opacity = reveal <= 0.001 ? '0' : '1'
    }

    const updateCollapseVisuals = () => {
      surface.setProgress(progressRef.current.value)
      applyBlackout(blackoutProgressRef.current.value)
    }

    try {
      const snapshot = await captureViewport(shell, center)
      surface.setTarget(center.x, center.y)
      surface.setSnapshot(snapshot)
      const updateSurfaceTarget = () => {
        const nextCenter = getCollapseTargetCenter(collapseTargetRef.current)
        center = nextCenter
        surface.setTarget(nextCenter.x, nextCenter.y)
      }
      surfaceResizeRef.current = updateSurfaceTarget
      window.addEventListener('resize', updateSurfaceTarget)
      progressRef.current.value = 0
      blackoutProgressRef.current.value = 0
      updateCollapseVisuals()
      surface.setVisible(true)
      if (blackout) {
        gsap.set(blackout, { opacity: 0 })
        blackout.style.setProperty('--collapse-x', `${center.x}px`)
        blackout.style.setProperty('--collapse-y', `${center.y}px`)
        blackout.style.setProperty('--collapse-radius', '0px')
        blackout.style.setProperty('--collapse-scale', '0')
      }

      // The captured surface now owns the visible page while the live hero remains
      // underneath, ready to be restored without a second rendering scene.
      gsap.set(sourceElements, { opacity: 0, pointerEvents: 'none' })
      if (voidScreen) gsap.set(voidScreen, { opacity: 0, pointerEvents: 'none' })

      timelineRef.current?.kill()
      const timeline = gsap.timeline({
        paused: true,
        defaults: { overwrite: 'auto' },
        onUpdate: updateCollapseVisuals,
        onComplete: () => {
          updateCollapseVisuals()
          surface.setVisible(false)
          if (blackout) gsap.set(blackout, { opacity: 0 })
          stateRef.current = 'collapsed'
          setState('collapsed')
        },
      })
      timelineRef.current = timeline

      const duration = reducedMotion ? 0.12 : 3.2
      timeline.to(
        progressRef.current,
        {
          value: 1,
          duration,
          ease: reducedMotion ? 'none' : 'power1.inOut',
        },
        0,
      )

      timeline.to(
        blackoutProgressRef.current,
        {
          value: 1,
          duration: reducedMotion ? 0.08 : 2.35,
          ease: reducedMotion ? 'none' : 'power2.inOut',
        },
        reducedMotion ? 0.04 : 0.65,
      )

      if (voidScreen) {
        timeline.to(
          voidScreen,
          {
            duration: reducedMotion ? 0.01 : 0.35,
            opacity: 1,
            pointerEvents: 'auto',
            ease: 'power2.out',
          },
          reducedMotion ? 0.08 : 2.95,
        )
      }

      timeline.play()
    } catch (error) {
      console.error('Unable to capture the portfolio collapse surface.', error)
      restoreSource()
      if (surfaceResizeRef.current) {
        window.removeEventListener('resize', surfaceResizeRef.current)
        surfaceResizeRef.current = null
      }
      surface.clear()
      if (blackout) gsap.set(blackout, { clearProps: 'opacity' })
      document.body.style.overflow = previousOverflowRef.current
      stateRef.current = 'idle'
      setState('idle')
    }
  }, [collapseTargetRef, blackoutRef, reducedMotion, restoreFocusRef, restoreSource, shellRef, surfaceRef, voidScreenRef])

  const restore = useCallback(() => {
    if (stateRef.current !== 'collapsed') return

    const surface = surfaceRef.current
    const voidScreen = voidScreenRef.current
    const blackout = blackoutRef.current
    if (!surface) return
    const center = getCollapseTargetCenter(collapseTargetRef.current)
    const updateRestoreVisuals = () => {
      surface.setProgress(progressRef.current.value)
      if (!blackout) return
      const reveal = Math.min(1, Math.max(0, blackoutProgressRef.current.value))
      blackout.style.setProperty('--collapse-x', `${center.x}px`)
      blackout.style.setProperty('--collapse-y', `${center.y}px`)
      blackout.style.setProperty('--collapse-radius', '0px')
      blackout.style.setProperty('--collapse-scale', String(reveal <= 0.001 ? 0 : 0.82 + reveal * 0.18))
      blackout.style.opacity = reveal <= 0.001 ? '0' : '1'
    }

    stateRef.current = 'restoring'
    setState('restoring')
    timelineRef.current?.kill()
    surface.setVisible(true)
    progressRef.current.value = 1
    blackoutProgressRef.current.value = 1
    surface.setProgress(1)

    const timeline = gsap.timeline({
      paused: true,
      defaults: { overwrite: 'auto' },
      onUpdate: updateRestoreVisuals,
      onComplete: finishRestore,
    })
    timelineRef.current = timeline

    if (voidScreen) {
      timeline.to(
        voidScreen,
        {
          duration: reducedMotion ? 0.01 : 0.25,
          opacity: 0,
          pointerEvents: 'none',
          ease: 'power2.out',
        },
        0,
      )
    }

    if (blackout) {
      timeline.to(
        blackoutProgressRef.current,
        {
          value: 0,
          duration: reducedMotion ? 0.01 : 0.42,
          ease: reducedMotion ? 'none' : 'power2.out',
        },
        0,
      )
    }

    timeline.to(
      progressRef.current,
      {
        value: 0,
        duration: reducedMotion ? 0.14 : 4.35,
        ease: reducedMotion ? 'none' : 'power2.out',
      },
      reducedMotion ? 0 : 0.06,
    )

    timeline.play()
  }, [blackoutRef, collapseTargetRef, finishRestore, reducedMotion, surfaceRef, voidScreenRef])

  useEffect(() => {
    return () => {
      timelineRef.current?.kill()
      if (surfaceResizeRef.current) {
        window.removeEventListener('resize', surfaceResizeRef.current)
        surfaceResizeRef.current = null
      }
      if (blackoutRef.current) gsap.set(blackoutRef.current, { clearProps: 'opacity' })
      restoreSource()
      surfaceRef.current?.clear()
      document.body.style.overflow = previousOverflowRef.current
    }
  }, [blackoutRef, restoreSource, surfaceRef])

  return { state, startCollapse, restore }
}
