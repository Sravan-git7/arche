import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { gsap } from "../lib/gsap";
import { isIntroActive } from "./Intro";

export interface HeroEnvironmentProps {
  hoveredService?: number | null;
}

/**
 * ARCHÉ 4-PLATE KINETIC MONOLITH STACK (Three.js)
 *
 * Precision-Machined 3D Architectural Centerpiece:
 * - Studio PBR Lighting: RoomEnvironment + PMREMGenerator, ACESFilmicToneMapping,
 *   transparent WebGL canvas on #F4F4EE with grounded soft radial contact shadow.
 * - Central Optical Spine: Sleek vertical brushed-charcoal cylinder with continuous glowing
 *   #9EE41A emissive optical rod + 2 traveling energy pulses at 60fps.
 * - 4 Interlocking Architectural Plates (y = +1.05, +0.35, -0.35, -1.05):
 *   Chamfered slabs (RoundedBoxGeometry) stacked at sleek isometric angle (-0.58 rad Y, 0.36 rad X).
 *   - Plate 01 (Top — Video Editing): Matte brushed obsidian (#141413) with recessed #9EE41A side light-slot.
 *   - Plate 02 (Web Development): Satin warm ceramic (#EAE7DF) with thin dark anodized inlay rim.
 *   - Plate 03 (AI Chatbots): Matte charcoal (#1A1A18) with pulsing #9EE41A perimeter indicator dot.
 *   - Plate 04 (Bottom — AI Automation): Satin ceramic (#DFDCD2) with 4 recessed micro-grooves along bevel.
 * - Mechanical Choreography:
 *   - Unpack on load (0.0s -> 1.35s, power4.out): compressed monolith levitates apart along spine with opposing twist.
 *   - Living motion: phase-offset zero-gravity breathing, damped cursor orbit (±10deg lerp 0.06), dynamic specular keylight.
 *   - Inspection: Hovering 01–04 bar physically slides THAT exact plate forward (+0.55 along local axis) and brightens rim.
 *   - Scroll-out: Smooth decoupling drift off-axis into The Proposition.
 * - 0% GPU suspension via IntersectionObserver when off-screen.
 */
