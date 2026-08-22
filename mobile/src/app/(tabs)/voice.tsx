import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, Animated, Easing } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { T, radius } from "../../constants/theme";
import { AppScreen } from "../../components/shared/AppScreen";
import { AppHeader } from "../../components/shared/AppHeader";
import { Icon } from "../../components/ui/Icon";
import { Markdown } from "../../components/solver/Markdown";
import { RecordingSheet } from "../../components/voice/RecordingSheet";
import { useRecorder } from "../../hooks/useRecorder";
import { useSubject } from "../../hooks/useSubject";
import { useUiStore } from "../../store/uiStore";
import { useLibraryStore } from "../../store/libraryStore";
import { summarizeApi } from "../../services/api/summarize";
import { storageGet, storageSet, STORAGE_KEYS } from "../../utils/storage";
import type { LectureSummary } from "../../types/voice";

const RECORD = "#ff6b6b";
const RECORD_DEEP = "#e2554d";

const clock = (ms: number) => {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const sec = total % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

/** The hand-drawn pointer from the reference, aimed at the record button. */
const HintArrow = () => (
  <Svg width={132} height={124} viewBox="0 0 132 124" fill="none">
    <Path
      d="M6 4C1 30 2 58 18 78c14 17 38 28 66 32"
      stroke="#e3e4e8"
      strokeWidth={5}
      strokeLinecap="round"
    />
    <Path
      d="M70 100l16 10-8 14"
      stroke="#e3e4e8"
      strokeWidth={5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/** Slow breathing halo behind the record button while capturing. */
const Pulse: React.FC<{ active: boolean }> = ({ active }) => {
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      v.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 1100, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active, v]);

  if (!active) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        s.pulse,
        {
          opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] }),
          transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.75] }) }],
        },
      ]}
    />
  );
};

