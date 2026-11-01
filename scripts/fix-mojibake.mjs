import fs from "fs";

const files = [
  "src/components/WebDevDemo.tsx",
  "src/components/VideoEditingDemo.tsx",
  "src/components/Chapters.tsx",
  "src/components/AutomationDemo.tsx",
  "src/components/AgentDemo.tsx",
];

const replacements = [
  ["ΓåÆ", "→"],
  ["ΓÇö", "—"],
  ["┬╖", "·"],
  ["Γ¥ÜΓ¥Ü", "⏸⏸"],
  ["Γû╢", "▶"],
  ["ΓùÅ", "●"],
  ["ΓÇ£", "“"],
  ["ΓÇ¥", "”"],
  ["Γ£ô", "✓"],
  ["ΓÇª", "…"],
  ["1├ù", "1×"],
  ["├ù", "×"],
  ["Γçä", "⇄"],
  ["1.1ΓÇô1.6s", "1.1–1.6s"],
];

for (const f of files) {
  let content = fs.readFileSync(f, "utf8");
  for (const [from, to] of replacements) {
    content = content.replaceAll(from, to);
  }
  fs.writeFileSync(f, content, "utf8");
  const count = (content.match(/[Γ┬├]/g) || []).length;
  console.log(`${f}: remaining mojibake count = ${count}`);
}
