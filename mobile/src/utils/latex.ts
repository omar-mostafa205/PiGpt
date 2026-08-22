/**
 * Model responses come back as markdown with TeX fragments mixed in
 * (`$\mathrm{CH_3-CH=C^*H-CH_3}$`, `\frac{a}{b}`, `\alpha`). Rendering that
 * raw is what leaves `\n$\mathrm{...}$` visible on screen.
 *
 * There is no TeX engine here, so this converts the subset that actually shows
 * up in tutoring answers into Unicode that reads correctly in a plain <Text>.
 */

const SUP: Record<string, string> = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
  "+": "⁺", "-": "⁻", "=": "⁼", "(": "⁽", ")": "⁾", n: "ⁿ", i: "ⁱ", x: "ˣ", a: "ᵃ", b: "ᵇ", c: "ᶜ",
  d: "ᵈ", e: "ᵉ", k: "ᵏ", m: "ᵐ", p: "ᵖ", t: "ᵗ", T: "ᵀ",
};

const SUB: Record<string, string> = {
  "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
  "+": "₊", "-": "₋", "=": "₌", "(": "₍", ")": "₎", n: "ₙ", i: "ᵢ", x: "ₓ", a: "ₐ", e: "ₑ", o: "ₒ",
  p: "ₚ", t: "ₜ", s: "ₛ", r: "ᵣ", u: "ᵤ", v: "ᵥ",
};

const SYMBOLS: Record<string, string> = {
  alpha: "α", beta: "β", gamma: "γ", delta: "δ", epsilon: "ε", varepsilon: "ε", zeta: "ζ", eta: "η",
  theta: "θ", vartheta: "ϑ", iota: "ι", kappa: "κ", lambda: "λ", mu: "μ", nu: "ν", xi: "ξ", pi: "π",
  rho: "ρ", sigma: "σ", tau: "τ", upsilon: "υ", phi: "φ", varphi: "φ", chi: "χ", psi: "ψ", omega: "ω",
  Gamma: "Γ", Delta: "Δ", Theta: "Θ", Lambda: "Λ", Xi: "Ξ", Pi: "Π", Sigma: "Σ", Upsilon: "Υ",
  Phi: "Φ", Psi: "Ψ", Omega: "Ω",
  int: "∫", iint: "∬", oint: "∮", sum: "∑", prod: "∏", infty: "∞", partial: "∂", nabla: "∇",
  pm: "±", mp: "∓", times: "×", div: "÷", cdot: "·", ast: "∗", star: "⋆",
  leq: "≤", le: "≤", geq: "≥", ge: "≥", neq: "≠", ne: "≠", approx: "≈", equiv: "≡", sim: "∼",
  propto: "∝", ll: "≪", gg: "≫",
  rightarrow: "→", to: "→", leftarrow: "←", leftrightarrow: "↔", Rightarrow: "⇒", Leftarrow: "⇐",
  Leftrightarrow: "⇔", mapsto: "↦", uparrow: "↑", downarrow: "↓",
  in: "∈", notin: "∉", subset: "⊂", subseteq: "⊆", supset: "⊃", supseteq: "⊇", cup: "∪", cap: "∩",
  emptyset: "∅", varnothing: "∅", forall: "∀", exists: "∃", neg: "¬", land: "∧", lor: "∨",
  therefore: "∴", because: "∵", angle: "∠", perp: "⊥", parallel: "∥", degree: "°", circ: "∘",
  ldots: "…", cdots: "⋯", dots: "…", prime: "′", quad: " ", qquad: "  ",
  lim: "lim", log: "log", ln: "ln", sin: "sin", cos: "cos", tan: "tan", sec: "sec", csc: "csc",
  cot: "cot", sinh: "sinh", cosh: "cosh", tanh: "tanh", max: "max", min: "min", exp: "exp",
};

/** Map each character of `body` through `table`, bailing out if any is missing. */
function mapScript(body: string, table: Record<string, string>): string | null {
  let out = "";
  for (const ch of body) {
    const mapped = table[ch];
    if (!mapped) return null;
    out += mapped;
  }
  return out;
}

/** Pull out the `{...}` group starting at `i`, honouring nesting. */
function readGroup(src: string, i: number): { body: string; next: number } | null {
  if (src[i] !== "{") return null;
  let depth = 0;
  for (let j = i; j < src.length; j++) {
    if (src[j] === "{") depth++;
    else if (src[j] === "}") {
      depth--;
      if (depth === 0) return { body: src.slice(i + 1, j), next: j + 1 };
    }
  }
  return null;
}

