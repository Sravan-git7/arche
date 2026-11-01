import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Flip } from "gsap/Flip";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";

let registered = false;

if (typeof window !== "undefined" && !registered) {
  gsap.registerPlugin(ScrollTrigger, SplitText, Flip, DrawSVGPlugin, MotionPathPlugin);
  (window as any).gsap = gsap;
  (window as any).ScrollTrigger = ScrollTrigger;
  registered = true;
}

export { gsap, ScrollTrigger, SplitText, Flip, DrawSVGPlugin, MotionPathPlugin };
export default gsap;
