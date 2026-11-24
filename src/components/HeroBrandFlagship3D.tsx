import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { gsap } from "../lib/gsap";
import { prefersReducedMotion } from "../lib/gsap";

export interface HeroBrandFlagship3DProps {
  scrollProgress?: number;
}

/**
 * ARCHÉ 3D BRAND FLAGSHIP — THE "AC" KINETIC SCULPTURE
 *
 * An original, interactive 3D centerpiece sculpted around Arché's iconic AC monogram:
 * - Studio PBR Lighting: RoomEnvironment + PMREMGenerator, ACESFilmicToneMapping,
 *   transparent WebGL canvas on #F4F4EE with soft grounded radial contact shadow.
 * - Sculpted Continuous AC Ribbon Geometry:
 *     - "A" Letterform + Sweep: Brushed obsidian (#141413, roughness: 0.20, metalness: 0.78, clearcoat: 0.5)
 *     - "C" Arc: Satin warm ceramic (#EAE7DF, roughness: 0.28, metalness: 0.12, clearcoat: 0.35)
 *     - Inner Inlay Seam: Razor-thin glowing surgical lime (#9EE41A, emissiveIntensity: 2.5) along C inner curve
 *     - Floating Magnetic Core Sphere: SphereGeometry(0.32, 48, 48) suspended inside C cavity with local PointLight(0x9EE41A, 3.0)
 *       casting live lime specular reflections onto the obsidian curves!
 * - Tangible Interactive Physics:
 *     - Click & Drag to spin with angular momentum and fling inertia (damping: 0.94)
 *     - Damped mouse orbit (±12deg lerp)
 *     - Magnetic attraction: cursor pulls floating #9EE41A core sphere inside C cavity with spring physics
 *     - Page-Load Assembly: rotates smoothly in from side profile (-1.1 -> 0.18 rad) as core snaps into center
 *     - Scroll Handoff: sculpture zooms/rotates past camera (scale 1 -> 1.45, opacity -> 0) while core sphere
 *       detaches downward along x = 0 straight toward The Proposition!
 * - 0% GPU suspension via IntersectionObserver when off-screen.
 */
