import { useEffect, useRef } from "react";
import * as THREE from "three";

export interface Pavilion3DProps {
  progress: number; // 0.00 -> 1.00 from ScrollTrigger
  pointer: { x: number; y: number };
  inView: boolean;
  activeRoom: number; // 0 = Video, 1 = Web, 2 = Chatbots, 3 = Automation
}

/**
 * THE ARCHÉ PAVILION — Physical 4-Room Brutalist-Minimalist Limestone Studio
 *
 * Architecture inspired by Tadao Ando concrete/limestone & Teenage Engineering hardware:
 *  - Real architectural daylight with soft shadows (PCFSoftShadowMap, 2048x2048)
 *  - Procedural tactile limestone bump/roughness canvas texture
 *  - Continuous glowing lime (#9EE41A) floor conduit snaking through all 4 rooms
 *  - Dual-spline Steadicam camera rail (cameraPosCurve & cameraLookCurve)
 *  - 4 Physical Studio Spaces:
 *      Room 01: The Screening Vault (curved cinema screen monolith + console ledge)
 *      Room 02: The Drafting Atrium (tall ceiling skylight slots + 3-layer exploded 3D glass model)
 *      Room 03: The Glass Observatory (circular limestone chamber + sculptural pulsing lime light-core)
 *      Room 04: The Control Floor (central AI plinth + 4 fanning conduits to INBOX, SHEET, CRM, SLACK pedestals)
 */

