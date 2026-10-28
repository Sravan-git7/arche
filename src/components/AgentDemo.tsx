import { useState } from "react";
import { rememberLastTrigger, resolveIntent, type Resolution, type VisualTrigger } from "../data/intents";

const QUESTIONS = [
  "What does Arche do?",
  "Can you automate lead management?",
  "What kind of AI agent can you build?",
  "Can you connect my existing tools?",
  "How do I start a project?",
];

const FLOWS: Record<VisualTrigger, string[]> = {
  "service:video": ["FOOTAGE", "EDIT", "STORY"],
  "service:web": ["IDEA", "INTERFACE", "VISITOR"],
  "service:agent": ["QUESTION", "AGENT", "HUMAN / ACTION"],
  "service:automation": ["WEBSITE", "AGENT", "QUALIFY", "CRM"],
  system: ["INPUT", "CONNECT", "OUTPUT"],
  contact: ["QUESTION", "TEAM", "NEXT STEP"],
};

type Exchange = { question: string; result: Resolution };

/** The same local intent resolver powers this miniature and Ask Arche below.
 * There is deliberately no model, network request or simulated typing delay. */
export function AgentDemo({ active = true, preview = false }: { active?: boolean; preview?: boolean }) {
  const [question, setQuestion] = useState("");
  const [exchange, setExchange] = useState<Exchange | null>(null);

  const ask = (value: string) => {
    const text = value.trim();
    if (!text || preview) return;
    const result = resolveIntent(text);
    setExchange({ question: text, result });
    setQuestion("");
    rememberLastTrigger(result.trigger);
  };

  const flow = FLOWS[exchange?.result.trigger ?? "system"];

  return (
    <div className="agent-experience" aria-label="Rules-based agent demonstration">
      <div className="agent-experience-head">
        <div><span className="agent-experience-dot" /> <span className="mono mono-fg">Arche agent</span> <span className="mono">/ {active ? "ready" : "preview"}</span></div>
        <button type="button" className="mono lnk" onClick={() => { setExchange(null); setQuestion(""); }} disabled={!exchange && !question}>Reset</button>
      </div>
      <p className="agent-disclosure">A rules-based demo. No live AI or connected tools.</p>
      <div className="agent-experience-conversation" aria-live="polite" aria-atomic="true">
        {exchange ? (
          <>
            <p className="agent-experience-question">{exchange.question}</p>
            <div className="agent-experience-answer">
              <span className="mono mono-a">{exchange.result.label}</span>
              <p>{exchange.result.response.join(" ")}</p>
            </div>
          </>
        ) : (
          <div className="agent-experience-empty"><span className="mono mono-a">01 / ASK</span><p>Ask a question.<br />See the route it suggests.</p></div>
        )}
      </div>
      <div className="agent-route" aria-label={`Example route: ${flow.join(" to ")}`}>
        {flow.map((item, i) => <span key={item}><i />{item}{i < flow.length - 1 && <b aria-hidden>→</b>}</span>)}
      </div>
      <div className="agent-suggestions" aria-label="Suggested questions">
        {QUESTIONS.map((q) => <button type="button" key={q} onClick={() => ask(q)} disabled={preview}>{q}</button>)}
      </div>
      <form className="agent-experience-form" onSubmit={(e) => { e.preventDefault(); ask(question); }}>
        <label className="sr-only" htmlFor="agent-demo-question">Ask the agent demo</label>
        <input id="agent-demo-question" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask a question…" disabled={preview} />
        <button type="submit" disabled={!question.trim() || preview}>Ask <span aria-hidden>↗</span></button>
      </form>
    </div>
  );
}
