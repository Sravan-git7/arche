import { MonolithMotionState } from "../components/monolithMotion";
import { ScrollTrigger } from "./gsap";

export interface MasterChapter {
  id: string;
  number: string;
  label: string;
  defaultZ: string;
}

export const MASTER_CHAPTERS: MasterChapter[] = [
  { id: "hero", number: "01", label: "HERO", defaultZ: "01 · HERO" },
  { id: "tension", number: "02", label: "TENSION", defaultZ: "02 · TENSION" },
  { id: "services", number: "03", label: "SERVICES", defaultZ: "03 · SERVICES" },
  { id: "difference", number: "04", label: "STUDIO", defaultZ: "04 · STUDIO" },
  { id: "process", number: "05", label: "PROCESS", defaultZ: "05 · PROCESS" },
  { id: "work", number: "06", label: "WORK", defaultZ: "06 · WORK" },
  { id: "faq", number: "07", label: "FAQ", defaultZ: "07 · FAQ" },
];

export interface OneRailTelemetryData {
  chapterIdx: number;
  chapterLabel: string;
  telemetry: string;
  masterZ: number;
  sectionProgress: number;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Creates default top-down blueprint motion state for Act I (Hero & Problem)
 */
function createBlueprintMotion(section: "HERO" | "PROBLEM", progress = 0): MonolithMotionState {
  const isHero = section === "HERO";
  const z = isHero ? 60.0 : 32.0;

  return {
    act0Active: false,
    act0ShutterPart: 0,
    act0Opacity: 0,
    activeServiceIndex: 0,
    subPhase: "TRAVEL",
    subPhaseProgress: 0,
    cameraX: 0,
    cameraY: 14.0, // Top-down overhead blueprint view
    cameraZ: z,
    cameraLookAtX: 0,
    cameraLookAtY: 0,
    cameraLookAtZ: z - 20,
    cameraBankZ: 0,
    cameraFov: 42,
    cameraPitch: -1.4835, // -85deg top-down pitch
    activeSection: section,
    telemetryLabel: isHero ? "HERO // Z: +60" : "PROBLEM // Z: +32",
    masterZ: z,
    doorY: -1.35,
    doorScale: 0.84,
    monolithAngleY: 0,
    moduleExpansions: [0, 0, 0, 0],
    doorSeamGlow: [0, 0, 0, 0],
    floorRailProgress: isHero ? 0.05 : 0.25,
    floorPulseActive: true,
    floorPulseZ: z - progress * 12,
    floorPulseIntensity: 2.2,
    canvasOpacity: 1.0,
    canvasBlur: 0,
    activeCardIndex: 0,
    cardOpacity: 0,
    cardScale: 0.8,
    cardBlur: 0,
    cardPointerEvents: false,
    revealVisible: false,
    revealOpacity: 0,
    revealIndex: 0,
    circuitProgress: isHero ? 0 : 25,
    odometerReading: isHero ? 1.0 : 2.0,
  };
}

/**
 * Creates the continuous pitch-down handoff motion state between Problem and Services
 * Smoothly lowers cameraY (14.0 -> 0.0), cameraPitch (-85deg -> 0deg), and cameraZ (32.0 -> 8.5)
 */
function createHandoffMotion(progress: number): MonolithMotionState {
  const p = Math.max(0, Math.min(1, progress));
  const t = easeInOutCubic(p);

  const camY = 14.0 * (1 - t);
  const pitch = -1.4835 * (1 - t);
  const camZ = 32.0 - t * (32.0 - 8.5);

  const zFormatted = camZ >= 0 ? `+${camZ.toFixed(0).padStart(2, "0")}` : camZ.toFixed(0);

  return {
    act0Active: p > 0.85,
    act0ShutterPart: 0,
    act0Opacity: 0,
    activeServiceIndex: 0,
    subPhase: "TRAVEL",
    subPhaseProgress: p,
    cameraX: 0,
    cameraY: camY,
    cameraZ: camZ,
    cameraLookAtX: 0,
    cameraLookAtY: 0,
    cameraLookAtZ: camZ - 20,
    cameraBankZ: 0,
    cameraFov: 42,
    cameraPitch: pitch,
    activeSection: "SERVICES",
    telemetryLabel: `ENTRANCE // Z: ${zFormatted}`,
    masterZ: camZ,
    doorY: -1.35,
    doorScale: 0.84,
    monolithAngleY: 0,
    moduleExpansions: [0, 0, 0, 0],
    doorSeamGlow: [0, 0, 0, 0],
    floorRailProgress: 0.25 + p * 0.15,
    floorPulseActive: true,
    floorPulseZ: camZ - 4,
    floorPulseIntensity: 2.8,
    canvasOpacity: 1.0,
    canvasBlur: 0,
    activeCardIndex: 0,
    cardOpacity: 0,
    cardScale: 0.8,
    cardBlur: 0,
    cardPointerEvents: false,
    revealVisible: false,
    revealOpacity: 0,
    revealIndex: 0,
    circuitProgress: 25 + p * 10,
    odometerReading: 2.0 + p * 0.5,
  };
}

class OneRailStore {
  private motionState: MonolithMotionState = createBlueprintMotion("HERO");
  private telemetryData: OneRailTelemetryData = {
    chapterIdx: 0,
    chapterLabel: "HERO",
    telemetry: "HERO // Z: +60",
    masterZ: 60,
    sectionProgress: 0,
  };