export function HeroBrandFlagship3D({ scrollProgress = 0 }: HeroBrandFlagship3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<number>(scrollProgress);
  scrollRef.current = scrollProgress;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;
    const isMobile = window.innerWidth < 768;
    const reducedMotion = prefersReducedMotion();

    // -------------------------------------------------------------
    // 1. Scene, Camera, Renderer
    // -------------------------------------------------------------
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 40);
    camera.position.set(0, 0, 8.4);

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
    canvas.style.touchAction = "none";
    canvas.style.cursor = "grab";
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
    grad.addColorStop(0.35, "rgba(20, 20, 19, 0.11)");
    grad.addColorStop(0.75, "rgba(20, 20, 19, 0.02)");
    grad.addColorStop(1, "rgba(20, 20, 19, 0)");
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 256, 256);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(6.6, 6.6),
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
      })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.set(0, -2.15, 0);
    scene.add(shadowPlane);

    // -------------------------------------------------------------
    // 4. Master Sculpture Group & Geometries
    // -------------------------------------------------------------
    const sculptureGroup = new THREE.Group();
    scene.add(sculptureGroup);

    // Sculpture scale calibration: slightly smaller on mobile to fit comfortably inside 100vh
    const baseScale = isMobile ? 0.82 : 1.0;
    sculptureGroup.scale.set(baseScale, baseScale, baseScale);

    // Tube radius and segment definitions
    const tubeRadius = 0.125;
    const tubularSegs = isMobile ? 90 : 220;
    const radialSegs = isMobile ? 24 : 48;

    // -------------------------------------------------------------
    // 4A. Curve A: The "A" Letterform + Interlocking Crossbar + Bridge
    // -------------------------------------------------------------
    const pointsA = [
      new THREE.Vector3(-1.85, -1.15, -0.05), // Base of left leg
      new THREE.Vector3(-1.50, -0.40, 0.08),  // Ascending left leg
      new THREE.Vector3(-1.20, 0.55, 0.18),   // Upper left stem
      new THREE.Vector3(-0.98, 1.25, 0.22),   // Left apex shoulder
      new THREE.Vector3(-0.80, 1.25, 0.22),   // Right apex shoulder
      new THREE.Vector3(-0.58, 0.55, 0.12),   // Descending right stem
      new THREE.Vector3(-0.35, -0.35, 0.02),  // Descending right leg
      new THREE.Vector3(-0.22, -1.15, -0.08), // Base of right leg
      new THREE.Vector3(-0.32, -1.18, 0.05),  // Lower turnaround curve
      new THREE.Vector3(-0.48, -0.55, 0.20),  // Climbing back towards crossbar
      new THREE.Vector3(-0.82, -0.15, 0.26),  // Horizontal crossbar center
      new THREE.Vector3(-1.24, -0.15, 0.25),  // Crossbar left knot
      new THREE.Vector3(-1.08, -0.12, 0.20),  // Crossbar return
      new THREE.Vector3(-0.48, -0.04, 0.14),  // Exiting crossbar to center
      new THREE.Vector3(0.08, 0.12, 0.08),    // Center transition point
    ];
    const curveA = new THREE.CatmullRomCurve3(pointsA);

    // Brushed Anodized Obsidian Material (#141413)
    const matA = new THREE.MeshPhysicalMaterial({
      color: 0x141413,
      roughness: 0.20,
      metalness: 0.78,
      clearcoat: 0.5,
      clearcoatRoughness: 0.15,
    });

    const geomA = new THREE.TubeGeometry(curveA, tubularSegs, tubeRadius, radialSegs, false);
    const meshA = new THREE.Mesh(geomA, matA);
    sculptureGroup.add(meshA);

    // -------------------------------------------------------------
    // 4B. Curve C: The "C" Arc Sweeping Around the Floating Core
    // -------------------------------------------------------------
    const pointsC = [
      new THREE.Vector3(0.08, 0.12, 0.08),    // Seamless junction from A sweep
      new THREE.Vector3(0.38, 0.65, 0.06),    // Upper transition shoulder
      new THREE.Vector3(0.82, 1.12, 0.02),    // Top crest of C
      new THREE.Vector3(1.42, 1.18, -0.06),   // Top curvature of C
      new THREE.Vector3(1.92, 0.85, -0.12),   // Upper right lip
      new THREE.Vector3(2.14, 0.22, -0.08),   // Outer right curvature
      new THREE.Vector3(2.08, -0.38, 0.02),   // Lower outer curvature
      new THREE.Vector3(1.82, -0.88, 0.08),   // Lower right lip
      new THREE.Vector3(1.32, -1.16, 0.14),   // Bottom trough of C
      new THREE.Vector3(0.72, -1.04, 0.16),   // Bottom left curvature
      new THREE.Vector3(0.32, -0.62, 0.12),   // Terminating lower tip of C
    ];
    const curveC = new THREE.CatmullRomCurve3(pointsC);

    // Satin Warm Ceramic Material (#EAE7DF)
    const matC = new THREE.MeshPhysicalMaterial({
      color: 0xeae7df,
      roughness: 0.28,
      metalness: 0.12,
      clearcoat: 0.35,
      clearcoatRoughness: 0.20,
    });

    const geomC = new THREE.TubeGeometry(curveC, Math.round(tubularSegs * 0.75), tubeRadius, radialSegs, false);
    const meshC = new THREE.Mesh(geomC, matC);
    sculptureGroup.add(meshC);

    // -------------------------------------------------------------
    // 4C. Inner Inlay Seam on "C" (Razor-Thin Glowing #9EE41A Conduit)
    // -------------------------------------------------------------
    const cCenter = new THREE.Vector3(1.15, 0.05, 0.0);
    const inlayPoints = pointsC.slice(1, pointsC.length - 1).map((pt) => {
      const dir = pt.clone().sub(cCenter);
      return cCenter.clone().add(dir.multiplyScalar(0.86)).add(new THREE.Vector3(0, 0, 0.02));
    });
    const curveCInlay = new THREE.CatmullRomCurve3(inlayPoints);

    const matInlay = new THREE.MeshStandardMaterial({
      color: 0x9ee41a,
      emissive: 0x9ee41a,
      emissiveIntensity: 2.5,
      roughness: 0.1,
      metalness: 0.2,
    });
    const geomInlay = new THREE.TubeGeometry(
      curveCInlay,
      Math.round(tubularSegs * 0.5),
      tubeRadius * 0.18,
      16,
      false
    );
    const meshInlay = new THREE.Mesh(geomInlay, matInlay);
    sculptureGroup.add(meshInlay);

    // -------------------------------------------------------------
    // 4D. Polished Hemispherical End Caps
    // -------------------------------------------------------------
    const capGeom = new THREE.SphereGeometry(tubeRadius, 32, 32);
    const capStartA = new THREE.Mesh(capGeom, matA);
    capStartA.position.copy(pointsA[0]);
    sculptureGroup.add(capStartA);

    const capEndC = new THREE.Mesh(capGeom, matC);
    capEndC.position.copy(pointsC[pointsC.length - 1]);
    sculptureGroup.add(capEndC);

    // -------------------------------------------------------------
    // 4E. Floating Magnetic #9EE41A Core Sphere + Local Specular Light
    // -------------------------------------------------------------
    const coreRestPos = new THREE.Vector3(1.15, 0.05, 0.0);
    const coreSphereGeom = new THREE.SphereGeometry(0.32, 48, 48);
    const coreSphereMat = new THREE.MeshStandardMaterial({
      color: 0x9ee41a,
      emissive: 0x9ee41a,
      emissiveIntensity: 2.2,
      roughness: 0.15,
      metalness: 0.10,
    });
    const coreSphere = new THREE.Mesh(coreSphereGeom, coreSphereMat);
    coreSphere.position.copy(coreRestPos);
    sculptureGroup.add(coreSphere);

    // Subtle outer atmospheric glow halo
    const haloGeom = new THREE.SphereGeometry(0.39, 32, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x9ee41a,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    });
    const haloMesh = new THREE.Mesh(haloGeom, haloMat);
    coreSphere.add(haloMesh);

    // Local PointLight casting surgical lime specular reflections onto the AC curves!
    const coreLight = new THREE.PointLight(0x9ee41a, 3.0, 7);
    coreLight.position.set(0, 0, 0);
    coreSphere.add(coreLight);

    // -------------------------------------------------------------
    // 5. Interactive Physics State (Fling Inertia + Magnetic Spring)
    // -------------------------------------------------------------
    const restRotY = 0.18;
    const restRotX = 0.06;
    let targetRotY = restRotY;
    let targetRotX = restRotX;
    let rotYVel = 0;
    let rotXVel = 0;
    let isDragging = false;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let ndcX = 0;
    let ndcY = 0;

    // Dynamic Core Sphere Current & Target Positions
    const currentCorePos = coreRestPos.clone();
    const targetCorePos = coreRestPos.clone();

    // -------------------------------------------------------------
    // 6. Page-Load Entrance Animation (0.0s -> 1.4s, power4.out)
    // -------------------------------------------------------------
    if (!reducedMotion) {
      sculptureGroup.rotation.set(restRotX, -1.1, 0);
      sculptureGroup.scale.set(baseScale * 0.72, baseScale * 0.72, baseScale * 0.72);

      gsap.to(sculptureGroup.rotation, {
        y: restRotY,
        x: restRotX,
        duration: 1.4,
        ease: "power4.out",
      });

      gsap.to(sculptureGroup.scale, {
        x: baseScale,
        y: baseScale,
        z: baseScale,
        duration: 1.4,
        ease: "power4.out",
      });

      coreSphere.position.set(2.6, 1.4, 0.6);
      gsap.to(coreSphere.position, {
        x: coreRestPos.x,
        y: coreRestPos.y,
        z: coreRestPos.z,
        duration: 1.35,
        delay: 0.2,
        ease: "power3.out",
      });
    } else {
      sculptureGroup.rotation.set(restRotX, restRotY, 0);
      sculptureGroup.scale.set(baseScale, baseScale, baseScale);
      coreSphere.position.copy(coreRestPos);
    }

    // -------------------------------------------------------------
    // 7. Pointer Event Handlers (Drag to Spin + Fling Momentum)
    // -------------------------------------------------------------
    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
      rotYVel = 0;
      rotXVel = 0;
      canvas.style.cursor = "grabbing";
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      ndcX = (px / rect.width) * 2 - 1;
      ndcY = -(py / rect.height) * 2 + 1;

      if (isDragging) {
        const dx = e.clientX - lastPointerX;
        const dy = e.clientY - lastPointerY;
        lastPointerX = e.clientX;
        lastPointerY = e.clientY;

        const sensitivity = isMobile ? 0.007 : 0.005;
        rotYVel = dx * sensitivity;
        rotXVel = dy * sensitivity * 0.75;

        sculptureGroup.rotation.y += rotYVel;
        sculptureGroup.rotation.x += rotXVel;
      }
    };

    const onPointerUp = () => {
      isDragging = false;
      canvas.style.cursor = "grab";
    };

    const onPointerCancel = () => {
      isDragging = false;
      canvas.style.cursor = "grab";
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerCancel);

    // -------------------------------------------------------------
    // 8. Resize Handler
    // -------------------------------------------------------------
    const onResize = () => {
      if (!container) return;
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 768 ? 1.5 : 2));

      const updatedScale = window.innerWidth < 768 ? 0.82 : 1.0;
      sculptureGroup.scale.set(updatedScale, updatedScale, updatedScale);
    };
    window.addEventListener("resize", onResize);

    // -------------------------------------------------------------
    // 9. IntersectionObserver (0% GPU when off-screen)
    // -------------------------------------------------------------
    let isVisible = true;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
        });
      },
      { threshold: 0.02 }
    );
    observer.observe(container);

    // -------------------------------------------------------------
    // 10. Main Animation Loop (60fps Render Engine)
    // -------------------------------------------------------------
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (!isVisible) return;

      const time = clock.getElapsedTime();
      const currentScroll = scrollRef.current;

      // -------------------------------------------------------------
      // Physics A: Fling Inertia & Damped Spring Return
      // -------------------------------------------------------------
      if (!reducedMotion) {
        if (isDragging) {
          // While dragging, velocity decays gradually
          rotYVel *= 0.92;
          rotXVel *= 0.92;
        } else {
          // Angular momentum fling
          sculptureGroup.rotation.y += rotYVel;
          sculptureGroup.rotation.x += rotXVel;

          // Friction damping
          rotYVel *= 0.94;
          rotXVel *= 0.94;

          // When angular velocity has calmed down, smoothly orbit with mouse
          if (Math.abs(rotYVel) < 0.003 && Math.abs(rotXVel) < 0.003) {
            targetRotY = restRotY + ndcX * 0.21; // ±12 deg orbit
            targetRotX = restRotX - ndcY * 0.14; // ±8 deg pitch
            sculptureGroup.rotation.y += (targetRotY - sculptureGroup.rotation.y) * 0.05;
            sculptureGroup.rotation.x += (targetRotX - sculptureGroup.rotation.x) * 0.05;
          }
        }

        // Idle levitation breathing
        const idleY = Math.sin(time * 1.6) * 0.04;
        sculptureGroup.position.y = idleY;

        // -------------------------------------------------------------
        // Physics B: Magnetic Core Attraction
        // Pulls the #9EE41A core sphere towards cursor inside C cavity
        // -------------------------------------------------------------
        if (currentScroll < 0.05) {
          targetCorePos.x = coreRestPos.x + ndcX * 0.28;
          targetCorePos.y = coreRestPos.y + ndcY * 0.22 + Math.sin(time * 2.4) * 0.025;
          targetCorePos.z = coreRestPos.z - ndcX * 0.14;

          currentCorePos.lerp(targetCorePos, 0.08);
          coreSphere.position.copy(currentCorePos);
        }
      }

      // -------------------------------------------------------------
      // Scroll Handoff Transformation (Scrub-driven into The Proposition)
      // -------------------------------------------------------------
      if (currentScroll > 0) {
        // Zoom & rotate sculpture gracefully past the camera
        const scaleMult = 1.0 + currentScroll * 0.45;
        const currentBase = isMobile ? 0.82 : 1.0;
        sculptureGroup.scale.set(
          currentBase * scaleMult,
          currentBase * scaleMult,
          currentBase * scaleMult
        );
        sculptureGroup.rotation.y += currentScroll * 0.015;

        // Opacity fade of canvas
        const canvasOpacity = Math.max(0, 1.0 - Math.pow(currentScroll, 1.4));
        canvas.style.opacity = canvasOpacity.toFixed(3);
        shadowPlane.material.opacity = 0.85 * canvasOpacity;

        // Detach glowing #9EE41A core sphere straight downward along x = 0
        if (currentScroll > 0.08) {
          const t = Math.min(1.0, (currentScroll - 0.08) / 0.85);
          const detachX = THREE.MathUtils.lerp(coreRestPos.x, 0.0, Math.min(1.0, t * 1.5));
          const detachY = THREE.MathUtils.lerp(coreRestPos.y, -4.2, Math.pow(t, 1.3));
          const detachZ = THREE.MathUtils.lerp(coreRestPos.z, 0.1, t);
          coreSphere.position.set(detachX, detachY, detachZ);
        }
      } else {
        canvas.style.opacity = "1";
        shadowPlane.material.opacity = 0.85;
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    // -------------------------------------------------------------
    // Cleanup
    // -------------------------------------------------------------
    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
      window.removeEventListener("resize", onResize);

      pmremGenerator.dispose();
      renderer.dispose();
      geomA.dispose();
      matA.dispose();
      geomC.dispose();
      matC.dispose();
      geomInlay.dispose();
      matInlay.dispose();
      capGeom.dispose();
      coreSphereGeom.dispose();
      coreSphereMat.dispose();
      haloGeom.dispose();
      haloMat.dispose();
      shadowTex.dispose();

      if (container.contains(canvas)) {
        container.removeChild(canvas);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full pointer-events-auto select-none overflow-hidden"
      style={{ zIndex: 10 }}
      aria-label="Interactive 3D AC Ribbon Sculpture — Click and drag to inspect"
    />
  );
}
