// File: src/components/HeroFluidCursor.tsx
import { useEffect, useRef } from 'react'

type HeroFluidCursorProps = {
  reducedMotion: boolean
  active: boolean
}

const baseVertexShader = `
  precision highp float;
  attribute vec2 aPosition;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  uniform vec2 texelSize;

  void main () {
    vUv = aPosition * 0.5 + 0.5;
    vL = vUv - vec2(texelSize.x, 0.0);
    vR = vUv + vec2(texelSize.x, 0.0);
    vT = vUv + vec2(0.0, texelSize.y);
    vB = vUv - vec2(0.0, texelSize.y);
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`

const clearShader = `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  uniform sampler2D uTexture;
  uniform float value;

  void main () {
    gl_FragColor = value * texture2D(uTexture, vUv);
  }
`

const splatShader = `
  precision highp float;
  precision highp sampler2D;
  varying vec2 vUv;
  uniform sampler2D uTarget;
  uniform float aspectRatio;
  uniform vec3 color;
  uniform vec2 point;
  uniform float radius;
  uniform vec2 velocityDir;

  void main () {
    vec2 p = vUv - point.xy;
    p.x *= aspectRatio;

    float speed = length(velocityDir);
    if (speed > 0.001) {
      vec2 dir = velocityDir / speed;
      vec2 perp = vec2(-dir.y, dir.x);
      float along = dot(p, dir);
      float across = dot(p, perp);
      float stretch = clamp(1.0 + speed * 0.55, 1.0, 2.4);
      p = dir * (along / stretch) + perp * (across * sqrt(stretch));
    }

    float d2 = dot(p, p);
    float mainBlob = exp(-d2 / max(radius, 1e-6));

    // Organic satellite droplets around the main liquid chrome mass
    float rSqrt = sqrt(max(radius, 1e-6));
    float dist = sqrt(d2);
    float ring1 = exp(-pow(dist - rSqrt * 1.75, 2.0) / (radius * 0.22));
    float ring2 = exp(-pow(dist - rSqrt * 2.45, 2.0) / (radius * 0.16));
    float angle = atan(p.y, p.x);
    float hash1 = pow(max(0.0, sin(angle * 6.0 + point.x * 43.0) * cos(angle * 4.0 - point.y * 37.0)), 6.0);
    float hash2 = pow(max(0.0, cos(angle * 8.0 - point.y * 53.0) * sin(angle * 5.0 + point.x * 31.0)), 8.0);
    float droplets = (ring1 * hash1 * 0.85 + ring2 * hash2 * 0.65) * clamp(speed * 0.9, 0.15, 1.0);

    vec3 splat = (mainBlob + droplets) * color;
    vec3 base = texture2D(uTarget, vUv).xyz;
    gl_FragColor = vec4(base + splat, 1.0);
  }
`

const advectionShader = `
  precision highp float;
  precision highp sampler2D;
  varying vec2 vUv;
  uniform sampler2D uVelocity;
  uniform sampler2D uSource;
  uniform vec2 texelSize;
  uniform vec2 dyeTexelSize;
  uniform float dt;
  uniform float dissipation;

  vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
    vec2 st = uv / tsize - 0.5;
    vec2 iuv = floor(st);
    vec2 fuv = fract(st);
    vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
    vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
    vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
    vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);
    return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
  }

  void main () {
    #ifdef MANUAL_FILTERING
      vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
      vec4 result = bilerp(uSource, coord, dyeTexelSize);
    #else
      vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
      vec4 result = texture2D(uSource, coord);
    #endif
    float decay = 1.0 + dissipation * dt;
    gl_FragColor = result / decay;
  }
`

const divergenceShader = `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  varying highp vec2 vL;
  varying highp vec2 vR;
  varying highp vec2 vT;
  varying highp vec2 vB;
  uniform sampler2D uVelocity;

  void main () {
    float L = texture2D(uVelocity, vL).x;
    float R = texture2D(uVelocity, vR).x;
    float T = texture2D(uVelocity, vT).y;
    float B = texture2D(uVelocity, vB).y;
    vec2 C = texture2D(uVelocity, vUv).xy;
    if (vL.x < 0.0) { L = -C.x; }
    if (vR.x > 1.0) { R = -C.x; }
    if (vT.y > 1.0) { T = -C.y; }
    if (vB.y < 0.0) { B = -C.y; }
    float div = 0.5 * (R - L + T - B);
    gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
  }
`

