import { useEffect, useRef, useState } from "react";
import { Link, useRoute } from "../lib/router";
import { gsap, prefersReducedMotion } from "../lib/gsap";
import { isIntroActive } from "./Intro";
import { getLenis } from "../motion/SmoothScroll";
import { AcMonogram } from "./AcMonogram";
import { SlotButton } from "./SlotButton";

interface NavItem {
  label: string;
  to: string;
  hashTarget?: string;
}

export function Header() {
  const navRef = useRef<HTMLElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | null>(null);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<"services" | "work" | null>(null);

  const route = useRoute();
  const lastScrollY = useRef(0);

  // Clear pending close timers
  const clearCloseTimer = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const handleTriggerEnter = (type: "services" | "work") => {
    clearCloseTimer();
    setActiveDropdown(type);
  };

  const handleTriggerLeave = () => {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setActiveDropdown(null);
    }, 180);
  };

  const handleMenuEnter = () => {
    clearCloseTimer();
  };

  const handleMenuLeave = () => {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setActiveDropdown(null);
    }, 180);
  };

  const toggleDropdown = (type: "services" | "work") => {
    clearCloseTimer();
    setActiveDropdown((prev) => (prev === type ? null : type));
  };

  // Close dropdown on click outside
  useEffect(() => {
    const onDocPointerDown = (e: PointerEvent) => {
      if (!navRef.current?.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("pointerdown", onDocPointerDown);
    return () => document.removeEventListener("pointerdown", onDocPointerDown);
  }, []);

  // Intro coordination: fades in at t2.4 during intro; instant if intro was already shown
  useEffect(() => {
    if (!navRef.current) return;
    if (!isIntroActive()) {
      gsap.set(navRef.current, { opacity: 1, yPercent: 0 });
      return;
    }

    gsap.set(navRef.current, { opacity: 0, yPercent: 0 });

    const onNavReveal = () => {
      if (navRef.current) {
        gsap.to(navRef.current, { opacity: 1, duration: 0.6, ease: "power2.out" });
      }
    };

    window.addEventListener("arche:nav-reveal-start", onNavReveal, { once: true });
    const failsafe = window.setTimeout(onNavReveal, 3200);

    return () => {
      window.removeEventListener("arche:nav-reveal-start", onNavReveal);
      window.clearTimeout(failsafe);
    };
  }, []);

  // Smooth smart-hide on deep scroll down; reveal on scroll up
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (navRef.current && !mobileOpen) {
        const hide = y > 300 && y > lastScrollY.current && !activeDropdown;
        gsap.to(navRef.current, {
          yPercent: hide ? -140 : 0,
          duration: prefersReducedMotion() ? 0 : 0.45,
          ease: "power3.out",
          overwrite: true,
        });
      }
      lastScrollY.current = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [mobileOpen, activeDropdown]);

  // Lock body scroll while mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Close mobile drawer and dropdown on route change
  useEffect(() => {
    setMobileOpen(false);
    setActiveDropdown(null);
  }, [route]);

  // Escape key dismisses mobile drawer & dropdown
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (activeDropdown) {
          setActiveDropdown(null);
        }
        if (mobileOpen) {
          setMobileOpen(false);
          menuBtnRef.current?.focus();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen, activeDropdown]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  };

  const handlePointerLeave = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    el.style.setProperty("--mx", "-999px");
    el.style.setProperty("--my", "-999px");
  };

  const handleNavClick = (item: NavItem, e: React.MouseEvent) => {
    setMobileOpen(false);
    setActiveDropdown(null);
    if (route === "/" && item.hashTarget) {
      const el = document.getElementById(item.hashTarget);
      if (el) {
        e.preventDefault();
        const lenis = getLenis();
        if (lenis) {
          lenis.scrollTo(el, { offset: -90, duration: 1.1 });
        } else {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
  };

  const isActive = (item: NavItem) => {
    if (item.to === "/" && route === "/") return true;
    if (item.to !== "/" && (route === item.to || route.startsWith(`${item.to}/`))) return true;
    return false;
  };

  return (
    <>
      {/* Exact 3-Zone nav-pill glass Navbar Architecture (64px x 1220px) */}
      <header
        ref={navRef}
        id="nav"
        className="nav fixed top-4 left-0 right-0 z-50 px-4 md:px-8 flex justify-center pointer-events-none select-none transition-transform duration-300"
      >
        <div className="nav-wrap relative w-full max-w-[1220px] flex justify-center pointer-events-none">
          <div
            className="nav-pill glass pointer-events-auto relative w-full max-w-[1220px] h-[64px] px-7 rounded-full flex items-center justify-between"
            data-liquid="pill"
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
          >
            {/* Zone 1: Left — Logo (h-9) */}
            <Link
              to="/"
              onClick={() => {
                setMobileOpen(false);
                setActiveDropdown(null);
              }}
              className="nav-logo flex items-center gap-2.5 group cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#9EE41A] rounded-full h-9"
            >
              <AcMonogram badge size={32} />
              <span className="font-display text-[19px] font-bold tracking-[-0.04em] text-[#141413]">
                Arche
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#9EE41A] shadow-[0_0_6px_rgba(158,228,26,0.9)] animate-pulse -ml-0.5" />
            </Link>

            {/* Zone 2: Center — 5 Cleanly Spaced Nav Links + Work ▾ & Services ▾ Dropdown Triggers */}
            <nav className="nav-links hidden md:flex items-center gap-8">
              {/* 1. Work ▾ Dropdown Trigger */}
              <div
                className="relative py-1 flex items-center"
                onPointerEnter={() => handleTriggerEnter("work")}
                onPointerLeave={handleTriggerLeave}
              >
                <button
                  type="button"
                  onClick={() => toggleDropdown("work")}
                  aria-expanded={activeDropdown === "work"}
                  aria-haspopup="true"
                  className={`group relative py-1 font-sans text-[14.5px] font-medium tracking-normal transition-colors duration-200 flex items-center gap-1.5 cursor-pointer ${
                    activeDropdown === "work" || isActive({ label: "Work", to: "/work" })
                      ? "text-[#141413] font-semibold"
                      : "text-[#141413]/85 hover:text-[#141413]"
                  }`}
                >
                  <span>Work</span>
                  <svg
                    className={`w-3 h-3 text-[#141413]/60 transition-transform duration-250 ease-out ${
                      activeDropdown === "work" ? "rotate-180 text-[#141413]" : "group-hover:text-[#141413]"
                    }`}
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M2.5 4.5L6 8L9.5 4.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {(activeDropdown === "work" || isActive({ label: "Work", to: "/work" })) && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#72B314] shadow-[0_0_6px_#9EE41A]" />
                  )}
                  <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[#72B314] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]" />
                </button>
              </div>

              {/* 2. Services ▾ Dropdown Trigger */}
              <div
                className="relative py-1 flex items-center"
                onPointerEnter={() => handleTriggerEnter("services")}
                onPointerLeave={handleTriggerLeave}
              >
                <button
                  type="button"
                  onClick={() => toggleDropdown("services")}
                  aria-expanded={activeDropdown === "services"}
                  aria-haspopup="true"
                  className={`group relative py-1 font-sans text-[14.5px] font-medium tracking-normal transition-colors duration-200 flex items-center gap-1.5 cursor-pointer ${
                    activeDropdown === "services" || isActive({ label: "Services", to: "/services", hashTarget: "services" })
                      ? "text-[#141413] font-semibold"
                      : "text-[#141413]/85 hover:text-[#141413]"
                  }`}
                >
                  <span>Services</span>
                  <svg
                    className={`w-3 h-3 text-[#141413]/60 transition-transform duration-250 ease-out ${
                      activeDropdown === "services" ? "rotate-180 text-[#141413]" : "group-hover:text-[#141413]"
                    }`}
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M2.5 4.5L6 8L9.5 4.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {(activeDropdown === "services" || isActive({ label: "Services", to: "/services" })) && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#72B314] shadow-[0_0_6px_#9EE41A]" />
                  )}
                  <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[#72B314] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]" />
                </button>
              </div>

              {/* 3. Pricing Link */}
              <Link
                to="/pricing"
                onClick={(e) => handleNavClick({ label: "Pricing", to: "/pricing" }, e)}
                className={`group relative py-1 font-sans text-[14.5px] font-medium tracking-normal transition-colors duration-200 flex items-center gap-1.5 ${
                  isActive({ label: "Pricing", to: "/pricing" }) ? "text-[#141413] font-semibold" : "text-[#141413]/85 hover:text-[#141413]"
                }`}
              >
                <span>Pricing</span>
                {isActive({ label: "Pricing", to: "/pricing" }) && (
                  <span className="h-1.5 w-1.5 rounded-full bg-[#72B314] shadow-[0_0_6px_#9EE41A]" />
                )}
                <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[#72B314] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]" />
              </Link>

              {/* 5. FAQ Link (Navigates cleanly to dedicated /faq Hub) */}
              <Link
                to="/faq"
                onClick={(e) => handleNavClick({ label: "FAQ", to: "/faq" }, e)}
                className={`group relative py-1 font-sans text-[14.5px] font-medium tracking-normal transition-colors duration-200 flex items-center gap-1.5 ${
                  isActive({ label: "FAQ", to: "/faq" }) ? "text-[#141413] font-semibold" : "text-[#141413]/85 hover:text-[#141413]"
                }`}
              >
                <span>FAQ</span>
                {isActive({ label: "FAQ", to: "/faq" }) && (
                  <span className="h-1.5 w-1.5 rounded-full bg-[#72B314] shadow-[0_0_6px_#9EE41A]" />
                )}
                <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[#72B314] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]" />
              </Link>
            </nav>

            {/* Zone 3: Right — Nav Side (Sleek h-[42px] px-6 Pill Button + Mobile Hamburger) */}
            <div className="nav-side flex items-center gap-3">
              <div className="hidden md:flex items-center">
                <SlotButton
                  to="/contact"
                  variant="primary"
                  arrow="right"
                  className="!h-[42px] !px-6 !text-[13px] !font-semibold !tracking-tight !bg-[#141413] !text-[#FBFBF6] hover:!shadow-[0_0_16px_rgba(158,228,26,0.35)] active:scale-95 transition-all"
                >
                  Start a Project
                </SlotButton>
              </div>

              {/* Mobile Hamburger Toggle Button */}
              <button
                ref={menuBtnRef}
                type="button"
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
                aria-controls="mobile-nav-drawer"
                onClick={() => setMobileOpen((v) => !v)}
                className="relative z-50 flex h-8 w-8 flex-col items-center justify-center gap-1.5 md:hidden text-[#141413] focus:outline-none"
              >
                <span
                  className="block h-[1.5px] w-5 bg-[#141413] transition-transform duration-300 ease-out origin-center"
                  style={{
                    transform: mobileOpen ? "translateY(4px) rotate(45deg)" : "none",
                  }}
                />
                <span
                  className="block h-[1.5px] w-5 bg-[#141413] transition-transform duration-300 ease-out origin-center"
                  style={{
                    transform: mobileOpen ? "translateY(-3.5px) rotate(-45deg)" : "none",
                  }}
                />
              </button>
            </div>
          </div>

          {/* =========================================================
              FROSTED-ALABASTER GLASS MEGA-DROPDOWNS
              - Triggered by Work ▾ and Services ▾
              - Spring open with custom ease-out curve
              - Emil Kowalski craft: safe diagonal hover bridge
              ========================================================= */}
          <div
            ref={dropdownRef}
            data-nav-megamenu
            onPointerEnter={handleMenuEnter}
            onPointerLeave={handleMenuLeave}
            className={`absolute top-[72px] left-1/2 -translate-x-1/2 z-50 pointer-events-auto transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] origin-top ${
              activeDropdown
                ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
            }`}
            style={{
              filter: "drop-shadow(0 24px 60px rgba(20, 20, 19, 0.14))",
            }}
          >
            {/* SERVICES MEGA-DROPDOWN */}
            {activeDropdown === "services" && (
              <div
                data-megamenu-panel="services"
                className="w-[900px] max-w-[95vw] rounded-[24px] p-6 border border-[#141413]/[0.10] text-[#141413] grid grid-cols-1 lg:grid-cols-12 gap-6 shadow-[0_24px_56px_-14px_rgba(20,20,19,0.16),inset_0_1px_0_rgba(255,253,244,0.85)]"
                style={{
                  backgroundColor: "rgba(245, 242, 226, 0.98)",
                  backdropFilter: "blur(28px) saturate(180%)",
                  WebkitBackdropFilter: "blur(28px) saturate(180%)",
                }}
              >
                {/* 2x2 Grid of 4 Real Services (8 cols) */}
                <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* 01 · Video Editing */}
                  <Link
                    to="/services/video-editing"
                    onClick={() => setActiveDropdown(null)}
                    className="text-left group/item p-3.5 rounded-2xl bg-[#ECE9D6]/50 hover:bg-[#E5E8D5] border border-[#141413]/[0.06] hover:border-[#72B314]/30 shadow-[0_2px_8px_rgba(20,20,19,0.02)] hover:shadow-[0_8px_20px_rgba(20,20,19,0.05)] transition-all cursor-pointer flex flex-col justify-between block"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono text-[10px] font-bold tracking-widest text-[#72B314] uppercase">
                          01 · VIDEO EDITING
                        </span>
                        <span className="font-mono text-xs text-[#141413]/30 group-hover/item:text-[#72B314] group-hover/item:translate-x-0.5 transition-all">
                          →
                        </span>
                      </div>
                      <h4 className="text-[14px] font-bold text-[#141413] group-hover/item:text-[#72B314] transition-colors tracking-tight">
                        Video Editing
                      </h4>
                      <p className="text-[11.5px] text-[#595C56] leading-relaxed mt-1">
                        Cinematic editing, colour grading, and sound design from raw footage to master.
                      </p>
                    </div>
                  </Link>

                  {/* 02 · Web Development */}
                  <Link
                    to="/services/web-development"
                    onClick={() => setActiveDropdown(null)}
                    className="text-left group/item p-3.5 rounded-2xl bg-[#ECE9D6]/50 hover:bg-[#E5E8D5] border border-[#141413]/[0.06] hover:border-[#72B314]/30 shadow-[0_2px_8px_rgba(20,20,19,0.02)] hover:shadow-[0_8px_20px_rgba(20,20,19,0.05)] transition-all cursor-pointer flex flex-col justify-between block"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono text-[10px] font-bold tracking-widest text-[#72B314] uppercase">
                          02 · WEB DEVELOPMENT
                        </span>
                        <span className="font-mono text-xs text-[#141413]/30 group-hover/item:text-[#72B314] group-hover/item:translate-x-0.5 transition-all">
                          →
                        </span>
                      </div>
                      <h4 className="text-[14px] font-bold text-[#141413] group-hover/item:text-[#72B314] transition-colors tracking-tight">
                        Web Development
                      </h4>
                      <p className="text-[11.5px] text-[#595C56] leading-relaxed mt-1">
                        Fast, custom-built websites engineered to convert visitors into enquiries.
                      </p>
                    </div>
                  </Link>

                  {/* 03 · AI Chatbots */}
                  <Link
                    to="/services/ai-chatbots"
                    onClick={() => setActiveDropdown(null)}
                    className="text-left group/item p-3.5 rounded-2xl bg-[#ECE9D6]/50 hover:bg-[#E5E8D5] border border-[#141413]/[0.06] hover:border-[#72B314]/30 shadow-[0_2px_8px_rgba(20,20,19,0.02)] hover:shadow-[0_8px_20px_rgba(20,20,19,0.05)] transition-all cursor-pointer flex flex-col justify-between block"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono text-[10px] font-bold tracking-widest text-[#72B314] uppercase">
                          03 · AI CHATBOTS
                        </span>
                        <span className="font-mono text-xs text-[#141413]/30 group-hover/item:text-[#72B314] group-hover/item:translate-x-0.5 transition-all">
                          →
                        </span>
                      </div>
                      <h4 className="text-[14px] font-bold text-[#141413] group-hover/item:text-[#72B314] transition-colors tracking-tight">
                        AI Chatbots
                      </h4>
                      <p className="text-[11.5px] text-[#595C56] leading-relaxed mt-1">
                        24/7 intelligent agents that qualify leads, book calls, and connect to your CRM.
                      </p>
                    </div>
                  </Link>

                  {/* 04 · AI Automation */}
                  <Link
                    to="/services/ai-automation"
                    onClick={() => setActiveDropdown(null)}
                    className="text-left group/item p-3.5 rounded-2xl bg-[#ECE9D6]/50 hover:bg-[#E5E8D5] border border-[#141413]/[0.06] hover:border-[#72B314]/30 shadow-[0_2px_8px_rgba(20,20,19,0.02)] hover:shadow-[0_8px_20px_rgba(20,20,19,0.05)] transition-all cursor-pointer flex flex-col justify-between block"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono text-[10px] font-bold tracking-widest text-[#72B314] uppercase">
                          04 · AI AUTOMATION
                        </span>
                        <span className="font-mono text-xs text-[#141413]/30 group-hover/item:text-[#72B314] group-hover/item:translate-x-0.5 transition-all">
                          →
                        </span>
                      </div>
                      <h4 className="text-[14px] font-bold text-[#141413] group-hover/item:text-[#72B314] transition-colors tracking-tight">
                        AI Automation
                      </h4>
                      <p className="text-[11.5px] text-[#595C56] leading-relaxed mt-1">
                        End-to-end workflows syncing email, sheets, CRM, and Slack with zero manual copying.
                      </p>
                    </div>
                  </Link>
                </div>

                {/* Right-side Soft Sage-Ivory Featured Card (4 cols) */}
                <div
                  className="lg:col-span-4 rounded-2xl p-5 text-left flex flex-col justify-between border border-[#72B314]/[0.22] text-[#141413] relative overflow-hidden shadow-[0_12px_28px_-8px_rgba(20,20,19,0.06),inset_0_1px_0_rgba(255,255,255,0.9)]"
                  style={{
                    background: "linear-gradient(155deg, #EFF4E3 0%, #E5EDD3 100%)",
                  }}
                >
                  <div
                    className="pointer-events-none absolute top-0 right-0 w-36 h-36 rounded-full blur-[48px] opacity-[0.08] bg-[#9EE41A]"
                    aria-hidden="true"
                  />
                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-1.5 mb-2.5 px-2.5 py-1 rounded-full bg-[#72B314]/15 border border-[#72B314]/25">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#72B314] animate-pulse" />
                      <span className="font-mono text-[9px] font-bold tracking-widest uppercase text-[#4C750D]">
                        ONE CONNECTED SYSTEM
                      </span>
                    </div>
                    <h4 className="text-[14px] font-semibold text-[#141413] leading-snug">
                      All 4 disciplines built under one roof.
                    </h4>
                    <p className="text-[11.5px] text-[#595C56] leading-relaxed mt-2">
                      Replace fragmented freelancers and separate vendors with one integrated engine.
                    </p>
                  </div>
                  <Link
                    to="/services"
                    onClick={() => setActiveDropdown(null)}
                    className="relative z-10 mt-5 pt-3 border-t border-[#72B314]/20 text-[12px] font-semibold text-[#4C750D] hover:text-[#325205] flex items-center justify-between group/cta cursor-pointer transition-colors"
                  >
                    <span>View all services (4)</span>
                    <span className="font-mono text-xs group-hover/cta:translate-x-1 transition-transform">→</span>
                  </Link>
                </div>
              </div>
            )}

            {/* WORK MEGA-DROPDOWN */}
            {activeDropdown === "work" && (
              <div
                data-megamenu-panel="work"
                className="w-[740px] max-w-[95vw] rounded-[24px] p-6 border border-[#141413]/[0.10] text-[#141413] flex flex-col gap-4 shadow-[0_24px_56px_-14px_rgba(20,20,19,0.16),inset_0_1px_0_rgba(255,253,244,0.85)]"
                style={{
                  backgroundColor: "rgba(245, 242, 226, 0.96)",
                  backdropFilter: "blur(28px) saturate(180%)",
                  WebkitBackdropFilter: "blur(28px) saturate(180%)",
                }}
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#141413]/[0.08]">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#72B314]" />
                    <span className="font-mono text-[10.5px] font-bold tracking-wider uppercase text-[#595C56]">
                      FEATURED INTERNAL BUILDS &amp; PROOFS
                    </span>
                  </div>
                  <Link
                    to="/work"
                    onClick={() => setActiveDropdown(null)}
                    className="font-mono text-[11px] font-medium text-[#141413]/70 hover:text-[#141413] flex items-center gap-1 group/all transition-colors"
                  >
                    <span>View all work (4)</span>
                    <span className="group-hover/all:translate-x-0.5 transition-transform">→</span>
                  </Link>
                </div>

                {/* 2x2 Grid of Builds */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <Link
                    to="/work"
                    onClick={() => setActiveDropdown(null)}
                    className="group/card p-3.5 rounded-2xl bg-[#ECE9D6] hover:bg-[#E5E8D5] border border-[#141413]/[0.06] hover:border-[#72B314]/30 shadow-[0_2px_8px_rgba(20,20,19,0.03)] hover:shadow-[0_8px_20px_rgba(20,20,19,0.06)] transition-all cursor-pointer text-left block"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[9.5px] font-bold tracking-widest text-[#72B314] uppercase">
                        FILM / COMMERCIAL
                      </span>
                      <span className="font-mono text-xs text-[#141413]/30 group-hover/card:text-[#72B314] group-hover/card:translate-x-0.5 transition-all">
                        →
                      </span>
                    </div>
                    <h4 className="text-[13.5px] font-semibold text-[#141413] group-hover/card:text-[#72B314] transition-colors">
                      Retention Edit System
                    </h4>
                    <p className="text-[11.5px] text-[#595C56] leading-relaxed mt-1">
                      High-velocity retention editing system designed for organic engagement.
                    </p>
                  </Link>

                  <Link
                    to="/work"
                    onClick={() => setActiveDropdown(null)}
                    className="group/card p-3.5 rounded-2xl bg-[#ECE9D6] hover:bg-[#E5E8D5] border border-[#141413]/[0.06] hover:border-[#72B314]/30 shadow-[0_2px_8px_rgba(20,20,19,0.03)] hover:shadow-[0_8px_20px_rgba(20,20,19,0.06)] transition-all cursor-pointer text-left block"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[9.5px] font-bold tracking-widest text-[#72B314] uppercase">
                        CINEMA / NARRATIVE
                      </span>
                      <span className="font-mono text-xs text-[#141413]/30 group-hover/card:text-[#72B314] group-hover/card:translate-x-0.5 transition-all">
                        →
                      </span>
                    </div>
                    <h4 className="text-[13.5px] font-semibold text-[#141413] group-hover/card:text-[#72B314] transition-colors">
                      Long-form Narrative Cut
                    </h4>
                    <p className="text-[11.5px] text-[#595C56] leading-relaxed mt-1">
                      Cinema-grade commercial narrative cut with custom score &amp; audio master.
                    </p>
                  </Link>

                  <Link
                    to="/work"
                    onClick={() => setActiveDropdown(null)}
                    className="group/card p-3.5 rounded-2xl bg-[#ECE9D6] hover:bg-[#E5E8D5] border border-[#141413]/[0.06] hover:border-[#72B314]/30 shadow-[0_2px_8px_rgba(20,20,19,0.03)] hover:shadow-[0_8px_20px_rgba(20,20,19,0.06)] transition-all cursor-pointer text-left block"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[9.5px] font-bold tracking-widest text-[#72B314] uppercase">
                        WEB / BESPOKE
                      </span>
                      <span className="font-mono text-xs text-[#141413]/30 group-hover/card:text-[#72B314] group-hover/card:translate-x-0.5 transition-all">
                        →
                      </span>
                    </div>
                    <h4 className="text-[13.5px] font-semibold text-[#141413] group-hover/card:text-[#72B314] transition-colors">
                      Studio Site System
                    </h4>
                    <p className="text-[11.5px] text-[#595C56] leading-relaxed mt-1">
                      Sub-35ms flagship with fluid gestures, 3D assets, and spatial layout.
                    </p>
                  </Link>

                  <Link
                    to="/work"
                    onClick={() => setActiveDropdown(null)}
                    className="group/card p-3.5 rounded-2xl bg-[#ECE9D6] hover:bg-[#E5E8D5] border border-[#141413]/[0.06] hover:border-[#72B314]/30 shadow-[0_2px_8px_rgba(20,20,19,0.03)] hover:shadow-[0_8px_20px_rgba(20,20,19,0.06)] transition-all cursor-pointer text-left block"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[9.5px] font-bold tracking-widest text-[#72B314] uppercase">
                        AI / AUTOMATION
                      </span>
                      <span className="font-mono text-xs text-[#141413]/30 group-hover/card:text-[#72B314] group-hover/card:translate-x-0.5 transition-all">
                        →
                      </span>
                    </div>
                    <h4 className="text-[13.5px] font-semibold text-[#141413] group-hover/card:text-[#72B314] transition-colors">
                      AI Ops Pipeline
                    </h4>
                    <p className="text-[11.5px] text-[#595C56] leading-relaxed mt-1">
                      Autonomous multi-tool agent with live CRM routing and zero data loss.
                    </p>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Clean Mobile Glass Overlay Drawer (< 768px) */}
      <div
        id="mobile-nav-drawer"
        aria-hidden={!mobileOpen}
        className={`fixed inset-0 z-40 bg-[#F4F4EE]/95 backdrop-blur-2xl transition-all duration-300 md:hidden flex flex-col justify-between p-6 pt-24 ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex flex-col gap-6 overflow-y-auto max-h-[calc(100svh-140px)] pr-2">
          <p className="font-mono text-[10.5px] uppercase tracking-widest text-[#5C5F59] pb-2 border-b border-[#141413]/10">
            Navigation
          </p>

          <div className="flex flex-col gap-4">
            {/* Work Item with Sub-links */}
            <div className="flex flex-col gap-2">
              <Link
                to="/work"
                onClick={() => setMobileOpen(false)}
                className="text-2xl font-semibold text-[#141413] hover:text-[#9EE41A] transition-colors flex items-center justify-between"
              >
                <span>Work</span>
                <span className="font-mono text-sm text-[#5C5F59]">→</span>
              </Link>
              <div className="grid grid-cols-2 gap-2 pl-2">
                <Link
                  to="/work"
                  onClick={() => setMobileOpen(false)}
                  className="text-xs text-[#595C56] hover:text-[#141413] py-1"
                >
                  Retention Edit
                </Link>
                <Link
                  to="/work"
                  onClick={() => setMobileOpen(false)}
                  className="text-xs text-[#595C56] hover:text-[#141413] py-1"
                >
                  Narrative Cut
                </Link>
                <Link
                  to="/work"
                  onClick={() => setMobileOpen(false)}
                  className="text-xs text-[#595C56] hover:text-[#141413] py-1"
                >
                  Studio Site
                </Link>
                <Link
                  to="/work"
                  onClick={() => setMobileOpen(false)}
                  className="text-xs text-[#595C56] hover:text-[#141413] py-1"
                >
                  AI Ops
                </Link>
              </div>
            </div>

            {/* Services Item with Sub-links */}
            <div className="flex flex-col gap-2 pt-2 border-t border-[#141413]/[0.06]">
              <Link
                to="/services"
                onClick={() => setMobileOpen(false)}
                className="text-2xl font-semibold text-[#141413] hover:text-[#9EE41A] transition-colors flex items-center justify-between text-left"
              >
                <span>Services</span>
                <span className="font-mono text-sm text-[#5C5F59]">→</span>
              </Link>
              <div className="grid grid-cols-2 gap-2 pl-2">
                <Link
                  to="/services/video-editing"
                  onClick={() => setMobileOpen(false)}
                  className="text-xs text-[#595C56] hover:text-[#141413] py-1 text-left"
                >
                  01 · Video Editing
                </Link>
                <Link
                  to="/services/web-development"
                  onClick={() => setMobileOpen(false)}
                  className="text-xs text-[#595C56] hover:text-[#141413] py-1 text-left"
                >
                  02 · Web Dev
                </Link>
                <Link
                  to="/services/ai-chatbots"
                  onClick={() => setMobileOpen(false)}
                  className="text-xs text-[#595C56] hover:text-[#141413] py-1 text-left"
                >
                  03 · AI Chatbots
                </Link>
                <Link
                  to="/services/ai-automation"
                  onClick={() => setMobileOpen(false)}
                  className="text-xs text-[#595C56] hover:text-[#141413] py-1 text-left"
                >
                  04 · Automation
                </Link>
              </div>
            </div>

            {/* Remaining Nav Items */}
            <Link
              to="/#process"
              onClick={(e) => handleNavClick({ label: "Process", to: "/#process", hashTarget: "process" }, e)}
              className="text-2xl font-semibold text-[#141413] hover:text-[#9EE41A] transition-colors flex items-center justify-between pt-2 border-t border-[#141413]/[0.06]"
            >
              <span>Process</span>
              <span className="font-mono text-sm text-[#5C5F59]">→</span>
            </Link>

            <Link
              to="/pricing"
              onClick={(e) => handleNavClick({ label: "Pricing", to: "/pricing" }, e)}
              className="text-2xl font-semibold text-[#141413] hover:text-[#9EE41A] transition-colors flex items-center justify-between"
            >
              <span>Pricing</span>
              <span className="font-mono text-sm text-[#5C5F59]">→</span>
            </Link>

            <Link
              to="/faq"
              onClick={(e) => handleNavClick({ label: "FAQ", to: "/faq" }, e)}
              className="text-2xl font-semibold text-[#141413] hover:text-[#9EE41A] transition-colors flex items-center justify-between"
            >
              <span>FAQ</span>
              <span className="font-mono text-sm text-[#5C5F59]">→</span>
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-4 border-t border-[#141413]/10">
          <Link
            to="/contact"
            onClick={() => setMobileOpen(false)}
            className="w-full py-3.5 rounded-full bg-[#141413] text-[#F4F4EE] hover:text-[#9EE41A] font-bold text-center text-sm tracking-tight shadow-[0_4px_16px_rgba(20,20,19,0.15)] active:scale-98 transition-all"
          >
            Start a Project →
          </Link>
          <p className="font-mono text-[10px] text-center text-[#5C5F59] uppercase tracking-widest">
            Arché Creative Studios · Technology Meets Creativity
          </p>
        </div>
      </div>
    </>
  );
}
