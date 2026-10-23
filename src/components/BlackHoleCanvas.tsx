import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader.js';
// @ts-ignore
import { Observer } from '../camera/Observer.js';
import fragmentShaderSource from '../shaders/blackhole.glsl?raw';

type BlackHoleCanvasProps = {
  reducedMotion?: boolean;
  active?: boolean;
  tilt?: number;
};

export function BlackHoleCanvas({ reducedMotion = false, active = true, tilt = 0 }: BlackHoleCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(active);
  const targetTiltRef = useRef(tilt);
  const currentTiltRef = useRef(0);
  const startAnimationRef = useRef<() => void>(() => undefined);
  const stopAnimationRef = useRef<() => void>(() => undefined);
  const renderOnceRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    activeRef.current = active;
    if (active) startAnimationRef.current();
    else stopAnimationRef.current();
  }, [active]);

  useEffect(() => {
    targetTiltRef.current = tilt;
    renderOnceRef.current();
  }, [tilt]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animId: number;
    let lastFrame = performance.now();
    let time = 0;
    let totalTime = 0;
    let running = false;
    let visible = true;
    let contextLost = false;
    let fallback: HTMLDivElement | null = null;

    const showFallback = () => {
      if (fallback) return;
      fallback = document.createElement('div');
      fallback.className = 'black-hole-fallback';
      fallback.setAttribute('aria-hidden', 'true');
      container.appendChild(fallback);
    };

    const mobile = window.innerWidth <= 700;
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;
    const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
    const lowPower = mobile || hardwareConcurrency <= 4 || deviceMemory <= 4;
    const pixelRatio = lowPower ? 1 : Math.min(window.devicePixelRatio, 1.25);

    // 1. Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      // Probe first so browsers that have temporarily blocked WebGL after a
      // context loss use the CSS fallback without Three.js logging a second
      // failed renderer construction.
      const probe = document.createElement('canvas');
      const probeContext = probe.getContext('webgl2') ?? probe.getContext('webgl');
      if (!probeContext) {
        showFallback();
        return () => {
          if (fallback && container.contains(fallback)) container.removeChild(fallback);
        };
      }
      renderer = new THREE.WebGLRenderer({
        powerPreference: 'high-performance',
        antialias: false,
        alpha: false
      });
    } catch {
      showFallback();
      return () => {
        if (fallback && container.contains(fallback)) container.removeChild(fallback);
      };
    }
    renderer.setClearColor(0x000000, 1.0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(pixelRatio);
    renderer.autoClear = false;
    container.appendChild(renderer.domElement);

    // 2. Camera & Scene for Quad Projection
    const scene = new THREE.Scene();
    const camera = new THREE.Camera();
    camera.position.z = 1;

    // 3. Effect Composer & UnrealBloomPass (Exact settings from vlwkaos)
    const composer = new EffectComposer(renderer);
    composer.setPixelRatio(pixelRatio);
    composer.setSize(window.innerWidth, window.innerHeight);
    const renderPass = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(128, 128),
      lowPower ? 0.82 : 1.0, // preserve the original first-frame brightness
      0.5, // radius
      0.6  // threshold
    );
    const copyPass = new ShaderPass(CopyShader);
    copyPass.renderToScreen = true;

    composer.addPass(renderPass);
    composer.addPass(bloomPass);
    composer.addPass(copyPass);

    // 4. Observer Camera (distance 10.4, camera locked to initial Picture 1 frame)
    const observer = new Observer(60.0, window.innerWidth / window.innerHeight, 1, 80000);
    observer.distance = 10.4;
    observer.fov = 90.0;
    observer.moving = false; // Lock camera orbit to preserve exact Picture 1 shape & color grade

    // 5. Textures (Exact loaders and filters from vlwkaos)
    const textureLoader = new THREE.TextureLoader();
    const bgTexture = textureLoader.load('/assets/blackhole/milkyway.jpg');
    bgTexture.magFilter = THREE.NearestFilter;
    bgTexture.minFilter = THREE.NearestFilter;

    const starTexture = textureLoader.load('/assets/blackhole/star_noise.png');
    starTexture.magFilter = THREE.LinearFilter;
    starTexture.minFilter = THREE.LinearFilter;

    const diskTexture = textureLoader.load('/assets/blackhole/accretion_disk.png');
    diskTexture.magFilter = THREE.LinearFilter;
    diskTexture.minFilter = THREE.LinearFilter;

    // 6. Shader Uniforms
    const isDesktop = window.innerWidth > 900;
    const uniforms = {
      time: { type: 'f', value: 0.0 },
      resolution: { type: 'v2', value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      screen_offset: { type: 'v2', value: new THREE.Vector2(isDesktop ? 0.82 : 0.0, 0.40) },
      accretion_disk: { type: 'b', value: true },
      use_disk_texture: { type: 'b', value: true },
      lorentz_transform: { type: 'b', value: true },
      doppler_shift: { type: 'b', value: true },
      beaming: { type: 'b', value: true },
      cool_palette: { type: 'b', value: isDesktop },
      // Keep the disk texture at full source strength. The shader applies a
      // peak-radiance cap only after rotation/beaming have been combined.
      disk_intensity: { type: 'f', value: 1.0 },
      cam_pos: { type: 'v3', value: observer.position },
      cam_vel: { type: 'v3', value: observer.velocity },
      cam_dir: { type: 'v3', value: observer.direction },
      cam_up: { type: 'v3', value: observer.up },
      fov: { type: 'f', value: observer.fov },
      bg_texture: { type: 't', value: bgTexture },
      star_texture: { type: 't', value: starTexture },
      disk_texture: { type: 't', value: diskTexture }
    };

    // Keep the ray length close to the original look while reducing the worst-case
    // fragment workload on mobile and integrated GPUs.
    const defines = `
      #define STEP ${lowPower ? '0.072' : '0.065'}
      #define NSTEPS ${lowPower ? '320' : '400'}
    `;

    const vertexShader = `
      void main() {
        gl_Position = vec4(position, 1.0);
      }
    `;

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader: defines + fragmentShaderSource
    });
    material.needsUpdate = true;

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    // 7. Resize Handler
    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h);
      composer.setSize(w, h);
      uniforms.resolution.value.set(w, h);
      uniforms.screen_offset.value.set(w > 900 ? 0.82 : 0.0, 0.40);
      uniforms.cool_palette.value = w > 900;
      renderFrame(0);
    };

    // 8. Animation Loop
    const baseIncline = -5.0 * (Math.PI / 180.0);
    const r = 10.4;
    const loopSpeed = 0.18;
    const pos = new THREE.Vector3();
    const dir = new THREE.Vector3();
    const up = new THREE.Vector3();
    const vel = new THREE.Vector3();
    const baseUp = new THREE.Vector3(0, 1, 0);
    const rotMatrix = new THREE.Matrix4();
    const rollQuaternion = new THREE.Quaternion();

    const renderFrame = (delta: number) => {
      if (!reducedMotion) {
        totalTime += delta;
        time += delta * 0.5;
      }

      const swayAngle = Math.sin(totalTime * loopSpeed) * 0.02;
      const swayIncline = baseIncline + Math.cos(totalTime * loopSpeed * 0.8) * 0.006;
      const tiltDelta = targetTiltRef.current - currentTiltRef.current;
      currentTiltRef.current = reducedMotion
        ? targetTiltRef.current
        : currentTiltRef.current + tiltDelta * (1 - Math.exp(-delta * 3.4));
      const sinT = Math.sin(swayAngle);
      const cosT = Math.cos(swayAngle);

      rotMatrix.makeRotationX(swayIncline);
      pos.set(r * sinT, 0, r * cosT).applyMatrix4(rotMatrix);
      dir.copy(pos).negate().normalize();
      up.copy(baseUp).applyMatrix4(rotMatrix);
      if (Math.abs(currentTiltRef.current) > 0.001) {
        rollQuaternion.setFromAxisAngle(dir, currentTiltRef.current * Math.PI / 180);
        up.applyQuaternion(rollQuaternion);
      }
      vel.set(
        0.06 * Math.sin(totalTime * loopSpeed),
        0.02 * Math.cos(totalTime * loopSpeed * 0.5),
        0.06 * Math.cos(totalTime * loopSpeed),
      ).applyMatrix4(rotMatrix);

      uniforms.time.value = time;
      uniforms.cam_pos.value.copy(pos);
      uniforms.cam_dir.value.copy(dir);
      uniforms.cam_up.value.copy(up);
      uniforms.cam_vel.value.copy(vel);
      composer.render();
    };

    const shouldAnimate = () => activeRef.current && !contextLost && !reducedMotion && visible && document.visibilityState === 'visible';
    const stop = () => {
      running = false;
      if (animId) cancelAnimationFrame(animId);
    };
    const update = (now: number) => {
      if (!running) return;
      const delta = Math.min((now - lastFrame) / 1000, 0.1);
      lastFrame = now;
      renderFrame(delta);
      if (shouldAnimate()) animId = requestAnimationFrame(update);
      else running = false;
    };
    const start = () => {
      if (running || !shouldAnimate()) return;
      running = true;
      lastFrame = performance.now();
      animId = requestAnimationFrame(update);
    };
    startAnimationRef.current = start;
    stopAnimationRef.current = stop;
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') stop();
      else start();
    };
    const observerVisibility = 'IntersectionObserver' in window
      ? new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
          if (visible) start();
          else stop();
        }, { rootMargin: '160px' })
      : null;

    const renderOnce = () => renderFrame(reducedMotion ? 0 : 1 / 60);
    renderOnceRef.current = renderOnce;
    const onContextLost = (event: Event) => {
      event.preventDefault();
      contextLost = true;
      stop();
      renderer.domElement.style.display = 'none';
      showFallback();
    };
    const onContextRestored = () => {
      contextLost = false;
      if (fallback && container.contains(fallback)) {
        container.removeChild(fallback);
        fallback = null;
      }
      renderer.domElement.style.display = 'block';
      renderOnce();
      start();
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost, false);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored, false);
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibilityChange);
    observerVisibility?.observe(container);
    renderOnce();
    start();

    return () => {
      stop();
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      observerVisibility?.disconnect();
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
      startAnimationRef.current = () => undefined;
      stopAnimationRef.current = () => undefined;
      renderOnceRef.current = () => undefined;
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      bgTexture.dispose();
      starTexture.dispose();
      diskTexture.dispose();
      material.dispose();
      mesh.geometry.dispose();
      composer.dispose();
      renderer.forceContextLoss();
      renderer.dispose();
      if (fallback && container.contains(fallback)) container.removeChild(fallback);
    };
  }, [reducedMotion]);

  return (
    <div
      ref={containerRef}
      className="black-hole-canvas"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        overflow: 'hidden'
      }}
    />
  );
}
