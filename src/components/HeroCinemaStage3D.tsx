import { useEffect, useRef } from "react";
import * as THREE from "three";

interface HeroCinemaStage3DProps {
  progress: number; // 0.00 to 1.00 from Hero GSAP ScrollTrigger
  reducedMotion?: boolean;
}

export function HeroCinemaStage3D({ progress, reducedMotion }: HeroCinemaStage3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef<number>(progress);
  progressRef.current = progress;

  const isVisibleRef = useRef<boolean>(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // 1. WebGL Renderer
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
    scene.fog = new THREE.FogExp2(0xf4f4ee, 0.040);

    // 3. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.4, 9.5);
    camera.lookAt(0, 0, -10);

    // 4. Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xf4f4ee, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff8ee, 1.4);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    // -------------------------------------------------------------
    // ACT 0-1: ARCHITECTURAL RUNWAY (Perspective Floor Grid & Lime Spine)
    // -------------------------------------------------------------
    const runwayGroup = new THREE.Group();
    scene.add(runwayGroup);

    // Fine perspective floor grid (100 units long in -Z)
    const gridHelper = new THREE.GridHelper(60, 40, 0x141413, 0x141413);
    gridHelper.position.y = -1.25;
    const gridMat = gridHelper.material as THREE.LineBasicMaterial;
    gridMat.opacity = 0.085;
    gridMat.transparent = true;
    runwayGroup.add(gridHelper);

    // Center Glowing #9EE41A Guide Rail
    const railGeo = new THREE.BufferGeometry();
    const railPoints = [new THREE.Vector3(0, -1.24, 10), new THREE.Vector3(0, -1.24, -45)];
    railGeo.setFromPoints(railPoints);
    const railMat = new THREE.LineBasicMaterial({
      color: 0x9ee41a,
      linewidth: 2,
      transparent: true,
      opacity: 0.85,
    });
    const railLine = new THREE.Line(railGeo, railMat);
    runwayGroup.add(railLine);

    // -------------------------------------------------------------
    // ACT 2A: CINEMA BEAT (Floating Matte-Charcoal Cinema Frame Planes)
    // -------------------------------------------------------------
    const cinemaGroup = new THREE.Group();
    scene.add(cinemaGroup);

    const frameGeo = new THREE.BufferGeometry();
    // 2.39:1 cinemascope frame wireframe
    const fw = 4.2;
    const fh = fw / 2.39;
    const fpts = [
      new THREE.Vector3(-fw / 2, -fh / 2, 0),
      new THREE.Vector3(fw / 2, -fh / 2, 0),
      new THREE.Vector3(fw / 2, fh / 2, 0),
      new THREE.Vector3(-fw / 2, fh / 2, 0),
      new THREE.Vector3(-fw / 2, -fh / 2, 0),
    ];
    frameGeo.setFromPoints(fpts);
    const frameMat = new THREE.LineBasicMaterial({
      color: 0x141413,
      transparent: true,
      opacity: 0.35,
    });

    const cinemaFrames: THREE.Line[] = [];
    const frameOffsets = [
      { x: -3.6, y: 0.2, z: -2 },
      { x: 3.6, y: -0.1, z: -6 },
      { x: -3.8, y: -0.3, z: -10 },
      { x: 3.8, y: 0.3, z: -14 },
    ];
    frameOffsets.forEach((pos) => {
      const line = new THREE.Line(frameGeo, frameMat.clone());
      line.position.set(pos.x, pos.y, pos.z);
      cinemaGroup.add(line);
      cinemaFrames.push(line);
    });

    // -------------------------------------------------------------
    // ACT 2B: ENGINEERING BEAT (3D Wireframe Architectural Planes & Accent Vertices)
    // -------------------------------------------------------------
    const engineeringGroup = new THREE.Group();
    scene.add(engineeringGroup);

    const wireBoxGeo = new THREE.BoxGeometry(4.8, 3.0, 4.8);
    const edgesGeo = new THREE.EdgesGeometry(wireBoxGeo);
    const wireMat = new THREE.LineBasicMaterial({
      color: 0x141413,
      transparent: true,
      opacity: 0.25,
    });
    const wireMesh = new THREE.LineSegments(edgesGeo, wireMat);
    wireMesh.position.set(0, 0, -8);
    engineeringGroup.add(wireMesh);

    // Accent corner dots (#9EE41A)
    const dotGeo = new THREE.SphereGeometry(0.045, 8, 8);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0x9ee41a });
    const cornerPositions = [
      [-2.4, -1.5, -2.4],
      [2.4, -1.5, -2.4],
      [2.4, 1.5, -2.4],
      [-2.4, 1.5, -2.4],
      [-2.4, -1.5, 2.4],
      [2.4, -1.5, 2.4],
      [2.4, 1.5, 2.4],
      [-2.4, 1.5, 2.4],
    ];
    cornerPositions.forEach(([x, y, z]) => {
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.set(x, y, z);
      wireMesh.add(dot);
    });

    // -------------------------------------------------------------
    // ACT 2C: AUTOMATION BEAT (Converging Optical Beams + Central Core)
    // -------------------------------------------------------------
    const automationGroup = new THREE.Group();
    scene.add(automationGroup);

    // Central Obsidian Geometric Node
    // Central Matte-Stone & Lime-Wireframe Geometric Node
    const coreGeo = new THREE.OctahedronGeometry(0.50, 0);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xeae7df,
      roughness: 0.5,
      metalness: 0.1,
      transparent: true,
      opacity: 0.35,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.set(0, -1.2, -6.5);
    automationGroup.add(coreMesh);

    // Razor-sharp #9EE41A wireframe edges
    const coreEdges = new THREE.EdgesGeometry(coreGeo);
    const coreEdgeMat = new THREE.LineBasicMaterial({
      color: 0x9ee41a,
      linewidth: 2,
      transparent: true,
      opacity: 0.9,
    });
    const coreWire = new THREE.LineSegments(coreEdges, coreEdgeMat);
    coreMesh.add(coreWire);

    // 4 Sleek Glowing Optical Conduit Arcs Converging to Core
    const beamCurves = [
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-6.5, 3.5, 0.0),
        new THREE.Vector3(-3.8, 1.2, -3.0),
        new THREE.Vector3(0.0, -1.2, -6.5),
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-6.5, -3.0, 0.0),
        new THREE.Vector3(-3.8, -1.8, -3.0),
        new THREE.Vector3(0.0, -1.2, -6.5),
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(6.5, 3.5, 0.0),
        new THREE.Vector3(3.8, 1.2, -3.0),
        new THREE.Vector3(0.0, -1.2, -6.5),
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(6.5, -3.0, 0.0),
        new THREE.Vector3(3.8, -1.8, -3.0),
        new THREE.Vector3(0.0, -1.2, -6.5),
      ]),
    ];

    const beamShaderMaterial = new THREE.ShaderMaterial({
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        varying vec2 vUv;
        void main() {
          vec3 cLime = vec3(0.620, 0.894, 0.102);
          vec3 cCore = vec3(0.078, 0.078, 0.075);
          float pulse = smoothstep(0.18, 0.0, abs(vUv.x - fract(uTime * 0.8)));
          vec3 col = mix(cCore * 0.2, cLime, pulse * 1.5);
          gl_FragColor = vec4(col, clamp(0.25 + pulse * 0.75, 0.0, 1.0));
        }
      `,
      uniforms: {
        uTime: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
    });

    beamCurves.forEach((curve) => {
      const tubeGeo = new THREE.TubeGeometry(curve, 36, 0.026, 8, false);
      const tubeMesh = new THREE.Mesh(tubeGeo, beamShaderMaterial);
      automationGroup.add(tubeMesh);
    });

    // -------------------------------------------------------------
    // ACT 3: HANDOFF (Single Straight #9EE41A Floor Line Downward)
    // -------------------------------------------------------------
    const handoffGroup = new THREE.Group();
    scene.add(handoffGroup);

    const handoffGeo = new THREE.BufferGeometry();
    handoffGeo.setFromPoints([new THREE.Vector3(0, -1.24, -6), new THREE.Vector3(0, -1.24, 12)]);
    const handoffMat = new THREE.LineBasicMaterial({
      color: 0x9ee41a,
      linewidth: 3,
      transparent: true,
      opacity: 0.0,
    });
    const handoffLine = new THREE.Line(handoffGeo, handoffMat);
    handoffGroup.add(handoffLine);

    // 5. IntersectionObserver: pause rendering when scrolled past
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.02 }
    );
    observer.observe(container);

    // 6. Resize listener
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

    // 7. Continuous 60fps Loop
    let rafId = 0;
    let targetCameraZ = 9.5;
    let targetCameraY = 0.4;
    let targetFov = 45;

    const animate = (time: number) => {
      rafId = requestAnimationFrame(animate);
      if (!isVisibleRef.current) return;

      const p = progressRef.current;
      const t = time * 0.001;

      // Update shader uniform
      beamShaderMaterial.uniforms.uTime.value = t;

      // Continuous runway grid glide in -Z (paused if reducedMotion)
      if (!reducedMotion) {
        gridHelper.position.z = (t * 2.2) % 1.5;
      }

      // -----------------------------------------------------------
      // ACT-BY-ACT 3D STATE INTERPOLATION
      // -----------------------------------------------------------
      if (p < 0.14) {
        // Act 0: Idle Runway
        targetCameraZ = 9.5;
        targetCameraY = 0.4;
        targetFov = 45;
        runwayGroup.visible = true;
        cinemaGroup.visible = false;
        engineeringGroup.visible = false;
        automationGroup.visible = false;
        handoffMat.opacity = 0.0;
      } else if (p < 0.30) {
        // Act 1: Punch-Through Acceleration
        const norm = (p - 0.14) / 0.16;
        targetCameraZ = 9.5 - norm * 5.0; // 9.5 -> 4.5
        targetCameraY = 0.4 - norm * 0.2;
        targetFov = 45 + Math.sin(norm * Math.PI) * 12; // 45 -> 57 -> 45
        runwayGroup.visible = true;
        cinemaGroup.visible = norm > 0.4;
        engineeringGroup.visible = false;
        automationGroup.visible = false;
        handoffMat.opacity = 0.0;
      } else if (p < 0.47) {
        // Act 2A: Film Beat
        const norm = (p - 0.30) / 0.17;
        targetCameraZ = 4.5 - norm * 2.0;
        targetCameraY = 0.2;
        targetFov = 45;
        runwayGroup.visible = true;
        cinemaGroup.visible = true;
        engineeringGroup.visible = false;
        automationGroup.visible = false;
        handoffMat.opacity = 0.0;

        // Cinema frames glide past camera
        cinemaFrames.forEach((frame, idx) => {
          frame.position.z = frameOffsets[idx].z + norm * 4.0;
        });
      } else if (p < 0.64) {
        // Act 2B: Web Engineering Wireframes
        const norm = (p - 0.47) / 0.17;
        targetCameraZ = 2.5 - norm * 2.0;
        targetCameraY = 0.1;
        targetFov = 45;
        runwayGroup.visible = true;
        cinemaGroup.visible = false;
        engineeringGroup.visible = true;
        automationGroup.visible = false;
        handoffMat.opacity = 0.0;

        // Wireframe rotates smoothly in perspective
        wireMesh.rotation.y = norm * Math.PI * 0.45;
        wireMesh.rotation.x = Math.sin(norm * Math.PI) * 0.18;
      } else if (p < 0.82) {
        // Act 2C: AI & Automation Optical Core
        const norm = (p - 0.64) / 0.18;
        targetCameraZ = 0.5 - norm * 1.5;
        targetCameraY = 0.25;
        targetFov = 45;
        runwayGroup.visible = true;
        cinemaGroup.visible = false;
        engineeringGroup.visible = false;
        automationGroup.visible = true;
        handoffMat.opacity = 0.0;

        // Core node spins and pulses
        coreMesh.rotation.x = t * 0.8;
        coreMesh.rotation.y = t * 1.2;
        const coreScale = 1.0 + Math.sin(t * 4.0) * 0.08;
        coreMesh.scale.set(coreScale, coreScale, coreScale);
      } else {
        // Act 3: Convergence & Handoff
        const norm = (p - 0.82) / 0.18;
        targetCameraZ = -1.0 - norm * 2.0;
        targetCameraY = -0.3;
        targetFov = 45;
        runwayGroup.visible = true;
        cinemaGroup.visible = false;
        engineeringGroup.visible = false;
        automationGroup.visible = false;

        // Handoff line ignites bright surgical lime
        handoffMat.opacity = Math.min(norm * 1.5, 1.0);
      }

      // Smooth camera interpolation
      camera.position.z += (targetCameraZ - camera.position.z) * 0.10;
      camera.position.y += (targetCameraY - camera.position.y) * 0.10;
      camera.fov += (targetFov - camera.fov) * 0.10;
      camera.updateProjectionMatrix();

      renderer.render(scene, camera);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      gridHelper.dispose();
      railGeo.dispose();
      railMat.dispose();
      frameGeo.dispose();
      frameMat.dispose();
      wireBoxGeo.dispose();
      edgesGeo.dispose();
      wireMat.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      coreEdges.dispose();
      coreEdgeMat.dispose();
      beamShaderMaterial.dispose();
      handoffGeo.dispose();
      handoffMat.dispose();
    };
  }, []);

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
