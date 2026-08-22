import React, { useMemo } from "react";
import { View, Text, StyleSheet, type TextStyle } from "react-native";
import { T } from "../../constants/theme";
import { parseBlocks, type Block } from "../../utils/markdown";
import { parseRich } from "../../utils/latex";

/**
 * Markdown renderer for AI output, ported from scriba's components/ui/markdown.tsx.
 * Supports headings (#/##/###), bullet and numbered lists with one level of
 * nesting, **bold**, *italic*, `code`, --- rules, and paragraphs.
 *
 * Added on top of scriba's version: TeX spans ($...$, \(...\)) are converted to
 * Unicode (x², ∫, π) so equations read correctly in the body font — the whole
 * answer stays in one typeface.
 */

interface InlineProps {
  text: string;
  style?: TextStyle;
  mathColor?: string;
  bold?: boolean;
}

/** Splits on **bold**, *italic*, `code`, then on maths within each token. */
const Inline: React.FC<InlineProps> = ({ text, style, mathColor, bold }) => {
  const tokens = useMemo(
    () => text.split(/(\*\*[^*]+?\*\*|\*[^*]+?\*|`[^`]+?`)/g).filter(Boolean),
    [text]
  );

  return (
    <>
      {tokens.map((tok, i) => {
        if (tok.length > 4 && tok.startsWith("**") && tok.endsWith("**")) {
          return (
            <Inline key={i} text={tok.slice(2, -2)} style={style} mathColor={mathColor} bold />
          );
        }
        if (tok.length > 2 && tok.startsWith("*") && tok.endsWith("*")) {
          return (
            <Text key={i} style={s.italic}>
              <Inline text={tok.slice(1, -1)} style={style} mathColor={mathColor} bold={bold} />
            </Text>
          );
        }
        if (tok.length > 2 && tok.startsWith("`") && tok.endsWith("`")) {
          return (
            <Text key={i} style={s.code}>
              {tok.slice(1, -1)}
            </Text>
          );
        }

        return (
          <Text key={i} style={bold ? s.bold : undefined}>
            {parseRich(tok).map((seg, j) =>
              seg.math ? (
                <Text key={j} style={[s.math, mathColor ? { color: mathColor } : null]}>
                  {seg.text}
                </Text>
              ) : (
                <Text key={j}>{seg.text}</Text>
              )
            )}
          </Text>
        );
      })}
    </>
  );
};

interface Props {
  children: string;
  style?: TextStyle;
  /** Optional colour for maths spans; defaults to the surrounding text. */
  mathColor?: string;
}

export const Markdown: React.FC<Props> = ({ children, style, mathColor }) => {
  const blocks = useMemo(() => parseBlocks(children ?? ""), [children]);

  return (
    <View style={s.stack}>
      {blocks.map((block, i) => (
        <BlockView key={i} block={block} style={style} mathColor={mathColor} />
      ))}
    </View>
  );
};

const BlockView: React.FC<{ block: Block; style?: TextStyle; mathColor?: string }> = ({
  block,
  style,
  mathColor,
}) => {
  if (block.kind === "hr") return <View style={s.hr} />;

  if (block.kind === "h") {
    return (
      <Text style={[style, s.heading, HEADING[block.level]]}>
        <Inline text={block.text} style={style} mathColor={mathColor} />
      </Text>
    );
  }

  if (block.kind === "ul" || block.kind === "ol") {
    return (
      <View style={s.list}>
        {block.items.map((item, j) => (
          <View key={j} style={[s.listRow, item.nested && s.nested]}>
            <Text style={[style, s.marker]}>
              {block.kind === "ol" ? `${j + 1}.` : item.nested ? "◦" : "•"}
            </Text>
            <Text style={[style, s.listText]}>
              <Inline text={item.text} style={style} mathColor={mathColor} />
            </Text>
          </View>
        ))}
      </View>
    );
  }

  return (
    <Text style={style}>
      {block.text.split("\n").map((line, li) => (
        <Text key={li}>
          {li > 0 ? "\n" : null}
          <Inline text={line} style={style} mathColor={mathColor} />
        </Text>
      ))}
    </Text>
  );
};

const HEADING: Record<1 | 2 | 3, TextStyle> = {
  1: { fontSize: 16 },
  2: { fontSize: 15 },
  3: { fontSize: 14 },
};

const s = StyleSheet.create({
  stack: { gap: 8 },
  heading: { fontWeight: "600", color: T.ink },
  hr: { height: 1, backgroundColor: T.border, marginVertical: 4 },

  list: { gap: 4 },
  listRow: { flexDirection: "row", gap: 8 },
  nested: { paddingLeft: 16 },
  marker: { opacity: 0.55 },
  listText: { flex: 1 },

  bold: { fontWeight: "600", color: T.ink },
  italic: { fontStyle: "italic" },
  // Answers render in a single typeface — the body font. Maths is already
  // converted to Unicode (x², ∫, π), so it reads correctly without a serif,
  // and mixing families mid-sentence looked inconsistent.
  code: { fontWeight: "500" },
  math: {},
});
