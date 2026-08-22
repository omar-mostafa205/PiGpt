import React, { useEffect } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, Animated, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { T, radius } from "../../constants/theme";
import { Icon } from "../ui/Icon";
import { Markdown } from "../solver/Markdown";
import { useUiStore } from "../../store/uiStore";
import { useOverlayAnimation } from "../../hooks/useOverlayAnimation";
import { useQuizStore } from "../../store/quizStore";
import { useSubject } from "../../hooks/useSubject";

const DEFAULT_TOPIC: Record<string, string> = {
  math: "calculus: limits, derivatives and integration",
  physics: "mechanics and electromagnetism",
  chemistry: "stoichiometry and reactions",
  accounting: "double-entry bookkeeping and financial statements",
};

/**
 * The quiz runs as a window over whatever screen you were on, rather than a
 * separate tab — you never lose the conversation behind it.
 */
export const QuizSheet: React.FC = () => {
  const quizOpen = useUiStore((st) => st.quizOpen);
  const closeOverlays = useUiStore((st) => st.closeOverlays);
  const insets = useSafeAreaInsets();
  const { mounted, slide, fade } = useOverlayAnimation(quizOpen, 900);
  const { activeSubject } = useSubject();
  const {
    session,
    isGenerating,
    error,
    generateQuiz,
    answerQuestion,
    checkAnswer,
    nextQuestion,
    prevQuestion,
    resetSession,
    submitResult,
  } = useQuizStore();

  useEffect(() => {
    if (quizOpen && !session.quiz && !isGenerating && !error) {
      generateQuiz({
        subject: activeSubject,
        topic: DEFAULT_TOPIC[activeSubject] ?? activeSubject,
        difficulty: "medium",
        questionCount: 5,
      });
    }
  }, [quizOpen, session.quiz, isGenerating, error, activeSubject, generateQuiz]);

  if (!mounted) return null;

  const quiz = session.quiz;
  const total = quiz?.questions.length ?? 0;
  const index = session.currentIndex;
  const q = quiz?.questions[index];
  const picked = session.answers[index] ?? null;
  const checked = session.checked[index] ?? false;

  const attempted = session.answers.filter((a) => a !== null).length;
  const correct = quiz
    ? session.answers.filter((a, i) => a !== null && a === quiz.questions[i].correctIndex).length
    : 0;
  const done = total > 0 && attempted === total;

  const close = () => {
    closeOverlays();
    if (done) {
      submitResult(activeSubject, "medium");
      resetSession();
    }
  };

  return (
    <View style={s.root}>
      <Animated.View style={[StyleSheet.absoluteFill, s.scrim, { opacity: fade }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
      </Animated.View>

      <Animated.View
        style={[s.sheet, { paddingTop: insets.top + 46, transform: [{ translateY: slide }] }]}
      >
        <View style={s.grabber} />

        <View style={s.head}>
          {quiz?.title ? <Text style={s.title}>{quiz.title}</Text> : null}

          <View style={s.statusRow}>
            <Text style={s.status}>{done ? "Nice work!" : attempted === 0 ? "Let's start!" : "Keep going"}</Text>
            <Text style={s.points}>
              <Text style={{ color: correct > 0 ? T.goodFg : T.muted2 }}>{correct}</Text>
              <Text style={{ color: T.muted2 }}> / {attempted} points attempted</Text>
            </Text>
          </View>

          <View style={s.segments}>
            {Array.from({ length: Math.max(total, 1) }).map((_, i) => (
              <View
                key={i}
                style={[s.segment, { backgroundColor: i <= index && total > 0 ? T.blue : "#e5e7eb" }]}
              />
            ))}
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[s.body, { paddingBottom: Math.max(insets.bottom, 20) + 28 }]}
          showsVerticalScrollIndicator={false}
        >
          {isGenerating || (!quiz && !error) ? (
            <View style={s.loading}>
              <ActivityIndicator color={T.blue} />
              <Text style={s.loadingText}>Building your quiz</Text>
            </View>
          ) : error ? (
            <View>
              <Text style={s.errorText}>{error}</Text>
              <Pressable onPress={resetSession} style={s.checkBtnActive}>
                <Text style={s.checkTextActive}>Try again</Text>
              </Pressable>
            </View>
          ) : q ? (
            <>
              <View style={s.navRow}>
                <Text style={s.qCount}>
                  Question {index + 1}/{total}
                </Text>
                <View style={s.navBtns}>
                  <Pressable
                    onPress={prevQuestion}
                    disabled={index === 0}
                    hitSlop={10}
                    style={index === 0 && s.disabled}
                  >
                    <Icon name="chevronLeft" size={9} height={15} color={T.muted2} strokeWidth={2} />
                  </Pressable>
                  <Pressable
                    onPress={nextQuestion}
                    disabled={index >= total - 1}
                    hitSlop={10}
                    style={index >= total - 1 && s.disabled}
                  >
                    <Icon name="chevronRight" size={9} height={15} color={T.muted2} strokeWidth={2} />
                  </Pressable>
                </View>
              </View>

              <Markdown style={s.question}>{q.question}</Markdown>

              <View style={s.options}>
                {q.options.map((o, i) => {
                  const isCorrect = i === q.correctIndex;
                  const isPicked = picked === i;
                  const good = checked && isCorrect;
                  const bad = checked && isPicked && !isCorrect;
                  return (
                    <Pressable
                      key={`${o}-${i}`}
                      disabled={checked}
                      onPress={() => answerQuestion(i)}
                      style={[
                        s.option,
                        isPicked && !checked && { borderColor: T.blue },
                        good && { borderColor: T.good, backgroundColor: T.goodBg },
                        bad && { borderColor: T.bad, backgroundColor: T.badBg },
                      ]}
                    >
                      <View
                        style={[
                          s.radio,
                          isPicked && !checked && { borderColor: T.blue, borderWidth: 6 },
                          good && { borderColor: T.good, borderWidth: 6 },
                          bad && { borderColor: T.bad, borderWidth: 6 },
                        ]}
                      />
                      <Markdown style={s.optionLabel}>{o}</Markdown>
                    </Pressable>
                  );
                })}
              </View>

              <View style={s.actions}>
                <View style={[s.checkBtn, picked !== null && !checked && s.checkBtnActive]}>
                  <Pressable
                    disabled={picked === null || checked}
                    onPress={checkAnswer}
                    style={s.checkPress}
                  >
                    <Text style={picked !== null && !checked ? s.checkTextActive : s.checkText}>Check</Text>
                  </Pressable>
                </View>

                <Pressable onPress={checkAnswer} disabled={picked === null}>
                  <Text style={[s.showSteps, picked === null && s.disabled]}>Show Steps</Text>
                </Pressable>
              </View>

              {checked ? (
                <View style={s.explain}>
                  <Text
                    style={[s.verdict, { color: picked === q.correctIndex ? T.goodFg : T.badFg }]}
                  >
                    {picked === q.correctIndex ? "Correct" : "Not quite"}
                  </Text>
                  <Markdown style={s.explainText}>{q.explanation}</Markdown>

                  {index < total - 1 ? (
                    <Pressable onPress={nextQuestion} style={s.nextBtn}>
                      <Text style={s.nextText}>Next question</Text>
                    </Pressable>
                  ) : (
                    <Pressable onPress={close} style={s.nextBtn}>
                      <Text style={s.nextText}>
                        Finish · {correct}/{total} correct
                      </Text>
                    </Pressable>
                  )}
                </View>
              ) : null}
            </>
          ) : null}
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const s = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, zIndex: 85, justifyContent: "flex-end" },
  scrim: { backgroundColor: "rgba(11,13,18,0.32)" },
  sheet: {
    flex: 1,
    marginTop: 0,
    backgroundColor: T.white,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
  },
  grabber: {
    position: "absolute",
    top: 10,
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#d6d9de",
  },

  head: { paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: T.border },
  title: { fontSize: 19, lineHeight: 25, fontWeight: "700", color: T.ink, textAlign: "center" },
  statusRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  status: { fontSize: 17, fontWeight: "700", color: T.ink },
  points: { fontSize: 15 },
  segments: { marginTop: 12, flexDirection: "row", gap: 8 },
  segment: { flex: 1, height: 5, borderRadius: 3 },

  body: { padding: 20 },
  loading: { paddingTop: 40, alignItems: "center", gap: 12 },
  loadingText: { fontSize: 15, color: T.muted2 },
  errorText: { fontSize: 15, lineHeight: 22, color: T.badFg, marginBottom: 14 },

  navRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  qCount: { fontSize: 16, color: T.muted2 },
  navBtns: { flexDirection: "row", gap: 26 },
  disabled: { opacity: 0.3 },

  question: { marginTop: 20, fontSize: 17, lineHeight: 26, color: T.ink },

  options: { marginTop: 20, gap: 12 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: radius.option,
    borderWidth: 1,
    borderColor: T.border2,
    backgroundColor: T.white,
  },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: "#d6d9de" },
  optionLabel: { flex: 1, fontSize: 16, lineHeight: 22, color: T.ink2 },

  actions: { marginTop: 22, flexDirection: "row", alignItems: "center", gap: 22 },
  checkBtn: { borderRadius: 10, backgroundColor: "#e9eaee" },
  checkBtnActive: { borderRadius: 10, backgroundColor: T.blue },
  checkPress: { paddingHorizontal: 34, paddingVertical: 14 },
  checkText: { fontSize: 16, fontWeight: "600", color: T.muted2 },
  checkTextActive: { fontSize: 16, fontWeight: "600", color: T.white, textAlign: "center" },
  showSteps: { fontSize: 16, fontWeight: "600", color: T.blue },

  explain: {
    marginTop: 20,
    padding: 16,
    borderRadius: radius.card,
    backgroundColor: T.canvas,
    borderWidth: 1,
    borderColor: T.border,
  },
  verdict: { fontSize: 14.5, fontWeight: "700" },
  explainText: { marginTop: 7, fontSize: 14.5, lineHeight: 21.75, color: T.body2 },
  nextBtn: {
    marginTop: 16,
    height: 48,
    borderRadius: 24,
    backgroundColor: T.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  nextText: { fontSize: 16, fontWeight: "600", color: T.white },
});