/** Convert a TeX fragment into the closest readable Unicode. */
export function texToUnicode(input: string): string {
  let src = input;

  // Wrappers that carry no visual meaning here.
  src = src.replace(/\\(left|right|displaystyle|limits|!)/g, "");
  src = src.replace(/\\[,;:> ]/g, " ");
  src = src.replace(/\\\\/g, "\n");

  // \frac{a}{b} -> (a)/(b), innermost first.
  for (let guard = 0; guard < 8; guard++) {
    const before = src;
    src = src.replace(
      /\\(?:frac|dfrac|tfrac)\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g,
      (_m, a: string, b: string) => {
        const wrapA = /[+\-\s]/.test(a.trim()) ? `(${a})` : a;
        const wrapB = /[+\-\s]/.test(b.trim()) ? `(${b})` : b;
        return `${wrapA}/${wrapB}`;
      }
    );
    if (src === before) break;
  }

  // \sqrt{x} -> √(x)
  src = src.replace(/\\sqrt\s*\{([^{}]*)\}/g, (_m, a: string) =>
    a.length === 1 ? `√${a}` : `√(${a})`
  );

  // Font/style commands keep only their contents.
  src = src.replace(/\\(?:mathrm|mathbf|mathit|mathsf|mathcal|mathbb|text|textbf|textit|operatorname)\s*/g, "");

  let out = "";
  for (let i = 0; i < src.length; ) {
    const ch = src[i];

    if (ch === "\\") {
      const m = /^[a-zA-Z]+/.exec(src.slice(i + 1));
      if (m) {
        const name = m[0];
        const value = SYMBOLS[name] ?? name;
        // "\\frac{d}{dx}\\ln x" must not collapse into "d/dxln x".
        if (/[a-zA-Z]/.test(value[0]) && /[a-zA-Z0-9)]$/.test(out)) out += " ";
        out += value;
        i += 1 + name.length;
        continue;
      }
      // Escaped punctuation such as \{ or \%
      out += src[i + 1] ?? "";
      i += 2;
      continue;
    }

    if (ch === "^" || ch === "_") {
      const table = ch === "^" ? SUP : SUB;
      const group = readGroup(src, i + 1);
      const body = group ? group.body : src[i + 1] ?? "";
      const next = group ? group.next : i + 2;
      const mapped = mapScript(body, table);
      if (mapped) {
        out += mapped;
      } else if (body.length === 1 && !/[a-zA-Z0-9]/.test(body)) {
        // A lone mark such as the * in C^*H reads better bare than as "^*".
        out += body;
      } else {
        // Otherwise keep it legible, converting any commands inside the group.
        out += `${ch}${group ? `(${texToUnicode(body)})` : body}`;
      }
      i = next;
      continue;
    }

    if (ch === "{" || ch === "}") {
      i++;
      continue;
    }

    out += ch;
    i++;
  }

  return out.replace(/[ \t]{2,}/g, " ").trim();
}

export interface Segment {
  text: string;
  math: boolean;
}

/**
 * Split a response into plain and math segments, converting the maths and
 * normalising the literal "\n" sequences models often emit.
 */
export function parseRich(input: string): Segment[] {
  if (!input) return [];

  const normalised = input
    .replace(/\\n/g, "\n")
    .replace(/\\\[/g, "$$")
    .replace(/\\\]/g, "$$")
    .replace(/\\\(/g, "$")
    .replace(/\\\)/g, "$");

  const segments: Segment[] = [];
  // $$...$$ first so display maths is not split by the inline rule.
  const re = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(normalised)) !== null) {
    if (m.index > last) segments.push({ text: normalised.slice(last, m.index), math: false });
    segments.push({ text: texToUnicode(m[1] ?? m[2] ?? ""), math: true });
    last = m.index + m[0].length;
  }
  if (last < normalised.length) segments.push({ text: normalised.slice(last), math: false });

  // A response can be TeX without ever using $ delimiters.
  return segments.map((seg) =>
    seg.math || !/\\[a-zA-Z]+/.test(seg.text) ? seg : { ...seg, text: texToUnicode(seg.text) }
  );
}

/** Strip markdown emphasis markers that would otherwise render literally. */
export function stripMarkdown(input: string): string {
  return input
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/(^|\s)\*(\S(?:.*?\S)?)\*(?=\s|$)/g, "$1$2")
    .replace(/`([^`]+)`/g, "$1");
}
