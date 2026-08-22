import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, useWindowDimensions } from "react-native";
import { T, SERIF } from "../../constants/theme";

const TABS = ["Popular", "sin cos", "Calculus", "≥ ≠", "∈ ⊂", "→", "ΩΔ"];

const KEYS: Record<number, string[]> = {
  0: ["+", "−", "×", "÷", "=", "^", "√", "x²", "x⁻¹", "eˣ", "log", "ln", "!", "π", "(", ")", "|x|", "∑", "∏", "∞", "%"],
  1: ["sin", "cos", "tan", "csc", "sec", "cot", "sin⁻¹", "cos⁻¹", "tan⁻¹", "sinh", "cosh", "tanh", "θ", "φ", "°", "rad", "π/2", "π/3", "π/4", "π/6", "2π"],
  2: ["∫", "∬", "d/dx", "∂", "lim", "∇", "Σ", "dx", "dy", "dt", "→", "∞", "′", "″", "∆", "ε", "δ", "∮", "f(x)", "g(x)", "C"],
  3: ["≥", "≤", "≠", "≈", "≡", "<", ">", "±", "∓", "∝", "≫", "≪", "⌊⌋", "⌈⌉", "√", "∛", "%", "‰", "∴", "∵", "∎"],
  4: ["∈", "∉", "⊂", "⊆", "⊃", "⊇", "∪", "∩", "∅", "ℝ", "ℕ", "ℤ", "ℚ", "ℂ", "∀", "∃", "¬", "∧", "∨", "|", "×"],
  5: ["→", "←", "↔", "⇒", "⇐", "⇔", "↦", "↑", "↓", "∴", "≐", "≅", "∼", "⊥", "∥", "∠", "△", "□", "○", "·", "∘"],
  6: ["α", "β", "γ", "δ", "ε", "ζ", "η", "θ", "λ", "μ", "ν", "ξ", "π", "ρ", "σ", "τ", "φ", "χ", "ψ", "ω", "Ω"],
};

const COLS = 7;
const GAP = 7;
const H_PADDING = 12;

export const MathKeyboard: React.FC<{ onKey: (k: string) => void }> = ({ onKey }) => {
  const [tab, setTab] = useState(0);
  const { width } = useWindowDimensions();
  // Exact column width, so seven keys always fit on one row.
  const keyWidth = (width - H_PADDING * 2 - GAP * (COLS - 1)) / COLS;

  return (
    <View style={s.root}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.tabs}
      >
        {TABS.map((t, i) => (
          <Pressable key={t} onPress={() => setTab(i)} style={[s.tab, tab === i && s.tabActive]}>
            <Text style={[s.tabText, { color: tab === i ? T.blue : T.muted }]}>{t}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={s.grid}>
        {(KEYS[tab] ?? KEYS[0]).map((k, i) => (
          <Pressable key={`${k}-${i}`} onPress={() => onKey(k)} style={[s.key, { width: keyWidth }]}>
            <Text style={s.keyText}>{k}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  root: { borderTopWidth: 1, borderTopColor: T.border, backgroundColor: T.white },
  tabs: { gap: 20, paddingHorizontal: 16, paddingTop: 11 },
  tab: { paddingBottom: 9, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive: { borderBottomColor: T.blue },
  tabText: { fontFamily: SERIF, fontStyle: "italic", fontSize: 15 },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: H_PADDING,
    paddingTop: 11,
    paddingBottom: 13,
    gap: GAP,
    borderTopWidth: 1,
    borderTopColor: T.chipBg,
  },
  key: {
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: T.border2,
    backgroundColor: T.white,
    alignItems: "center",
    justifyContent: "center",
  },
  keyText: { fontFamily: SERIF, fontStyle: "italic", fontSize: 15, color: T.ink2 },
});
