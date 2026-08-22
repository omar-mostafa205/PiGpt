// Pure Markdown block parser for AI output (chat answers + generated notes).
// Ported from scriba (src/lib/markdown.ts) so both apps parse model output the
// same way. React-free and unit-testable by design — rendering lives in
// components/solver/Markdown.tsx, which consumes these blocks. Supports
// headings (#/##/###), one level of nested bullets, --- rules, and paragraphs.

export type ListItem = { text: string; nested: boolean };

export type Block =
  | { kind: "h"; level: 1 | 2 | 3; text: string }
  | { kind: "p"; text: string }
  | { kind: "hr" }
  | { kind: "ul"; items: ListItem[] }
  | { kind: "ol"; items: ListItem[] };

export function parseBlocks(md: string): Block[] {
  // Models frequently emit the two-character sequence \n rather than a newline.
  const lines = md.replace(/\r\n/g, "\n").replace(/\\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let para: string[] = [];

  const flushPara = () => {
    if (para.length) {
      // Keep single newlines as line breaks (GFM / chat-renderer behaviour):
      // LLM output puts each distinct line — labelled fields, address lines — on
      // its own line and expects them kept apart, not merged into one run-on.
      blocks.push({ kind: "p", text: para.join("\n").trim() });
      para = [];
    }
  };

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");
    if (!line.trim()) {
      flushPara();
      continue;
    }

    const heading = /^(#{1,3})\s+(.*)$/.exec(line.trim());
    if (heading) {
      flushPara();
      blocks.push({
        kind: "h",
        level: heading[1].length as 1 | 2 | 3,
        text: heading[2].trim(),
      });
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      flushPara();
      blocks.push({ kind: "hr" });
      continue;
    }

    const bullet = /^(\s*)[-*]\s+(.*)$/.exec(line);
    if (bullet) {
      flushPara();
      const nested = bullet[1].length >= 2;
      const last = blocks[blocks.length - 1];
      const item = { text: bullet[2].trim(), nested };
      if (last && last.kind === "ul") last.items.push(item);
      else blocks.push({ kind: "ul", items: [item] });
      continue;
    }

    // Ordered list: "1. ", "2) ", etc. Consecutive items group into one list.
    const ordered = /^(\s*)\d+[.)]\s+(.*)$/.exec(line);
    if (ordered) {
      flushPara();
      const nested = ordered[1].length >= 2;
      const last = blocks[blocks.length - 1];
      const item = { text: ordered[2].trim(), nested };
      if (last && last.kind === "ol") last.items.push(item);
      else blocks.push({ kind: "ol", items: [item] });
      continue;
    }

    para.push(line.trim());
  }
  flushPara();
  return blocks;
}