const curlShader = `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  varying highp vec2 vL;
  varying highp vec2 vR;
  varying highp vec2 vT;
  varying highp vec2 vB;
  uniform sampler2D uVelocity;

  void main () {
    float L = texture2D(uVelocity, vL).y;
    float R = texture2D(uVelocity, vR).y;
    float T = texture2D(uVelocity, vT).x;
    float B = texture2D(uVelocity, vB).x;
    float vorticity = R - L - T + B;
    gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
  }
`

const vorticityShader = `
  precision highp float;
  precision highp sampler2D;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  uniform sampler2D uVelocity;
  uniform sampler2D uCurl;
  uniform float curl;
  uniform float dt;

  void main () {
    float L = texture2D(uCurl, vL).x;
    float R = texture2D(uCurl, vR).x;
    float T = texture2D(uCurl, vT).x;
    float B = texture2D(uCurl, vB).x;
    float C = texture2D(uCurl, vUv).x;
    vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
    force /= length(force) + 0.0001;
    force *= curl * C;
    force.y *= -1.0;
    vec2 velocity = texture2D(uVelocity, vUv).xy;
    velocity += force * dt;
    velocity = min(max(velocity, -1000.0), 1000.0);
    gl_FragColor = vec4(velocity, 0.0, 1.0);
  }
`

const pressureShader = `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  varying highp vec2 vL;
  varying highp vec2 vR;
  varying highp vec2 vT;
  varying highp vec2 vB;
  uniform sampler2D uPressure;
  uniform sampler2D uDivergence;

  void main () {
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    float divergence = texture2D(uDivergence, vUv).x;
    float pressure = (L + R + B + T - divergence) * 0.25;
    gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
  }
`

const gradientSubtractShader = `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  varying highp vec2 vL;
  varying highp vec2 vR;
  varying highp vec2 vT;
  varying highp vec2 vB;
  uniform sampler2D uPressure;
  uniform sampler2D uVelocity;

  void main () {
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    vec2 velocity = texture2D(uVelocity, vUv).xy;
    velocity.xy -= vec2(R - L, T - B);
    gl_FragColor = vec4(velocity, 0.0, 1.0);
  }
`

