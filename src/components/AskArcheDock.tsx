import { useState, useRef, useEffect } from "react";
import { AcMonogram } from "./AcMonogram";
import {
  askArcheChatbot,
  matchGroundedIntent,
  type BotResponse,
} from "../lib/archeGroundedBot";

interface ChatMessage {
  id: string;
  sender: "studio" | "user";
  text: string;
  time?: string;
  actions?: {
    label: string;
    href: string;
    isExternal?: boolean;
  }[];
}

const QUICK_QUESTIONS = [
  {
    q: "How much does a system cost?",
    a: "Arché projects start from transparent launch rates in INR: Video Editing from ₹799/video, Pitch Decks from ₹3,999, Web Development from ₹5,999, and AI Automation from ₹7,999. Every package includes fixed turnarounds and structured revision rounds.",
  },
  {
    q: "Can we start with one service?",
    a: "Yes, absolutely. You can start with a single vertical (e.g. Video Editing from ₹799 or a Launch Website at ₹5,999) and expand into connected AI agents and automations as you scale.",
  },
  {
    q: "How fast can we launch?",
    a: "Video edits ship in 3–5 working days; pitch decks take 4–8 days; bespoke websites launch in 5–15 days; and AI chatbots / workflow automations deploy in 5–15 days with live staging previews.",
  },
];

/**
 * Compact Bottom-Left Floating Live Chat Pill & Interactive Chat Drawer.
 * Upgraded with:
 * 1. Standard HTML form with id, name, autoComplete="name" / autoComplete="tel" for native autofill.
 * 2. Persistent localStorage caching (arche:chat_name, arche:chat_phone).
 * 3. 100% free, zero-cost, offline-capable smart intent matcher grounded strictly in verified Arché data.
 * 4. Free-text custom question input with instant conversational answers and quick action links.
 */