export function HeroEnvironment({ hoveredService = null }: HeroEnvironmentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hoveredRef = useRef<number | null>(hoveredService);
  hoveredRef.current = hoveredService;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || 540;
    let height = container.clientHeight || 540;
    const isMobile = window.innerWidth < 768;

    // -------------------------------------------------------------
    // 1. Scene, Camera, Renderer
    // -------------------------------------------------------------
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 50);
    camera.position.set(0, 0, 8.2);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setClearColor(0x000000, 0);

    const canvas = renderer.domElement;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    canvas.style.pointerEvents = "none";
    container.appendChild(canvas);

    // -------------------------------------------------------------
    // 2. Studio IBL Environment & Precision Lighting
    // -------------------------------------------------------------
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const roomEnv = new RoomEnvironment();
    scene.environment = pmremGenerator.fromScene(roomEnv, 0.04).texture;

    // Key studio light (warm top-left, slides subtly with pointer)
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.45);
    keyLight.position.set(-5, 6, 6);
    scene.add(keyLight);

    // Fill light (warm ivory reflection)
    const fillLight = new THREE.DirectionalLight(0xfaf9f5, 0.85);
    fillLight.position.set(5, -3, 4);
    scene.add(fillLight);

    // Subtle surgical lime rim light
    const rimLight = new THREE.DirectionalLight(0x9ee41a, 0.95);
    rimLight.position.set(4, 5, -5);
    scene.add(rimLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambientLight);

    // -------------------------------------------------------------
    // 3. Ground Contact Shadow Plane
    // -------------------------------------------------------------
    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sCtx = shadowCanvas.getContext("2d")!;
    const grad = sCtx.createRadialGradient(128, 128, 10, 128, 128, 120);
    grad.addColorStop(0, "rgba(20, 20, 19, 0.22)");
    grad.addColorStop(0.35, "rgba(20, 20, 19, 0.12)");
    grad.addColorStop(0.75, "rgba(20, 20, 19, 0.03)");
    grad.addColorStop(1, "rgba(20, 20, 19, 0)");
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 256, 256);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(5.4, 5.4),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.8, depthWrite: false })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.set(0, -2.45, 0);
    scene.add(shadowPlane);

    // -------------------------------------------------------------
    // 4. Main Stack Group & Materials
    // -------------------------------------------------------------
    const stackGroup = new THREE.Group();
    stackGroup.position.set(0, 0, 0);
    stackGroup.rotation.set(0.36, -0.58, 0);
    scene.add(stackGroup);

    // Central Optical Spine
    const spineMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#141413"),
      roughness: 0.26,
      metalness: 0.75,
    });
    const spineCylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 3.4, isMobile ? 24 : 36),
      spineMat
    );
    stackGroup.add(spineCylinder);

    // Continuous glowing #9EE41A optical core rod
    const coreRodMat = new THREE.MeshBasicMaterial({ color: new THREE.Color("#9EE41A") });
    const coreRod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 3.42, 16),
      coreRodMat
    );
    stackGroup.add(coreRod);

    // 2 Traveling glowing energy pulses
    const pulseMat1 = new THREE.MeshBasicMaterial({ color: new THREE.Color("#9EE41A") });
    const pulseMesh1 = new THREE.Mesh(
      new THREE.TorusGeometry(0.155, 0.022, 12, 32),
      pulseMat1
    );
    pulseMesh1.rotation.x = Math.PI / 2;
    stackGroup.add(pulseMesh1);

    const pulseMat2 = new THREE.MeshBasicMaterial({ color: new THREE.Color("#9EE41A") });
    const pulseMesh2 = new THREE.Mesh(
      new THREE.TorusGeometry(0.155, 0.022, 12, 32),
      pulseMat2
    );
    pulseMesh2.rotation.x = Math.PI / 2;
    stackGroup.add(pulseMesh2);

    // Dynamic point light following pulse 1
    const pulseLight = new THREE.PointLight(0x9ee41a, 1.2, 2.5);
    stackGroup.add(pulseLight);

    // -------------------------------------------------------------
    // 5. Four Architectural Plates
    // -------------------------------------------------------------
    const restingY = [1.05, 0.35, -0.35, -1.05];
    const initialCompressedY = [0.51, 0.17, -0.17, -0.51];
    const restingTwist = [-0.09, 0.07, -0.06, 0.08]; // alternating opposing twist angles

    const plateGeom = new RoundedBoxGeometry(
      2.5,
      0.34,
      2.5,
      isMobile ? 3 : 5,
      0.08
    );

    // Materials
    const obsidianMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#141413"),
      roughness: 0.24,
      metalness: 0.72,
    });

    const ceramicMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#EAE7DF"),
      roughness: 0.32,
      metalness: 0.08,
      clearcoat: 0.25,
      clearcoatRoughness: 0.2,
    });

    const charcoalMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#1A1A18"),
      roughness: 0.26,
      metalness: 0.68,
    });

    const ceramicLightMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#DFDCD2"),
      roughness: 0.34,
      clearcoat: 0.2,
    });

    const limeAccentMat = new THREE.MeshBasicMaterial({ color: new THREE.Color("#9EE41A") });

    // Build the 4 plates
    const platePivots: THREE.Group[] = [];
    const plateMeshes: THREE.Mesh[] = [];
    const currentSlide = [0, 0, 0, 0];
    const targetSlide = [0, 0, 0, 0];
    const animState = {
      progress: 0, // 0 = compressed, 1 = unpacked
    };

    // --- Plate 01: Top (Video Editing, Obsidian) ---
    const p0Pivot = new THREE.Group();
    p0Pivot.position.y = initialCompressedY[0];
    stackGroup.add(p0Pivot);
    platePivots.push(p0Pivot);

    const p0Mesh = new THREE.Mesh(plateGeom, obsidianMat);
    p0Pivot.add(p0Mesh);
    plateMeshes.push(p0Mesh);

    // Recessed #9EE41A side light-slot
    const p0Slot = new THREE.Mesh(
      new THREE.BoxGeometry(2.32, 0.028, 0.032),
      limeAccentMat
    );
    p0Slot.position.set(0, 0, 1.25);
    p0Mesh.add(p0Slot);

    // --- Plate 02: Web Development (Satin Ceramic) ---
    const p1Pivot = new THREE.Group();
    p1Pivot.position.y = initialCompressedY[1];
    stackGroup.add(p1Pivot);
    platePivots.push(p1Pivot);

    const p1Mesh = new THREE.Mesh(plateGeom, ceramicMat);
    p1Pivot.add(p1Mesh);
    plateMeshes.push(p1Mesh);

    // Thin dark anodized inlay rim
    const p1Rim = new THREE.Mesh(
      new THREE.BoxGeometry(2.44, 0.018, 2.44),
      obsidianMat
    );
    p1Rim.position.set(0, 0.174, 0);
    p1Mesh.add(p1Rim);

    // --- Plate 03: AI Chatbots (Matte Charcoal) ---
    const p2Pivot = new THREE.Group();
    p2Pivot.position.y = initialCompressedY[2];
    stackGroup.add(p2Pivot);
    platePivots.push(p2Pivot);

    const p2Mesh = new THREE.Mesh(plateGeom, charcoalMat);
    p2Pivot.add(p2Mesh);
    plateMeshes.push(p2Mesh);

    // Pulsing #9EE41A perimeter indicator dot
    const p2Dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 16, 16),
      limeAccentMat
    );
    p2Dot.position.set(1.15, 0.18, 1.15);
    p2Mesh.add(p2Dot);

    // --- Plate 04: Bottom (AI Automation, Ceramic Light) ---
    const p3Pivot = new THREE.Group();
    p3Pivot.position.y = initialCompressedY[3];
    stackGroup.add(p3Pivot);
    platePivots.push(p3Pivot);

    const p3Mesh = new THREE.Mesh(plateGeom, ceramicLightMat);
    p3Pivot.add(p3Mesh);
    plateMeshes.push(p3Mesh);

    // 4 recessed micro-grooves along front bevel
    const grooveGeom = new THREE.BoxGeometry(0.024, 0.16, 0.02);
    const grooveOffsets = [-0.48, -0.16, 0.16, 0.48];
    grooveOffsets.forEach((gx) => {
      const groove = new THREE.Mesh(grooveGeom, obsidianMat);
      groove.position.set(gx, 0, 1.252);
      p3Mesh.add(groove);
    });

    // -------------------------------------------------------------
    // 6. GSAP Unpack Entrance & Scroll-Out Timeline
    // -------------------------------------------------------------
    const ctx = gsap.context(() => {
      // Unpack Animation (0.0s -> 1.35s, power4.out)
      gsap.to(animState, {
        progress: 1,
        duration: 1.35,
        ease: "power4.out",
        delay: isIntroActive() ? 0.25 : 0,
      });

      // Scale entrance of whole stack
      gsap.fromTo(
        stackGroup.scale,
        { x: 0.82, y: 0.82, z: 0.82 },
        {
          x: 1,
          y: 1,
          z: 1,
          duration: 1.2,
          ease: "power3.out",
          delay: isIntroActive() ? 0.2 : 0,
        }
      );

      // Scroll-out handoff into The Proposition
      const heroSection = document.getElementById("hero");
      if (heroSection) {
        gsap.to(stackGroup.position, {
          y: 1.2,
          z: -1.2,
          ease: "none",
          scrollTrigger: {
            trigger: heroSection,
            start: "top top",
            end: "bottom top",
            scrub: 0.85,
            invalidateOnRefresh: true,
          },
        });

        // Drift decouple plates off-axis as user scrolls
        platePivots.forEach((pivot, i) => {
          gsap.to(pivot.position, {
            y: restingY[i] * 1.45,
            ease: "none",
            scrollTrigger: {
              trigger: heroSection,
              start: "top top",
              end: "bottom top",
              scrub: 0.85,
              invalidateOnRefresh: true,
            },
          });
        });
      }
    });

    // -------------------------------------------------------------
    // 7. Interactive Pointer Parallax
    // -------------------------------------------------------------
    let targetPointerX = 0;
    let targetPointerY = 0;
    let currentPointerX = 0;
    let currentPointerY = 0;

    const onPointerMove = (e: PointerEvent) => {
      targetPointerX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetPointerY = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    // -------------------------------------------------------------
    // 8. Render Loop with IntersectionObserver (0% GPU Off-Screen)
    // -------------------------------------------------------------
    let animationFrameId = 0;
    let isVisible = true;
    const clock = new THREE.Clock();

    const render = () => {
      if (!isVisible) return;

      const elapsed = clock.getElapsedTime();

      // Traveling glowing energy pulses along spine
      const pulseY1 = Math.sin(elapsed * 2.2) * 1.5;
      const pulseY2 = -Math.sin(elapsed * 1.8 + 0.8) * 1.5;
      pulseMesh1.position.y = pulseY1;
      pulseMesh2.position.y = pulseY2;
      pulseLight.position.y = pulseY1;

      // Indicator dot pulse on Plate 03
      const dotScale = 1 + Math.sin(elapsed * 3.5) * 0.25;
      p2Dot.scale.set(dotScale, dotScale, dotScale);

      // Interpolate pointer parallax (lerp 0.06)
      currentPointerX += (targetPointerX - currentPointerX) * 0.06;
      currentPointerY += (targetPointerY - currentPointerY) * 0.06;

      // Base isometric angle + damped pointer tilt (±10deg Y, ±8deg X)
      stackGroup.rotation.y = -0.58 + currentPointerX * 0.17;
      stackGroup.rotation.x = 0.36 - currentPointerY * 0.14;

      // Keylight shifts slightly with pointer so specular highlights glide across chamfers
      keyLight.position.set(-5 + currentPointerX * 1.5, 6 - currentPointerY * 1.5, 6);

      // Unpack interpolation & zero-gravity breathing
      const prg = animState.progress;
      for (let i = 0; i < 4; i++) {
        // Base unpack Y
        const targetY = THREE.MathUtils.lerp(initialCompressedY[i], restingY[i], prg);
        // Phase-offset zero-gravity breathing (sin(t + i * 0.9) * 0.035)
        const breathe = Math.sin(elapsed * 1.4 + i * 0.9) * 0.035 * prg;
        platePivots[i].position.y = targetY + breathe;

        // Base twist angle + subtle micro-yaw breathing
        const targetTwist = restingTwist[i] * prg;
        const yawBreathe = Math.cos(elapsed * 1.2 + i * 0.8) * 0.015 * prg;
        platePivots[i].rotation.y = targetTwist + yawBreathe;

        // Interactive Plate Inspection (Slide forward +0.55 on hover)
        const isHovered = hoveredRef.current === i;
        targetSlide[i] = isHovered ? 0.55 : 0;
        currentSlide[i] += (targetSlide[i] - currentSlide[i]) * 0.12;
        plateMeshes[i].position.z = currentSlide[i];
      }

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(render);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        isVisible = entry.isIntersecting;
        if (isVisible) {
          clock.start();
          animationFrameId = requestAnimationFrame(render);
        } else {
          cancelAnimationFrame(animationFrameId);
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    const onResize = () => {
      if (!container) return;
      width = container.clientWidth || 540;
      height = container.clientHeight || 540;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 768 ? 1.5 : 2));
    };
    window.addEventListener("resize", onResize);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", onResize);
      ctx.revert();

      plateGeom.dispose();
      obsidianMat.dispose();
      ceramicMat.dispose();
      charcoalMat.dispose();
      ceramicLightMat.dispose();
      limeAccentMat.dispose();
      spineMat.dispose();
      coreRodMat.dispose();
      pulseMat1.dispose();
      pulseMat2.dispose();
      shadowTex.dispose();
      pmremGenerator.dispose();
      renderer.dispose();

      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative flex items-center justify-center pointer-events-none select-none z-10"
      aria-hidden="true"
    />
  );
}
