import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion, EASE, DUR, STAGGER, SCROLL, onMotionPreferenceChange, constrainedDevice, hasFinePointer, duration } from "./motion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export { gsap, ScrollTrigger, prefersReducedMotion, EASE, DUR, STAGGER, SCROLL, onMotionPreferenceChange, constrainedDevice, hasFinePointer, duration };
