import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import Svg, { Path } from "react-native-svg";
import { T } from "../../constants/theme";
import type { Subject } from "../../types";

/** Status lines while the model works, per subject. */
const LABELS: Record<Subject, string[]> = {
  math: [
    "Reading the problem",
    "Choosing a method",
    "Working the algebra",
    "Checking each step",
    "Simplifying",
    "Writing it up",
  ],
  physics: [
    "Reading the problem",
    "Identifying the forces",
    "Picking a frame",
    "Balancing the equations",
    "Checking the units",
    "Writing it up",
  ],
  chemistry: [
    "Reading the problem",
    "Counting atoms",
    "Balancing the equation",
    "Working the moles",
    "Checking the units",
    "Writing it up",
  ],
  accounting: [
    "Reading the problem",
    "Sorting the entries",
    "Matching debits and credits",
    "Running the totals",
    "Checking the balance",
    "Writing it up",
  ],
};

const SWEEP_MS = 1500;
const LABEL_MS = 2600;
const BAND = 0.28; // how wide the glow is, as a fraction of the label

/** Six-point asterisk, rotating — the mark in front of the status line. */
const Spinner = () => {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 1400, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <Svg width={15} height={15} viewBox="0 0 16 16" fill="none">
        <Path
          d="M8 1.4v13.2M2.3 4.7l11.4 6.6M2.3 11.3l11.4-6.6"
          stroke={T.muted2}
          strokeWidth={1.9}
          strokeLinecap="round"
        />
      </Svg>
    </Animated.View>
  );
};

/**
 * A status line whose glow sweeps left to right.
 *
 * The sweep is done per character rather than with a gradient mask: each
 * character's opacity peaks as the highlight passes over it, which reads as a
 * travelling glow and needs nothing beyond the native driver.
 */
export const ThinkingLabel: React.FC<{ subject: Subject }> = ({ subject }) => {
  const pool = LABELS[subject] ?? LABELS.math;
  const [index, setIndex] = useState(0);
  const sweep = useRef(new Animated.Value(0)).current;

  // Advance through the status lines while the answer is still coming.
  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % pool.length), LABEL_MS);
    return () => clearInterval(id);
  }, [pool.length]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: SWEEP_MS,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      })
    );
    sweep.setValue(0);
    loop.start();
    return () => loop.stop();
  }, [sweep]);

  const label = pool[index];
  const chars = useMemo(() => label.split(""), [label]);

  return (
    <View style={s.row}>
      <Spinner />
      <Text style={s.label}>
        {chars.map((ch, i) => {
          // Where this character sits along the label, 0..1.
          const at = chars.length > 1 ? i / (chars.length - 1) : 0;
          return (
            <Animated.Text
              key={i}
              style={{
                opacity: sweep.interpolate({
                  // Start before 0 and end past 1 so the glow enters and exits
                  // rather than popping in at the first character.
                  inputRange: [-BAND, at - BAND, at, at + BAND, 1 + BAND],
                  outputRange: [0.45, 0.45, 1, 0.45, 0.45],
                  extrapolate: "clamp",
                }),
              }}
            >
              {ch}
            </Animated.Text>
          );
        })}
        <Text>…</Text>
      </Text>
    </View>
  );
};

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 9, paddingVertical: 4 },
  label: { fontSize: 16, lineHeight: 22, color: T.muted2, fontWeight: "500" },
});
