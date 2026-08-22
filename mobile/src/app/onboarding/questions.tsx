import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Svg, { Defs, LinearGradient, Stop, Rect, Path } from "react-native-svg";
import { T, radius, ONBOARDING_GRADIENT } from "../../constants/theme";
import { ICONS } from "../../components/ui/Icon";
import { Logo } from "../../components/ui/Logo";
import { useUserStore } from "../../store/userStore";
import type { Role, Goal, Source, OnboardingSubject } from "../../types/user";

type Option = { label: string; sub: string };
type Question = { key: "role" | "goal" | "subjects" | "source"; title: string; sub: string; multi: boolean; options: Option[] };

/** Verbatim from the design canvas. */
const QUESTIONS: Question[] = [
  {
    key: "role",
    title: "What best describes you?",
    sub: "So answers land at the right level",
    multi: false,
    options: [
      { label: "High school student", sub: "Grades 9 to 12" },
      { label: "University student", sub: "Undergrad or postgrad" },
      { label: "Parent", sub: "Helping someone else study" },
      { label: "Teacher", sub: "Setting work for a class" },
      { label: "Self-study", sub: "Learning on my own time" },
    ],
  },
  {
    key: "goal",
    title: "What's your top goal?",
    sub: "We'll put the right tools up front",
    multi: false,
    options: [
      { label: "Getting homework help", sub: "Tonight's problem set" },
      { label: "Acing my exams", sub: "Practice tests and revision" },
      { label: "Understanding the why", sub: "Concepts, not just answers" },
      { label: "Catching up fast", sub: "I'm behind and need to move" },
    ],
  },
  {
    key: "subjects",
    title: "Which subjects do you need?",
    sub: "Pick as many as you like",
    multi: true,
    options: [
      { label: "Math", sub: "Algebra to calculus" },
      { label: "Physics", sub: "Mechanics, waves, fields" },
      { label: "Chemistry", sub: "Reactions and stoichiometry" },
      { label: "Statistics", sub: "Probability and inference" },
      { label: "Accounting", sub: "Journals to statements" },
    ],
  },
  {
    key: "source",
    title: "How did you hear about us?",
    sub: "Helps us know where to show up",
    multi: false,
    options: [
      { label: "A friend or classmate", sub: "Word of mouth" },
      { label: "Social media", sub: "TikTok, Instagram, X" },
      { label: "App Store", sub: "Search or featured" },
      { label: "Teacher or school", sub: "Recommended in class" },
      { label: "Somewhere else", sub: "Ads, news, elsewhere" },
    ],
  },
];

export default function OnboardingQuestions() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [qIndex, setQIndex] = useState(0);
  const { role, goal, subjects, source, setRole, setGoal, toggleSubject, setSource, completeOnboarding } =
    useUserStore();

  const q = QUESTIONS[qIndex];

  const isPicked = (label: string) => {
    if (q.key === "subjects") return subjects.includes(label as OnboardingSubject);
    if (q.key === "role") return role === label;
    if (q.key === "goal") return goal === label;
    return source === label;
  };

  const pick = (label: string) => {
    if (q.key === "role") setRole(label as Role);
    else if (q.key === "goal") setGoal(label as Goal);
    else if (q.key === "subjects") toggleSubject(label as OnboardingSubject);
    else setSource(label as Source);
  };

  const answered = q.key === "subjects" ? subjects.length > 0 : q.key === "role" ? !!role : q.key === "goal" ? !!goal : !!source;

  const onBack = () => {
    if (qIndex > 0) setQIndex((i) => i - 1);
    else router.back();
  };

  const onContinue = () => {
    if (!answered) return;
    if (qIndex === QUESTIONS.length - 1) {
      completeOnboarding();
      router.replace("/(tabs)");
    } else {
      setQIndex((i) => i + 1);
    }
  };

  const ctaLabel =
    q.key === "subjects" && subjects.length > 0 ? `Continue with ${subjects.length} selected` : "Continue";

  return (
    <View style={s.root}>
      <StatusBar style="dark" />

      {/* Page gradient: #f8f9fc → #f1f3f9 (55%) → #e9ecf6 */}
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <LinearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={ONBOARDING_GRADIENT[0]} />
            <Stop offset="0.55" stopColor={ONBOARDING_GRADIENT[1]} />
            <Stop offset="1" stopColor={ONBOARDING_GRADIENT[2]} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#bg)" />
      </Svg>

      <View style={[s.header, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={onBack} hitSlop={10} style={s.backBtn}>
          <Svg width={6} height={11} viewBox={ICONS.chevronLeft.box} fill="none">
            <Path d={ICONS.chevronLeft.d} stroke="#8b9099" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Pressable>
        <View style={s.segments}>
          {QUESTIONS.map((_, i) => (
            <View key={i} style={[s.segment, { backgroundColor: i <= qIndex ? T.blue : T.segEmpty }]} />
          ))}
        </View>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollInner} showsVerticalScrollIndicator={false}>
        <View style={s.logoRow}>
          <Logo size={40} color={T.ink3} />
        </View>

        <Text style={s.title}>{q.title}</Text>
        <Text style={s.sub}>{q.sub}</Text>

        <View style={s.options}>
          {q.options.map((o) => {
            const on = isPicked(o.label);
            return (
              <Pressable
                key={o.label}
                onPress={() => pick(o.label)}
                style={[s.option, on ? s.optionOn : s.optionOff]}
              >
                <Text style={s.optionLabel}>{o.label}</Text>
                <Text style={s.optionSub}>{o.sub}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={[s.ctaWrap, { paddingBottom: Math.max(insets.bottom, 16) + 18 }]}>
        <Pressable
          onPress={onContinue}
          disabled={!answered}
          style={[s.cta, { backgroundColor: answered ? T.blue : T.blueDim }]}
        >
          <Text style={s.ctaText}>{ctaLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: ONBOARDING_GRADIENT[0] },

  header: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 20 },
  backBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: T.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#101828",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  segments: { flexDirection: "row", gap: 8, flex: 1, paddingRight: 20 },
  segment: { flex: 1, height: 7, borderRadius: 4 },

  scroll: { flex: 1 },
  scrollInner: { paddingHorizontal: 22, paddingTop: 26, paddingBottom: 20 },
  logoRow: { alignItems: "center" },

  title: {
    marginTop: 20,
    fontSize: 26,
    lineHeight: 31,
    fontWeight: "700",
    letterSpacing: -0.62, // -.024em at 26px
    color: T.ink3,
    textAlign: "center",
  },
  sub: {
    marginTop: 7,
    fontSize: 14.5,
    lineHeight: 19.5,
    fontWeight: "400",
    color: T.muted4,
    textAlign: "center",
  },

  options: { marginTop: 22, gap: 9 },
  option: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: radius.option, borderWidth: 1.5, gap: 2 },
  optionOff: {
    backgroundColor: T.white,
    borderColor: "transparent",
    shadowColor: "#101828",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  optionOn: { backgroundColor: T.tintBg3, borderColor: T.blue },
  optionLabel: { fontSize: 15.5, lineHeight: 19.5, fontWeight: "600", letterSpacing: -0.12, color: T.ink2 },
  optionSub: { fontSize: 13, lineHeight: 17, fontWeight: "400", color: T.muted4 },

  ctaWrap: { paddingHorizontal: 22, paddingTop: 12 },
  cta: { height: 52, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  ctaText: { fontSize: 16.5, fontWeight: "600", color: T.white },
});
