import { useEffect, useRef } from "react";
import * as THREE from "three";

interface HeroTopographicWorldProps {
  hoveredIndex: number | null;
  reducedMotion?: boolean;
  onCameraUpdate?: (camera: THREE.PerspectiveCamera, setScrollFlatten: (v: number) => void) => void;
}

// -------------------------------------------------------------
// GLSL Shaders for 3D Topographic Wave Field
// -------------------------------------------------------------
const vertexShader = /* glsl */ `
uniform float uTime;
uniform vec2 uMouse;
uniform float uMouseSpeed;
uniform vec2 uPulseOrigin;
uniform float uPulseTime;
uniform float uScrollFlatten;

varying float vElevation;
varying vec3 vNormal;
varying vec2 vUv;
varying float vMouseDist;
varying vec3 vWorldPosition;

// 2D Simplex Noise
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m;
  m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x  = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// 3-Octave Fractional Brownian Motion
float fbm(vec2 p) {
  float total = 0.0;
  float amp = 0.70;
  float freq = 0.22;
  for (int i = 0; i < 3; i++) {
    total += snoise(p * freq) * amp;
    freq *= 2.05;
    amp *= 0.45;
  }
  return total;
}

// Analytical Height Function
float getHeight(vec2 p) {
  // 1. Slow organic topographic waves
  float wave = fbm(p + vec2(uTime * 0.045, uTime * 0.025)) * 1.15;

  // 2. Center damping: Keeps the central headline zone calm and ultra-legible
  vec2 centerDiff = p * vec2(0.32, 0.65);
  float centerDist = length(centerDiff);
  float centerDamp = smoothstep(0.9, 3.2, centerDist);

  // 3. Real-time cursor wave ripple physics (only active when mouse moves)
  float mDist = length(p - uMouse);
  float mouseRipple = sin(mDist * 4.5 - uTime * 6.5) * exp(-mDist * 0.40) * 0.65 * clamp(uMouseSpeed, 0.0, 2.5);

  // 4. Corner shockwave pulse physics (triggered on bottom 01-04 hover)
  float pDist = length(p - uPulseOrigin);
  float pulseRing = exp(-pow(pDist - uPulseTime * 9.5, 2.0) * 1.4) * sin(pDist * 5.0 - uPulseTime * 14.0);
  float pulseDecay = max(0.0, 1.0 - uPulseTime * 0.70);
  float shockwave = pulseRing * pulseDecay * 1.2;

  // Combined displacement with scroll flattening
  return (wave * centerDamp + mouseRipple + shockwave) * (1.0 - uScrollFlatten);
}

void main() {
  vUv = uv;
  vec3 pos = position;

  // Calculate elevation
  float elevation = getHeight(pos.xy);
  pos.z += elevation;
  vElevation = elevation;

  // Finite-difference surface normal calculation for physical studio lighting
  float eps = 0.06;
  float hX = getHeight(pos.xy + vec2(eps, 0.0));
  float hY = getHeight(pos.xy + vec2(0.0, eps));
  vec3 calculatedNormal = normalize(vec3((elevation - hX) / eps, (elevation - hY) / eps, 1.0));

  vNormal = normalize(normalMatrix * calculatedNormal);
  vMouseDist = length(pos.xy - uMouse);
  vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const fragmentShader = /* glsl */ `
uniform float uTime;
uniform float uMouseSpeed;
varying float vElevation;
varying vec3 vNormal;
varying vec2 vUv;
varying float vMouseDist;
varying vec3 vWorldPosition;

