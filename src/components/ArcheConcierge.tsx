import { useState, useRef, useEffect, type FormEvent } from "react";
import { askArcheChatbot, type BotResponse } from "../lib/archeGroundedBot";
import { type KnowledgeAction } from "../lib/archeKnowledge";
import { AcMonogram } from "./AcMonogram";
import { attachCardTilt } from "../motion/cardTilt";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  actions?: KnowledgeAction[];
}

const STARTER_PROMPTS = [
  "Basic video editing cost?",
  "What's in Standard Website?",
  "Can you connect my CRM?",
  "How fast do you deliver?",
];

const INITIAL_BOT_MESSAGE: Message = {
  id: "initial-welcome",
  sender: "bot",
  text: "Hello! I am Arché's Studio Concierge. I'm directly grounded in Arché's verified INR rates, turnaround SLAs, and service architectures. Ask me anything about our film, pitch decks, web, and automation tiers:",
  timestamp: "Just now",
  actions: [
    { label: "View All Pricing →", href: "#/pricing" },
    { label: "Book Kickoff Call →", href: "#/contact" },
  ],
};

function formatTime(): string {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Robust Chat Markdown Renderer
 * Parses bold (**...**), italics (*...* or _..._), bullets (•, -, *), and numbered items
 * without ever leaving raw asterisks or broken formatting in the UI.
 */
function renderFormattedMessage(text: string, isUser: boolean) {
  const lines = text.split("\n");

  return (
    <div className="space-y-1.5 leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        // Match bullet prefix: •, -, *, or numbered items (1., 2.)
        const bulletMatch = line.match(/^(\s*)([•\-\*]|\d+\.)\s+(.*)$/);
        const isBullet = Boolean(bulletMatch);
        const isIndented = bulletMatch ? bulletMatch[1].length > 0 : false;
        const lineContent = bulletMatch ? bulletMatch[3] : line;

        // Split tokens for bold (**...**), italic (*...* or _..._)
        const tokens = lineContent.split(/(\*\*.*?\*\*|\*[^*]+?\*|_[^_]+?_)/g);

        const renderedLine = tokens.map((token, tIdx) => {
          if (token.startsWith("**") && token.endsWith("**") && token.length >= 4) {
            return (
              <strong
                key={tIdx}
                className={isUser ? "text-[#9EE41A] font-semibold" : "text-[#0B0C0A] font-bold"}
              >
                {token.slice(2, -2)}
              </strong>
            );
          }
          if (token.startsWith("*") && token.endsWith("*") && token.length >= 2) {
            return (
              <em
                key={tIdx}
                className={isUser ? "text-[#E6F4D0] italic font-normal" : "text-[#1C1E1A] italic font-medium"}
              >
                {token.slice(1, -1)}
              </em>
            );
          }
          if (token.startsWith("_") && token.endsWith("_") && token.length >= 2) {
            return (
              <em
                key={tIdx}
                className={isUser ? "text-[#E6F4D0] italic font-normal" : "text-[#1C1E1A] italic font-medium"}
              >
                {token.slice(1, -1)}
              </em>
            );
          }
          // Remove any stray raw asterisks so the text stays clean
          const clean = token.replace(/\*/g, "");
          return <span key={tIdx}>{clean}</span>;
        });

        if (isBullet) {
          const isNumbered = bulletMatch ? /^\d+\./.test(bulletMatch[2]) : false;
          return (
            <div
              key={idx}
              className={`flex items-start gap-2 ${isIndented ? "pl-4 sm:pl-5" : "pl-1"}`}
            >
              {isNumbered ? (
                <span className="font-mono text-xs font-semibold text-[#72B314] mt-0.5 flex-shrink-0">
                  {bulletMatch![2]}
                </span>
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-[#72B314] mt-2 flex-shrink-0" />
              )}
              <div className="flex-1">{renderedLine}</div>
            </div>
          );
        }

        return <div key={idx}>{renderedLine}</div>;
      })}
    </div>
  );
}

