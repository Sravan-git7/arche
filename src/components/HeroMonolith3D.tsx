import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { MonolithMotionState, DOOR_Z } from "./monolithMotion";
import { oneRailStore } from "../lib/oneRailState";

export interface HeroMonolith3DProps {
  motionState?: MonolithMotionState;
  pointer?: { x: number; y: number };
  inView?: boolean;
  className?: string;
}

/**
 * THE ARCHÉ 4-PORTAL DOORS — Straight-Forward Z-Axis Fly-Through Viewport
 *
 * Implements 4 distinct, forward-facing 3D Portal Doors lined up straight along -Z:
 *  - Three.js PBR Studio IBL with RoomEnvironment + PMREMGenerator
 *  - ACESFilmicToneMapping & PCFSoftShadowMap
 *  - Atmospheric Studio Fog: THREE.FogExp2(0xf4f4ee, 0.038)
 *  - 4 Distinct Doors along -Z:
 *      Door 01 (z = 0):   Optical Cinema Iris Aperture
 *      Door 02 (z = -22): Exploded Interface Glass Stack
 *      Door 03 (z = -44): Kinetic Neural Prism
 *      Door 04 (z = -66): 4-Channel Dispatch Bus
 *  - Hollow Portal Frames with Center Openings for Genuine Camera Pass-Through
 *  - Continuous Center Floor Rail (x = 0, y = -2.06, spanning z: +10 to -75)
 *  - Subtle Horizontal Floor Distance Ticks every 3 units along Z
 *  - Forward-Racing #9EE41A Energy Pulse Packet with PointLight
 *  - Strictly Monotonic Forward Z Flight (x = 0 constant, zero sideways movement)
 */