void main() {
  // Physical Studio Travertine / Matte Paper Lighting
  // Sunlit warm light from top-right-front
  vec3 sunDir = normalize(vec3(0.45, 0.75, 0.65));
  float NdotL = max(dot(vNormal, sunDir), 0.0);

  // Ambient sky bounce
  float skyBounce = max(vNormal.z * 0.5 + 0.5, 0.0);

  // Exact Arché Brand Palette
  // Pure Warm Ivory Ground (#F4F4EE)
  vec3 cIvory = vec3(0.957, 0.957, 0.933);
  // Recessed Warm Stone (#EAE7DF)
  vec3 cStone = vec3(0.918, 0.906, 0.875);
  // Architectural Valley Shadow (#E2DFD6)
  vec3 cShadow = vec3(0.886, 0.875, 0.839);
  // Surgical Lime Accent (#9EE41A)
  vec3 cLime = vec3(0.620, 0.894, 0.102);
  // Matte Obsidian Charcoal (#141413)
  vec3 cInk = vec3(0.078, 0.078, 0.075);

  // Base sculpted travertine shading
  vec3 surfaceColor = mix(cShadow, cStone, NdotL * 0.7 + skyBounce * 0.3);
  surfaceColor = mix(surfaceColor, cIvory, smoothstep(-0.2, 0.7, vElevation));

  // -------------------------------------------------------------
  // Signature Topographic Elevation Isolines (fwidth anti-aliased)
  // -------------------------------------------------------------
  float contourSpacing = 6.5; // Frequency of isolines
  float val = vElevation * contourSpacing;
  float f = fract(val);
  float distToLine = min(f, 1.0 - f);
  float fw = fwidth(val) * 1.5;
  float isoline = 1.0 - smoothstep(0.0, fw, distToLine);

  // Soften isolines directly behind dead-center headline for pristine readability
  vec2 centerDiff = vWorldPosition.xy * vec2(0.24, 0.62);
  float centerClear = smoothstep(0.8, 3.0, length(centerDiff));
  isoline *= centerClear;

  // Delicate warm charcoal base isolines across entire terrain
  surfaceColor = mix(surfaceColor, cInk, isoline * 0.08);

  // -------------------------------------------------------------
  // Dynamic #9EE41A Surgical Lime Ignition along Wave Crests & Cursor Ripple
  // -------------------------------------------------------------
  float rippleProximity = smoothstep(3.2, 0.4, vMouseDist) * (uMouseSpeed * 1.4 + 0.45);
  float crestHeight = smoothstep(0.30, 0.75, vElevation);
  float limeEnergy = clamp(rippleProximity + crestHeight * 0.5, 0.0, 1.0);

  // Blend isolines into luminous surgical lime
  surfaceColor = mix(surfaceColor, cLime, isoline * limeEnergy * 0.95);

  // Subtle ambient neon bloom along active peaks
  surfaceColor += cLime * (isoline * limeEnergy * 0.30);

  // -------------------------------------------------------------
  // Seamless Edge Falloff into Studio Ground (#F4F4EE)
  // -------------------------------------------------------------
  float edgeX = smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.88, vUv.x);
  float edgeY = smoothstep(0.0, 0.14, vUv.y) * smoothstep(1.0, 0.86, vUv.y);
  float borderFade = edgeX * edgeY;

  vec3 finalColor = mix(cIvory, surfaceColor, borderFade);

  gl_FragColor = vec4(finalColor, 1.0);
}
`;

// -------------------------------------------------------------
// GLSL Shaders for 3D Optical Conduit Arcs
// -------------------------------------------------------------
const arcVertexShader = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormal;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const arcFragmentShader = /* glsl */ `
uniform float uTime;
uniform float uOffset;
uniform float uGlow;
varying vec2 vUv;
varying vec3 vNormal;

