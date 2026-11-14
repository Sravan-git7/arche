import { useLayoutEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "../lib/gsap";
import { siteContent } from "../data/site";
import "./HowWeWork.css";

// Approach principles copy, preserved verbatim.
const principles = [
  { k: "Systems thinking", v: "We design the connections between tools, content and people — not isolated deliverables." },
  { k: "AI where it earns its place", v: "Automation and agents only where they remove real work. No AI for the brochure." },
  { k: "Design + engineering", v: "Interface, motion and implementation are one language, not three handoffs." },
  { k: "Built to keep running", v: "Every engagement ends with something you can operate, measure and improve." },
];

const VS_SOURCE = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FS_SOURCE = `
precision highp float;
uniform vec2 u_resolution;
uniform float u_progress; // 0.0 to 1.0
uniform float u_theme;    // 0.0 = paper, 1.0 = dark
uniform float u_time;

mat2 rot(float a) {
  float c = cos(a), s = sin(a);
  return mat2(c, -s, s, c);
}

float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

float sdBox2D(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

// Sculptural Torus Ribbon with twist & wave modulation
float sdRibbonLoop(vec3 p, float R, vec2 dim, float twist, float bevel, float waveAmp, float waveFreq) {
  float ang = atan(p.z, p.x);
  float yWave = sin(ang * waveFreq) * waveAmp;
  vec2 q = vec2(length(p.xz) - R, p.y - yWave);
  q *= rot(ang * twist);
  return sdBox2D(q, dim, bevel);
}

// Map the architectural 3D journey
vec2 map(vec3 p) {
  float t = u_progress;

  // Convergence factor:
  // 0.00 - 0.16 : Discover (3 distinct floating sculptural bodies in space)
  // 0.16 - 0.32 : Design (bodies orient, rotate, harmonize)
  // 0.32 - 0.44 : Build (precision dimensional clearance, alignment)
  // 0.44 - 0.54 : Connect (seamless fusion into one continuous monument)
  // 0.54 - 0.65 : Launch (dark theme, electric lime light channel ignites)
  // 0.65 - 0.75 : Evolve (living harmonic flex through the unified form)
  // 0.75 - 1.00 : Approach (Systems, AI, Design+Eng, Built to run)

  float conv = smoothstep(0.12, 0.48, t);
  float sep = (1.0 - conv);

  vec3 pMain = p;
  pMain.y -= 0.05;

  // Global slow rotation
  pMain.xz *= rot(0.3 + t * 1.5);
  pMain.yz *= rot(0.22 + 0.12 * sin(t * 3.1415));

  // --- Form 1: The Primary Infinity Ribbon ---
  vec3 p1 = pMain;
  p1.x += sep * 1.1;
  p1.y -= sep * 0.4;
  p1.yz *= rot(sep * 0.45);
  p1.xz *= rot(sep * -0.6);
  float d1 = sdRibbonLoop(p1, 1.55, vec2(0.24, 0.09), 1.5, 0.04, 0.35 * conv, 3.0);

  // --- Form 2: The Interlocking Blade ---
  vec3 p2 = pMain;
  p2.x -= sep * 1.2;
  p2.z += sep * 0.8;
  p2.xy *= rot(sep * -0.5);
  p2.xz *= rot(1.05);
  p2.yz *= rot(0.85);
  float d2 = sdRibbonLoop(p2, 1.35, vec2(0.20, 0.08), 1.0, 0.04, 0.28 * conv, 2.0);

  // --- Form 3: The Vaulted Arch ---
  vec3 p3 = pMain;
  p3.y += sep * 1.0;
  p3.z -= sep * 0.7;
  p3.xz *= rot(-1.2 - sep * 0.5);
  p3.xy *= rot(0.7);
  float d3 = sdRibbonLoop(p3, 1.2, vec2(0.18, 0.07), 0.5, 0.03, 0.2 * conv, 2.0);

  // Seamless fusion of the architectural forms
  float blendK = mix(0.02, 0.44, conv);
  float dSculpture = smin(d1, d2, blendK);
  dSculpture = smin(dSculpture, d3, blendK);

  // Evolve subtle flex
  if (t > 0.62) {
    float wave = sin(atan(pMain.z, pMain.x) * 5.0 - u_time * 2.8) * 0.022 * smoothstep(0.62, 0.76, t);
    dSculpture += wave;
  }

  // Luminous Seam Channel: embedded laser track along the spine
  float ang1 = atan(p1.z, p1.x);
  vec2 q1 = vec2(length(p1.xz) - 1.55, p1.y - sin(ang1 * 3.0) * 0.35 * conv);
  q1 *= rot(ang1 * 1.5);
  float dChannel = length(q1 - vec2(0.0, 0.08)) - 0.035;
  dChannel = max(dChannel, dSculpture - 0.015);

  // Ground plane
  float dGround = p.y + 1.8;

  if (dGround < dSculpture && dGround < dChannel) {
    return vec2(dGround, 3.0);
  }
  if (dChannel < dSculpture && conv > 0.45) {
    return vec2(dChannel, 2.0);
  }
  return vec2(dSculpture, 1.0);
}

vec3 calcNormal(vec3 p) {
  const float h = 0.001;
  const vec2 k = vec2(1, -1);
  return normalize(k.xyy * map(p + k.xyy * h).x +
                   k.yyx * map(p + k.yyx * h).x +
                   k.yxy * map(p + k.yxy * h).x +
                   k.xxx * map(p + k.xxx * h).x);
}

float calcAO(vec3 pos, vec3 nor) {
  float occ = 0.0;
  float sca = 1.0;
  for (int i = 0; i < 5; i++) {
    float h = 0.01 + 0.16 * float(i) / 4.0;
    float d = map(pos + h * nor).x;
    occ += (h - d) * sca;
    sca *= 0.85;
  }
  return clamp(1.0 - 2.5 * occ, 0.0, 1.0);
}

float calcSoftShadow(vec3 ro, vec3 rd, float mint, float maxt, float k) {
  float res = 1.0;
  float t = mint;
  for (int i = 0; i < 28; i++) {
    float h = map(ro + rd * t).x;
    if (h < 0.001) return 0.0;
    res = min(res, k * h / t);
    t += clamp(h, 0.03, 0.25);
    if (t > maxt) break;
  }
  return clamp(res, 0.0, 1.0);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
  float t = u_progress;

  // Purposeful camera choreography
  float aspect = u_resolution.x / u_resolution.y;
  float mobileFactor = clamp((0.9 - aspect) / 0.5, 0.0, 1.0);
  float camDist = mix(4.8, 6.4, mobileFactor);

  float camYaw = 0.5 + t * 2.2;
  float camPitch = 0.4;

  if (t < 0.18) {
    // Discover: high-angle spatial overview
    camDist *= mix(1.10, 1.0, t / 0.18);
    camPitch = mix(0.65, 0.42, t / 0.18);
  } else if (t >= 0.74 && t < 0.82) {
    // Approach - Systems thinking: sweeping grand orbit
    camDist *= 1.08;
    camPitch = 0.38;
  } else if (t >= 0.82 && t < 0.90) {
    // Approach - AI where it earns place: push close to core
    camDist *= mix(1.08, 0.80, (t - 0.82) / 0.08);
    camPitch = 0.28;
  } else if (t >= 0.90 && t < 0.96) {
    // Approach - Design + engineering: macro grazing edge
    camDist *= mix(0.80, 0.72, (t - 0.90) / 0.06);
    camPitch = 0.18;
  } else if (t >= 0.96) {
    // Approach - Built to keep running: balanced, iconic, centered monument
    camDist *= mix(0.72, 1.02, (t - 0.96) / 0.04);
    camPitch = 0.36;
    camYaw = 0.5 + 0.96 * 2.2;
  }

  vec3 ro = vec3(sin(camYaw) * cos(camPitch), sin(camPitch), cos(camYaw) * cos(camPitch)) * camDist;
  vec3 ta = vec3(0.0, -0.05, 0.0);

  vec3 ww = normalize(ta - ro);
  vec3 uu = normalize(cross(ww, vec3(0.0, 1.0, 0.0)));
  vec3 vv = normalize(cross(uu, ww));
  vec3 rd = normalize(uv.x * uu + uv.y * vv + 1.68 * ww);

  // Background interpolation: Paper (#f5f4ef) to Dark Obsidian (#09090b)
  vec3 bgPaper = vec3(0.961, 0.957, 0.937);
  vec3 bgDark  = vec3(0.035, 0.035, 0.043);
  vec3 bg = mix(bgPaper, bgDark, u_theme);

  float vig = 1.0 - 0.26 * dot(uv, uv);
  vec3 col = bg * vig;

  vec3 lightDir = normalize(vec3(0.75, 1.35, 0.85));

  float dO = 0.0;
  float matId = 0.0;
  for (int i = 0; i < 75; i++) {
    vec3 p = ro + rd * dO;
    vec2 res = map(p);
    float dS = res.x;
    matId = res.y;
    if (dS < 0.001) break;
    dO += dS;
    if (dO > 18.0) { dO = 18.0; break; }
  }

  if (dO < 18.0) {
    vec3 p = ro + rd * dO;
    vec3 n = calcNormal(p);
    float ao = calcAO(p, n);
    float shadow = calcSoftShadow(p, lightDir, 0.03, 3.5, 16.0);

    if (matId > 2.5) {
      // Ground plane contact shadow
      vec3 gPaper = vec3(0.94, 0.935, 0.915);
      vec3 gDark  = vec3(0.032, 0.032, 0.038);
      vec3 gCol = mix(gPaper, gDark, u_theme);
      col = mix(gCol * 0.62, gCol, shadow * ao);
      col = mix(col, bg, smoothstep(2.5, 7.0, length(p.xz)));
    }
    else if (matId > 1.5) {
      // Luminous Inset Channel: Arché electric lime
      vec3 lime = vec3(0.85, 1.0, 0.25);
      float coreGlow = smoothstep(0.48, 0.65, t) * u_theme;
      vec3 glowCol = mix(vec3(0.12), lime * 2.8, coreGlow);
      col = glowCol * ao;
    }
    else {
      // Sculptural Titanium Ribbon
      vec3 matPaper = vec3(0.135, 0.135, 0.155);
      vec3 matDark  = vec3(0.055, 0.055, 0.065);
      vec3 baseColor = mix(matPaper, matDark, u_theme);

      float diff = max(dot(n, lightDir), 0.0);
      vec3 ambient = mix(vec3(0.44, 0.43, 0.41), vec3(0.06, 0.06, 0.075), u_theme);

      // Sharp specular highlight along chamfers
      vec3 halfDir = normalize(lightDir - rd);
      float spec = pow(max(dot(n, halfDir), 0.0), 44.0);

      // Crisp rim lighting
      float fresnel = pow(1.0 - max(dot(-rd, n), 0.0), 3.2);
      vec3 rimCol = mix(vec3(0.88, 0.88, 0.92), vec3(0.85, 1.0, 0.4), u_theme);

      col = baseColor * (diff * shadow + ambient * ao);
      col += spec * 0.65 * shadow;
      col += fresnel * 0.42 * rimCol;

      // Subtle lime reflection in dark mode
      float limeSpot = smoothstep(0.5, 0.65, t) * u_theme * 0.15;
      col += limeSpot * vec3(0.8, 1.0, 0.3) * max(dot(n, vec3(0.0, 1.0, 0.0)), 0.0);

      col *= ao;
    }

    float fogStart = camDist + 3.0;
    float fogEnd   = camDist + 11.0;
    col = mix(col, bg, smoothstep(fogStart, fogEnd, dO));
  }

  gl_FragColor = vec4(col, 1.0);
}
`;

/**
 * HowWeWork — Bold, Full-Width, Scroll-Driven 3D Experience.
 *
 * One continuous, carefully art-directed 3D world:
 * - Discover -> Design -> Build -> Connect -> Launch -> Evolve -> Approach
 * - Seamless hardware-accelerated WebGL procedural sculptural architecture.
 * - Paper through Connect, dark during Launch, dark through Evolve & Approach,
 *   returning to paper at .hww-exit.
 * - Preserves #process and #approach anchors, ProgressRail integration,
 *   reduced-motion, and mobile pinned-scene behavior.
 */
export function HowWeWork() {
  const root = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ink, setInk] = useState(false);
  const p = siteContent.process;

  useLayoutEffect(() => {
    const el = root.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) return;

    const reduced = prefersReducedMotion();

    // Probe color tokens from stylesheet
    const probe = document.createElement("div");
    probe.className = "on-ink";
    probe.hidden = true;
    el.appendChild(probe);
    const keys = ["--bg", "--bg-2", "--fg", "--muted", "--faint", "--line", "--card", "--accent-deep", "--accent-ink"];
    const palette = (node: Element) => Object.fromEntries(keys.map(k => [k, getComputedStyle(node).getPropertyValue(k).trim()]));
    const light = palette(document.documentElement);
    const dark = palette(probe);
    probe.remove();

    // WebGL Setup
    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: true,
      powerPreference: "high-performance",
    });

    if (!gl) return;

    function compile(src: string, type: number) {
      const s = gl!.createShader(type);
      if (!s) return null;
      gl!.shaderSource(s, src);
      gl!.compileShader(s);
      if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) {
        console.error("Shader compile error:", gl!.getShaderInfoLog(s));
        gl!.deleteShader(s);
        return null;
      }
      return s;
    }

    const vs = compile(VS_SOURCE, gl.VERTEX_SHADER);
    const fs = compile(FS_SOURCE, gl.FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(prog));
      return;
    }

    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(prog, "position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "u_resolution");
    const uProg = gl.getUniformLocation(prog, "u_progress");
    const uTheme = gl.getUniformLocation(prog, "u_theme");
    const uTime = gl.getUniformLocation(prog, "u_time");

    let currentProgress = reduced ? 0.96 : 0.0;
    let currentTheme = reduced ? 1.0 : 0.0;
    let animId = 0;
    let startTime = performance.now();
    let isVisible = false;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    window.addEventListener("resize", resize);
    resize();

    const render = () => {
      const elapsed = (performance.now() - startTime) * 0.001;
      gl.useProgram(prog);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uProg, currentProgress);
      gl.uniform1f(uTheme, currentTheme);
      gl.uniform1f(uTime, elapsed);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    const loop = () => {
      if (isVisible) {
        render();
      }
      animId = requestAnimationFrame(loop);
    };

    if (reduced) {
      setInk(true);
      gsap.set(el, dark);
      render();
    } else {
      animId = requestAnimationFrame(loop);
    }

    // ScrollTrigger to scrub progress 0 -> 1 and control theme transitions
    const st = ScrollTrigger.create({
      id: "how-we-work-scroll",
      trigger: el,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.1,
      onToggle: (self) => {
        isVisible = self.isActive;
        el.dataset.running = String(self.isActive);
      },
      onUpdate: (self) => {
        if (reduced) return;
        const p = self.progress; // 0.0 to 1.0
        currentProgress = p;

        // Theme Transition:
        // Paper through Connect (0.0 to 0.52)
        // Transition to dark during Launch (0.52 to 0.58)
        // Dark through Evolve & Approach (0.58 to 0.95)
        // Return to paper at exit (0.95 to 1.00)
        let targetTheme = 0.0;
        if (p >= 0.52 && p < 0.95) {
          targetTheme = gsap.utils.clamp(0, 1, (p - 0.52) / 0.06);
        } else if (p >= 0.95) {
          targetTheme = gsap.utils.clamp(0, 1, (1.0 - p) / 0.05);
        }

        currentTheme = targetTheme;
        const shouldBeInk = p >= 0.54 && p < 0.97;
        setInk(shouldBeInk);

        if (targetTheme >= 0.99) {
          gsap.set(el, dark);
        } else if (targetTheme <= 0.01) {
          gsap.set(el, light);
        } else {
          // Smoothly interpolate CSS variables between light and dark
          const mixed: Record<string, string> = {};
          keys.forEach(k => {
            // Let GSAP interpolate colors
            mixed[k] = gsap.utils.interpolate(light[k], dark[k], targetTheme);
          });
          gsap.set(el, mixed);
        }
      },
    });

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animId);
      st.kill();
      if (gl) {
        gl.deleteBuffer(buf);
        gl.deleteProgram(prog);
        gl.deleteShader(vs);
        gl.deleteShader(fs);
      }
    };
  }, []);

  return (
    <section ref={root} className={`hww ${ink ? "on-ink" : ""}`} aria-label={p.label}>
      {/* Screen Reader Semantic Accessibility Content: No visual text panel on screen */}
      <div className="sr-only">
        <section aria-labelledby="sr-process-heading">
          <h2 id="sr-process-heading">{p.label}: {p.statement}</h2>
          <ol>
            {p.steps.map((step) => (
              <li key={step.n}>
                <h3>{step.n} {step.k}</h3>
                <p>{step.v}</p>
              </li>
            ))}
          </ol>
        </section>
        <section aria-labelledby="sr-approach-heading">
          <h2 id="sr-approach-heading">Approach: Good systems don't add more work. They remove it.</h2>
          <ol>
            {principles.map((item, i) => (
              <li key={item.k}>
                <h3>0{i + 1} {item.k}</h3>
                <p>{item.v}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {/* Full-Bleed Sticky 3D Viewport */}
      <div className="hww-sticky-viewport">
        <canvas ref={canvasRef} className="hww-canvas" aria-hidden="true" />
      </div>

      {/* Scroll Track & Chapter Triggers for ProgressRail & Anchors */}
      <div className="hww-scroll-track">
        <div id="process" data-chapter="Process" className="hww-trigger-zone hww-trigger-process" />
        <div id="approach" data-chapter="Approach" className="hww-trigger-zone hww-trigger-approach" />
      </div>

      <div className="hww-exit" aria-hidden="true" />
    </section>
  );
}