export function ArcheConcierge({ className = "" }: { className?: string }) {
  const [messages, setMessages] = useState<Message[]>([INITIAL_BOT_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Attach weighted card 3D tilt
  useEffect(() => {
    if (containerRef.current) {
      return attachCardTilt(containerRef.current);
    }
  }, []);

  // Auto-scroll transcript container to bottom on message updates or typing indicator
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTo({
        top: transcriptRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isTyping]);

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText ?? input).trim();
    if (!textToSend || isTyping) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: formatTime(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Natural responsive delay (260ms) as specified
    const delayPromise = new Promise((resolve) => setTimeout(resolve, 260));
    const botPromise = askArcheChatbot(textToSend, messages);

    const [, botRes]: [unknown, BotResponse] = await Promise.all([delayPromise, botPromise]);

    const botMsg: Message = {
      id: `bot-${Date.now()}`,
      sender: "bot",
      text: botRes.text,
      timestamp: formatTime(),
      actions: botRes.actions,
    };

    setIsTyping(false);
    setMessages((prev) => [...prev, botMsg]);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSend();
  };

  const handleReset = () => {
    setMessages([
      {
        ...INITIAL_BOT_MESSAGE,
        id: `initial-${Date.now()}`,
        timestamp: formatTime(),
      },
    ]);
    setInput("");
    setIsTyping(false);
  };

  return (
    <div
      ref={containerRef}
      className={`arche-concierge-card frosted-ivory-card arche-glow-card shiny-border w-full h-[580px] md:h-[620px] rounded-[24px] overflow-hidden flex flex-col transition-all duration-300 ${className}`}
      style={{
        background: "#F4F1E0",
        border: "1px solid rgba(20, 20, 19, 0.12)",
        boxShadow:
          "inset 0 1px 0 rgba(255, 253, 244, 0.92), 0 20px 48px -16px rgba(20, 20, 19, 0.12)",
      }}
    >
      {/* =========================================================
          OBSIDIAN HEADER BAR (Flagship Studio Assistant Frame)
          ========================================================= */}
      <div className="bg-[#141413] text-[#FBFBF6] px-5 py-3.5 sm:px-6 sm:py-4 flex items-center justify-between border-b border-[#232620]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[10px] bg-[#1E201B] border border-[#9EE41A]/30 flex items-center justify-center flex-shrink-0 shadow-sm">
            <AcMonogram className="w-5 h-5 text-[#FBFBF6]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-sans text-sm font-semibold text-[#FBFBF6] tracking-tight">
                Arché Studio Assistant
              </span>
              <span className="hidden sm:inline-block font-mono text-[9.5px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#232620] text-[#9EE41A] border border-[#9EE41A]/20">
                AI Grounded
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#9EE41A] animate-pulse flex-shrink-0" />
              <span className="font-mono text-[10.5px] text-[#A6ABA0] tracking-wide">
                Online · Grounded in live INR rates &amp; studio scope
              </span>
            </div>
          </div>
        </div>

        {/* Reset / Clear Button */}
        <button
          type="button"
          onClick={handleReset}
          className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono text-[#8C9186] hover:text-[#FBFBF6] hover:bg-[#232620] transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#9EE41A]"
          title="Reset conversation"
        >
          <svg
            className="w-3.5 h-3.5 transition-transform duration-300 group-hover:-rotate-90 text-[#8C9186] group-hover:text-[#9EE41A]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span className="hidden sm:inline">Clear</span>
        </button>
      </div>

      {/* =========================================================
          TRANSCRIPT BODY (Scrollable messages with data-lenis-prevent)
          ========================================================= */}
      <div
        ref={transcriptRef}
        data-lenis-prevent
        className="flex-1 min-h-0 overflow-y-auto px-6 py-5 sm:px-8 sm:py-6 space-y-4 scroll-smooth"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(20,20,19,0.15) transparent",
        }}
      >
        {messages.map((m) => (
          <div
            key={m.id}
            data-sender={m.sender}
            className={`flex flex-col ${
              m.sender === "user" ? "items-end" : "items-start"
            }`}
          >
            {/* Timestamp label */}
            <span className="font-mono text-[11.5px] font-semibold text-[#2E322B] mb-1 px-1">
              {m.sender === "user" ? "You" : "Arché Concierge"} · {m.timestamp}
            </span>

            {/* Bubble */}
            <div
              className={`max-w-[88%] sm:max-w-[78%] rounded-2xl p-4 sm:p-5 text-[15px] sm:text-[15.5px] leading-[1.6] font-medium transition-all duration-200 ${
                m.sender === "user"
                  ? "bg-[#0B0C0A] text-[#FBFBF6] rounded-tr-sm shadow-md"
                  : "bg-white text-[#1C1E1A] border border-[#141413]/12 rounded-tl-sm shadow-[0_2px_8px_rgba(20,20,19,0.04)]"
              }`}
            >
              {renderFormattedMessage(m.text, m.sender === "user")}

              {/* Attached Action Chips (if any) */}
              {m.actions && m.actions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[#141413]/10 flex flex-wrap gap-2">
                  {m.actions.map((act) => (
                    <a
                      key={act.label}
                      href={act.href}
                      target={act.isExternal ? "_blank" : undefined}
                      rel={act.isExternal ? "noopener noreferrer" : undefined}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold tracking-wide bg-[#0B0C0A] text-[#FBFBF6] hover:bg-[#232620] hover:text-[#9EE41A] active:scale-[0.97] transition-all duration-150 cursor-pointer shadow-sm"
                    >
                      <span>{act.label}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* 3-Dot Typing Indicator */}
        {isTyping && (
          <div className="flex flex-col items-start">
            <span className="font-mono text-[11.5px] font-semibold text-[#2E322B] mb-1 px-1">
              Arché Concierge · Thinking...
            </span>
            <div className="bg-white border border-[#141413]/12 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#72B314] animate-bounce [animation-delay:-0.3s]" />
              <span className="w-2 h-2 rounded-full bg-[#72B314] animate-bounce [animation-delay:-0.15s]" />
              <span className="w-2 h-2 rounded-full bg-[#72B314] animate-bounce" />
            </div>
          </div>
        )}
      </div>

      {/* =========================================================
          PROMPT STARTERS CHIPS + INPUT BAR
          ========================================================= */}
      <div className="p-4 sm:p-5 bg-[rgba(244,241,224,0.98)] border-t border-[#141413]/10 flex flex-col gap-3">
        {/* 4 Smart Starter Chips (flex-wrap for clean multi-line display with zero scrollbars) */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] font-bold text-[#2E322B] uppercase tracking-wider flex-shrink-0">
            Suggested:
          </span>
          {STARTER_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleSend(prompt)}
              disabled={isTyping}
              className="inline-flex items-center px-3 py-1.5 rounded-full text-[12.5px] font-sans font-semibold text-[#1C1E1A] bg-white hover:bg-[#F4F1E0] hover:text-[#0B0C0A] border border-[#141413]/12 shadow-[0_1px_3px_rgba(20,20,19,0.04)] active:scale-[0.97] transition-all duration-150 cursor-pointer disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Real Interactive Input Form */}
        <form onSubmit={onSubmit} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
            placeholder="Ask pricing, turnaround, CRM integration, scopes..."
            className="w-full pl-4 pr-12 py-3 rounded-full bg-white text-[#0B0C0A] placeholder-[#2E322B]/75 text-base sm:text-[15px] font-medium border border-[#141413]/15 shadow-inner focus:outline-none focus:ring-2 focus:ring-[#72B314]/50 focus:border-[#72B314] transition-all duration-200"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            aria-label="Send query"
            className="absolute right-1.5 w-9 h-9 rounded-full bg-[#141413] text-[#FBFBF6] flex items-center justify-center hover:bg-[#232620] hover:text-[#9EE41A] active:scale-[0.95] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer shadow-sm"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 12h14M12 5l7 7-7 7"
              />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