void main() {
  vec3 cLime = vec3(0.620, 0.894, 0.102);
  vec3 cBase = vec3(0.078, 0.078, 0.075);

  // Traveling 60fps energy pulse along tube length (vUv.x)
  float head = fract(uTime * 0.40 + uOffset);
  float dist = abs(vUv.x - head);
  dist = min(dist, 1.0 - dist); // wrap

  float pulse = smoothstep(0.14, 0.0, dist);

  // Rim lighting on 3D cylindrical tube
  float rim = 1.0 - abs(vNormal.z);

  vec3 col = mix(cBase * 0.15, cLime, pulse * (1.0 + uGlow * 1.5));
  float alpha = clamp(0.15 + pulse * 0.85 + uGlow * 0.4, 0.0, 1.0);

  gl_FragColor = vec4(col, alpha);
}
`;

export function HeroTopographicWorld({
  hoveredIndex,
  reducedMotion,
  onCameraUpdate,
}: HeroTopographicWorldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Three.js internal references
  const terrainMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const arcMaterialsRef = useRef<THREE.ShaderMaterial[]>([]);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const scrollFlattenRef = useRef<number>(0);

  // Pointer tracking
  const pointerRef = useRef({
    targetX: 0,
    targetY: 0,
    currentX: 0,
    currentY: 0,
    lastX: 0,
    lastY: 0,
    speed: 0,
    active: false,
  });

  const isVisibleRef = useRef<boolean>(true);

  // Corner origins for shockwave pulses (in terrain coordinate space)
  const CORNER_ORIGINS: [number, number][] = [
    [-8.5, 3.2],  // 01 Film (Top-Left)
    [-8.0, -3.5], // 02 Web (Bottom-Left)
    [8.0, -3.5],  // 03 Agent (Bottom-Right)
    [8.5, 3.2],   // 04 Ops (Top-Right)
  ];

  // Trigger shockwave & surge matching optical arc when hovered
  useEffect(() => {
    if (hoveredIndex === null || reducedMotion) return;
    const origin = CORNER_ORIGINS[hoveredIndex] || [0, 0];

    // Trigger vertex shader shockwave
    if (terrainMaterialRef.current) {
      terrainMaterialRef.current.uniforms.uPulseOrigin.value.set(origin[0], origin[1]);
      terrainMaterialRef.current.uniforms.uPulseTime.value = 0.0;
    }

    // Surge matching optical arc glow
    if (arcMaterialsRef.current[hoveredIndex]) {
      arcMaterialsRef.current[hoveredIndex].uniforms.uGlow.value = 2.4;
    }
  }, [hoveredIndex, reducedMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // 1. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0xf4f4ee, 1.0);

    // 2. Scene & Fog
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xf4f4ee, 0.042);

    // 3. Perspective Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0.6, 9.5);
    camera.lookAt(0, -0.6, 0);
    cameraRef.current = camera;

    if (onCameraUpdate) {
      onCameraUpdate(camera, (val: number) => {
        scrollFlattenRef.current = val;
      });
    }

    // 4. Sculpted 3D Topographic Terrain Mesh
    const isMobile = width < 768;
    const planeGeo = new THREE.PlaneGeometry(
      isMobile ? 22 : 28,
      isMobile ? 14 : 16,
      isMobile ? 64 : 160,
      isMobile ? 64 : 160
    );

    const terrainMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(-999, -999) },
        uMouseSpeed: { value: 0 },
        uPulseOrigin: { value: new THREE.Vector2(-999, -999) },
        uPulseTime: { value: 99.0 },
        uScrollFlatten: { value: 0.0 },
      },
      wireframe: false,
    });
    terrainMaterialRef.current = terrainMaterial;

    const terrainMesh = new THREE.Mesh(planeGeo, terrainMaterial);
    terrainMesh.rotation.x = -0.58;
    terrainMesh.position.set(0, -1.2, 0);
    scene.add(terrainMesh);

    // 5. Four 3D Optical Conduit Arcs (CatmullRomCurve3 + TubeGeometry)
    const arcCurves = [
      // Arc 01: Top-Left (Film)
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-9.2, 3.4, 0.8),
        new THREE.Vector3(-7.0, 1.8, -0.6),
        new THREE.Vector3(-4.5, -0.2, -1.8),
        new THREE.Vector3(-2.8, -1.0, -2.6),
      ]),
      // Arc 02: Bottom-Left (Web)
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-8.8, -1.4, 1.0),
        new THREE.Vector3(-6.2, -1.6, -0.4),
        new THREE.Vector3(-3.8, -1.8, -1.6),
        new THREE.Vector3(-1.4, -1.6, -2.8),
      ]),
      // Arc 03: Top-Right (Agent)
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(9.2, 3.4, 0.8),
        new THREE.Vector3(7.0, 1.8, -0.6),
        new THREE.Vector3(4.5, -0.2, -1.8),
        new THREE.Vector3(2.8, -1.0, -2.6),
      ]),
      // Arc 04: Bottom-Right (Ops)
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(8.8, -1.4, 1.0),
        new THREE.Vector3(6.2, -1.6, -0.4),
        new THREE.Vector3(3.8, -1.8, -1.6),
        new THREE.Vector3(1.4, -1.6, -2.8),
      ]),
    ];

    const arcMaterials: THREE.ShaderMaterial[] = [];
    arcCurves.forEach((curve, idx) => {
      const tubeGeo = new THREE.TubeGeometry(curve, 48, 0.024, 8, false);
      const arcMat = new THREE.ShaderMaterial({
        vertexShader: arcVertexShader,
        fragmentShader: arcFragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uOffset: { value: idx * 0.25 },
          uGlow: { value: 0.0 },
        },
        transparent: true,
        depthWrite: false,
      });
      arcMaterials.push(arcMat);
      const tubeMesh = new THREE.Mesh(tubeGeo, arcMat);
      scene.add(tubeMesh);
    });
    arcMaterialsRef.current = arcMaterials;

    // 6. IntersectionObserver: Pause when offscreen (0% GPU/CPU overhead)
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    // 7. Mouse tracking & 3D raycasting
    const raycaster = new THREE.Raycaster();
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 1.2);
    const planeIntersect = new THREE.Vector3();

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      // Raycast to 3D terrain space
      raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
      raycaster.ray.intersectPlane(plane, planeIntersect);

      pointerRef.current.targetX = planeIntersect.x;
      pointerRef.current.targetY = planeIntersect.z; // mapping to plane's local coordinate space
      pointerRef.current.active = true;
    };

    const onPointerLeave = () => {
      pointerRef.current.active = false;
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerleave", onPointerLeave);

    // 8. Resize listener
    const onResize = () => {
      if (!container) return;
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    };
    window.addEventListener("resize", onResize);

    // 9. Continuous 60fps Render Loop
    let rafId = 0;
    let lastTime = performance.now();

    const animate = (time: number) => {
      rafId = requestAnimationFrame(animate);
      if (!isVisibleRef.current) return;

      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Pointer interpolation & velocity decay
      const ptr = pointerRef.current;
      if (ptr.active) {
        ptr.currentX += (ptr.targetX - ptr.currentX) * 0.08;
        ptr.currentY += (ptr.targetY - ptr.currentY) * 0.08;
        const dX = ptr.currentX - ptr.lastX;
        const dY = ptr.currentY - ptr.lastY;
        const instantSpeed = Math.hypot(dX, dY) / (dt || 0.016);
        ptr.speed += (instantSpeed - ptr.speed) * 0.12;
        ptr.lastX = ptr.currentX;
        ptr.lastY = ptr.currentY;
      } else {
        ptr.speed *= 0.92;
      }

      // Update terrain uniforms
      if (terrainMaterialRef.current) {
        const u = terrainMaterialRef.current.uniforms;
        u.uTime.value = time * 0.001;
        u.uMouse.value.set(ptr.currentX, ptr.currentY);
        u.uMouseSpeed.value = Math.min(ptr.speed * 0.08, 2.5);
        u.uPulseTime.value += dt;
        u.uScrollFlatten.value = scrollFlattenRef.current;
      }

      // Update arc materials
      arcMaterialsRef.current.forEach((mat) => {
        mat.uniforms.uTime.value = time * 0.001;
        mat.uniforms.uGlow.value *= 0.94; // Decay surge glow
      });

      renderer.render(scene, camera);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      planeGeo.dispose();
      terrainMaterial.dispose();
      arcMaterials.forEach((m) => m.dispose());
    };
  }, [onCameraUpdate]);

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0 w-full h-full z-0 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ willChange: "transform" }}
        aria-hidden="true"
      />
    </div>
  );
}