  private motionListeners = new Set<() => void>();
  private telemetryListeners = new Set<(d: OneRailTelemetryData) => void>();

  public getMotionState(): MonolithMotionState {
    return this.motionState;
  }

  public getTelemetryData(): OneRailTelemetryData {
    return this.telemetryData;
  }

  public subscribeMotion(listener: () => void): () => void {
    this.motionListeners.add(listener);
    return () => this.motionListeners.delete(listener);
  }

  public subscribeTelemetry(listener: (d: OneRailTelemetryData) => void): () => void {
    this.telemetryListeners.add(listener);
    listener(this.telemetryData);
    return () => this.telemetryListeners.delete(listener);
  }

  private notify(): void {
    this.motionListeners.forEach((fn) => fn());
    this.telemetryListeners.forEach((fn) => fn(this.telemetryData));
  }

  public setChapter(idx: number, _label: string, progress = 0, telemetryCustom?: string): void {
    const safeIdx = Math.max(0, Math.min(MASTER_CHAPTERS.length - 1, idx));
    const ch = MASTER_CHAPTERS[safeIdx];
    const zMap: Record<number, number> = {
      0: 60,
      1: 32,
      2: 0,
      3: -90,
      4: -120,
      5: -160,
    };
    const z = zMap[safeIdx] ?? 0;
    const defaultTelemetry = `${ch.number} · ${ch.label}`;

    this.telemetryData = {
      chapterIdx: safeIdx,
      chapterLabel: ch.label,
      telemetry: telemetryCustom || defaultTelemetry,
      masterZ: z,
      sectionProgress: progress,
    };
    this.notify();
  }

  public setBlueprintState(section: "HERO" | "PROBLEM", progress = 0): void {
    // Rigid lock: Never allow Hero/Problem to override if Services pin is active!
    try {
      const pin = ScrollTrigger.getById("services-pin");
      if (pin && pin.isActive) {
        return;
      }
    } catch {}

    this.motionState = createBlueprintMotion(section, progress);
    const idx = section === "HERO" ? 0 : 1;
    this.telemetryData = {
      chapterIdx: idx,
      chapterLabel: MASTER_CHAPTERS[idx].label,
      telemetry: this.motionState.telemetryLabel || `Z: +${this.motionState.cameraZ.toFixed(0)}`,
      masterZ: this.motionState.cameraZ,
      sectionProgress: progress,
    };
    this.notify();
  }

  public setHandoffProgress(progress: number): void {
    try {
      const pin = ScrollTrigger.getById("services-pin");
      if (pin && pin.isActive) {
        return;
      }
    } catch {}

    this.motionState = createHandoffMotion(progress);
    this.telemetryData = {
      chapterIdx: 2, // 03 · SERVICES
      chapterLabel: "SERVICES",
      telemetry: this.motionState.telemetryLabel || `Z: +${this.motionState.cameraZ.toFixed(0)}`,
      masterZ: this.motionState.cameraZ,
      sectionProgress: progress,
    };
    this.notify();
  }

  public setServicesProgress(servicesP: number): void {
    const p = Math.max(0, Math.min(1, servicesP));
    let telemetry = "DOOR.01 // Z: 00";
    const cz = -Math.round(p * 66);
    const czFmt = cz >= 0 ? `+${String(cz).padStart(2, "0")}` : String(cz);

    if (p < 0.25) {
      telemetry = `DOOR.01 // Z: ${czFmt}`;
    } else if (p < 0.50) {
      telemetry = `DOOR.02 // Z: ${czFmt}`;
    } else if (p < 0.75) {
      telemetry = `DOOR.03 // Z: ${czFmt}`;
    } else {
      telemetry = `DOOR.04 // Z: ${czFmt}`;
    }

    this.telemetryData = {
      chapterIdx: 2, // GUARANTEED 03 · SERVICES!
      chapterLabel: "SERVICES",
      telemetry,
      masterZ: cz,
      sectionProgress: p,
    };

    this.notify();
  }

  public setOtherSection(chapterIdx: number, progress = 0): void {
    // Rigid lock: Never allow post-Services triggers to override while Services is pinned
    try {
      const pin = ScrollTrigger.getById("services-pin");
      if (pin && pin.isActive) {
        return;
      }
    } catch {}

    const safeIdx = Math.max(0, Math.min(MASTER_CHAPTERS.length - 1, chapterIdx));
    const ch = MASTER_CHAPTERS[safeIdx];
    const zMap: Record<number, number> = {
      0: 60,
      1: 32,
      2: 0,
      3: -90,
      4: -120,
      5: -160,
    };
    const z = zMap[safeIdx] ?? -100;

    this.telemetryData = {
      chapterIdx: safeIdx,
      chapterLabel: ch.label,
      telemetry: `${ch.label} // ${ch.defaultZ}`,
      masterZ: z,
      sectionProgress: progress,
    };
    this.notify();
  }
}

export const oneRailStore = new OneRailStore();
