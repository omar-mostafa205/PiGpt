import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, Animated, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { T } from "../../constants/theme";
import { useOverlayAnimation } from "../../hooks/useOverlayAnimation";
import { levelFromMetering } from "../../hooks/useRecorder";

const WAVE = "#f4463c";
const SHEET_BG = "#f1f1f5";

const BAR_W = 2;
const BAR_GAP = 3;
const WAVE_HEIGHT = 170;

/** mm:ss.hh, the way Voice Memos shows it. */
const clock = (ms: number) => {
  const total = Math.floor(ms / 10);
  const hundredths = total % 100;
  const seconds = Math.floor(total / 100) % 60;
  const minutes = Math.floor(total / 6000);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(minutes)}:${pad(seconds)}.${pad(hundredths)}`;
};

interface Props {
  open: boolean;
  title: string;
  durationMs: number;
  metering?: number;
  onStop: () => void;
}

/**
 * The recording surface: title, hundredths timer, a live waveform built from
 * the input level, and a stop button.
 */
export const RecordingSheet: React.FC<Props> = ({ open, title, durationMs, metering, onStop }) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { mounted, slide, fade } = useOverlayAnimation(open, 420);

  const capacity = Math.max(12, Math.floor((width - 48) / (BAR_W + BAR_GAP)));
  const [bars, setBars] = useState<number[]>([]);
  const lastAt = useRef(0);

  // Append one bar per metering update, keeping only what fits on screen.
  useEffect(() => {
    if (!open) {
      setBars([]);
      lastAt.current = 0;
      return;
    }
    if (durationMs === lastAt.current) return;
    lastAt.current = durationMs;
    setBars((prev) => {
      const next = prev.concat(levelFromMetering(metering));
      return next.length > capacity ? next.slice(next.length - capacity) : next;
    });
  }, [open, durationMs, metering, capacity]);

  if (!mounted) return null;

  return (
    <View style={s.root}>
      <Animated.View style={[StyleSheet.absoluteFill, s.scrim, { opacity: fade }]} pointerEvents="none" />

      <Animated.View
        style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 18) + 12, transform: [{ translateY: slide }] }]}
      >
        <View style={s.grabber} />

        <Text style={s.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={s.timer}>{clock(durationMs)}</Text>

        <View style={s.wave}>
          {bars.map((level, i) => {
            // A floor keeps silence as a visible hairline rather than nothing.
            const h = Math.max(3, level * WAVE_HEIGHT);
            return <View key={i} style={[s.bar, { height: h }]} />;
          })}
          <View style={s.playhead} />
        </View>

        <Pressable onPress={onStop} style={s.stopBtn} accessibilityLabel="Stop recording">
          <View style={s.stopSquare} />
        </Pressable>
      </Animated.View>
    </View>
  );
};

const s = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, zIndex: 90, justifyContent: "flex-end" },
  scrim: { backgroundColor: "rgba(11,13,18,0.18)" },
  sheet: {
    backgroundColor: SHEET_BG,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  grabber: { width: 40, height: 5, borderRadius: 3, backgroundColor: "#c3c4c9", marginBottom: 18 },

  title: { fontSize: 22, fontWeight: "700", color: T.ink, textAlign: "center" },
  timer: {
    marginTop: 6,
    fontSize: 19,
    color: "#8a8a8e",
    fontVariant: ["tabular-nums"],
  },

  wave: {
    height: WAVE_HEIGHT,
    marginTop: 26,
    marginBottom: 26,
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    gap: BAR_GAP,
  },
  bar: { width: BAR_W, borderRadius: 1, backgroundColor: WAVE },
  playhead: {
    position: "absolute",
    right: 0,
    width: 1.5,
    height: 10,
    borderRadius: 1,
    backgroundColor: "#c3c4c9",
  },

  stopBtn: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: T.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  stopSquare: { width: 34, height: 34, borderRadius: 8, backgroundColor: WAVE },
});
