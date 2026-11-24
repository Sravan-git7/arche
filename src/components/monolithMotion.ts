/**
 * ARCHÉ 4-PORTAL DOORS — Straight-Forward Z-Axis Fly-Through Motion Engine
 *
 * All 4 precision 3D Portal Doors are lined up straight along the -Z axis at x = 0:
 *   - Door 01: z = 0   (Optical Cinema Iris Aperture - Video Editing)
 *   - Door 02: z = -22 (Exploded Interface Glass Stack - Web Development)
 *   - Door 03: z = -44 (Kinetic Neural Prism - AI Chatbots)
 *   - Door 04: z = -66 (4-Channel Dispatch Bus - AI Automation)
 *
 * Camera Kinematics:
 *   - camera.position.x is ALWAYS 0 (constant, zero sideways translation).
 *   - camera.position.z moves STRICTLY forward along -Z (monotonically decreasing).
 *   - Zero cube rotation (all doors face forward towards +z).
 *
 * 4-Step Straight-Forward Choreography between Door N and Door N+1:
 *   Step 1: Approach & Reveal Door N (camera.position.z = doorZ + 7.6):
 *           Pulse hits Door N base -> Door N portal opens wide -> reveal title displays.
 *   Step 2: Zoom Straight Into Door N & Lock Inspection (z: doorZ + 7.6 -> doorZ + 2.6):
 *           Camera drives straight in, WebGL softens (opacity 0.18, blur 6px),
 *           inspection card zooms to scale 1.0 and locks 100% still.
 *   Step 3: Fly-Through Door N & Forward Flight to Door N+1 (z: doorZ + 2.6 -> nextDoorZ + 7.6):
 *           Card scales forward past camera (scale: 1.0 -> 1.18, opacity: 1 -> 0),
 *           camera passes through wide-open portal (doorZ + 2.6 -> doorZ - 0.0),
 *           flies down the straight #9EE41A floor line as Door N+1 emerges from fog.
 *   Step 4: Pulse Plug-In & Door N+1 Reveal (camera locks at nextDoorZ + 7.6).
 */

export const DOOR_SPACING_Z = 22;
export const DOOR_Z = [0, -22, -44, -66] as const;

export interface MonolithMotionState {
  act0Active: boolean;
  act0ShutterPart: number;
  act0Opacity: number;

  activeServiceIndex: number;
  subPhase: "REVEAL" | "ZOOM_IN" | "INSPECTION" | "PASS_THROUGH" | "TRAVEL";
  subPhaseProgress: number;

  // 3D Camera Flight Coordinates (x = 0 constant)
  cameraX: number; // Always 0
  cameraY: number; // 0 (slight vertical breathing in Act 0)
  cameraZ: number; // Strictly monotonic forward flight (+8.8 down to -63.4)
  cameraLookAtX: number; // 0
  cameraLookAtY: number; // 0
  cameraLookAtZ: number; // cameraZ - 10 (straight ahead)
  cameraBankZ: number; // 0 (subtle micro banking during fast transit)
  cameraFov: number; // 42° -> 50° -> 42°
  cameraPitch?: number; // Pitch angle in radians (-1.4835 rad / -85deg top-down -> 0 rad forward)
  activeSection?: string;
  telemetryLabel?: string;
  masterZ?: number;

  // Active Door Vertical Placement
  doorY: number; // Y offset (-1.35 in Act 0, -0.22 in Reveal, 0.0 in Inspection)
  doorScale: number; // 0.84 in Act 0, 1.0 in normal beats
  monolithAngleY: number; // ALWAYS 0 (Doors face forward, zero cube rotation)

  // 4 Individual Door Module Expansions (0.0 to 1.0 - open wide for pass-through)
  moduleExpansions: [number, number, number, number];

  // 4 Door Seam Pulse Illumination (0.0 to 1.0)
  doorSeamGlow: [number, number, number, number];

  // Center Floor Rail & Traveling Energy Pulse (along Z)
  floorRailProgress: number; // 0.0 to 1.0 (current position along rail z: +10 -> -66)
  floorPulseActive: boolean;
  floorPulseZ: number; // Live Z coord of light-packet on center floor rail
  floorPulseIntensity: number; // 0.0 -> 3.8

  // Canvas Viewport Visuals
  canvasOpacity: number; // 0.18 in inspection, 1.0 in transit/reveal
  canvasBlur: number; // 6px in inspection, 0px in transit/reveal

  // DOM Inspection Card & Presentation
  activeCardIndex: number; // 0, 1, 2, 3
  cardOpacity: number; // 0.0 -> 1.0
  cardScale: number; // 0.80 -> 1.0 in zoom-in; 1.0 -> 1.18 in pass-through!
  cardBlur: number; // 8px -> 0px
  cardPointerEvents: boolean;

  // Reveal Typography
  revealVisible: boolean;
  revealOpacity: number;
  revealIndex: number;

  // Telemetry & Swiss Odometer
  circuitProgress: number; // 0% -> 100%
  odometerReading: number; // 1.00 -> 4.00 continuous
}