export default function VoiceScreen() {
  const insets = useSafeAreaInsets();
  const { activeSubject } = useSubject();
  const openQuiz = useUiStore((st) => st.openQuiz);
  const openNotes = useUiStore((st) => st.openNotes);
  const refreshLibrary = useLibraryStore((st) => st.refresh);
  const { start, stop, reset, readBase64, isRecording, durationMs, metering, error } = useRecorder();

  const [summary, setSummary] = useState<LectureSummary | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const [lastUri, setLastUri] = useState<string | null>(null);
  const [title, setTitle] = useState("New Recording");
  // useAudioRecorderState zeroes durationMillis once the recorder stops, so the
  // length has to be captured before stopping to survive on the summary screen.
  const [finalMs, setFinalMs] = useState(0);
  const [savedId, setSavedId] = useState<string | null>(null);

  const onToggle = async () => {
    if (isRecording) {
      setFinalMs(durationMs);
      setLastUri(await stop());
      return;
    }
    setSummary(null);
    setFailed(null);
    setLastUri(null);
    setFinalMs(0);
    setSavedId(null);

    // Name recordings the way Voice Memos does, counting up across sessions.
    const n = ((await storageGet<number>(STORAGE_KEYS.RECORDING_COUNT)) ?? 0) + 1;
    await storageSet(STORAGE_KEYS.RECORDING_COUNT, n);
    setTitle(`New Recording ${n}`);

    await start();
  };

  const summarise = async () => {
    if (!lastUri) return;
    setBusy(true);
    setFailed(null);
    try {
      const audioBase64 = await readBase64(lastUri);
      const { summary: result, noteId } = await summarizeApi.fromAudio({
        audioBase64,
        mimeType: "audio/m4a",
        subject: activeSubject,
        durationMs: finalMs,
      });
      setSummary(result);
      setSavedId(noteId);
      // The Notes panel reads from the server, so refresh it.
      refreshLibrary();
    } catch (e) {
      setFailed((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const discard = () => {
    reset();
    setLastUri(null);
    setSummary(null);
    setFailed(null);
    setFinalMs(0);
    setSavedId(null);
  };

  const idle = !isRecording && !lastUri && !summary;

  return (
    <AppScreen background={T.white}>
      <AppHeader mode="voice" />

      {idle || isRecording ? (
        // Empty state: the hint points down at the record button.
        <View style={s.emptyStage}>
          <View style={s.hintBlock}>
            <Text style={s.hintText}>Start by tapping{"\n"}the record button</Text>
            <View style={s.arrow}>
              <HintArrow />
            </View>
          </View>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={s.body}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={s.timer}>{clock(isRecording ? durationMs : finalMs)}</Text>
          <Text style={s.stageHint}>
            {isRecording
              ? "Recording — tap the button to stop"
              : summary
                ? savedId
                  ? "Saved to Notes"
                  : "Summary ready"
                : "Recording ready"}
          </Text>

          {error ? <Text style={s.error}>{error}</Text> : null}
          {failed ? <Text style={s.error}>{failed}</Text> : null}

          {lastUri && !isRecording && !summary ? (
            <View style={s.actions}>
              <Pressable onPress={summarise} disabled={busy} style={[s.primaryBtn, busy && { opacity: 0.6 }]}>
                <Text style={s.primaryBtnText}>{busy ? "Summarising…" : "Generate summary"}</Text>
              </Pressable>
              <Pressable onPress={discard} style={s.secondaryBtn}>
                <Icon name="trash" size={17} color={T.body} strokeWidth={1.7} />
                <Text style={s.secondaryBtnText}>Discard</Text>
              </Pressable>
            </View>
          ) : null}

          {summary ? (
            <View style={s.results}>
              <View style={s.card}>
                <Text style={s.cardLabel}>Lecture</Text>
                <Text style={s.summaryTitle}>{summary.title}</Text>
                <Markdown style={s.summaryBody}>{summary.summary}</Markdown>
              </View>

              {summary.keyPoints?.length ? (
                <View style={s.card}>
                  <Text style={s.cardTitle}>Key points</Text>
                  {summary.keyPoints.map((k, i) => (
                    <View key={`${k}-${i}`} style={s.pointRow}>
                      <View style={s.pointNum}>
                        <Text style={s.pointNumText}>{i + 1}</Text>
                      </View>
                      <Markdown style={s.pointText}>{k}</Markdown>
                    </View>
                  ))}
                </View>
              ) : null}

              {summary.topics?.length ? (
                <View style={s.card}>
                  <Text style={s.cardTitle}>Topics covered</Text>
                  <View style={s.chips}>
                    {summary.topics.map((t) => (
                      <View key={t} style={s.chip}>
                        <Text style={s.chipText}>{t}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}

              {summary.followUps?.length ? (
                <View style={s.card}>
                  <Text style={s.cardTitle}>Check yourself</Text>
                  {summary.followUps.map((q) => (
                    <Markdown key={q} style={s.followUp}>{`· ${q}`}</Markdown>
                  ))}
                </View>
              ) : null}

              <Pressable onPress={openQuiz} style={s.quizBtn}>
                <Text style={s.quizBtnText}>Quiz me on this lecture</Text>
              </Pressable>
              <Pressable onPress={openNotes} style={s.quizBtn}>
                <Text style={s.quizBtnText}>Open in Notes</Text>
              </Pressable>
              <Pressable onPress={discard} style={s.newBtn}>
                <Text style={s.newBtnText}>Record another</Text>
              </Pressable>
            </View>
          ) : null}
        </ScrollView>
      )}

      <View style={[s.dock, { paddingBottom: Math.max(insets.bottom, 16) + 14 }]}>
        <Pulse active={isRecording} />
        <Pressable onPress={onToggle} style={s.recordBtn} accessibilityLabel="Start recording" />
      </View>

      <RecordingSheet
        open={isRecording}
        title={title}
        durationMs={durationMs}
        metering={metering}
        onStop={onToggle}
      />
    </AppScreen>
  );
}

const s = StyleSheet.create({
  emptyStage: { flex: 1, justifyContent: "flex-end", paddingBottom: 10 },
  hintBlock: { paddingLeft: 30 },
  hintText: {
    fontSize: 23,
    lineHeight: 34,
    color: "#d8d9de",
    fontStyle: "italic",
    fontWeight: "500",
  },
  arrow: { marginTop: 2, marginLeft: 4 },

  body: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20, alignItems: "stretch" },
  timer: {
    fontSize: 46,
    fontWeight: "700",
    color: T.ink,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  stageHint: { marginTop: 4, marginBottom: 22, fontSize: 14.5, color: T.muted2, textAlign: "center" },
  error: { marginBottom: 14, fontSize: 14, lineHeight: 20, color: T.badFg, textAlign: "center" },

  actions: { gap: 10 },
  primaryBtn: { height: 54, borderRadius: 27, backgroundColor: T.blue, alignItems: "center", justifyContent: "center" },
  primaryBtnText: { fontSize: 17, fontWeight: "600", color: T.white },
  secondaryBtn: {
    height: 54,
    borderRadius: 27,
    backgroundColor: T.white,
    borderWidth: 1,
    borderColor: T.border3,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  secondaryBtnText: { fontSize: 17, fontWeight: "600", color: T.body },

  results: { gap: 13 },
  card: {
    padding: 16,
    paddingVertical: 17,
    borderRadius: radius.cardLg,
    backgroundColor: T.white,
    borderWidth: 1,
    borderColor: T.border,
  },
  cardLabel: { fontSize: 11.5, fontWeight: "600", letterSpacing: 0.69, textTransform: "uppercase", color: T.blue },
  cardTitle: { fontSize: 15.5, fontWeight: "600", color: T.ink2, marginBottom: 12 },
  summaryTitle: { marginTop: 8, fontSize: 19, lineHeight: 25, fontWeight: "700", color: T.ink },
  summaryBody: { marginTop: 8, fontSize: 14.5, lineHeight: 21.75, color: T.body2 },

  pointRow: { flexDirection: "row", gap: 11, marginBottom: 11 },
  pointNum: {
    width: 22,
    height: 22,
    borderRadius: 8,
    backgroundColor: T.keyBg,
    alignItems: "center",
    justifyContent: "center",
  },
  pointNumText: { fontSize: 12, fontWeight: "600", color: "#4a4f58" },
  pointText: { flex: 1, fontSize: 14.5, lineHeight: 21.75, color: T.body2 },

  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 9, backgroundColor: T.tintBg2 },
  chipText: { fontSize: 13, fontWeight: "600", color: T.blue },

  followUp: { fontSize: 14.5, lineHeight: 22, color: T.body2 },

  quizBtn: {
    height: 54,
    borderRadius: 27,
    backgroundColor: T.white,
    borderWidth: 1,
    borderColor: T.border3,
    alignItems: "center",
    justifyContent: "center",
  },
  quizBtnText: { fontSize: 17, fontWeight: "600", color: T.blue },
  newBtn: { height: 46, alignItems: "center", justifyContent: "center" },
  newBtnText: { fontSize: 15.5, fontWeight: "600", color: T.muted2 },

  dock: { alignItems: "center", paddingTop: 8, backgroundColor: T.white },
  pulse: {
    position: "absolute",
    top: 8,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: RECORD,
  },
  recordBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: RECORD,
    shadowColor: RECORD_DEEP,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
});