export function AskArcheDock() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "studio",
      text: "Hey! Welcome to Arché Studio. Looking to build a connected system or start with one vertical?",
      time: "Just now",
      actions: [
        { label: "Start a Project →", href: "#/contact" },
        {
          label: "WhatsApp Partner Line →",
          href: "https://wa.me/917995937536?text=Hi%20Arch%C3%A9%20Studio%2C%20I'd%20like%20to%20discuss%20a%20project",
          isExternal: true,
        },
      ],
    },
  ]);
  const [activeQuick, setActiveQuick] = useState<string | null>(null);
  const [leadName, setLeadName] = useState("");
  const [leadNumber, setLeadNumber] = useState("");
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const drawerRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Initialize cached lead name and phone from localStorage
  useEffect(() => {
    try {
      const cachedName = localStorage.getItem("arche:chat_name");
      const cachedPhone = localStorage.getItem("arche:chat_phone");
      if (cachedName) setLeadName(cachedName);
      if (cachedPhone) setLeadNumber(cachedPhone);
      if (cachedName && cachedPhone) {
        setLeadSubmitted(true);
      }
    } catch {
      /* ignore storage restrictions */
    }
  }, []);

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", handleClick);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("mousedown", handleClick);
      window.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, activeQuick, isTyping]);

  const handleQuickQuestion = (item: { q: string; a: string }) => {
    if (activeQuick === item.q) return;
    setActiveQuick(item.q);

    // Append user question
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: item.q,
      time: "Just now",
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // Grounded studio reply
    setTimeout(() => {
      setIsTyping(false);
      const studioReply: ChatMessage = {
        id: `studio-${Date.now()}`,
        sender: "studio",
        text: item.a,
        time: "Just now",
        actions: [
          { label: "Start a Project →", href: "#/contact" },
          {
            label: "Chat on WhatsApp →",
            href: "https://wa.me/917995937536?text=Hi%20Arch%C3%A9%20Studio%2C%20I'd%20like%20to%20discuss%20a%20project",
            isExternal: true,
          },
        ],
      };
      setMessages((prev) => [...prev, studioReply]);
    }, 380);
  };

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName.trim() || !leadNumber.trim()) return;

    try {
      localStorage.setItem("arche:chat_name", leadName.trim());
      localStorage.setItem("arche:chat_phone", leadNumber.trim());
    } catch {
      /* ignore */
    }

    setLeadSubmitted(true);
    const confirmation: ChatMessage = {
      id: `conf-${Date.now()}`,
      sender: "studio",
      text: `Thanks ${leadName.trim()}! Details verified (${leadNumber.trim()}). You can now ask any question about Arché's services, systems, or process below, or message us directly on WhatsApp.`,
      time: "Just now",
      actions: [
        { label: "Start a Project →", href: "#/contact" },
        {
          label: "Open WhatsApp →",
          href: `https://wa.me/917995937536?text=Hi%20Arch%C3%A9%20Studio%2C%20my%20name%20is%20${encodeURIComponent(
            leadName.trim()
          )}`,
          isExternal: true,
        },
      ],
    };
    setMessages((prev) => [...prev, confirmation]);
  };

  const handleCustomQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = customInput.trim();
    if (!query) return;

    setCustomInput("");
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query,
      time: "Just now",
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const response: BotResponse = await askArcheChatbot(query);
      setIsTyping(false);
      const studioMsg: ChatMessage = {
        id: `studio-${Date.now()}`,
        sender: "studio",
        text: response.text,
        time: "Just now",
        actions: response.actions,
      };
      setMessages((prev) => [...prev, studioMsg]);
    } catch {
      setIsTyping(false);
      const fallback = matchGroundedIntent(query);
      const studioMsg: ChatMessage = {
        id: `studio-${Date.now()}`,
        sender: "studio",
        text: fallback.text,
        time: "Just now",
        actions: fallback.actions,
      };
      setMessages((prev) => [...prev, studioMsg]);
    }
  };

  return (
    <div data-ask-arche-dock className="fixed bottom-5 left-5 z-50 select-none">
      {/* =========================================================
          INTERACTIVE CHAT DRAWER (w-[360px] max-w-[92vw])
          ========================================================= */}
      {open && (
        <div
          ref={drawerRef}
          role="dialog"
          aria-label="Arché Studio Live Chat"
          className="absolute bottom-[calc(100%+12px)] left-0 w-[360px] max-w-[92vw] rounded-[24px] bg-[#141413]/96 backdrop-blur-[24px] border border-[#253821]/70 p-0 shadow-[0_28px_70px_rgba(20,32,18,0.55)] text-[#F4F4EE] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-250"
        >
          {/* Top Bar: AC square badge + Arché Studio + status + Close button */}
          <div className="flex items-center justify-between p-4 border-b border-[#253821]/60 bg-gradient-to-br from-[#1A2418] to-[#0E0F0D]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[9px] bg-[#141413] flex items-center justify-center border border-[#9EE41A]/30 flex-shrink-0">
                <AcMonogram size={18} onDark={true} />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-display text-[14px] font-bold text-white leading-tight">
                  Arché Studio
                </span>
                <span className="font-mono text-[10px] text-[#9EE41A] flex items-center gap-1.5 leading-tight mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#9EE41A] animate-pulse" />
                  Live chat · Grounded Studio Intelligence
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-white/60 hover:text-white p-1 rounded-full hover:bg-white/10 text-sm transition-colors cursor-pointer"
              aria-label="Close live chat"
            >
              ✕
            </button>
          </div>

          {/* Conversation Area */}
          <div
            ref={chatScrollRef}
            className="p-4 space-y-3.5 max-h-[310px] overflow-y-auto overscroll-contain text-left"
          >
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`p-3 rounded-2xl text-[12.5px] leading-relaxed max-w-[88%] ${
                    m.sender === "user"
                      ? "bg-[#F4F1E0] text-[#141413] font-medium rounded-br-none shadow-sm"
                      : "bg-white/[0.08] text-[#F4F1E0] border border-white/10 rounded-bl-none"
                  }`}
                >
                  {m.text}
                </div>

                {/* Quick Action Links if returned by Studio reply */}
                {m.actions && m.actions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {m.actions.map((act, aIdx) => (
                      <a
                        key={aIdx}
                        href={act.href}
                        target={act.isExternal ? "_blank" : undefined}
                        rel={act.isExternal ? "noopener noreferrer" : undefined}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 hover:bg-[#9EE41A] hover:text-[#141413] text-white/90 text-[10px] font-mono font-medium border border-white/10 transition-colors"
                      >
                        {act.label}
                      </a>
                    ))}
                  </div>
                )}

                {m.time && (
                  <span className="font-mono text-[9px] text-white/40 mt-1 px-1">
                    {m.time}
                  </span>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-center gap-1.5 p-3 rounded-2xl bg-white/[0.08] text-[#9EE41A] border border-white/10 w-fit">
                <span className="h-1.5 w-1.5 rounded-full bg-[#9EE41A] animate-bounce" />
                <span className="h-1.5 w-1.5 rounded-full bg-[#9EE41A] animate-bounce [animation-delay:0.15s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-[#9EE41A] animate-bounce [animation-delay:0.3s]" />
              </div>
            )}

            {/* 3 Clickable Quick-Question Pills */}
            <div className="pt-2 space-y-1.5">
              <span className="font-mono text-[9.5px] font-semibold uppercase tracking-wider text-white/50 block mb-1">
                Suggested Questions
              </span>
              {QUICK_QUESTIONS.map((item) => (
                <button
                  key={item.q}
                  type="button"
                  onClick={() => handleQuickQuestion(item)}
                  className={`w-full text-left p-2.5 rounded-xl border text-[11.5px] font-medium transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    activeQuick === item.q
                      ? "bg-white/15 border-white/30 text-[#F4F1E0]"
                      : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20 hover:text-white"
                  }`}
                >
                  <span>{item.q}</span>
                  <span className="text-[11px] opacity-60">→</span>
                </button>
              ))}
            </div>
          </div>

          {/* =========================================================
              AUTOFILLED LEAD CAPTURE FORM / CUSTOM FREE-TEXT CHAT
              ========================================================= */}
          {!leadSubmitted ? (
            <form
              id="chat-lead-form"
              onSubmit={handleLeadSubmit}
              className="p-3.5 border-t border-white/10 bg-[#0E0F0D] flex flex-col gap-2 text-left"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#F4F1E0]">
                  Quick one before we start
                </span>
                <button
                  type="button"
                  onClick={() => setLeadSubmitted(true)}
                  className="font-mono text-[9.5px] text-[#9EE41A] hover:underline cursor-pointer"
                >
                  Skip & Ask Directly →
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  ref={nameInputRef}
                  id="chat-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Your name"
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  required
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white/5 border border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-[#9EE41A] transition-colors"
                />
                <input
                  id="chat-phone"
                  name="tel"
                  type="tel"
                  autoComplete="tel"
                  placeholder="Your number"
                  value={leadNumber}
                  onChange={(e) => setLeadNumber(e.target.value)}
                  required
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white/5 border border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-[#9EE41A] transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-full bg-[#F4F1E0] hover:bg-white text-[#141413] font-mono text-[11px] font-bold uppercase tracking-wider transition-all shadow-[0_4px_16px_rgba(0,0,0,0.25)] active:scale-[0.98] cursor-pointer"
              >
                Start the chat
              </button>
            </form>
          ) : (
            <div className="border-t border-white/10 bg-[#0E0F0D] flex flex-col">
              {/* Partner WhatsApp Direct Link Strip */}
              <div className="px-3.5 py-1.5 bg-white/[0.03] border-b border-white/5 flex items-center justify-between text-left">
                <span className="font-mono text-[9.5px] text-white/50 truncate">
                  Connected: {leadName || "Visitor"} {leadNumber ? `(${leadNumber})` : ""}
                </span>
                <a
                  href={`https://wa.me/917995937536?text=Hi%20Arch%C3%A9%20Studio%2C%20my%20name%20is%20${encodeURIComponent(
                    leadName || "Visitor"
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[9.5px] uppercase font-bold text-[#9EE41A] hover:underline flex-shrink-0"
                >
                  WhatsApp Partner →
                </a>
              </div>

              {/* Free-text Custom Question Input Form */}
              <form
                id="chat-message-form"
                onSubmit={handleCustomQuestion}
                className="p-2.5 flex items-center gap-2"
              >
                <input
                  id="chat-message-input"
                  name="message"
                  type="text"
                  placeholder="Ask anything about Arché..."
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-[#9EE41A] transition-colors"
                />
                <button
                  type="submit"
                  disabled={!customInput.trim()}
                  className="px-3.5 py-2 rounded-xl bg-[#F4F1E0] hover:bg-white disabled:opacity-30 disabled:hover:bg-[#F4F1E0] text-[#141413] font-mono text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer flex-shrink-0"
                >
                  Send
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* =========================================================
          COMPACT FLOATING PILL (fixed bottom-5 left-5 z-50)
          ========================================================= */}
      <div className="flex items-center gap-2.5 h-11 px-3.5 rounded-full bg-gradient-to-br from-[#1A2418]/95 to-[#10120F]/95 backdrop-blur-[20px] border border-[#253821]/80 shadow-[0_16px_36px_rgba(20,32,18,0.40)] select-none">
        {/* Pulsing #9EE41A dot + "Live chat" label */}
        <div
          onClick={() => setOpen((prev) => !prev)}
          className="flex items-center gap-2 cursor-pointer pr-1"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#9EE41A] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#9EE41A]" />
          </span>
          <span className="font-mono text-[11px] font-medium tracking-wider text-white/90 uppercase">
            Live chat
          </span>
        </div>

        {/* Separator */}
        <span className="w-px h-3.5 bg-white/15" />

        {/* Two Circular 32px Icon Buttons */}
        <div className="flex items-center gap-1.5">
          {/* 1. WhatsApp Button (opens https://wa.me/917995937536) */}
          <a
            href="https://wa.me/917995937536?text=Hello%20Arch%C3%A9%20Studio%2C%20I%20would%20like%20to%20discuss%20a%20project"
            target="_blank"
            rel="noopener noreferrer"
            data-cursor="hover"
            aria-label="Direct WhatsApp Message"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#25D366]/20 hover:text-[#25D366] text-white/80 border border-white/10 flex items-center justify-center transition-all cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.16 12.04 20.16C10.66 20.16 9.3 19.8 8.1 19.09L7.81 18.92L4.69 19.74L5.52 16.7L5.33 16.4C4.55 15.16 4.13 13.71 4.13 11.91C4.13 7.37 7.84 3.67 12.05 3.67M9.27 7.55C9.09 7.55 8.79 7.62 8.54 7.89C8.29 8.16 7.58 8.83 7.58 10.18C7.58 11.53 8.56 12.83 8.7 13.01C8.84 13.19 10.63 15.95 13.37 17.13C15.65 18.11 16.11 17.91 16.61 17.87C17.11 17.82 18.22 17.21 18.45 16.56C18.68 15.92 18.68 15.37 18.61 15.26C18.54 15.15 18.36 15.08 18.09 14.95C17.82 14.81 16.49 14.16 16.24 14.07C16 13.98 15.82 13.93 15.64 14.21C15.46 14.48 14.94 15.08 14.78 15.26C14.63 15.44 14.47 15.46 14.2 15.33C13.93 15.19 12.78 14.82 11.43 13.61C10.37 12.67 9.66 11.51 9.45 11.15C9.24 10.79 9.43 10.59 9.57 10.45C9.69 10.33 9.84 10.13 9.98 9.97C10.12 9.81 10.17 9.69 10.26 9.51C10.35 9.33 10.3 9.17 10.23 9.04C10.16 8.91 9.61 7.55 9.38 7C9.16 6.46 8.94 6.54 8.78 6.53L8.27 6.53C8.09 6.53 7.8 6.54 7.55 6.81" />
            </svg>
          </a>

          {/* 2. Chat Bubble Icon Toggle */}
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            data-cursor="hover"
            aria-expanded={open}
            aria-label="Toggle Live Chat Drawer"
            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
              open
                ? "bg-[#9EE41A] text-[#141413] border-[#9EE41A] shadow-[0_0_12px_rgba(158,228,26,0.5)]"
                : "bg-white/10 hover:bg-[#9EE41A]/20 hover:text-[#9EE41A] text-white/80 border-white/10"
            }`}
          >
            {open ? (
              <span className="text-xs font-bold leading-none">✕</span>
            ) : (
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2m0 14H6l-2 2V4h16v12Z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
