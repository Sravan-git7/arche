import { useEffect, useRef } from "react";
import * as THREE from "three";

interface PropositionCinemaStage3DProps {
  progress: number; // 0.00 to 1.00 from Proposition GSAP ScrollTrigger
  reducedMotion?: boolean;
}

export function PropositionCinemaStage3D({ progress, reducedMotion }: PropositionCinemaStage3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef<number>(progress);
  progressRef.current = progress;

  const isVisibleRef = useRef<boolean>(false);

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

    // 2. Scene & Fog (Matching Hero Studio Environment)
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
    // 5. Studio Perspective Floor Grid (Infinite Gliding Horizon)
    // -------------------------------------------------------------
    const gridHelper = new THREE.GridHelper(60, 40, 0x141413, 0x141413);
    gridHelper.position.y = -1.25;
    const gridMat = gridHelper.material as THREE.LineBasicMaterial;
    gridMat.opacity = 0.085;
    gridMat.transparent = true;
    scene.add(gridHelper);

    // -------------------------------------------------------------
    // 6. Act 1: Fractured Floor Rail vs Act 2-3 Solid Floor Rail
    // -------------------------------------------------------------
    // Broken Rail Segment 1 (Entering from Hero above): z: 12 down to z: 1.6
    const railSeg1Geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -1.24, 12),
      new THREE.Vector3(0, -1.24, 1.6),
    ]);
    const railSeg1Mat = new THREE.LineBasicMaterial({
      color: 0x9ee41a,
      linewidth: 2,
      transparent: true,
      opacity: 0.85,
    });
    const railSeg1 = new THREE.Line(railSeg1Geo, railSeg1Mat);
    scene.add(railSeg1);

    // Fractured Dim Fault Line Gap (z: 1.6 to z: -1.6, offset slightly in x)
    const faultGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -1.24, 1.6),
      new THREE.Vector3(0.12, -1.24, 0.8),
      new THREE.Vector3(-0.10, -1.24, -0.2),
      new THREE.Vector3(0.08, -1.24, -1.0),
      new THREE.Vector3(0, -1.24, -1.6),
    ]);
    const faultMat = new THREE.LineBasicMaterial({
      color: 0x141413,
      transparent: true,
      opacity: 0.25,
    });
    const faultLine = new THREE.Line(faultGeo, faultMat);
    scene.add(faultLine);

    // Broken Rail Segment 2 (Receding into distance): z: -1.6 down to z: -45
    const railSeg2Geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -1.24, -1.6),
      new THREE.Vector3(0, -1.24, -45),
    ]);
    const railSeg2Mat = new THREE.LineBasicMaterial({
      color: 0x9ee41a,
      linewidth: 2,
      transparent: true,
      opacity: 0.85,
    });
    const railSeg2 = new THREE.Line(railSeg2Geo, railSeg2Mat);
    scene.add(railSeg2);

    // Full Solid Healed Center Guide Rail (Act 2 & Act 3)
    const healedRailGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -1.24, 12),
      new THREE.Vector3(0, -1.24, -45),
    ]);
    const healedRailMat = new THREE.LineBasicMaterial({
      color: 0x9ee41a,
      linewidth: 3,
      transparent: true,
      opacity: 0.0,
    });
    const healedRail = new THREE.Line(healedRailGeo, healedRailMat);
    scene.add(healedRail);

    // -------------------------------------------------------------
    // 7. 4 Floating 3D Architectural Wireframe Frames
    // -------------------------------------------------------------
    const framesGroup = new THREE.Group();
    scene.add(framesGroup);

    // Wireframe Box Geometry for cards
    const cardW = 2.4;
    const cardH = 1.45;
    const cardD = 0.15;
    const cardBoxGeo = new THREE.BoxGeometry(cardW, cardH, cardD);
    const cardEdgesGeo = new THREE.EdgesGeometry(cardBoxGeo);

    const wireMatNormal = new THREE.LineBasicMaterial({
      color: 0x141413,
      transparent: true,
      opacity: 0.35,
    });

    const wireMatActive = new THREE.LineBasicMaterial({
      color: 0x9ee41a,
      transparent: true,
      opacity: 0.90,
    });

    const cornerDotGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const cornerDotMat = new THREE.MeshBasicMaterial({ color: 0x9ee41a });

    // Initial Drifted Positions (Act 1: Disconnected)
    const driftedConfigs = [
      { id: "01", x: -3.5, y: 1.8, z: -4.5, rx: 0.10, ry: 0.20, rz: -0.08 },
      { id: "02", x: 3.5, y: 1.6, z: -5.2, rx: -0.12, ry: -0.15, rz: 0.10 },
      { id: "03", x: -3.6, y: -1.6, z: -5.0, rx: 0.15, ry: -0.18, rz: 0.12 },
      { id: "04", x: 3.4, y: -1.9, z: -4.6, rx: -0.10, ry: 0.22, rz: -0.09 },
    ];

    // Snapped 2x2 Grid Positions (Act 2: Reconnected)
    const snappedConfigs = [
      { id: "01", x: -1.45, y: 0.95, z: -5.0, rx: 0, ry: 0, rz: 0 },
      { id: "02", x: 1.45, y: 0.95, z: -5.0, rx: 0, ry: 0, rz: 0 },
      { id: "03", x: -1.45, y: -0.95, z: -5.0, rx: 0, ry: 0, rz: 0 },
      { id: "04", x: 1.45, y: -0.95, z: -5.0, rx: 0, ry: 0, rz: 0 },
    ];

    const frameMeshes: THREE.LineSegments[] = [];

    driftedConfigs.forEach((cfg) => {
      const mesh = new THREE.LineSegments(cardEdgesGeo, wireMatNormal.clone());
      mesh.position.set(cfg.x, cfg.y, cfg.z);
      mesh.rotation.set(cfg.rx, cfg.ry, cfg.rz);

      // Add 4 corner accent dots
      const corners = [
        [-cardW / 2, -cardH / 2, cardD / 2],
        [cardW / 2, -cardH / 2, cardD / 2],
        [cardW / 2, cardH / 2, cardD / 2],
        [-cardW / 2, cardH / 2, cardD / 2],
      ];
      corners.forEach(([cx, cy, cz]) => {
        const dot = new THREE.Mesh(cornerDotGeo, cornerDotMat);
        dot.position.set(cx, cy, cz);
        mesh.add(dot);
      });

      framesGroup.add(mesh);
      frameMeshes.push(mesh);
    });

    // -------------------------------------------------------------
    // 8. Reconnecting 3D Optical Circuit Beams (Act 2)
    // -------------------------------------------------------------
    const circuitGroup = new THREE.Group();
    scene.add(circuitGroup);

    // 4 Inter-card circuit lines in 2x2 grid
    // 01 -> 02 (horizontal top)
    const c1Geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-1.45, 0.95, -5.0),
      new THREE.Vector3(1.45, 0.95, -5.0),
    ]);
    // 02 -> 04 (vertical right)
    const c2Geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(1.45, 0.95, -5.0),
      new THREE.Vector3(1.45, -0.95, -5.0),
    ]);
    // 04 -> 03 (horizontal bottom)
    const c3Geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(1.45, -0.95, -5.0),
      new THREE.Vector3(-1.45, -0.95, -5.0),
    ]);
    // 03 -> 01 (vertical left)
    const c4Geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-1.45, -0.95, -5.0),
      new THREE.Vector3(-1.45, 0.95, -5.0),
    ]);

    const circuitMat = new THREE.LineBasicMaterial({
      color: 0x9ee41a,
      linewidth: 2.5,
      transparent: true,
      opacity: 0.0,
    });

    const cLines = [
      new THREE.Line(c1Geo, circuitMat.clone()),
      new THREE.Line(c2Geo, circuitMat.clone()),
      new THREE.Line(c3Geo, circuitMat.clone()),
      new THREE.Line(c4Geo, circuitMat.clone()),
    ];
    cLines.forEach((l) => circuitGroup.add(l));

    // -------------------------------------------------------------
    // 9. IntersectionObserver: strictly pauses rendering offscreen
    // -------------------------------------------------------------
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.02 }
    );
    observer.observe(container);

    // 10. Resize Listener
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

    // -------------------------------------------------------------
    // 11. Continuous 60fps Loop
    // -------------------------------------------------------------
    let rafId = 0;

    const animate = (time: number) => {
      rafId = requestAnimationFrame(animate);
      if (!isVisibleRef.current) return;

      const p = progressRef.current;
      const t = time * 0.001;

      // Glide runway grid in -Z (paused if reducedMotion)
      if (!reducedMotion) {
        gridHelper.position.z = (t * 2.2) % 1.5;
      }

      // ACT 1: Broken Rail & Drifting Disconnected Frames (0.00 -> 0.34)
      if (p < 0.34) {
        // Fractured rail is visible, healed rail is invisible
        railSeg1Mat.opacity = 0.85;
        railSeg2Mat.opacity = 0.85;
        faultMat.opacity = 0.35 + Math.sin(t * 5.0) * 0.15; // subtle flickering fault
        healedRailMat.opacity = 0.0;

        framesGroup.visible = true;
        circuitGroup.visible = false;

        // Floating phase oscillation for drifted frames
        frameMeshes.forEach((mesh, idx) => {
          const cfg = driftedConfigs[idx];
          const floatY = Math.sin(t * 1.3 + idx * 1.4) * 0.12;
          const floatR = Math.cos(t * 1.1 + idx * 1.2) * 0.04;
          mesh.position.set(cfg.x, cfg.y + floatY, cfg.z);
          mesh.rotation.set(cfg.rx + floatR, cfg.ry + floatR, cfg.rz);
          (mesh.material as THREE.LineBasicMaterial).color.setHex(0x141413);
          (mesh.material as THREE.LineBasicMaterial).opacity = 0.35;
        });
      }
      // ACT 2: Reconnection Snap & Healed Rail (0.34 -> 0.62)
      else if (p < 0.62) {
        const norm = (p - 0.34) / 0.28; // 0.0 -> 1.0

        // Fractured rail fades out, solid healed rail ignites bright lime
        railSeg1Mat.opacity = Math.max(0, 0.85 - norm * 2.5);
        railSeg2Mat.opacity = Math.max(0, 0.85 - norm * 2.5);
        faultMat.opacity = Math.max(0, 0.35 - norm * 2.5);
        healedRailMat.opacity = Math.min(1.0, norm * 1.8);

        framesGroup.visible = true;
        circuitGroup.visible = norm > 0.45;

        // Physical snap from drifted -> snapped 2x2 grid
        const snapEase = Math.min(1.0, norm * 1.4); // snaps quickly then holds
        const cubicEase = snapEase < 0.5 ? 4 * snapEase * snapEase * snapEase : 1 - Math.pow(-2 * snapEase + 2, 3) / 2;

        frameMeshes.forEach((mesh, idx) => {
          const dCfg = driftedConfigs[idx];
          const sCfg = snappedConfigs[idx];

          mesh.position.x = dCfg.x + (sCfg.x - dCfg.x) * cubicEase;
          mesh.position.y = dCfg.y + (sCfg.y - dCfg.y) * cubicEase;
          mesh.position.z = dCfg.z + (sCfg.z - dCfg.z) * cubicEase;

          mesh.rotation.x = dCfg.rx * (1 - cubicEase);
          mesh.rotation.y = dCfg.ry * (1 - cubicEase);
          mesh.rotation.z = dCfg.rz * (1 - cubicEase);

          // Turn wireframes lime once snapped
          const mat = mesh.material as THREE.LineBasicMaterial;
          if (cubicEase > 0.8) {
            mat.color.setHex(0x9ee41a);
            mat.opacity = 0.85;
          } else {
            mat.color.setHex(0x141413);
            mat.opacity = 0.35 + cubicEase * 0.35;
          }
        });

        // Inter-card circuit beams pulse
        const cAlpha = Math.max(0, (norm - 0.45) / 0.55);
        cLines.forEach((line) => {
          (line.material as THREE.LineBasicMaterial).opacity = cAlpha * 0.9;
        });
      }
      // ACT 3: Handover to Docked 2-Column Console & Exit into Services (0.62 -> 1.00)
      else {
        const norm = (p - 0.62) / 0.38;

        // Frames smoothly fade out to reveal the real DOM console
        framesGroup.visible = norm < 0.25;
        if (framesGroup.visible) {
          const fadeOut = Math.max(0, 1.0 - norm * 4.0);
          frameMeshes.forEach((mesh) => {
            (mesh.material as THREE.LineBasicMaterial).opacity = fadeOut * 0.85;
          });
        }
        circuitGroup.visible = false;

        // Continuous solid floor rail shoots straight into Services
        healedRailMat.opacity = 1.0;
        railSeg1Mat.opacity = 0.0;
        railSeg2Mat.opacity = 0.0;
        faultMat.opacity = 0.0;
      }

      renderer.render(scene, camera);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      gridHelper.dispose();
      railSeg1Geo.dispose();
      railSeg1Mat.dispose();
      faultGeo.dispose();
      faultMat.dispose();
      railSeg2Geo.dispose();
      railSeg2Mat.dispose();
      healedRailGeo.dispose();
      healedRailMat.dispose();
      cardBoxGeo.dispose();
      cardEdgesGeo.dispose();
      wireMatNormal.dispose();
      wireMatActive.dispose();
      cornerDotGeo.dispose();
      cornerDotMat.dispose();
      c1Geo.dispose();
      c2Geo.dispose();
      c3Geo.dispose();
      c4Geo.dispose();
      circuitMat.dispose();
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
