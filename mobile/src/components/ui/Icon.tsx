import React from "react";
import Svg, { Path } from "react-native-svg";

/**
 * Icons are stroked SVG paths taken from the design canvas.
 *
 * The canvas draws some glyphs with a mix of <path>, <circle> and <rect>
 * elements. Those are expressed here as multiple path strings (circles and
 * rounded rects written as arcs) so a single renderer covers every icon —
 * dropping the non-path parts is what previously left the magnifier and the
 * gear without their circles.
 */
type Glyph = { box: string; d: string | string[] };

/** A circle as a path, so it can live alongside the rest of a glyph. */
const circle = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0`;

export const ICONS = {
  // ── Chrome ────────────────────────────────────────────────────────────────
  menu:        { box: "0 0 18 14", d: "M1 1h16M1 7h11M1 13h16" },
  chevronLeft: { box: "0 0 8 14", d: "M7 1 1 7l6 6" },
  chevronRight:{ box: "0 0 8 14", d: "M1 1l6 6-6 6" },
  arrowRight:  { box: "0 0 15 13", d: "M1 6.5h12M8.5 2l4.5 4.5-4.5 4.5" },
  send:        { box: "0 0 16 17", d: "M8 16V2M2 8l6-6 6 6" },
  plus:        { box: "0 0 18 18", d: "M9 1v16M1 9h16" },
  search:      { box: "0 0 20 20", d: [circle(8.5, 8.5, 6.5), "M13.5 13.5 19 19"] },
  compose:     { box: "0 0 20 20", d: "M13.5 2.5l4 4L7 17H3v-4z" },
  chat:        { box: "0 0 20 15", d: ["M3.5 1h13a2.5 2.5 0 0 1 2.5 2.5v8a2.5 2.5 0 0 1-2.5 2.5h-13a2.5 2.5 0 0 1-2.5-2.5v-8a2.5 2.5 0 0 1 2.5-2.5z", "M5 5h1M9 5h1M13 5h1M5 9h9"] },
  camera:      { box: "0 0 18 15", d: ["M1 4.5h3l1.5-2.5h7L14 4.5h3v9H1z", circle(9, 8.5, 3)] },
  mic:         { box: "0 0 13 17", d: ["M4 3.5a2.5 2.5 0 0 1 5 0v4a2.5 2.5 0 0 1-5 0z", "M1.5 8a5 5 0 0 0 10 0M6.5 13v3"] },
  tools:       { box: "0 0 20 20", d: ["M12.6 3.4a3.6 3.6 0 0 0 4.6 4.6l-9 9a2.3 2.3 0 0 1-3.2-3.2z", "M3.6 15.4h.01"] },
  bulb:        { box: "0 0 18 18", d: "M9 12v-2M9 1a5 5 0 0 1 3 9v2H6v-2a5 5 0 0 1 3-9zM7 16h4" },
  pinned:      { box: "0 0 22 22", d: "M11 19.5c4.7 0 8.5-3.4 8.5-8S15.7 3.5 11 3.5 2.5 6.9 2.5 11.5c0 1.7.5 3.2 1.4 4.5l-.9 3.5 3.6-1.1c1.3.7 2.8 1.1 4.4 1.1z" },
  gear:        { box: "0 0 20 20", d: [circle(10, 10, 2.6), "M10 1.5v2M10 16.5v2M2.6 5.8l1.7 1M15.7 13.2l1.7 1M2.6 14.2l1.7-1M15.7 6.8l1.7-1"] },
  trash:       { box: "0 0 20 20", d: "M3 5h14M8 5V3h4v2M5 5l1 13h8l1-13M8.5 8.5v6M11.5 8.5v6" },
  photos:      { box: "0 0 20 20", d: ["M2.5 3h15a1.5 1.5 0 0 1 1.5 1.5v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 1 15.5v-11A1.5 1.5 0 0 1 2.5 3z", circle(7, 7.5, 1.6), "M1.5 14l4.5-4.5 3.5 3.5 3-3 6 5.5"] },
  paperclip:   { box: "0 0 20 20", d: "M16 9.2 9.6 15.6a4 4 0 0 1-5.7-5.7l6.9-6.9a2.7 2.7 0 0 1 3.8 3.8l-6.8 6.8a1.3 1.3 0 0 1-1.9-1.9l6-6" },
  stop:        { box: "0 0 20 20", d: "M6.5 6.5h7v7h-7z" },
  close:       { box: "0 0 20 20", d: "M4.5 4.5l11 11M15.5 4.5l-11 11" },
  notes:       { box: "0 0 24 24", d: ["M5.5 3.5h9l5 5v12h-14z", "M14.5 3.5V8h5", "M8.5 12h7M8.5 15.5h5"] },
  share:       { box: "0 0 20 20", d: ["M10 13V2.6M6.4 6.2L10 2.6l3.6 3.6", "M4 11.5v5.5h12v-5.5"] },
  pin:         { box: "0 0 20 20", d: ["M12.4 2.6l5 5-2.2 1-1.3 4-5.5-5.5 4-1.3z", "M8.4 11.6L3.5 16.5"] },
  archive:     { box: "0 0 20 20", d: ["M2.5 3.5h15v3.5h-15z", "M4 7v9.5h12V7", "M8 10.5h4"] },

  // ── Sidebar navigation ────────────────────────────────────────────────────
  navSolve:    { box: "0 0 24 24", d: "M4 6h16M4 12h10M4 18h7" },
  navCamera:   { box: "0 0 24 24", d: ["M2 6.5h3.5L7.5 4h7l2 2.5H20v13H2z", circle(11, 12.5, 4)] },
  navQuiz:     { box: "0 0 24 24", d: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.2 9a2.9 2.9 0 0 1 5.6 1c0 2-2.8 2.4-2.8 4M12 17.5v.5" },
  navProgress: { box: "0 0 24 24", d: "M3 3v18h18M7 15l4-5 3 3 4-6" },
  navVoice:    { box: "0 0 24 24", d: ["M12 2.5a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0v-6a3 3 0 0 1 3-3z", "M5 11a7 7 0 0 0 14 0M12 18v3.5M8.5 21.5h7"] },

  // ── Tools sheet ───────────────────────────────────────────────────────────
  toolTest:       { box: "0 0 24 24", d: ["M6 2.5h9l4.5 4.5v14.5H6z", "M15 2.5V7h4.5", "M9.5 12.5l2 2 3.5-4"] },
  toolQuestion:   { box: "0 0 24 24", d: ["M4 4.5h16v11H9l-4 3.5v-3.5H4z", "M11.4 8.4a1.9 1.9 0 0 1 3.2 1.3c0 1.3-1.6 1.6-1.6 2.6M13 13.6h.01"] },
  toolGraph:      { box: "0 0 24 24", d: ["M3.5 20.5V4M3.5 20.5H20", "M7.5 20.5v-6M12 20.5V9M16.5 20.5v-9"] },
  toolStudyGuide: { box: "0 0 24 24", d: ["M5.5 3.5h10l4 4v13h-14z", "M9 9.5h7M9 13h7M9 16.5h4"] },
  toolFlashcards: { box: "0 0 24 24", d: ["M2.5 8.2l7.4-4.3a2 2 0 0 1 2 0l7.4 4.3a1 1 0 0 1 0 1.7l-7.4 4.3a2 2 0 0 1-2 0L2.5 9.9a1 1 0 0 1 0-1.7z", "M5 12.5v4.2c0 1.6 2.7 2.8 6 2.8s6-1.2 6-2.8v-4.2"] },
  toolMath:       { box: "0 0 24 24", d: ["M4 4.5h8M8 4.5v15M4 19h8", "M14.5 6l6 6M20.5 6l-6 6", "M17.5 15.5V19"] },

  // ── Small state glyphs ────────────────────────────────────────────────────
  check:      { box: "0 0 11 9", d: "M1 4.4 4 7.5 10 1" },
  checkSmall: { box: "0 0 13 11", d: "M1 5.6 4.6 9 12 1.5" },
  cross:      { box: "0 0 13 11", d: "M2 2l9 7M11 2l-9 7" },

  /** Chat header: new conversation bubble and the Upgrade sparkle. */
  bubble:  { box: "0 0 22 22", d: "M11 19.5c4.7 0 8.5-3.4 8.5-8S15.7 3.5 11 3.5 2.5 6.9 2.5 11.5c0 1.7.5 3.2 1.4 4.5l-.9 3.5 3.6-1.1c1.3.7 2.8 1.1 4.4 1.1z" },
  sparkle: { box: "0 0 24 24", d: "M12 2.2l2.3 7.5 7.5 2.3-7.5 2.3-2.3 7.5-2.3-7.5L2.2 12l7.5-2.3z" },

  /** The wordmark tick shown above every onboarding question. */
  logo: { box: "0 0 200 200", d: "M20 118 L52 108 L92 178 L138 34 L196 34" },
} as const satisfies Record<string, Glyph>;

export type IconName = keyof typeof ICONS;

interface IconProps {
  name: IconName;
  size?: number;
  /** Height in px. Defaults to `size`, so pass it for non-square viewBoxes. */
  height?: number;
  color?: string;
  strokeWidth?: number;
  /** Render as a solid shape instead of a stroked outline. */
  filled?: boolean;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 20,
  height,
  color = "#15181f",
  strokeWidth = 1.8,
  filled = false,
}) => {
  const { box, d } = ICONS[name] as Glyph;
  const paths = Array.isArray(d) ? d : [d];
  return (
    <Svg width={size} height={height ?? size} viewBox={box} fill="none">
      {paths.map((p, i) => (
        <Path
          key={i}
          d={p}
          fill={filled ? color : "none"}
          stroke={filled ? "none" : color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </Svg>
  );
};