// Realistic Molten Liquid-Chrome / Black Mercury Surface Shader
const liquidChromeDisplayShader = `
  precision highp float;
  precision highp sampler2D;
  varying vec2 vUv;
  uniform sampler2D uTexture;
  uniform vec2 texelSize;

  float sampleHeight(vec2 uv) {
    vec2 t = texelSize * 1.5;
    float c  = texture2D(uTexture, uv).r * 4.0;
    float l  = texture2D(uTexture, uv - vec2(t.x, 0.0)).r * 2.0;
    float r  = texture2D(uTexture, uv + vec2(t.x, 0.0)).r * 2.0;
    float b  = texture2D(uTexture, uv - vec2(0.0, t.y)).r * 2.0;
    float tp = texture2D(uTexture, uv + vec2(0.0, t.y)).r * 2.0;
    float bl = texture2D(uTexture, uv - t).r;
    float br = texture2D(uTexture, uv + vec2(t.x, -t.y)).r;
    float tl = texture2D(uTexture, uv + vec2(-t.x, t.y)).r;
    float tr = texture2D(uTexture, uv + t).r;
    return (c + l + r + b + tp + bl + br + tl + tr) / 16.0;
  }

  void main () {
    float h = sampleHeight(vUv);

    // Crisp liquid-metal surface tension threshold (eliminates smoke/fog completely)
    float mask = smoothstep(0.08, 0.16, h);
    if (mask <= 0.002) {
      gl_FragColor = vec4(0.0);
      return;
    }

    vec2 eps = texelSize * 2.2;
    float hL = sampleHeight(vUv - vec2(eps.x, 0.0));
    float hR = sampleHeight(vUv + vec2(eps.x, 0.0));
    float hB = sampleHeight(vUv - vec2(0.0, eps.y));
    float hT = sampleHeight(vUv + vec2(0.0, eps.y));

    // 3D normal from heightfield gradient
    float bumpScale = 24.0;
    vec3 normal = normalize(vec3((hL - hR) * bumpScale, (hB - hT) * bumpScale, 1.0));
    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    vec3 refl = reflect(-viewDir, normal);

    // Exact metallic palette:
    // Shadow (#080808), Midtone (#777777), Silver (#C0C0C0), Highlight (#F2F2F2)
    vec3 colShadow    = vec3(0.031, 0.031, 0.031); // #080808
    vec3 colMidtone   = vec3(0.467, 0.467, 0.467); // #777777
    vec3 colSilver    = vec3(0.753, 0.753, 0.753); // #C0C0C0
    vec3 colHighlight = vec3(0.949, 0.949, 0.949); // #F2F2F2

    // Studio chrome reflection bands
    float band1 = sin(refl.x * 7.0 + refl.y * 4.5) * 0.5 + 0.5;
    float band2 = cos(refl.y * 9.5 - refl.x * 3.8) * 0.5 + 0.5;
    float horizon = smoothstep(-0.3, 0.65, refl.y * 0.7 + refl.x * 0.4);
    float envReflect = pow(band1 * band2, 1.5);

    // Dual studio specular lights
    vec3 lightKey = normalize(vec3(-0.48, 0.62, 0.62));
    vec3 lightRim = normalize(vec3(0.65, -0.48, 0.58));
    vec3 halfKey  = normalize(lightKey + viewDir);
    vec3 halfRim  = normalize(lightRim + viewDir);

    float specKey = pow(max(dot(normal, halfKey), 0.0), 58.0);
    float specRim = pow(max(dot(normal, halfRim), 0.0), 28.0);
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.3);

    float slope = length(normal.xy);
    float edgeContour = smoothstep(0.08, 0.55, slope);

    // Base dark obsidian interior -> brushed steel midtone -> liquid silver rim
    vec3 chrome = colShadow;
    chrome = mix(chrome, colMidtone, edgeContour * (0.5 + 0.5 * horizon));
    chrome = mix(chrome, colSilver, smoothstep(0.26, 0.78, fresnel * 1.2 + envReflect * 0.55));

    // Deep dark reflective interior inside thick blobs (matches reference image)
    float deepInterior = smoothstep(0.28, 0.85, h) * (1.0 - smoothstep(0.15, 0.6, slope));
    chrome = mix(chrome, colShadow * 0.7, deepInterior * 0.78);

    // Bright liquid-silver meniscus ring along the outer boundary
    float meniscus = smoothstep(0.08, 0.16, h) * (1.0 - smoothstep(0.16, 0.28, h));
    chrome = mix(chrome, colSilver, meniscus * (0.55 + 0.45 * horizon));

    // Razor-sharp near-white (#F2F2F2) specular highlights
    float specular = clamp(specKey * 1.55 + specRim * 0.75 + pow(fresnel, 3.0) * 0.85, 0.0, 1.0);
    chrome = mix(chrome, colHighlight, specular);

    gl_FragColor = vec4(chrome * mask, mask);
  }
`

type FBO = {
  texture: WebGLTexture
  fbo: WebGLFramebuffer
  width: number
  height: number
  texelSizeX: number
  texelSizeY: number
  attach: (id: number) => number
}

type DoubleFBO = {
  width: number
  height: number
  texelSizeX: number
  texelSizeY: number
  read: FBO
  write: FBO
  swap: () => void
}

