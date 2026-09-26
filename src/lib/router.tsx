import { useEffect, useRef, useState, type ReactNode } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "./gsap";

/**
 * Minimal hash router for the single-file deployment.
 * Routes are namespaced as "#/path" so plain "#section" anchors keep
 * working for in-page scrolling (handled by Lenis). Navigation runs
 * through a full-screen wipe so route changes feel continuous rather
 * than like a hard cut.
 */
export function getPath(): string {
  const h = window.location.hash;
  return h.startsWith("#/") ? h.slice(1) : "/";
}

export function useRoute(): string {
  const [path, setPath] = useState(getPath);
  useEffect(() => {
    const on = () => setPath(getPath());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return path;
}

let navigating = false;

export function navigate(to: string) {
  if (getPath() === to || navigating) return;
  if (prefersReducedMotion()) {
    window.location.hash = `#${to}`;
    window.scrollTo(0, 0);
    return;
  }
  navigating = true;
  window.dispatchEvent(new CustomEvent("arche:navigate", { detail: to }));
}

/** Full-screen wipe that carries the route change in its covered frame. */
export function RouteWipe() {
  const el = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const onNav = (e: Event) => {
      const to = (e as CustomEvent<string>).detail;
      const wipe = el.current!;
      const tl = gsap.timeline({
        onComplete: () => {
          navigating = false;
        },
      });
      tl.set(wipe, { clipPath: "inset(100% 0 0 0)" })
        .to(wipe, { clipPath: "inset(0% 0 0 0)", duration: 0.5, ease: "power4.inOut" })
        .to(label.current, { opacity: 1, duration: 0.18 }, "-=0.2")
        .add(() => {
          window.location.hash = `#${to}`;
          window.scrollTo(0, 0);
          ScrollTrigger.refresh();
        })
        .to(label.current, { opacity: 0, duration: 0.18, delay: 0.16 })
        .to(wipe, { clipPath: "inset(0 0 100% 0)", duration: 0.55, ease: "power4.inOut" })
        .set(wipe, { clipPath: "inset(0 0 100% 0)" });
    };
    window.addEventListener("arche:navigate", onNav);
    return () => window.removeEventListener("arche:navigate", onNav);
  }, []);

  return (
    <div ref={el} className="wipe" aria-hidden>
      <p ref={label} className="mono">
        Arche
      </p>
    </div>
  );
}

export function Link({
  to,
  children,
  className,
  style,
  cursor,
  onNavigate,
}: {
  to: string;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  cursor?: string;
  onNavigate?: () => void;
}) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = e.currentTarget;
    const isBtn = target.classList.contains("btn") || target.dataset.magnetic !== undefined || (typeof children === "string" && children.toLowerCase().includes("start a project"));

    if (isBtn && !prefersReducedMotion()) {
      // PROMPT 32 (Delight 4): ~150ms tactile scale-down-then-up press micro-reward
      gsap.to(target, {
        scale: 0.94,
        duration: 0.07,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut",
        onComplete: () => {
          gsap.set(target, { scale: 1 });
          onNavigate?.();
          navigate(to);
        },
      });
    } else {
      onNavigate?.();
      navigate(to);
    }
  };

  return (
    <a
      href={`#${to}`}
      className={className}
      style={style}
      data-cursor={cursor}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}

/** Per-page boot: title, scroll reset, deferred ScrollTrigger refresh. */
export function usePage(title: string) {
  useEffect(() => {
    document.title = title;
    window.scrollTo(0, 0);
    const t = setTimeout(() => ScrollTrigger.refresh(), 120);
    return () => clearTimeout(t);
  }, [title]);
}