export const STATION_PROGRESS = [0.185, 0.475, 0.765, 0.985] as const;

/** Mechanical smooth cubic ease-in-out */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Smoothstep ease */
function smoothstep(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

/** Easing out with crisp mechanical stop */
function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

export function computeMonolithMotion(p: number): MonolithMotionState {
  const clampedP = Math.max(0, Math.min(1, p));

  // -------------------------------------------------------------
  // ACT 0: Archway Intro & Shutter Split (0.000 -> 0.065)
  // Camera glides straight forward toward Door 01 (z: 8.5 -> 6.8, x: 0)
  // -------------------------------------------------------------
  if (clampedP < 0.065) {
    const act0Norm = clampedP / 0.065;
    const shutterPart = Math.max(0, (act0Norm - 0.20) / 0.80);
    const shutterOpacity = Math.max(0, 1 - shutterPart * 1.3);

    const rise = smoothstep(act0Norm);
    const doorY = -1.35 + rise * 1.13; // -1.35 to -0.22
    const doorScale = 0.84 + rise * 0.16;
    const cameraZ = 8.5 - rise * 1.7; // 8.5 down to 6.8

    return {
      act0Active: true,
      act0ShutterPart: shutterPart,
      act0Opacity: shutterOpacity,
      activeServiceIndex: 0,
      subPhase: "REVEAL",
      subPhaseProgress: act0Norm,
      cameraX: 0,
      cameraY: 0,
      cameraZ,
      cameraLookAtX: 0,
      cameraLookAtY: 0,
      cameraLookAtZ: cameraZ - 20,
      cameraBankZ: 0,
      cameraFov: 42,
      doorY,
      doorScale,
      monolithAngleY: 0,
      moduleExpansions: [0, 0, 0, 0],
      doorSeamGlow: [0, 0, 0, 0],
      floorRailProgress: 0,
      floorPulseActive: false,
      floorPulseZ: 0,
      floorPulseIntensity: 0,
      canvasOpacity: 1.0,
      canvasBlur: 0,
      activeCardIndex: 0,
      cardOpacity: 0,
      cardScale: 0.82,
      cardBlur: 8,
      cardPointerEvents: false,
      revealVisible: false,
      revealOpacity: 0,
      revealIndex: 0,
      circuitProgress: 0,
      odometerReading: 1.0,
    };
  }

  // -------------------------------------------------------------
  // CYCLE 0: SERVICE 01 — Video Editing at Door 01 (z = 0) (0.065 -> 0.270)
  // -------------------------------------------------------------
  if (clampedP < 0.270) {
    const doorZ = DOOR_Z[0]; // 0

    // Sub-Phase 1: Door 01 Reveal & Opening (0.065 -> 0.100)
    if (clampedP < 0.100) {
      const t = (clampedP - 0.065) / 0.035;
      const exp = easeOutQuad(t);
      const seamGlow = Math.sin(t * Math.PI) * 1.5;

      return {
        act0Active: false,
        act0ShutterPart: 1,
        act0Opacity: 0,
        activeServiceIndex: 0,
        subPhase: "REVEAL",
        subPhaseProgress: t,
        cameraX: 0,
        cameraY: 0,
        cameraZ: doorZ + 6.8, // 6.8 (Door fills ~55-65% viewport height)
        cameraLookAtX: 0,
        cameraLookAtY: 0,
        cameraLookAtZ: doorZ + 6.8 - 20,
        cameraBankZ: 0,
        cameraFov: 42,
        doorY: -0.22,
        doorScale: 1.0,
        monolithAngleY: 0,
        moduleExpansions: [exp, 0, 0, 0],
        doorSeamGlow: [seamGlow, 0, 0, 0],
        floorRailProgress: 0,
        floorPulseActive: false,
        floorPulseZ: doorZ,
        floorPulseIntensity: 0,
        canvasOpacity: 1.0,
        canvasBlur: 0,
        activeCardIndex: 0,
        cardOpacity: 0,
        cardScale: 0.82,
        cardBlur: 8,
        cardPointerEvents: false,
        revealVisible: true,
        revealOpacity: smoothstep(t),
        revealIndex: 0,
        circuitProgress: 0,
        odometerReading: 1.0,
      };
    }

    // Sub-Phase 2: Optical Zoom-In Straight into Door 01 (0.100 -> 0.140)
    if (clampedP < 0.140) {
      const t = (clampedP - 0.100) / 0.040;
      const easeT = easeInOutCubic(t);
      const camZ = 6.8 - easeT * 4.4; // 6.8 down to 2.4
      const fovBreath = Math.sin(t * Math.PI) * 8.0;
      const doorY = -0.22 * (1 - easeT);

      return {
        act0Active: false,
        act0ShutterPart: 1,
        act0Opacity: 0,
        activeServiceIndex: 0,
        subPhase: "ZOOM_IN",
        subPhaseProgress: t,
        cameraX: 0,
        cameraY: 0,
        cameraZ: camZ,
        cameraLookAtX: 0,
        cameraLookAtY: 0,
        cameraLookAtZ: camZ - 20,
        cameraBankZ: 0,
        cameraFov: 42 + fovBreath,
        doorY,
        doorScale: 1.0,
        monolithAngleY: 0,
        moduleExpansions: [1.0, 0, 0, 0],
        doorSeamGlow: [0, 0, 0, 0],
        floorRailProgress: 0,
        floorPulseActive: false,
        floorPulseZ: doorZ,
        floorPulseIntensity: 0,
        canvasOpacity: Math.max(0.18, 1.0 - t * 0.82),
        canvasBlur: t * 6,
        activeCardIndex: 0,
        cardOpacity: t,
        cardScale: 0.80 + t * 0.20, // 0.80 -> 1.00
        cardBlur: (1 - t) * 8,
        cardPointerEvents: t > 0.6,
        revealVisible: t < 0.6,
        revealOpacity: Math.max(0, 1 - t * 1.8),
        revealIndex: 0,
        circuitProgress: t * 8,
        odometerReading: 1.0,
      };
    }

    // Sub-Phase 3: Locked Rock-Steady Inspection (0.140 -> 0.230)
    if (clampedP < 0.230) {
      const t = (clampedP - 0.140) / 0.090;
      return {
        act0Active: false,
        act0ShutterPart: 1,
        act0Opacity: 0,
        activeServiceIndex: 0,
        subPhase: "INSPECTION",
        subPhaseProgress: t,
        cameraX: 0,
        cameraY: 0,
        cameraZ: 2.4, // Rock-steady at z = 2.4
        cameraLookAtX: 0,
        cameraLookAtY: 0,
        cameraLookAtZ: 2.4 - 20,
        cameraBankZ: 0,
        cameraFov: 42,
        doorY: 0,
        doorScale: 1.0,
        monolithAngleY: 0,
        moduleExpansions: [1.0, 0, 0, 0],
        doorSeamGlow: [0, 0, 0, 0],
        floorRailProgress: 0,
        floorPulseActive: false,
        floorPulseZ: doorZ,
        floorPulseIntensity: 0,
        canvasOpacity: 0.18,
        canvasBlur: 6,
        activeCardIndex: 0,
        cardOpacity: 1.0,
        cardScale: 1.0,
        cardBlur: 0,
        cardPointerEvents: true,
        revealVisible: false,
        revealOpacity: 0,
        revealIndex: 0,
        circuitProgress: 8 + t * 6,
        odometerReading: 1.0,
      };
    }

    // Sub-Phase 4: Pass-Through Door 01 & Card Forward Fly-Through (0.230 -> 0.270)
    // Card scales FORWARD past camera (1.0 -> 1.18, opacity 1 -> 0)
    // Camera passes through Door 01 portal (2.4 -> 0.0)
    {
      const t = (clampedP - 0.230) / 0.040;
      const easeT = easeInOutCubic(t);
      const camZ = 2.4 - easeT * 2.4; // 2.4 down to 0.0 (crosses door threshold)
      const cardScale = 1.0 + easeT * 0.18; // 1.0 -> 1.18 forward fly-through!

      return {
        act0Active: false,
        act0ShutterPart: 1,
        act0Opacity: 0,
        activeServiceIndex: 0,
        subPhase: "PASS_THROUGH",
        subPhaseProgress: t,
        cameraX: 0,
        cameraY: 0,
        cameraZ: camZ,
        cameraLookAtX: 0,
        cameraLookAtY: 0,
        cameraLookAtZ: camZ - 20,
        cameraBankZ: 0,
        cameraFov: 42,
        doorY: 0,
        doorScale: 1.0,
        monolithAngleY: 0,
        moduleExpansions: [1.0, 0, 0, 0], // Keeps open wide for pass-through!
        doorSeamGlow: [0, 0, 0, 0],
        floorRailProgress: 0.05 * t,
        floorPulseActive: false,
        floorPulseZ: doorZ,
        floorPulseIntensity: 0,
        canvasOpacity: 0.18 + t * 0.82,
        canvasBlur: Math.max(0, 6 * (1 - t)),
        activeCardIndex: 0,
        cardOpacity: Math.max(0, 1 - t * 1.2),
        cardScale,
        cardBlur: t * 8,
        cardPointerEvents: false,
        revealVisible: false,
        revealOpacity: 0,
        revealIndex: 0,
        circuitProgress: 14 + t * 4,
        odometerReading: 1.0 + t * 0.08,
      };
    }
  }

  // -------------------------------------------------------------
  // TRANSIT 1: Straight Forward Flight Door 01 -> Door 02 (0.270 -> 0.355)
  // Camera glides straight forward down the center rail: z: 0.0 -> -15.2
  // Glowing #9EE41A pulse races straight forward ahead of camera (0 -> -22)!
  // Door 02 emerges smoothly out of #F4F4EE studio fog.
  // -------------------------------------------------------------
  if (clampedP < 0.355) {
    const t = (clampedP - 0.270) / 0.085;
    const easeT = easeInOutCubic(t);
    const startCamZ = 0.0;
    const targetCamZ = DOOR_Z[1] + 6.8; // -22 + 6.8 = -15.2
    const camZ = startCamZ + easeT * (targetCamZ - startCamZ); // 0.0 -> -15.2
    const pulseZ = 0.0 + easeT * DOOR_Z[1]; // 0.0 -> -22.0
    const pulseIntensity = Math.sin(t * Math.PI) * 3.8;
    const railFrac = Math.abs(pulseZ) / 66.0;

    return {
      act0Active: false,
      act0ShutterPart: 1,
      act0Opacity: 0,
      activeServiceIndex: 1, // Switched to upcoming Service 02
      subPhase: "TRAVEL",
      subPhaseProgress: t,
      cameraX: 0,
      cameraY: 0,
      cameraZ: camZ,
      cameraLookAtX: 0,
      cameraLookAtY: 0,
      cameraLookAtZ: camZ - 20,
      cameraBankZ: 0,
      cameraFov: 42,
      doorY: -0.22,
      doorScale: 1.0,
      monolithAngleY: 0,
      moduleExpansions: [1.0, 0, 0, 0],
      doorSeamGlow: [0, 0, 0, 0],
      floorRailProgress: railFrac,
      floorPulseActive: true,
      floorPulseZ: pulseZ,
      floorPulseIntensity: pulseIntensity,
      canvasOpacity: 1.0,
      canvasBlur: 0,
      activeCardIndex: 1,
      cardOpacity: 0,
      cardScale: 0.80,
      cardBlur: 8,
      cardPointerEvents: false,
      revealVisible: false,
      revealOpacity: 0,
      revealIndex: 1,
      circuitProgress: 18 + t * 15,
      odometerReading: 1.08 + easeT * 0.92, // Rolls 1.08 -> 2.00
    };
  }

  // -------------------------------------------------------------
  // CYCLE 1: SERVICE 02 — Web Development at Door 02 (z = -22) (0.355 -> 0.560)
  // -------------------------------------------------------------
  if (clampedP < 0.560) {
    const doorZ = DOOR_Z[1]; // -22

    // Sub-Phase 1: Pulse Plug-In & Door 02 Opening (0.355 -> 0.390)
    if (clampedP < 0.390) {
      const t = (clampedP - 0.355) / 0.035;
      const exp = easeOutQuad(t);
      const seamGlow = Math.sin(t * Math.PI) * 1.5;

      return {
        act0Active: false,
        act0ShutterPart: 1,
        act0Opacity: 0,
        activeServiceIndex: 1,
        subPhase: "REVEAL",
        subPhaseProgress: t,
        cameraX: 0,
        cameraY: 0,
        cameraZ: doorZ + 6.8, // -15.2
        cameraLookAtX: 0,
        cameraLookAtY: 0,
        cameraLookAtZ: doorZ + 6.8 - 20,
        cameraBankZ: 0,
        cameraFov: 42,
        doorY: -0.22,
        doorScale: 1.0,
        monolithAngleY: 0,
        moduleExpansions: [1.0, exp, 0, 0],
        doorSeamGlow: [0, seamGlow, 0, 0],
        floorRailProgress: 22.0 / 66.0,
        floorPulseActive: t < 0.4,
        floorPulseZ: doorZ,
        floorPulseIntensity: Math.max(0, 1 - t * 2.5),
        canvasOpacity: 1.0,
        canvasBlur: 0,
        activeCardIndex: 1,
        cardOpacity: 0,
        cardScale: 0.80,
        cardBlur: 8,
        cardPointerEvents: false,
        revealVisible: true,
        revealOpacity: smoothstep(t),
        revealIndex: 1,
        circuitProgress: 33,
        odometerReading: 2.0,
      };
    }

    // Sub-Phase 2: Optical Zoom-In into Door 02 (0.390 -> 0.430)
    if (clampedP < 0.430) {
      const t = (clampedP - 0.390) / 0.040;
      const easeT = easeInOutCubic(t);
      const camZ = doorZ + 6.8 - easeT * 4.4; // -15.2 -> -19.6
      const fovBreath = Math.sin(t * Math.PI) * 8.0;
      const doorY = -0.22 * (1 - easeT);

      return {
        act0Active: false,
        act0ShutterPart: 1,
        act0Opacity: 0,
        activeServiceIndex: 1,
        subPhase: "ZOOM_IN",
        subPhaseProgress: t,
        cameraX: 0,
        cameraY: 0,
        cameraZ: camZ,
        cameraLookAtX: 0,
        cameraLookAtY: 0,
        cameraLookAtZ: camZ - 20,
        cameraBankZ: 0,
        cameraFov: 42 + fovBreath,
        doorY,
        doorScale: 1.0,
        monolithAngleY: 0,
        moduleExpansions: [1.0, 1.0, 0, 0],
        doorSeamGlow: [0, 0, 0, 0],
        floorRailProgress: 22.0 / 66.0,
        floorPulseActive: false,
        floorPulseZ: doorZ,
        floorPulseIntensity: 0,
        canvasOpacity: Math.max(0.18, 1.0 - t * 0.82),
        canvasBlur: t * 6,
        activeCardIndex: 1,
        cardOpacity: t,
        cardScale: 0.80 + t * 0.20,
        cardBlur: (1 - t) * 8,
        cardPointerEvents: t > 0.6,
        revealVisible: t < 0.6,
        revealOpacity: Math.max(0, 1 - t * 1.8),
        revealIndex: 1,
        circuitProgress: 33 + t * 8,
        odometerReading: 2.0,
      };
    }

    // Sub-Phase 3: Locked Rock-Steady Inspection (0.430 -> 0.520)
    if (clampedP < 0.520) {
      const t = (clampedP - 0.430) / 0.090;
      return {
        act0Active: false,
        act0ShutterPart: 1,
        act0Opacity: 0,
        activeServiceIndex: 1,
        subPhase: "INSPECTION",
        subPhaseProgress: t,
        cameraX: 0,
        cameraY: 0,
        cameraZ: doorZ + 2.4, // -19.6
        cameraLookAtX: 0,
        cameraLookAtY: 0,
        cameraLookAtZ: doorZ + 2.4 - 20,
        cameraBankZ: 0,
        cameraFov: 42,
        doorY: 0,
        doorScale: 1.0,
        monolithAngleY: 0,
        moduleExpansions: [1.0, 1.0, 0, 0],
        doorSeamGlow: [0, 0, 0, 0],
        floorRailProgress: 22.0 / 66.0,
        floorPulseActive: false,
        floorPulseZ: doorZ,
        floorPulseIntensity: 0,
        canvasOpacity: 0.18,
        canvasBlur: 6,
        activeCardIndex: 1,
        cardOpacity: 1.0,
        cardScale: 1.0,
        cardBlur: 0,
        cardPointerEvents: true,
        revealVisible: false,
        revealOpacity: 0,
        revealIndex: 1,
        circuitProgress: 41 + t * 6,
        odometerReading: 2.0,
      };
    }

    // Sub-Phase 4: Pass-Through Door 02 & Card Forward Fly-Through (0.520 -> 0.560)
    {
      const t = (clampedP - 0.520) / 0.040;
      const easeT = easeInOutCubic(t);
      const camZ = doorZ + 2.4 - easeT * 2.4; // -19.6 -> -22.0 (crosses threshold of Door 02)
      const cardScale = 1.0 + easeT * 0.18;

      return {
        act0Active: false,
        act0ShutterPart: 1,
        act0Opacity: 0,
        activeServiceIndex: 1,
        subPhase: "PASS_THROUGH",
        subPhaseProgress: t,
        cameraX: 0,
        cameraY: 0,
        cameraZ: camZ,
        cameraLookAtX: 0,
        cameraLookAtY: 0,
        cameraLookAtZ: camZ - 20,
        cameraBankZ: 0,
        cameraFov: 42,
        doorY: 0,
        doorScale: 1.0,
        monolithAngleY: 0,
        moduleExpansions: [1.0, 1.0, 0, 0],
        doorSeamGlow: [0, 0, 0, 0],
        floorRailProgress: 22.0 / 66.0,
        floorPulseActive: false,
        floorPulseZ: doorZ,
        floorPulseIntensity: 0,
        canvasOpacity: 0.18 + t * 0.82,
        canvasBlur: Math.max(0, 6 * (1 - t)),
        activeCardIndex: 1,
        cardOpacity: Math.max(0, 1 - t * 1.2),
        cardScale,
        cardBlur: t * 8,
        cardPointerEvents: false,
        revealVisible: false,
        revealOpacity: 0,
        revealIndex: 1,
        circuitProgress: 47 + t * 4,
        odometerReading: 2.0 + t * 0.08,
      };
    }
  }

  // -------------------------------------------------------------
  // TRANSIT 2: Straight Forward Flight Door 02 -> Door 03 (0.560 -> 0.645)
  // Camera glides straight forward down the center rail: z: -22.0 -> -37.2
  // Glowing #9EE41A pulse races straight forward ahead (-22 -> -44)!
  // -------------------------------------------------------------
  if (clampedP < 0.645) {
    const t = (clampedP - 0.560) / 0.085;
    const easeT = easeInOutCubic(t);
    const startCamZ = DOOR_Z[1]; // -22.0
    const targetCamZ = DOOR_Z[2] + 6.8; // -44 + 6.8 = -37.2
    const camZ = startCamZ + easeT * (targetCamZ - startCamZ); // -22.0 -> -37.2
    const pulseZ = DOOR_Z[1] + easeT * (DOOR_Z[2] - DOOR_Z[1]); // -22 -> -44
    const pulseIntensity = Math.sin(t * Math.PI) * 3.8;
    const railFrac = Math.abs(pulseZ) / 66.0;

    return {
      act0Active: false,
      act0ShutterPart: 1,
      act0Opacity: 0,
      activeServiceIndex: 2,
      subPhase: "TRAVEL",
      subPhaseProgress: t,
      cameraX: 0,
      cameraY: 0,
      cameraZ: camZ,
      cameraLookAtX: 0,
      cameraLookAtY: 0,
      cameraLookAtZ: camZ - 20,
      cameraBankZ: 0,
      cameraFov: 42,
      doorY: -0.22,
      doorScale: 1.0,
      monolithAngleY: 0,
      moduleExpansions: [1.0, 1.0, 0, 0],
      doorSeamGlow: [0, 0, 0, 0],
      floorRailProgress: railFrac,
      floorPulseActive: true,
      floorPulseZ: pulseZ,
      floorPulseIntensity: pulseIntensity,
      canvasOpacity: 1.0,
      canvasBlur: 0,
      activeCardIndex: 2,
      cardOpacity: 0,
      cardScale: 0.80,
      cardBlur: 8,
      cardPointerEvents: false,
      revealVisible: false,
      revealOpacity: 0,
      revealIndex: 2,
      circuitProgress: 51 + t * 15,
      odometerReading: 2.08 + easeT * 0.92, // Rolls 2.08 -> 3.00
    };
  }

  // -------------------------------------------------------------
  // CYCLE 2: SERVICE 03 — AI Chatbots at Door 03 (z = -44) (0.645 -> 0.850)
  // -------------------------------------------------------------
  if (clampedP < 0.850) {
    const doorZ = DOOR_Z[2]; // -44

    // Sub-Phase 1: Pulse Plug-In & Door 03 Opening (0.645 -> 0.680)
    if (clampedP < 0.680) {
      const t = (clampedP - 0.645) / 0.035;
      const exp = easeOutQuad(t);
      const seamGlow = Math.sin(t * Math.PI) * 1.5;

      return {
        act0Active: false,
        act0ShutterPart: 1,
        act0Opacity: 0,
        activeServiceIndex: 2,
        subPhase: "REVEAL",
        subPhaseProgress: t,
        cameraX: 0,
        cameraY: 0,
        cameraZ: doorZ + 6.8, // -37.2
        cameraLookAtX: 0,
        cameraLookAtY: 0,
        cameraLookAtZ: doorZ + 6.8 - 20,
        cameraBankZ: 0,
        cameraFov: 42,
        doorY: -0.22,
        doorScale: 1.0,
        monolithAngleY: 0,
        moduleExpansions: [1.0, 1.0, exp, 0],
        doorSeamGlow: [0, 0, seamGlow, 0],
        floorRailProgress: 44.0 / 66.0,
        floorPulseActive: t < 0.4,
        floorPulseZ: doorZ,
        floorPulseIntensity: Math.max(0, 1 - t * 2.5),
        canvasOpacity: 1.0,
        canvasBlur: 0,
        activeCardIndex: 2,
        cardOpacity: 0,
        cardScale: 0.80,
        cardBlur: 8,
        cardPointerEvents: false,
        revealVisible: true,
        revealOpacity: smoothstep(t),
        revealIndex: 2,
        circuitProgress: 66,
        odometerReading: 3.0,
      };
    }

    // Sub-Phase 2: Optical Zoom-In into Door 03 (0.680 -> 0.720)
    if (clampedP < 0.720) {
      const t = (clampedP - 0.680) / 0.040;
      const easeT = easeInOutCubic(t);
      const camZ = doorZ + 6.8 - easeT * 4.4; // -37.2 -> -41.6
      const fovBreath = Math.sin(t * Math.PI) * 8.0;
      const doorY = -0.22 * (1 - easeT);

      return {
        act0Active: false,
        act0ShutterPart: 1,
        act0Opacity: 0,
        activeServiceIndex: 2,
        subPhase: "ZOOM_IN",
        subPhaseProgress: t,
        cameraX: 0,
        cameraY: 0,
        cameraZ: camZ,
        cameraLookAtX: 0,
        cameraLookAtY: 0,
        cameraLookAtZ: camZ - 20,
        cameraBankZ: 0,
        cameraFov: 42 + fovBreath,
        doorY,
        doorScale: 1.0,
        monolithAngleY: 0,
        moduleExpansions: [1.0, 1.0, 1.0, 0],
        doorSeamGlow: [0, 0, 0, 0],
        floorRailProgress: 44.0 / 66.0,
        floorPulseActive: false,
        floorPulseZ: doorZ,
        floorPulseIntensity: 0,
        canvasOpacity: Math.max(0.18, 1.0 - t * 0.82),
        canvasBlur: t * 6,
        activeCardIndex: 2,
        cardOpacity: t,
        cardScale: 0.80 + t * 0.20,
        cardBlur: (1 - t) * 8,
        cardPointerEvents: t > 0.6,
        revealVisible: t < 0.6,
        revealOpacity: Math.max(0, 1 - t * 1.8),
        revealIndex: 2,
        circuitProgress: 66 + t * 8,
        odometerReading: 3.0,
      };
    }

    // Sub-Phase 3: Locked Rock-Steady Inspection (0.720 -> 0.810)
    if (clampedP < 0.810) {
      const t = (clampedP - 0.720) / 0.090;
      return {
        act0Active: false,
        act0ShutterPart: 1,
        act0Opacity: 0,
        activeServiceIndex: 2,
        subPhase: "INSPECTION",
        subPhaseProgress: t,
        cameraX: 0,
        cameraY: 0,
        cameraZ: doorZ + 2.4, // -41.6
        cameraLookAtX: 0,
        cameraLookAtY: 0,
        cameraLookAtZ: doorZ + 2.4 - 20,
        cameraBankZ: 0,
        cameraFov: 42,
        doorY: 0,
        doorScale: 1.0,
        monolithAngleY: 0,
        moduleExpansions: [1.0, 1.0, 1.0, 0],
        doorSeamGlow: [0, 0, 0, 0],
        floorRailProgress: 44.0 / 66.0,
        floorPulseActive: false,
        floorPulseZ: doorZ,
        floorPulseIntensity: 0,
        canvasOpacity: 0.18,
        canvasBlur: 6,
        activeCardIndex: 2,
        cardOpacity: 1.0,
        cardScale: 1.0,
        cardBlur: 0,
        cardPointerEvents: true,
        revealVisible: false,
        revealOpacity: 0,
        revealIndex: 2,
        circuitProgress: 74 + t * 6,
        odometerReading: 3.0,
      };
    }

    // Sub-Phase 4: Pass-Through Door 03 & Card Forward Fly-Through (0.810 -> 0.850)
    {
      const t = (clampedP - 0.810) / 0.040;
      const easeT = easeInOutCubic(t);
      const camZ = doorZ + 2.4 - easeT * 2.4; // -41.6 -> -44.0 (crosses threshold of Door 03)
      const cardScale = 1.0 + easeT * 0.18;

      return {
        act0Active: false,
        act0ShutterPart: 1,
        act0Opacity: 0,
        activeServiceIndex: 2,
        subPhase: "PASS_THROUGH",
        subPhaseProgress: t,
        cameraX: 0,
        cameraY: 0,
        cameraZ: camZ,
        cameraLookAtX: 0,
        cameraLookAtY: 0,
        cameraLookAtZ: camZ - 20,
        cameraBankZ: 0,
        cameraFov: 42,
        doorY: 0,
        doorScale: 1.0,
        monolithAngleY: 0,
        moduleExpansions: [1.0, 1.0, 1.0, 0],
        doorSeamGlow: [0, 0, 0, 0],
        floorRailProgress: 44.0 / 66.0,
        floorPulseActive: false,
        floorPulseZ: doorZ,
        floorPulseIntensity: 0,
        canvasOpacity: 0.18 + t * 0.82,
        canvasBlur: Math.max(0, 6 * (1 - t)),
        activeCardIndex: 2,
        cardOpacity: Math.max(0, 1 - t * 1.2),
        cardScale,
        cardBlur: t * 8,
        cardPointerEvents: false,
        revealVisible: false,
        revealOpacity: 0,
        revealIndex: 2,
        circuitProgress: 80 + t * 4,
        odometerReading: 3.0 + t * 0.08,
      };
    }
  }

  // -------------------------------------------------------------
  // TRANSIT 3: Straight Forward Flight Door 03 -> Door 04 (0.850 -> 0.935)
  // Camera glides straight forward down the center rail: z: -44.0 -> -59.2
  // Glowing #9EE41A pulse races straight forward ahead (-44 -> -66)!
  // -------------------------------------------------------------
  if (clampedP < 0.935) {
    const t = (clampedP - 0.850) / 0.085;
    const easeT = easeInOutCubic(t);
    const startCamZ = DOOR_Z[2]; // -44.0
    const targetCamZ = DOOR_Z[3] + 6.8; // -66 + 6.8 = -59.2
    const camZ = startCamZ + easeT * (targetCamZ - startCamZ); // -44.0 -> -59.2
    const pulseZ = DOOR_Z[2] + easeT * (DOOR_Z[3] - DOOR_Z[2]); // -44 -> -66
    const pulseIntensity = Math.sin(t * Math.PI) * 3.8;
    const railFrac = Math.abs(pulseZ) / 66.0;

    return {
      act0Active: false,
      act0ShutterPart: 1,
      act0Opacity: 0,
      activeServiceIndex: 3,
      subPhase: "TRAVEL",
      subPhaseProgress: t,
      cameraX: 0,
      cameraY: 0,
      cameraZ: camZ,
      cameraLookAtX: 0,
      cameraLookAtY: 0,
      cameraLookAtZ: camZ - 20,
      cameraBankZ: 0,
      cameraFov: 42,
      doorY: -0.22,
      doorScale: 1.0,
      monolithAngleY: 0,
      moduleExpansions: [1.0, 1.0, 1.0, 0],
      doorSeamGlow: [0, 0, 0, 0],
      floorRailProgress: railFrac,
      floorPulseActive: true,
      floorPulseZ: pulseZ,
      floorPulseIntensity: pulseIntensity,
      canvasOpacity: 1.0,
      canvasBlur: 0,
      activeCardIndex: 3,
      cardOpacity: 0,
      cardScale: 0.80,
      cardBlur: 8,
      cardPointerEvents: false,
      revealVisible: false,
      revealOpacity: 0,
      revealIndex: 3,
      circuitProgress: 84 + t * 15,
      odometerReading: 3.08 + easeT * 0.92, // Rolls 3.08 -> 4.00
    };
  }

  // -------------------------------------------------------------
  // CYCLE 3: SERVICE 04 — AI Automation at Door 04 (z = -66) (0.935 -> 1.000)
  // -------------------------------------------------------------
  {
    const doorZ = DOOR_Z[3]; // -66

    // Sub-Phase 1: Pulse Plug-In & Door 04 Opening (0.935 -> 0.955)
    if (clampedP < 0.955) {
      const t = (clampedP - 0.935) / 0.020;
      const exp = easeOutQuad(t);
      const seamGlow = Math.sin(t * Math.PI) * 1.5;

      return {
        act0Active: false,
        act0ShutterPart: 1,
        act0Opacity: 0,
        activeServiceIndex: 3,
        subPhase: "REVEAL",
        subPhaseProgress: t,
        cameraX: 0,
        cameraY: 0,
        cameraZ: doorZ + 6.8, // -59.2
        cameraLookAtX: 0,
        cameraLookAtY: 0,
        cameraLookAtZ: doorZ + 6.8 - 20,
        cameraBankZ: 0,
        cameraFov: 42,
        doorY: -0.22,
        doorScale: 1.0,
        monolithAngleY: 0,
        moduleExpansions: [1.0, 1.0, 1.0, exp],
        doorSeamGlow: [0, 0, 0, seamGlow],
        floorRailProgress: 1.0,
        floorPulseActive: t < 0.5,
        floorPulseZ: doorZ,
        floorPulseIntensity: Math.max(0, 1 - t * 2.0),
        canvasOpacity: 1.0,
        canvasBlur: 0,
        activeCardIndex: 3,
        cardOpacity: 0,
        cardScale: 0.80,
        cardBlur: 8,
        cardPointerEvents: false,
        revealVisible: true,
        revealOpacity: smoothstep(t),
        revealIndex: 3,
        circuitProgress: 98,
        odometerReading: 4.0,
      };
    }

    // Sub-Phase 2: Optical Zoom-In into Door 04 (0.955 -> 0.970)
    if (clampedP < 0.970) {
      const t = (clampedP - 0.955) / 0.015;
      const easeT = easeInOutCubic(t);
      const camZ = doorZ + 6.8 - easeT * 4.4; // -59.2 -> -63.6
      const fovBreath = Math.sin(t * Math.PI) * 8.0;
      const doorY = -0.22 * (1 - easeT);

      return {
        act0Active: false,
        act0ShutterPart: 1,
        act0Opacity: 0,
        activeServiceIndex: 3,
        subPhase: "ZOOM_IN",
        subPhaseProgress: t,
        cameraX: 0,
        cameraY: 0,
        cameraZ: camZ,
        cameraLookAtX: 0,
        cameraLookAtY: 0,
        cameraLookAtZ: camZ - 20,
        cameraBankZ: 0,
        cameraFov: 42 + fovBreath,
        doorY,
        doorScale: 1.0,
        monolithAngleY: 0,
        moduleExpansions: [1.0, 1.0, 1.0, 1.0],
        doorSeamGlow: [0, 0, 0, 0],
        floorRailProgress: 1.0,
        floorPulseActive: false,
        floorPulseZ: doorZ,
        floorPulseIntensity: 0,
        canvasOpacity: Math.max(0.18, 1.0 - t * 0.82),
        canvasBlur: t * 6,
        activeCardIndex: 3,
        cardOpacity: t,
        cardScale: 0.80 + t * 0.20,
        cardBlur: (1 - t) * 8,
        cardPointerEvents: t > 0.6,
        revealVisible: t < 0.6,
        revealOpacity: Math.max(0, 1 - t * 1.8),
        revealIndex: 3,
        circuitProgress: 99,
        odometerReading: 4.0,
      };
    }

    // Sub-Phase 3: Locked Rock-Steady Inspection (0.970 -> 1.000)
    const t = (clampedP - 0.970) / 0.030;
    return {
      act0Active: false,
      act0ShutterPart: 1,
      act0Opacity: 0,
      activeServiceIndex: 3,
      subPhase: "INSPECTION",
      subPhaseProgress: t,
      cameraX: 0,
      cameraY: 0,
      cameraZ: doorZ + 2.4, // -63.6
      cameraLookAtX: 0,
      cameraLookAtY: 0,
      cameraLookAtZ: doorZ + 2.4 - 20,
      cameraBankZ: 0,
      cameraFov: 42,
      doorY: 0,
      doorScale: 1.0,
      monolithAngleY: 0,
      moduleExpansions: [1.0, 1.0, 1.0, 1.0],
      doorSeamGlow: [0, 0, 0, 0],
      floorRailProgress: 1.0,
      floorPulseActive: false,
      floorPulseZ: doorZ,
      floorPulseIntensity: 0,
      canvasOpacity: 0.18,
      canvasBlur: 6,
      activeCardIndex: 3,
      cardOpacity: 1.0,
      cardScale: 1.0,
      cardBlur: 0,
      cardPointerEvents: true,
      revealVisible: false,
      revealOpacity: 0,
      revealIndex: 3,
      circuitProgress: 100,
      odometerReading: 4.0,
    };
  }
}
