import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader.js';
// @ts-ignore
import { Observer } from '../camera/Observer.js';
// @ts-ignore
import { CameraDragControls } from '../camera/CameraDragControls.js';
import fragmentShaderSource from '../shaders/blackhole.glsl?raw';

type BlackHoleCanvasProps = {
  reducedMotion?: boolean;
};

export function BlackHoleCanvas({ reducedMotion = false }: BlackHoleCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animId: number;
    let lastFrame = performance.now();
    let time = 0;

    // 1. Renderer
    const renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: false,
      alpha: false
    });
    renderer.setClearColor(0x000000, 1.0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    renderer.autoClear = false;
    container.appendChild(renderer.domElement);

    // 2. Camera & Scene for Quad Projection
    const scene = new THREE.Scene();
    const camera = new THREE.Camera();
    camera.position.z = 1;

    // 3. Effect Composer & UnrealBloomPass (Exact settings from vlwkaos)
    const composer = new EffectComposer(renderer);
    composer.setSize(window.innerWidth, window.innerHeight);
    const renderPass = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(128, 128),
      1.0, // preserve the original first-frame brightness
      0.5, // radius
      0.6  // threshold
    );
    const copyPass = new ShaderPass(CopyShader);
    copyPass.renderToScreen = true;

    composer.addPass(renderPass);
    composer.addPass(bloomPass);
    composer.addPass(copyPass);

    // 4. Observer Camera & Drag Controls (distance 10.4, camera locked to initial Picture 1 frame)
    const observer = new Observer(60.0, window.innerWidth / window.innerHeight, 1, 80000);
    observer.distance = 10.4;
    observer.fov = 90.0;
    observer.moving = false; // Lock camera orbit to preserve exact Picture 1 shape & color grade
    const cameraControl = new CameraDragControls(observer, renderer.domElement);

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

    // Optimized steps for silky smooth 60 FPS without GPU lag
    const defines = `
      #define STEP 0.06
      #define NSTEPS 480
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
      cameraControl.handleResize();
    };
    window.addEventListener('resize', onResize);

    // 8. Animation Loop
    const baseIncline = -5.0 * (Math.PI / 180.0);
    const r = 10.4;
    let totalTime = 0;

    const update = () => {
      animId = requestAnimationFrame(update);

      const now = performance.now();
      const delta = Math.min((now - lastFrame) / 1000, 0.1);
      lastFrame = now;

      if (!reducedMotion) {
        totalTime += delta;
      }

      // 1. Accretion disk matter & circular reddish ring visibly rotates (slow, cinematic pace)
      time += delta * 0.5;

      // 2. Subtle relativistic lensing ripple loop (slow, gentle breathing pace)
      const loopSpeed = 0.18;
      const swayAngle = Math.sin(totalTime * loopSpeed) * 0.02; // Gentle micro-sway (~1.1 deg)
      const swayIncline = baseIncline + Math.cos(totalTime * loopSpeed * 0.8) * 0.006;

      const sinT = Math.sin(swayAngle);
      const cosT = Math.cos(swayAngle);

      // Camera coordinates anchored in place
      const pos = new THREE.Vector3(r * sinT, 0, r * cosT);
      const rotMatrix = new THREE.Matrix4().makeRotationX(swayIncline);
      pos.applyMatrix4(rotMatrix);

      // Direction looking into the black hole center
      const dir = pos.clone().negate().normalize();
      const up = new THREE.Vector3(0, 1, 0).applyMatrix4(new THREE.Matrix4().makeRotationZ(swayIncline));

      // Velocity loop causing subtle relativistic lensing undulation around the ring
      const vel = new THREE.Vector3(
        0.06 * Math.sin(totalTime * loopSpeed),
        0.02 * Math.cos(totalTime * loopSpeed * 0.5),
        0.06 * Math.cos(totalTime * loopSpeed)
      );
      vel.applyMatrix4(rotMatrix);

      // Sync uniforms
      uniforms.time.value = time;
      uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
      uniforms.cam_pos.value.copy(pos);
      uniforms.cam_dir.value.copy(dir);
      uniforms.cam_up.value.copy(up);
      uniforms.cam_vel.value.copy(vel);

      composer.render();
    };

    update();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      bgTexture.dispose();
      starTexture.dispose();
      diskTexture.dispose();
      material.dispose();
      mesh.geometry.dispose();
      composer.dispose();
      renderer.dispose();
    };
  }, [reducedMotion]);

  return (
    <div
      ref={containerRef}
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