export function Pavilion3D({ progress, pointer, inView }: Pavilion3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(progress);
  progressRef.current = progress;
  const pointerRef = useRef(pointer);
  pointerRef.current = pointer;
  const inViewRef = useRef(inView);
  inViewRef.current = inView;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf4f4ee);
    scene.fog = new THREE.FogExp2(0xf4f4ee, 0.012);

    const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 140);
    camera.position.set(0, 2.0, 18);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;

    container.appendChild(renderer.domElement);

    // 2. Procedural Tactile Limestone Canvas Texture
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#EAE7DF";
    ctx.fillRect(0, 0, 512, 512);
    const imgData = ctx.getImageData(0, 0, 512, 512);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const grain = (Math.random() - 0.5) * 16;
      data[i] = Math.min(255, Math.max(0, data[i] + grain));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + grain));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + grain));
    }
    ctx.putImageData(imgData, 0, 0);
    const limestoneTex = new THREE.CanvasTexture(canvas);
    limestoneTex.wrapS = THREE.RepeatWrapping;
    limestoneTex.wrapT = THREE.RepeatWrapping;
    limestoneTex.repeat.set(12, 12);

    // 3. Materials
    const limestoneWallMat = new THREE.MeshStandardMaterial({
      color: 0xeae7df,
      roughness: 0.88,
      metalness: 0.03,
      bumpMap: limestoneTex,
      bumpScale: 0.02,
    });

    const limestoneFloorMat = new THREE.MeshStandardMaterial({
      color: 0xdfdcd2,
      roughness: 0.82,
      metalness: 0.04,
      bumpMap: limestoneTex,
      bumpScale: 0.025,
    });

    const obsidianMat = new THREE.MeshStandardMaterial({
      color: 0x141413,
      roughness: 0.35,
      metalness: 0.85,
    });

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.68,
      opacity: 1,
      transparent: true,
      roughness: 0.15,
      ior: 1.45,
      thickness: 0.3,
    });

    const limeGlowMat = new THREE.MeshBasicMaterial({
      color: 0x9ee41a,
    });

    // 4. Lighting & Architectural Daylight Shadows (Museum-Grade Luxury)
    const hemiLight = new THREE.HemisphereLight(0xfffdf8, 0xeae7df, 1.25);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfffbf2, 1.05);
    dirLight.position.set(16, 26, 12);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 130;
    dirLight.shadow.camera.left = -28;
    dirLight.shadow.camera.right = 28;
    dirLight.shadow.camera.top = 28;
    dirLight.shadow.camera.bottom = -28;
    dirLight.shadow.bias = -0.0004;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xf4f4ee, 0.75);
    fillLight.position.set(-16, 16, 12);
    scene.add(fillLight);

    const archLight = new THREE.DirectionalLight(0xfffdf8, 0.85);
    archLight.position.set(10, 18, 26);
    scene.add(archLight);

    // 5. Pavilion Physical Architecture
    const pavilionGroup = new THREE.Group();
    scene.add(pavilionGroup);

    // A. Continuous Ground Floor with Expansion Joint Panels
    const floorGeo = new THREE.PlaneGeometry(80, 140);
    const floorMesh = new THREE.Mesh(floorGeo, limestoneFloorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(0, 0, -36);
    floorMesh.receiveShadow = true;
    pavilionGroup.add(floorMesh);

    // B. Act 0 — Monumental Entrance Archway (z = 12 to 8)
    const archPillarGeo = new THREE.BoxGeometry(2.4, 7.5, 2.4);
    const archPillarLeft = new THREE.Mesh(archPillarGeo, limestoneWallMat);
    archPillarLeft.position.set(-6, 3.75, 10);
    archPillarLeft.castShadow = true;
    archPillarLeft.receiveShadow = true;
    pavilionGroup.add(archPillarLeft);

    const archPillarRight = new THREE.Mesh(archPillarGeo, limestoneWallMat);
    archPillarRight.position.set(6, 3.75, 10);
    archPillarRight.castShadow = true;
    archPillarRight.receiveShadow = true;
    pavilionGroup.add(archPillarRight);

    const archLintelGeo = new THREE.BoxGeometry(14.4, 1.8, 2.4);
    const archLintel = new THREE.Mesh(archLintelGeo, limestoneWallMat);
    archLintel.position.set(0, 6.6, 10);
    archLintel.castShadow = true;
    archLintel.receiveShadow = true;
    pavilionGroup.add(archLintel);

    // C. Room 01 — The Screening Vault (z = +2 to -14)
    // Left & Right Baffle Walls
    const r1WallGeo = new THREE.BoxGeometry(0.8, 6.5, 18);
    const r1WallLeft = new THREE.Mesh(r1WallGeo, limestoneWallMat);
    r1WallLeft.position.set(-9.5, 3.25, -6);
    r1WallLeft.castShadow = true;
    r1WallLeft.receiveShadow = true;
    pavilionGroup.add(r1WallLeft);

    const r1WallRight = new THREE.Mesh(new THREE.BoxGeometry(0.8, 6.5, 10), limestoneWallMat);
    r1WallRight.position.set(7.5, 3.25, -2);
    r1WallRight.castShadow = true;
    r1WallRight.receiveShadow = true;
    pavilionGroup.add(r1WallRight);

    // Architectural 16:9 Cinema Screen Monolith shifted right/back (z = -14, x = +1.8) so left text NEVER collides
    const screenFrameGeo = new THREE.BoxGeometry(6.2, 3.6, 0.25);
    const screenFrame = new THREE.Mesh(screenFrameGeo, limestoneWallMat);
    screenFrame.position.set(1.8, 2.4, -14.15);
    screenFrame.castShadow = true;
    screenFrame.receiveShadow = true;
    pavilionGroup.add(screenFrame);

    const screenMonolithGeo = new THREE.BoxGeometry(5.6, 3.15, 0.28);
    const screenMonolith = new THREE.Mesh(screenMonolithGeo, obsidianMat);
    screenMonolith.position.set(1.8, 2.4, -14.0);
    screenMonolith.castShadow = true;
    screenMonolith.receiveShadow = true;
    pavilionGroup.add(screenMonolith);

    // Tactile Grading Console Ledge in front of screen
    const consoleLedgeGeo = new THREE.BoxGeometry(5.8, 0.4, 1.2);
    const consoleLedge = new THREE.Mesh(consoleLedgeGeo, obsidianMat);
    consoleLedge.position.set(1.8, 0.7, -12.5);
    consoleLedge.castShadow = true;
    consoleLedge.receiveShadow = true;
    pavilionGroup.add(consoleLedge);

    // D. Architectural Doorway 01 -> 02 (x = 7.5, z = -11) - Slim architectural frame
    const doorFrameGeo = new THREE.BoxGeometry(0.2, 5.8, 0.5);
    const doorFrame = new THREE.Mesh(doorFrameGeo, obsidianMat);
    doorFrame.position.set(7.5, 2.9, -11);
    pavilionGroup.add(doorFrame);

    const doorGlassGeo = new THREE.BoxGeometry(0.08, 5.4, 4.0);
    const doorGlass = new THREE.Mesh(doorGlassGeo, glassMat);
    doorGlass.position.set(7.5, 2.9, -11);
    pavilionGroup.add(doorGlass);

    // E. Room 02 — The Drafting Atrium (x = 10 to 24, z = -18 to -42)
    // High Baffle Walls
    const atriumWallBack = new THREE.Mesh(new THREE.BoxGeometry(16, 8.5, 0.8), limestoneWallMat);
    atriumWallBack.position.set(16, 4.25, -42);
    atriumWallBack.castShadow = true;
    atriumWallBack.receiveShadow = true;
    pavilionGroup.add(atriumWallBack);

    const atriumWallRight = new THREE.Mesh(new THREE.BoxGeometry(0.8, 8.5, 24), limestoneWallMat);
    atriumWallRight.position.set(24, 4.25, -30);
    atriumWallRight.castShadow = true;
    atriumWallRight.receiveShadow = true;
    pavilionGroup.add(atriumWallRight);

    // Ceiling Skylight Slats (pouring daylight cuts)
    for (let k = 0; k < 4; k++) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(14, 0.6, 1.2), limestoneWallMat);
      slat.position.set(16, 8.2, -22 - k * 5.2);
      slat.castShadow = true;
      pavilionGroup.add(slat);
    }

    // 3-Layer Exploded 3D Glass Website Installation
    const explodedGroup = new THREE.Group();
    explodedGroup.position.set(16, 2.4, -28);

    // Layer 1: Blueprint wireframe grid
    const gridHelper = new THREE.GridHelper(5.2, 10, 0x141413, 0x9ee41a);
    gridHelper.rotation.x = Math.PI / 2;
    gridHelper.position.set(0, 0, -0.6);
    explodedGroup.add(gridHelper);

    // Layer 2: Frosted Glass UI Card
    const glassCardGeo = new THREE.BoxGeometry(4.8, 2.8, 0.08);
    const glassCard = new THREE.Mesh(glassCardGeo, glassMat);
    glassCard.position.set(0, 0, 0);
    glassCard.castShadow = true;
    explodedGroup.add(glassCard);

    // Layer 3: Obsidian Action Plane
    const actionPlaneGeo = new THREE.BoxGeometry(3.6, 0.7, 0.08);
    const actionPlane = new THREE.Mesh(actionPlaneGeo, obsidianMat);
    actionPlane.position.set(0, -0.7, 0.5);
    actionPlane.castShadow = true;
    explodedGroup.add(actionPlane);

    pavilionGroup.add(explodedGroup);

    // F. Corridor 02 -> 03 (x = 20 -> 0, z = -44 -> -52)
    const corridorWallGeo = new THREE.BoxGeometry(18, 5.5, 0.8);
    const corridorWall = new THREE.Mesh(corridorWallGeo, limestoneWallMat);
    corridorWall.position.set(8, 2.75, -46);
    corridorWall.castShadow = true;
    corridorWall.receiveShadow = true;
    pavilionGroup.add(corridorWall);

    // G. Room 03 — The Glass Observatory (x = 0, z = -56 to -76)
    // Circular curved limestone wall segment
    const r3CurveGeo = new THREE.CylinderGeometry(11, 11, 7.0, 32, 1, true, -Math.PI * 0.75, Math.PI * 1.5);
    const r3Curve = new THREE.Mesh(r3CurveGeo, limestoneWallMat);
    r3Curve.position.set(0, 3.5, -66);
    r3Curve.castShadow = true;
    r3Curve.receiveShadow = true;
    pavilionGroup.add(r3Curve);

    // Centerpiece: Sculptural Frosted Glass Column with Rotating Lime Core
    const glassColumnGeo = new THREE.CylinderGeometry(1.4, 1.4, 4.6, 18);
    const glassColumn = new THREE.Mesh(glassColumnGeo, glassMat);
    glassColumn.position.set(0, 2.3, -66);
    glassColumn.castShadow = true;
    pavilionGroup.add(glassColumn);

    // Obsidian Plinth base & cap
    const colPlinthBase = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.2, 0.5, 18), obsidianMat);
    colPlinthBase.position.set(0, 0.25, -66);
    colPlinthBase.castShadow = true;
    colPlinthBase.receiveShadow = true;
    pavilionGroup.add(colPlinthBase);

    const colPlinthCap = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 1.8, 0.4, 18), obsidianMat);
    colPlinthCap.position.set(0, 4.8, -66);
    colPlinthCap.castShadow = true;
    pavilionGroup.add(colPlinthCap);

    // Pulsing Geometric 3D Light-Core
    const lightCoreGeo = new THREE.OctahedronGeometry(0.65, 0);
    const lightCoreMat = new THREE.MeshStandardMaterial({
      color: 0x9ee41a,
      emissive: 0x9ee41a,
      emissiveIntensity: 1.6,
      roughness: 0.2,
      metalness: 0.1,
    });
    const lightCore = new THREE.Mesh(lightCoreGeo, lightCoreMat);
    lightCore.position.set(0, 2.3, -66);
    pavilionGroup.add(lightCore);

    // H. Room 04 — The Control Floor (x = 0, z = -78 to -105)
    // Central Cylindrical AI Plinth
    const centerPlinthGeo = new THREE.CylinderGeometry(2.2, 2.4, 0.65, 24);
    const centerPlinth = new THREE.Mesh(centerPlinthGeo, obsidianMat);
    centerPlinth.position.set(0, 0.32, -88);
    centerPlinth.castShadow = true;
    centerPlinth.receiveShadow = true;
    pavilionGroup.add(centerPlinth);

    // Central Plinth Glowing Lime Ring
    const limeRingGeo = new THREE.RingGeometry(2.1, 2.25, 32);
    const limeRing = new THREE.Mesh(limeRingGeo, limeGlowMat);
    limeRing.rotation.x = -Math.PI / 2;
    limeRing.position.set(0, 0.66, -88);
    pavilionGroup.add(limeRing);

    // 4 Monolithic Pedestals arranged symmetrically in semi-circle (INBOX, SHEET, CRM, SLACK)
    const pedestalGeo = new THREE.BoxGeometry(1.6, 2.8, 1.6);
    const pedestalPositions = [
      { x: -5.8, z: -92, label: "INBOX" },
      { x: -2.2, z: -96, label: "SHEET" },
      { x: 2.2, z: -96, label: "CRM" },
      { x: 5.8, z: -92, label: "SLACK" },
    ];

    const pedestalMeshes: THREE.Mesh[] = [];
    pedestalPositions.forEach((pos) => {
      const ped = new THREE.Mesh(pedestalGeo, limestoneWallMat);
      ped.position.set(pos.x, 1.4, pos.z);
      ped.castShadow = true;
      ped.receiveShadow = true;
      pavilionGroup.add(ped);
      pedestalMeshes.push(ped);

      // Top Obsidian Cap
      const pedCap = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.2, 1.7), obsidianMat);
      pedCap.position.set(pos.x, 2.85, pos.z);
      pedCap.castShadow = true;
      pavilionGroup.add(pedCap);

      // Top Lime Status Jewel
      const jewel = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.08, 16), limeGlowMat);
      jewel.position.set(pos.x, 2.98, pos.z);
      pavilionGroup.add(jewel);
    });

    // Rear Monumental Wall of Room 04
    const r4BackWall = new THREE.Mesh(new THREE.BoxGeometry(26, 8.5, 1.0), limestoneWallMat);
    r4BackWall.position.set(0, 4.25, -102);
    r4BackWall.castShadow = true;
    r4BackWall.receiveShadow = true;
    pavilionGroup.add(r4BackWall);

    // 6. The Continuous Glowing Lime Floor Conduit Rail
    // Snaking through: Arch -> Room 01 -> Glass Door -> Room 02 -> Room 03 -> Split Point in Room 04
    const railPoints = [
      new THREE.Vector3(0, 0.03, 18),
      new THREE.Vector3(0, 0.03, 10),
      new THREE.Vector3(0, 0.03, -2),
      new THREE.Vector3(0, 0.03, -7),
      new THREE.Vector3(3.2, 0.03, -8.5),
      new THREE.Vector3(7.5, 0.03, -11),
      new THREE.Vector3(12, 0.03, -18),
      new THREE.Vector3(16, 0.03, -24),
      new THREE.Vector3(16, 0.03, -32),
      new THREE.Vector3(11, 0.03, -40),
      new THREE.Vector3(5, 0.03, -48),
      new THREE.Vector3(0, 0.03, -56),
      new THREE.Vector3(0, 0.03, -66),
      new THREE.Vector3(0, 0.03, -76),
      new THREE.Vector3(0, 0.03, -84), // branching hub
    ];

    const railCurve = new THREE.CatmullRomCurve3(railPoints, false, "centripetal", 0.35);

    // Recessed dark groove underneath tube
    const groovePoints = railCurve.getPoints(120);
    const grooveGeo = new THREE.BufferGeometry().setFromPoints(groovePoints);
    const grooveLine = new THREE.Line(
      grooveGeo,
      new THREE.LineBasicMaterial({ color: 0x141413, linewidth: 3 })
    );
    grooveLine.position.y = 0.01;
    pavilionGroup.add(grooveLine);

    // Glowing Lime Tube Rail
    const tubeGeo = new THREE.TubeGeometry(railCurve, 120, 0.035, 8, false);
    const tubeMesh = new THREE.Mesh(tubeGeo, limeGlowMat);
    pavilionGroup.add(tubeMesh);

    // 4 Branching Conduits in Room 04 fanning out to the 4 pedestals
    pedestalPositions.forEach((pos) => {
      const branchPoints = [
        new THREE.Vector3(0, 0.03, -84),
        new THREE.Vector3(pos.x * 0.5, 0.03, -87),
        new THREE.Vector3(pos.x, 0.03, pos.z),
      ];
      const branchCurve = new THREE.CatmullRomCurve3(branchPoints, false, "chordal");
      const branchTube = new THREE.Mesh(
        new THREE.TubeGeometry(branchCurve, 32, 0.028, 6, false),
        limeGlowMat
      );
      pavilionGroup.add(branchTube);
    });

    // Traveling Energy Pulse on the floor rail
    const pulseGeo = new THREE.SphereGeometry(0.12, 12, 12);
    const pulseMesh = new THREE.Mesh(pulseGeo, limeGlowMat);
    pulseMesh.position.set(0, 0.05, 18);
    pavilionGroup.add(pulseMesh);

    // 7. Dual-Spline Steadicam Camera Rail (Camera Position & Look-At Curves)
    // Docked positions offset x to right while looking center-left to frame 3D architecture beside the UI showcase
    const cameraWaypoints = [
      // Act 0: Approaching Entrance Arch
      new THREE.Vector3(0, 2.0, 20),
      new THREE.Vector3(0, 1.9, 13),
      // Walking under arch
      new THREE.Vector3(0, 1.8, 8),
      // Room 01: Docking in Screening Vault (Video Editing)
      new THREE.Vector3(1.2, 1.65, -1.8),
      new THREE.Vector3(1.4, 1.65, -2.4),
      // Exiting Room 01, turning towards glass doorway
      new THREE.Vector3(4.2, 1.75, -7.5),
      new THREE.Vector3(7.8, 1.75, -11.5),
      // Entering Room 02: Orbiting suspended website model
      new THREE.Vector3(14.0, 2.1, -19),
      new THREE.Vector3(18.0, 1.75, -22.5), // Docked view of Web Dev
      new THREE.Vector3(18.0, 1.75, -23.5),
      // Corridor to Room 03
      new THREE.Vector3(10.5, 1.8, -35),
      new THREE.Vector3(4.5, 1.8, -46),
      // Room 03: Docking in Glass Observatory (AI Chatbots)
      new THREE.Vector3(1.6, 1.7, -56),
      new THREE.Vector3(1.6, 1.7, -58),
      // Approaching Room 04: Crane elevation as floor branches
      new THREE.Vector3(1.2, 2.1, -72),
      // Room 04: Docking in Control Floor (AI Automation)
      new THREE.Vector3(1.4, 1.85, -78),
      new THREE.Vector3(1.4, 1.85, -80),
      // Act 5: Smooth Crane Exit
      new THREE.Vector3(0, 4.8, -86),
      new THREE.Vector3(0, 7.5, -92),
    ];

    const lookWaypoints = [
      // Act 0: Looking through arch at typography
      new THREE.Vector3(0, 2.0, 6),
      new THREE.Vector3(0, 1.8, 2),
      // Looking into Room 01
      new THREE.Vector3(0.2, 1.65, -8),
      // Looking down Room 01 with screen framed center-right
      new THREE.Vector3(0.4, 1.65, -12),
      new THREE.Vector3(0.4, 1.65, -12),
      // Looking towards doorway
      new THREE.Vector3(8, 1.8, -13),
      new THREE.Vector3(14, 1.8, -20),
      // Looking at exploded website model in center-left FOV
      new THREE.Vector3(14.5, 2.0, -28),
      new THREE.Vector3(14.5, 2.0, -28),
      new THREE.Vector3(14.5, 2.0, -28),
      // Looking down corridor
      new THREE.Vector3(3.5, 1.8, -44),
      new THREE.Vector3(-0.5, 1.8, -56),
      // Looking at pulsing geometric light-core in Room 03 in center-left FOV
      new THREE.Vector3(-1.2, 2.3, -66),
      new THREE.Vector3(-1.2, 2.3, -66),
      // Looking at branching floor and pedestals in Room 04 in center-left FOV
      new THREE.Vector3(-1.2, 1.2, -84),
      new THREE.Vector3(-1.4, 1.5, -88),
      new THREE.Vector3(-1.4, 1.5, -88),
      // Crane exit look-down
      new THREE.Vector3(0, 0.5, -92),
      new THREE.Vector3(0, 0, -96),
    ];

    const cameraPosCurve = new THREE.CatmullRomCurve3(cameraWaypoints, false, "centripetal", 0.4);
    const cameraLookCurve = new THREE.CatmullRomCurve3(lookWaypoints, false, "centripetal", 0.4);

    // 8. Render Loop & Scroll Sync
    let animId = 0;
    const currentCamPos = new THREE.Vector3();
    const currentLookAt = new THREE.Vector3();
    const targetLookAt = new THREE.Vector3();
    let mouseOffsetX = 0;
    let mouseOffsetY = 0;

    const render = () => {
      if (!inViewRef.current) {
        animId = requestAnimationFrame(render);
        return;
      }

      const p = Math.max(0, Math.min(1, progressRef.current));

      // Steadicam Path Evaluation
      const baseCam = cameraPosCurve.getPointAt(p);
      const baseLook = cameraLookCurve.getPointAt(p);

      // Subtle Damped Cockpit Mouse-Look Offset (±0.25 units)
      const targetMouseX = pointerRef.current.x * 0.28;
      const targetMouseY = pointerRef.current.y * 0.22;
      mouseOffsetX += (targetMouseX - mouseOffsetX) * 0.05;
      mouseOffsetY += (targetMouseY - mouseOffsetY) * 0.05;

      currentCamPos.copy(baseCam);
      currentCamPos.x += mouseOffsetX;
      currentCamPos.y += mouseOffsetY;
      camera.position.copy(currentCamPos);

      targetLookAt.copy(baseLook);
      targetLookAt.x += mouseOffsetX * 0.5;
      targetLookAt.y += mouseOffsetY * 0.5;
      currentLookAt.lerp(targetLookAt, 0.08);
      camera.lookAt(currentLookAt);

      // Animate Light Core Rotation in Room 03
      lightCore.rotation.y += 0.015;
      lightCore.rotation.x += 0.008;

      // Update Traveling Floor Pulse Position
      const pulseT = Math.min(1, p * 1.12);
      const pulsePos = railCurve.getPointAt(pulseT);
      pulseMesh.position.copy(pulsePos);

      // Subtly float exploded website model in Room 02
      explodedGroup.position.y = 2.4 + Math.sin(Date.now() * 0.0015) * 0.05;

      renderer.render(scene, camera);
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    // 9. Resize Handling
    const onResize = () => {
      if (!container) return;
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener("resize", onResize);

    // 10. Cleanup & Resource Disposal
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      limestoneTex.dispose();
      scene.clear();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden"
      aria-hidden="true"
    />
  );
}
