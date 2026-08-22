import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { T } from "../../constants/theme";
import { Icon } from "../ui/Icon";
import { useUiStore } from "../../store/uiStore";
import { useOverlayAnimation } from "../../hooks/useOverlayAnimation";
import { useLibraryStore } from "../../store/libraryStore";
import { useOpenSaved } from "../../hooks/useOpenSaved";
import { getSubjectConfig } from "../../constants/subjects";

/** Full-screen search over solved problems and quizzes. */
export const SearchSheet: React.FC = () => {
  const searchOpen = useUiStore((st) => st.searchOpen);
  const closeOverlays = useUiStore((st) => st.closeOverlays);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { mounted, slide, fade } = useOverlayAnimation(searchOpen, 900);
  const { recents, quizzes, refresh } = useLibraryStore();
  const openSaved = useOpenSaved();
  const openQuiz = useUiStore((st) => st.openQuiz);
  const [query, setQuery] = useState("");

  React.useEffect(() => {
    if (searchOpen) refresh();
  }, [searchOpen, refresh]);

  const q = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!q) return [];
    const problems = recents
      .filter((r) => r.question.toLowerCase().includes(q) || (r.topic ?? "").toLowerCase().includes(q))
      .map((r) => ({
        id: r.id,
        kind: "problem" as const,
        title: r.question,
        meta: `${getSubjectConfig(r.subject).shortLabel}${r.topic ? ` · ${r.topic}` : ""}`,
      }));
    const tests = quizzes
      .filter((z) => (z.topic ?? "").toLowerCase().includes(q))
      .map((z) => ({
        id: z.id,
        kind: "quiz" as const,
        title: z.topic,
        meta: `${getSubjectConfig(z.subject).shortLabel} quiz · ${z.score}%`,
      }));
    return [...problems, ...tests];
  }, [q, recents, quizzes]);

  if (!mounted) return null;

  const close = () => {
    setQuery("");
    closeOverlays();
  };

  return (
    <View style={s.root}>
      <Animated.View style={[StyleSheet.absoluteFill, s.scrim, { opacity: fade }]} pointerEvents="none" />

      <Animated.View style={[s.sheet, { paddingTop: insets.top, transform: [{ translateY: slide }] }]}>
        <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={s.body}>
            {q.length === 0 ? (
              <View style={s.empty}>
                <Icon name="search" size={38} color={T.muted2} strokeWidth={1.7} />
                <Text style={s.emptyText}>Search problems, quizzes, and topics</Text>
              </View>
            ) : results.length === 0 ? (
              <View style={s.empty}>
                <Text style={s.emptyText}>No matches for “{query.trim()}”</Text>
              </View>
            ) : (
              <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.results}>
                {results.map((r) => (
                  <Pressable
                    key={r.id}
                    style={s.result}
                    onPress={() => {
                      close();
                      if (r.kind === "quiz") openQuiz();
                      else openSaved(r.id);
                    }}
                  >
                    <Text style={s.resultTitle} numberOfLines={1}>
                      {r.title}
                    </Text>
                    <Text style={s.resultMeta}>{r.meta}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>

          <View style={[s.barRow, { paddingBottom: Math.max(insets.bottom, 12) + 4 }]}>
            <View style={s.bar}>
              <Icon name="search" size={19} color={T.muted2} strokeWidth={2} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search"
                placeholderTextColor="#9a9aa0"
                style={s.input}
                autoFocus
                returnKeyType="search"
              />
            </View>
            <Pressable onPress={close} style={s.closeBtn} hitSlop={8}>
              <Icon name="close" size={19} color={T.ink} strokeWidth={2.2} />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
};

const s = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, zIndex: 95 },
  scrim: { backgroundColor: "rgba(11,13,18,0.18)" },
  sheet: { flex: 1, backgroundColor: T.white },
  flex: { flex: 1 },

  body: { flex: 1 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 18, paddingHorizontal: 40 },
  emptyText: { fontSize: 19, lineHeight: 26, color: T.body, textAlign: "center" },

  results: { paddingHorizontal: 20, paddingTop: 20, gap: 4 },
  result: { paddingVertical: 12, gap: 3 },
  resultTitle: { fontSize: 16.5, color: T.ink },
  resultMeta: { fontSize: 12.5, color: T.muted3 },

  barRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingTop: 8 },
  bar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 52,
    paddingHorizontal: 18,
    borderRadius: 26,
    backgroundColor: "#f4f4f6",
  },
  input: { flex: 1, fontSize: 18, color: T.ink },
  closeBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#f4f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
});