export function HeroFluidCursor({ reducedMotion, active }: HeroFluidCursorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (reducedMotion || !active) return
    const canvas = canvasRef.current
    if (!canvas) return
    const hero = canvas.closest<HTMLElement>('.hero')
    if (!hero) return

    const params: WebGLContextAttributes = {
      alpha: true,
      depth: false,
      stencil: false,
      antialias: false,
      preserveDrawingBuffer: false,
      premultipliedAlpha: true,
    }

    const gl2 = canvas.getContext('webgl2', params) as WebGL2RenderingContext | null
    const isWebGL2 = Boolean(gl2)
    const gl = (gl2 ||
      canvas.getContext('webgl', params) ||
      canvas.getContext('experimental-webgl', params)) as WebGLRenderingContext | null

    if (!gl) return

    let halfFloatExt: { HALF_FLOAT_OES: number } | null = null
    let supportLinearFiltering = false

    if (isWebGL2 && gl2) {
      gl2.getExtension('EXT_color_buffer_float')
      supportLinearFiltering = Boolean(gl2.getExtension('OES_texture_float_linear'))
    } else {
      halfFloatExt = gl.getExtension('OES_texture_half_float')
      supportLinearFiltering = Boolean(gl.getExtension('OES_texture_half_float_linear'))
    }

    const halfFloatTexType =
      isWebGL2 && gl2 ? gl2.HALF_FLOAT : halfFloatExt ? halfFloatExt.HALF_FLOAT_OES : gl.UNSIGNED_BYTE

    const supportRenderTextureFormat = (internalFormat: number, format: number, type: number) => {
      const texture = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null)
      const fbo = gl.createFramebuffer()
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)
      const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.deleteFramebuffer(fbo)
      gl.deleteTexture(texture)
      return status === gl.FRAMEBUFFER_COMPLETE
    }

    const getSupportedFormat = (
      internalFormat: number,
      format: number,
      type: number,
    ): { internalFormat: number; format: number } => {
      if (!supportRenderTextureFormat(internalFormat, format, type)) {
        if (isWebGL2 && gl2) {
          if (internalFormat === gl2.R16F) return getSupportedFormat(gl2.RG16F, gl2.RG, type)
          if (internalFormat === gl2.RG16F) return getSupportedFormat(gl2.RGBA16F, gl.RGBA, type)
        }
        return { internalFormat: gl.RGBA, format: gl.RGBA }
      }
      return { internalFormat, format }
    }

    const formatRGBA =
      isWebGL2 && gl2
        ? getSupportedFormat(gl2.RGBA16F, gl.RGBA, halfFloatTexType)
        : getSupportedFormat(gl.RGBA, gl.RGBA, halfFloatTexType)
    const formatRG =
      isWebGL2 && gl2
        ? getSupportedFormat(gl2.RG16F, gl2.RG, halfFloatTexType)
        : getSupportedFormat(gl.RGBA, gl.RGBA, halfFloatTexType)
    const formatR =
      isWebGL2 && gl2
        ? getSupportedFormat(gl2.R16F, gl2.RED, halfFloatTexType)
        : getSupportedFormat(gl.RGBA, gl.RGBA, halfFloatTexType)

    const compileShader = (type: number, source: string, keywords?: string[]) => {
      const header = keywords ? keywords.map((k) => `#define ${k}\n`).join('') : ''
      const shader = gl.createShader(type)!
      gl.shaderSource(shader, header + source)
      gl.compileShader(shader)
      return shader
    }

    const createProgram = (vsSource: string, fsSource: string, keywords?: string[]) => {
      const program = gl.createProgram()!
      const vs = compileShader(gl.VERTEX_SHADER, vsSource)
      const fs = compileShader(gl.FRAGMENT_SHADER, fsSource, keywords)
      gl.attachShader(program, vs)
      gl.attachShader(program, fs)
      // CRITICAL: Bind aPosition to location 0 before linking so the quad always renders
      gl.bindAttribLocation(program, 0, 'aPosition')
      gl.linkProgram(program)
      gl.deleteShader(vs)
      gl.deleteShader(fs)

      const uniforms: Record<string, WebGLUniformLocation | null> = {}
      const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS)
      for (let i = 0; i < count; i++) {
        const info = gl.getActiveUniform(program, i)
        if (info) uniforms[info.name] = gl.getUniformLocation(program, info.name)
      }
      return {
        program,
        uniforms,
        bind: () => gl.useProgram(program),
      }
    }

    const clearProg = createProgram(baseVertexShader, clearShader)
    const splatProg = createProgram(baseVertexShader, splatShader)
    const advectionProg = createProgram(
      baseVertexShader,
      advectionShader,
      supportLinearFiltering ? undefined : ['MANUAL_FILTERING'],
    )
    const divergenceProg = createProgram(baseVertexShader, divergenceShader)
    const curlProg = createProgram(baseVertexShader, curlShader)
    const vorticityProg = createProgram(baseVertexShader, vorticityShader)
    const pressureProg = createProgram(baseVertexShader, pressureShader)
    const gradSubtractProg = createProgram(baseVertexShader, gradientSubtractShader)
    const displayProg = createProgram(baseVertexShader, liquidChromeDisplayShader)

    const quadBuffer = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW)
    const indexBuffer = gl.createBuffer()!
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW)

    const blit = (target: FBO | null, clear = false) => {
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer)
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
      gl.enableVertexAttribArray(0)

      if (target === null) {
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      } else {
        gl.viewport(0, 0, target.width, target.height)
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo)
      }
      if (clear) {
        gl.clearColor(0, 0, 0, 0)
        gl.clear(gl.COLOR_BUFFER_BIT)
      }
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0)
    }

    const createFBO = (w: number, h: number, internalFormat: number, format: number, type: number, param: number): FBO => {
      gl.activeTexture(gl.TEXTURE0)
      const texture = gl.createTexture()!
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null)

      const fbo = gl.createFramebuffer()!
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)
      gl.viewport(0, 0, w, h)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)

      return {
        texture,
        fbo,
        width: w,
        height: h,
        texelSizeX: 1.0 / w,
        texelSizeY: 1.0 / h,
        attach(id: number) {
          gl.activeTexture(gl.TEXTURE0 + id)
          gl.bindTexture(gl.TEXTURE_2D, texture)
          return id
        },
      }
    }

    const createDoubleFBO = (
      w: number,
      h: number,
      internalFormat: number,
      format: number,
      type: number,
      param: number,
    ): DoubleFBO => {
      let fbo1 = createFBO(w, h, internalFormat, format, type, param)
      let fbo2 = createFBO(w, h, internalFormat, format, type, param)
      return {
        width: w,
        height: h,
        texelSizeX: fbo1.texelSizeX,
        texelSizeY: fbo1.texelSizeY,
        get read() {
          return fbo1
        },
        set read(value) {
          fbo1 = value
        },
        get write() {
          return fbo2
        },
        set write(value) {
          fbo2 = value
        },
        swap() {
          const temp = fbo1
          fbo1 = fbo2
          fbo2 = temp
        },
      }
    }

    const getResolution = (resolution: number) => {
      let aspectRatio = gl.drawingBufferWidth / Math.max(1, gl.drawingBufferHeight)
      if (aspectRatio < 1) aspectRatio = 1.0 / aspectRatio
      const min = Math.round(resolution)
      const max = Math.round(resolution * aspectRatio)
      return gl.drawingBufferWidth > gl.drawingBufferHeight
        ? { width: max, height: min }
        : { width: min, height: max }
    }

    const SIM_RESOLUTION = 160
    const DYE_RESOLUTION = 768
    const VELOCITY_DISSIPATION = 3.6
    const DENSITY_DISSIPATION = 4.8
    const PRESSURE = 0.8
    const PRESSURE_ITERATIONS = 20
    const CURL = 12
    const SPLAT_RADIUS = 0.0013
    const SPLAT_FORCE = 3600

    let dye: DoubleFBO
    let velocity: DoubleFBO
    let divergence: FBO
    let curlFBO: FBO
    let pressure: DoubleFBO

    const initFramebuffers = () => {
      const simRes = getResolution(SIM_RESOLUTION)
      const dyeRes = getResolution(DYE_RESOLUTION)
      const filtering = supportLinearFiltering ? gl.LINEAR : gl.NEAREST
      gl.disable(gl.BLEND)

      dye = createDoubleFBO(
        dyeRes.width,
        dyeRes.height,
        formatRGBA.internalFormat,
        formatRGBA.format,
        halfFloatTexType,
        filtering,
      )
      velocity = createDoubleFBO(
        simRes.width,
        simRes.height,
        formatRG.internalFormat,
        formatRG.format,
        halfFloatTexType,
        filtering,
      )
      divergence = createFBO(
        simRes.width,
        simRes.height,
        formatR.internalFormat,
        formatR.format,
        halfFloatTexType,
        gl.NEAREST,
      )
      curlFBO = createFBO(
        simRes.width,
        simRes.height,
        formatR.internalFormat,
        formatR.format,
        halfFloatTexType,
        gl.NEAREST,
      )
      pressure = createDoubleFBO(
        simRes.width,
        simRes.height,
        formatR.internalFormat,
        formatR.format,
        halfFloatTexType,
        gl.NEAREST,
      )
    }

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = Math.max(1, Math.floor(hero.clientWidth * dpr))
      const h = Math.max(1, Math.floor(hero.clientHeight * dpr))
      if (canvas.width !== w || canvas.height !== h || !velocity) {
        canvas.width = w
        canvas.height = h
        initFramebuffers()
      }
    }

    resizeCanvas()

    const splat = (x: number, y: number, dx: number, dy: number) => {
      const aspect = canvas.width / Math.max(1, canvas.height)
      const speed = Math.hypot(dx, dy)
      const dynamicRadius = SPLAT_RADIUS * Math.min(1.5, Math.max(0.72, 0.78 + speed * 0.0002))

      splatProg.bind()
      gl.uniform1i(splatProg.uniforms.uTarget, velocity.read.attach(0))
      gl.uniform1f(splatProg.uniforms.aspectRatio, aspect)
      gl.uniform2f(splatProg.uniforms.point, x, y)
      gl.uniform3f(splatProg.uniforms.color, dx, dy, 0.0)
      gl.uniform1f(splatProg.uniforms.radius, dynamicRadius)
      gl.uniform2f(splatProg.uniforms.velocityDir, dx * 0.0018, dy * 0.0018)
      blit(velocity.write)
      velocity.swap()

      // Strong heightfield injection so the liquid chrome surface normal and meniscus pop clearly
      const intensity = Math.min(1.45, Math.max(0.62, 0.55 + speed * 0.0006))
      gl.uniform1i(splatProg.uniforms.uTarget, dye.read.attach(0))
      gl.uniform3f(splatProg.uniforms.color, intensity, intensity, intensity)
      gl.uniform1f(splatProg.uniforms.radius, dynamicRadius)
      blit(dye.write)
      dye.swap()
    }

    const pointer = {
      x: 0,
      y: 0,
      prevX: 0,
      prevY: 0,
      dx: 0,
      dy: 0,
      moved: false,
      initialized: false,
      overHalftone: false,
    }

    let raf = 0
    let heroVisible = true
    let settleFrames = 0
    let lastTime = performance.now()

    const stepSimulation = (dt: number) => {
      gl.disable(gl.BLEND)

      curlProg.bind()
      gl.uniform2f(curlProg.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY)
      gl.uniform1i(curlProg.uniforms.uVelocity, velocity.read.attach(0))
      blit(curlFBO)

      vorticityProg.bind()
      gl.uniform2f(vorticityProg.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY)
      gl.uniform1i(vorticityProg.uniforms.uVelocity, velocity.read.attach(0))
      gl.uniform1i(vorticityProg.uniforms.uCurl, curlFBO.attach(1))
      gl.uniform1f(vorticityProg.uniforms.curl, CURL)
      gl.uniform1f(vorticityProg.uniforms.dt, dt)
      blit(velocity.write)
      velocity.swap()

      divergenceProg.bind()
      gl.uniform2f(divergenceProg.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY)
      gl.uniform1i(divergenceProg.uniforms.uVelocity, velocity.read.attach(0))
      blit(divergence)

      clearProg.bind()
      gl.uniform1i(clearProg.uniforms.uTexture, pressure.read.attach(0))
      gl.uniform1f(clearProg.uniforms.value, PRESSURE)
      blit(pressure.write)
      pressure.swap()

      pressureProg.bind()
      gl.uniform2f(pressureProg.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY)
      gl.uniform1i(pressureProg.uniforms.uDivergence, divergence.attach(0))
      for (let i = 0; i < PRESSURE_ITERATIONS; i++) {
        gl.uniform1i(pressureProg.uniforms.uPressure, pressure.read.attach(1))
        blit(pressure.write)
        pressure.swap()
      }

      gradSubtractProg.bind()
      gl.uniform2f(gradSubtractProg.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY)
      gl.uniform1i(gradSubtractProg.uniforms.uPressure, pressure.read.attach(0))
      gl.uniform1i(gradSubtractProg.uniforms.uVelocity, velocity.read.attach(1))
      blit(velocity.write)
      velocity.swap()

      advectionProg.bind()
      gl.uniform2f(advectionProg.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY)
      if (!supportLinearFiltering) {
        gl.uniform2f(advectionProg.uniforms.dyeTexelSize, velocity.texelSizeX, velocity.texelSizeY)
      }
      const velId = velocity.read.attach(0)
      gl.uniform1i(advectionProg.uniforms.uVelocity, velId)
      gl.uniform1i(advectionProg.uniforms.uSource, velId)
      gl.uniform1f(advectionProg.uniforms.dt, dt)
      gl.uniform1f(advectionProg.uniforms.dissipation, VELOCITY_DISSIPATION)
      blit(velocity.write)
      velocity.swap()

      if (!supportLinearFiltering) {
        gl.uniform2f(advectionProg.uniforms.dyeTexelSize, dye.texelSizeX, dye.texelSizeY)
      }
      gl.uniform1i(advectionProg.uniforms.uVelocity, velocity.read.attach(0))
      gl.uniform1i(advectionProg.uniforms.uSource, dye.read.attach(1))
      gl.uniform1f(advectionProg.uniforms.dissipation, DENSITY_DISSIPATION)
      blit(dye.write)
      dye.swap()

      gl.enable(gl.BLEND)
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
      displayProg.bind()
      gl.uniform2f(displayProg.uniforms.texelSize, 1.0 / canvas.width, 1.0 / canvas.height)
      gl.uniform1i(displayProg.uniforms.uTexture, dye.read.attach(0))
      blit(null, true)
    }

    const loop = (now: number) => {
      raf = 0
      if (!heroVisible) return

      const dt = Math.min((now - lastTime) / 1000, 0.016666)
      lastTime = now

      if (pointer.moved && !pointer.overHalftone) {
        pointer.moved = false
        const dist = Math.hypot(pointer.dx, pointer.dy)
        const steps = Math.min(6, Math.max(1, Math.ceil(dist / 0.025)))
        for (let s = 1; s <= steps; s++) {
          const t = s / steps
          const sx = pointer.prevX + (pointer.x - pointer.prevX) * t
          const sy = pointer.prevY + (pointer.y - pointer.prevY) * t
          splat(sx, sy, (pointer.dx * SPLAT_FORCE) / steps, (pointer.dy * SPLAT_FORCE) / steps)
        }
        settleFrames = 120
      }

      stepSimulation(dt)

      if (settleFrames > 0) {
        settleFrames -= 1
        raf = window.requestAnimationFrame(loop)
      }
    }

    const wake = () => {
      if (!raf && heroVisible) {
        lastTime = performance.now()
        raf = window.requestAnimationFrame(loop)
      }
    }

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      const targetEl = e.target instanceof Element ? e.target : null

      // Avoid fluid cursor on the halftone AKIF name so only the dot physics runs there
      if (targetEl?.closest('.halftone-name')) {
        pointer.overHalftone = true
        pointer.initialized = false
        return
      }
      pointer.overHalftone = false

      const rect = hero.getBoundingClientRect()
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        pointer.initialized = false
        return
      }

      const nx = (e.clientX - rect.left) / Math.max(1, rect.width)
      const ny = 1.0 - (e.clientY - rect.top) / Math.max(1, rect.height)

      if (!pointer.initialized) {
        pointer.x = nx
        pointer.y = ny
        pointer.prevX = nx
        pointer.prevY = ny
        pointer.initialized = true
        return
      }

      pointer.prevX = pointer.x
      pointer.prevY = pointer.y
      pointer.x = nx
      pointer.y = ny

      const aspect = rect.width / Math.max(1, rect.height)
      pointer.dx = (nx - pointer.prevX) * (aspect < 1 ? aspect : 1)
      pointer.dy = (ny - pointer.prevY) * (aspect > 1 ? 1 / aspect : 1)

      if (Math.hypot(pointer.dx, pointer.dy) > 0.0001) {
        pointer.moved = true
        wake()
      }
    }

    const onPointerLeave = () => {
      pointer.initialized = false
      pointer.moved = false
    }

    const ro = new ResizeObserver(() => {
      resizeCanvas()
      settleFrames = Math.max(settleFrames, 20)
      wake()
    })
    ro.observe(hero)

    const io = new IntersectionObserver(
      ([entry]) => {
        heroVisible = entry.isIntersecting
        if (heroVisible) wake()
        else if (raf) {
          window.cancelAnimationFrame(raf)
          raf = 0
        }
      },
      { threshold: 0.02 },
    )
    io.observe(hero)

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    hero.addEventListener('pointerleave', onPointerLeave, { passive: true })

    return () => {
      if (raf) window.cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      window.removeEventListener('pointermove', onPointerMove)
      hero.removeEventListener('pointerleave', onPointerLeave)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
    }
  }, [reducedMotion, active])

  return <canvas ref={canvasRef} className="hero-fluid-canvas" aria-hidden="true" />
}