export function HeroMonolith3D({
  motionState,
  pointer = { x: 0, y: 0 },
  inView = true,
  className,
}: HeroMonolith3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeMotion, setActiveMotion] = useState<MonolithMotionState>(() => motionState ?? oneRailStore.getMotionState());
  const motionRef = useRef<MonolithMotionState>(motionState ?? oneRailStore.getMotionState());
  motionRef.current = motionState ?? oneRailStore.getMotionState();
  const pointerRef = useRef(pointer);
  pointerRef.current = pointer;
  const inViewRef = useRef(inView);
  inViewRef.current = inView;

  useEffect(() => {
    if (motionState) {
      setActiveMotion(motionState);
    } else {
      return oneRailStore.subscribeMotion(() => {
        const ms = oneRailStore.getMotionState();
        motionRef.current = ms;
        setActiveMotion(ms);
      });
    }
  }, [motionState]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf4f4ee);
    scene.fog = new THREE.FogExp2(0xf4f4ee, 0.038);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 95);
    camera.position.set(0, 0, 8.5);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    container.appendChild(renderer.domElement);

    // 2. Studio IBL Environment (RoomEnvironment + PMREMGenerator)
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const roomEnv = new RoomEnvironment();
    const envTexture = pmrem.fromScene(roomEnv, 0.04).texture;
    scene.environment = envTexture;
    scene.environmentIntensity = 0.85;
    pmrem.dispose();

    // 3. Studio Lighting (Keylight tracks camera Z for uniform studio lighting)
    const hemiLight = new THREE.HemisphereLight(0xfffdf8, 0xeae7df, 0.95);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfffbf2, 1.35);
    keyLight.position.set(6, 12, 12);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 32;
    keyLight.shadow.camera.left = -7;
    keyLight.shadow.camera.right = 7;
    keyLight.shadow.camera.top = 7;
    keyLight.shadow.camera.bottom = -7;
    keyLight.shadow.bias = -0.0003;
    scene.add(keyLight);
    scene.add(keyLight.target);

    const fillLight = new THREE.DirectionalLight(0xf4f4ee, 0.7);
    fillLight.position.set(-8, 6, -4);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xe8e5dc, 0.6);
    rimLight.position.set(0, -6, -8);
    scene.add(rimLight);

    // Dynamic Traveling Light-Pulse Point Light along Center Floor Rail
    const pulseLight = new THREE.PointLight(0x9ee41a, 0, 4.0);
    pulseLight.position.set(0, -1.95, 0);
    scene.add(pulseLight);

    // 4. Materials (Strict Arché Palette)
    const charcoalMat = new THREE.MeshStandardMaterial({
      color: 0x141413,
      roughness: 0.28,
      metalness: 0.65,
    });

    const ceramicMat = new THREE.MeshStandardMaterial({
      color: 0xdfdcd2,
      roughness: 0.35,
      metalness: 0.08,
    });

    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0xeae7df,
      roughness: 0.38,
      metalness: 0.06,
    });

    const frostedGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.72,
      roughness: 0.12,
      ior: 1.48,
      thickness: 0.5,
      transparent: true,
      opacity: 1.0,
    });

    const limeGlowMat = new THREE.MeshStandardMaterial({
      color: 0x9ee41a,
      emissive: 0x9ee41a,
      emissiveIntensity: 2.2,
      roughness: 0.2,
      metalness: 0.1,
    });

    const floorGrooveMat = new THREE.MeshStandardMaterial({
      color: 0x1e1e1c,
      roughness: 0.45,
      metalness: 0.4,
    });

    const unchargedRailMat = new THREE.MeshStandardMaterial({
      color: 0xc8c5bb,
      roughness: 0.4,
      metalness: 0.2,
    });

    // 5. Continuous Studio Floor Plane & Extended "ONE RAIL" Center Floor Rail
    // Extended along +Z from z: +65 down to -75 across the #F4F4EE blueprint floor plane
    const railStartZ = 65;
    const railEndZ = -75;
    const grooveLength = railStartZ - railEndZ; // 140 units
    const railCenterZ = (railStartZ + railEndZ) / 2; // -5 units

    const studioFloorGeo = new THREE.PlaneGeometry(60, 160);
    const studioFloorMat = new THREE.MeshStandardMaterial({
      color: 0xf4f4ee,
      roughness: 0.9,
      metalness: 0.02,
    });
    const studioFloor = new THREE.Mesh(studioFloorGeo, studioFloorMat);
    studioFloor.rotation.x = -Math.PI / 2;
    studioFloor.position.set(0, -2.1, railCenterZ);
    studioFloor.receiveShadow = true;
    scene.add(studioFloor);

    // Subtle Architectural Drafting Gridlines across #F4F4EE floor plane
    const draftingGrid = new THREE.GridHelper(160, 80, 0x141413, 0x141413);
    draftingGrid.position.set(0, -2.09, railCenterZ);
    if (draftingGrid.material instanceof THREE.LineBasicMaterial) {
      draftingGrid.material.transparent = true;
      draftingGrid.material.opacity = 0.042;
    }
    scene.add(draftingGrid);

    // Straight Continuous Floor Groove (x: 0, spanning z: +65 to -75, length = 140)
    const grooveGeo = new THREE.BoxGeometry(0.14, 0.04, grooveLength);
    const grooveMesh = new THREE.Mesh(grooveGeo, floorGrooveMat);
    grooveMesh.position.set(0, -2.08, railCenterZ);
    grooveMesh.receiveShadow = true;
    scene.add(grooveMesh);

    // Continuous Base Floor Rail Wire (Uncharged segment along Z)
    const railWireGeo = new THREE.CylinderGeometry(0.016, 0.016, grooveLength, 16);
    const railWireMesh = new THREE.Mesh(railWireGeo, unchargedRailMat);
    railWireMesh.rotation.x = Math.PI / 2;
    railWireMesh.position.set(0, -2.05, railCenterZ);
    scene.add(railWireMesh);

    // Glowing #9EE41A Charged Line Segment (Scales with pulseZ)
    const chargedRailGeo = new THREE.CylinderGeometry(0.022, 0.022, 1, 16);
    const chargedRailMesh = new THREE.Mesh(chargedRailGeo, limeGlowMat);
    chargedRailMesh.rotation.x = Math.PI / 2;
    chargedRailMesh.position.set(0, -2.04, 0);
    scene.add(chargedRailMesh);

    // Forward Traveling Energy Pulse Capsule Packet
    const pulsePacketGeo = new RoundedBoxGeometry(0.11, 0.07, 0.38, 2, 0.02);
    const pulsePacketMesh = new THREE.Mesh(pulsePacketGeo, limeGlowMat);
    pulsePacketMesh.position.set(0, -2.02, 0);
    pulsePacketMesh.visible = false;
    scene.add(pulsePacketMesh);

    // Minimalist Horizontal Floor Distance Ticks (every 3 units along Z from +65 down to -70)
    const tickBarGeo = new THREE.BoxGeometry(0.55, 0.01, 0.04);
    const tickDotGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.015, 12);

    for (let tz = 65; tz >= -70; tz -= 3) {
      const tickBar = new THREE.Mesh(tickBarGeo, charcoalMat);
      tickBar.position.set(0, -2.06, tz);
      scene.add(tickBar);

      // Subtle lime accent dots on both ends of the tick bar
      const dotL = new THREE.Mesh(tickDotGeo, limeGlowMat);
      dotL.position.set(-0.28, -2.05, tz);
      scene.add(dotL);

      const dotR = new THREE.Mesh(tickDotGeo, limeGlowMat);
      dotR.position.set(0.28, -2.05, tz);
      scene.add(dotR);
    }

    // 6. The 4 Separate Physical 3D Portal Doors (Lined up along -Z: 0, -22, -44, -66)
    const doorRoots: THREE.Group[] = [];
    const doorShadows: THREE.Mesh[] = [];

    // Factory: Constructs an openable architectural portal archway with a hollow center doorway
    const createDoorPortal = (zPos: number) => {
      const doorGroup = new THREE.Group();
      doorGroup.position.set(0, 0, zPos);
      scene.add(doorGroup);
      doorRoots.push(doorGroup);

      // A. Portal Frame Archway (Left/Right jambs + Top lintel + Base threshold)
      // Generous center opening (width ~2.2, height ~3.0) for clear camera pass-through
      const jambGeo = new RoundedBoxGeometry(0.55, 3.2, 0.8, 4, 0.12);
      const leftJamb = new THREE.Mesh(jambGeo, charcoalMat);
      leftJamb.position.set(-1.35, 0, 0);
      leftJamb.castShadow = true;
      leftJamb.receiveShadow = true;
      doorGroup.add(leftJamb);

      const rightJamb = new THREE.Mesh(jambGeo, charcoalMat);
      rightJamb.position.set(1.35, 0, 0);
      rightJamb.castShadow = true;
      rightJamb.receiveShadow = true;
      doorGroup.add(rightJamb);

      // Top Lintel Header
      const lintelGeo = new RoundedBoxGeometry(3.25, 0.55, 0.8, 4, 0.12);
      const lintel = new THREE.Mesh(lintelGeo, charcoalMat);
      lintel.position.set(0, 1.6, 0);
      lintel.castShadow = true;
      lintel.receiveShadow = true;
      doorGroup.add(lintel);

      // Ceramic Top Cap Ledge
      const capGeo = new RoundedBoxGeometry(3.35, 0.16, 0.92, 4, 0.06);
      const topCap = new THREE.Mesh(capGeo, ceramicMat);
      topCap.position.set(0, 1.95, 0);
      topCap.castShadow = true;
      doorGroup.add(topCap);

      // Bottom Base Threshold
      const baseGeo = new RoundedBoxGeometry(3.25, 0.28, 0.92, 4, 0.08);
      const bottomThreshold = new THREE.Mesh(baseGeo, ceramicMat);
      bottomThreshold.position.set(0, -1.72, 0);
      bottomThreshold.castShadow = true;
      bottomThreshold.receiveShadow = true;
      doorGroup.add(bottomThreshold);

      // Connecting Floor Rail Plug at base
      const plugGeo = new RoundedBoxGeometry(0.18, 0.12, 0.45, 2, 0.02);
      const plug = new THREE.Mesh(plugGeo, charcoalMat);
      plug.position.set(0, -1.72, 0.42);
      plug.castShadow = true;
      doorGroup.add(plug);

      const plugLightGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.22, 12);
      const plugLight = new THREE.Mesh(plugLightGeo, limeGlowMat);
      plugLight.rotation.x = Math.PI / 2;
      plugLight.position.set(0, -1.72, 0.54);
      doorGroup.add(plugLight);

      // Grounded Floor Contact Shadow directly under this door
      const shadowGeo = new THREE.PlaneGeometry(5.2, 5.2);
      const shadowMat = new THREE.ShadowMaterial({ opacity: 0.16 });
      const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
      shadowPlane.rotation.x = -Math.PI / 2;
      shadowPlane.position.set(0, -2.09, zPos);
      shadowPlane.receiveShadow = true;
      scene.add(shadowPlane);
      doorShadows.push(shadowPlane);

      return doorGroup;
    };

    // Instantiate 4 Portals along -Z
    const door01Root = createDoorPortal(DOOR_Z[0]); // z = 0
    const door02Root = createDoorPortal(DOOR_Z[1]); // z = -22
    const door03Root = createDoorPortal(DOOR_Z[2]); // z = -44
    const door04Root = createDoorPortal(DOOR_Z[3]); // z = -66

    // -------------------------------------------------------------
    // DOOR 01: Cinema Optical Iris Aperture (Video Editing, z = 0)
    // Retracts wide outward (r > 1.35) during pass-through!
    // -------------------------------------------------------------
    const mod01Group = new THREE.Group();
    mod01Group.position.set(0, 0, 0.38);
    door01Root.add(mod01Group);

    const ring01 = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.05, 16, 48), charcoalMat);
    ring01.castShadow = true;
    mod01Group.add(ring01);

    const ring02 = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.04, 16, 48), stoneMat);
    ring02.position.z = 0.04;
    ring02.castShadow = true;
    mod01Group.add(ring02);

    const bladesGroup = new THREE.Group();
    bladesGroup.position.z = 0.05;
    mod01Group.add(bladesGroup);

    const bladeGeo = new RoundedBoxGeometry(0.38, 0.18, 0.025, 3, 0.02);
    const blades: THREE.Mesh[] = [];
    for (let k = 0; k < 6; k++) {
      const angle = (k / 6) * Math.PI * 2;
      const blade = new THREE.Mesh(bladeGeo, frostedGlassMat);
      blade.position.set(Math.cos(angle) * 0.35, Math.sin(angle) * 0.35, 0);
      blade.rotation.z = angle + 0.45;
      blade.castShadow = true;
      bladesGroup.add(blade);
      blades.push(blade);
    }

    // -------------------------------------------------------------
    // DOOR 02: Exploded Glass Interface Stack (Web Development, z = -22)
    // Left & Right sliding plates slide wide outward during pass-through!
    // -------------------------------------------------------------
    const mod02Group = new THREE.Group();
    mod02Group.position.set(0, 0, 0.38);
    door02Root.add(mod02Group);

    const halfPlateGeo = new RoundedBoxGeometry(0.85, 2.3, 0.035, 3, 0.03);
    const plate02L = new THREE.Mesh(halfPlateGeo, frostedGlassMat);
    plate02L.position.set(-0.48, 0, 0.08);
    plate02L.castShadow = true;
    mod02Group.add(plate02L);

    const plate02R = new THREE.Mesh(halfPlateGeo, frostedGlassMat);
    plate02R.position.set(0.48, 0, 0.08);
    plate02R.castShadow = true;
    mod02Group.add(plate02R);

    const plate03L = new THREE.Mesh(new RoundedBoxGeometry(0.75, 2.0, 0.03, 3, 0.025), charcoalMat);
    plate03L.position.set(-0.45, 0, 0.16);
    plate03L.castShadow = true;
    mod02Group.add(plate03L);

    const plate03R = new THREE.Mesh(new RoundedBoxGeometry(0.75, 2.0, 0.03, 3, 0.025), charcoalMat);
    plate03R.position.set(0.45, 0, 0.16);
    plate03R.castShadow = true;
    mod02Group.add(plate03R);

    // -------------------------------------------------------------
    // DOOR 03: Kinetic Neural Prism (AI Chatbots, z = -44)
    // Prism & orbiting nodes expand outward to clear pass-through corridor!
    // -------------------------------------------------------------
    const mod03Group = new THREE.Group();
    mod03Group.position.set(0, 0, 0.38);
    door03Root.add(mod03Group);

    const prismL = new THREE.Mesh(new RoundedBoxGeometry(0.75, 2.2, 0.18, 4, 0.04), frostedGlassMat);
    prismL.position.set(-0.52, 0, 0.09);
    prismL.castShadow = true;
    mod03Group.add(prismL);

    const prismR = new THREE.Mesh(new RoundedBoxGeometry(0.75, 2.2, 0.18, 4, 0.04), frostedGlassMat);
    prismR.position.set(0.52, 0, 0.09);
    prismR.castShadow = true;
    mod03Group.add(prismR);

    const neuralCoreL = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28, 0), limeGlowMat);
    neuralCoreL.position.set(-0.52, 0, 0.15);
    mod03Group.add(neuralCoreL);

    const neuralCoreR = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28, 0), limeGlowMat);
    neuralCoreR.position.set(0.52, 0, 0.15);
    mod03Group.add(neuralCoreR);

    const nodeGeo = new THREE.SphereGeometry(0.065, 16, 16);
    const nodes: THREE.Mesh[] = [];
    for (let k = 0; k < 4; k++) {
      const node = new THREE.Mesh(nodeGeo, limeGlowMat);
      mod03Group.add(node);
      nodes.push(node);
    }

    // -------------------------------------------------------------
    // DOOR 04: Synchronized 4-Channel Dispatch Bus (AI Automation, z = -66)
    // 4 Corner bus blocks retract outward into jambs to clear center!
    // -------------------------------------------------------------
    const mod04Group = new THREE.Group();
    mod04Group.position.set(0, 0, 0.38);
    door04Root.add(mod04Group);

    const blockGeo = new RoundedBoxGeometry(0.65, 0.65, 0.12, 3, 0.03);
    const blocks: THREE.Mesh[] = [];
    const blockBases = [
      [-0.65, 0.65],
      [0.65, 0.65],
      [-0.65, -0.65],
      [0.65, -0.65],
    ];
    blockBases.forEach(([bx, by]) => {
      const block = new THREE.Mesh(blockGeo, ceramicMat);
      block.position.set(bx, by, 0.08);
      block.castShadow = true;
      mod04Group.add(block);
      blocks.push(block);
    });

    // 7. Animation & Render Loop
    let animId = 0;
    let mouseOffsetX = 0;
    let mouseOffsetY = 0;

    const render = () => {
      if (!inViewRef.current) {
        animId = requestAnimationFrame(render);
        return;
      }

      const m = motionRef.current;
      const now = performance.now() * 0.001;

      // Micro cursor parallax (subtle look-offset only, camera stays on x = 0 track)
      const isLocked = m.subPhase === "INSPECTION";
      const targetMouseX = isLocked ? 0 : pointerRef.current.x * 0.05;
      const targetMouseY = isLocked ? 0 : pointerRef.current.y * 0.04;
      mouseOffsetX += (targetMouseX - mouseOffsetX) * 0.06;
      mouseOffsetY += (targetMouseY - mouseOffsetY) * 0.06;

      // A. Update Door Elevations (Act 0 rise on Door 01; zero group rotation!)
      doorRoots.forEach((root, i) => {
        root.rotation.set(0, 0, 0); // Strict ZERO rotation!
        const isDoor0Act0 = i === 0 && m.act0Active;
        const baseY = -0.36;
        root.position.set(0, isDoor0Act0 ? baseY + m.doorY : baseY, DOOR_Z[i]);
        root.scale.setScalar(isDoor0Act0 ? m.doorScale : 1.0);

        const sh = doorShadows[i];
        if (sh) {
          sh.position.set(0, -2.09, DOOR_Z[i]);
          sh.rotation.set(-Math.PI / 2, 0, 0);
        }
      });

      // B. Studio KeyLight Tracking (Travels along Z with camera for uniform PBR lighting)
      const lightY = 12 + Math.max(0, m.cameraY ?? 0);
      keyLight.position.set(6, lightY, m.cameraZ + 4);
      keyLight.target.position.set(0, -2.1, m.cameraZ - 6);

      // C. Master "ONE RAIL" Camera Rig (height, pitch, Z + micro pointer parallax)
      const camY = (m.cameraY ?? 0) + mouseOffsetY * 0.1;
      camera.position.set(mouseOffsetX * 0.15, camY, m.cameraZ);

      const pitch = m.cameraPitch ?? 0;
      camera.rotation.set(pitch, 0, m.cameraBankZ ?? 0);
      camera.fov = m.cameraFov;
      camera.updateProjectionMatrix();

      // D. Center Floor Rail & Forward Pulse Charging along Z
      const pulseZ = m.floorPulseZ;
      const railStartZ = 65;
      const chargedLength = Math.max(0.1, railStartZ - pulseZ);
      chargedRailMesh.scale.set(1, chargedLength, 1);
      chargedRailMesh.position.z = railStartZ - chargedLength * 0.5;

      if (m.floorPulseActive || m.subPhase === "TRAVEL") {
        pulsePacketMesh.visible = true;
        pulsePacketMesh.position.z = pulseZ;
        pulseLight.position.z = pulseZ;
        pulseLight.intensity = m.floorPulseIntensity;
      } else {
        pulsePacketMesh.visible = false;
        pulseLight.intensity = 0;
      }

      // E. Pass-Through Openings (Doors retract outward to clear camera corridor)
      const exp01 = m.moduleExpansions[0];
      const exp02 = m.moduleExpansions[1];
      const exp03 = m.moduleExpansions[2];
      const exp04 = m.moduleExpansions[3];

      // Door 01: Iris blades retract outward (r expands from 0.35 to 1.35)
      blades.forEach((b, k) => {
        const baseAngle = (k / 6) * Math.PI * 2;
        b.rotation.z = baseAngle + 0.45 + exp01 * 0.65;
        const radius = 0.35 + exp01 * 1.05; // 0.35 -> 1.40 (clears corridor!)
        b.position.x = Math.cos(baseAngle) * radius;
        b.position.y = Math.sin(baseAngle) * radius;
      });

      // Door 02: Glass stack plates split left and right
      plate02L.position.x = -0.48 - exp02 * 0.85; // Slides to -1.33
      plate02R.position.x = 0.48 + exp02 * 0.85; // Slides to +1.33
      plate03L.position.x = -0.45 - exp02 * 0.85;
      plate03R.position.x = 0.45 + exp02 * 0.85;

      // Door 03: Neural prism splits left and right, orbiting nodes expand orbit
      prismL.position.x = -0.52 - exp03 * 0.80;
      prismR.position.x = 0.52 + exp03 * 0.80;
      neuralCoreL.position.x = -0.52 - exp03 * 0.80;
      neuralCoreR.position.x = 0.52 + exp03 * 0.80;
      neuralCoreL.rotation.y += 0.02;
      neuralCoreR.rotation.y += 0.02;
      nodes.forEach((n, k) => {
        const orbitAngle = now * 1.8 + (k / 4) * Math.PI * 2;
        const nodeRadius = 0.45 + exp03 * 1.05;
        n.position.set(
          Math.cos(orbitAngle) * nodeRadius,
          Math.sin(orbitAngle) * (nodeRadius * 0.8),
          0.15 + Math.sin(now * 3 + k) * 0.1
        );
      });

      // Door 04: 4-Channel bus blocks retract outward into door corners
      blockBases.forEach(([bx, by], k) => {
        const block = blocks[k];
        if (block) {
          block.position.x = bx + (bx > 0 ? 0.65 : -0.65) * exp04;
          block.position.y = by + (by > 0 ? 0.65 : -0.65) * exp04;
        }
      });

      renderer.render(scene, camera);
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    // 8. Resize Handler
    const onResize = () => {
      if (!container) return;
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    const onPointerMove = (e: PointerEvent) => {
      pointerRef.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -((e.clientY / window.innerHeight) * 2 - 1),
      };
    };
    window.addEventListener("pointermove", onPointerMove);

    window.addEventListener("resize", onResize);

    // 9. Cleanup
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      envTexture.dispose();
      scene.clear();
    };
  }, []);

  const currentMotion = motionState ?? activeMotion;

  return (
    <div
      ref={containerRef}
      className={
        className ??
        "absolute inset-0 z-0 pointer-events-none select-none overflow-hidden"
      }
      style={{
        opacity: currentMotion.canvasOpacity,
        filter: currentMotion.canvasBlur > 0 ? `blur(${currentMotion.canvasBlur}px)` : "none",
        transform: currentMotion.subPhase === "INSPECTION" ? "scale(1.02)" : "scale(1)",
        transition: "opacity 0.15s ease-out, filter 0.15s ease-out",
      }}
      aria-hidden="true"
    />
  );
}
