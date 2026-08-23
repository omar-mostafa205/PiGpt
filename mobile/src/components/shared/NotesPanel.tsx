import React from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { T, radius } from "../../constants/theme";
import { Icon } from "../ui/Icon";
import { useUiStore } from "../../store/uiStore";
import { useOverlayAnimation } from "../../hooks/useOverlayAnimation";
import { useLibraryStore } from "../../store/libraryStore";
import { useOpenSaved } from "../../hooks/useOpenSaved";
import { getSubjectConfig } from "../../constants/subjects";

const DRAWER_WIDTH = 322;

const timeAgo = (iso: string) => {
  const hours = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "yesterday" : `${days}d ago`;
};

/**
 * The second-level drawer behind the sidebar's Notes button: lecture summaries
 * and saved solutions, with a shortcut into the recorder.
 */
export const NotesPanel: React.FC = () => {
  const notesOpen = useUiStore((st) => st.notesOpen);
  const closeOverlays = useUiStore((st) => st.closeOverlays);
  const openSidebar = useUiStore((st) => st.openSidebar);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { mounted, slide, fade } = useOverlayAnimation(notesOpen, -DRAWER_WIDTH);
  const { recents, notes, refresh } = useLibraryStore();
  const openSaved = useOpenSaved();

  React.useEffect(() => {
    if (notesOpen) refresh();
  }, [notesOpen, refresh]);

  if (!mounted) return null;

  const go = (path: string) => {
    closeOverlays();
    router.navigate(path);
  };

  return (
    <View style={s.root} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, s.scrim, { opacity: fade }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeOverlays} />
      </Animated.View>

      <Animated.View style={[s.drawer, { paddingTop: insets.top + 12, transform: [{ translateX: slide }] }]}>
        <View style={s.head}>
          <Pressable onPress={openSidebar} hitSlop={10} style={s.backBtn}>
            <Icon name="chevronLeft" size={9} height={16} color={T.ink} strokeWidth={2.2} />
          </Pressable>
          <Text style={s.title}>Notes</Text>
        </View>

        <Pressable onPress={() => go("/(tabs)/voice")} style={s.newNote}>
          <Icon name="mic" size={14} height={18} color={T.white} strokeWidth={1.9} />
          <Text style={s.newNoteText}>Record a lecture</Text>
        </Pressable>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 24 }}
        >
          <Text style={s.section}>Lecture notes</Text>
          {notes.length === 0 ? (
            <Text style={s.empty}>
              Record a lecture and generate a summary — it saves here automatically.
            </Text>
          ) : (
            notes.map((n) => (
              <Pressable key={n.id} onPress={() => go("/(tabs)/voice")} style={s.note}>
                <View style={s.noteIcon}>
                  <Icon name="notes" size={17} color={T.blue} strokeWidth={1.7} />
                </View>
                <View style={s.noteText}>
                  <Text style={s.noteTitle} numberOfLines={1}>
                    {n.title}
                  </Text>
                  <Text style={s.noteMeta} numberOfLines={1}>
                    {n.topics.length ? `${n.topics[0]} · ` : ""}
                    {n.keyPoints.length} key points · {timeAgo(n.createdAt)}
                  </Text>
                </View>
              </Pressable>
            ))
          )}

          <Text style={s.section}>Saved solutions</Text>
          {recents.length === 0 ? (
            <Text style={s.empty}>
              Nothing saved yet. Solve a problem or record a lecture and it will show up here.
            </Text>
          ) : (
            recents.map((r) => (
              <Pressable key={r.id} onPress={() => openSaved(r.id)} style={s.note}>
                <View style={s.noteIcon}>
                  <Icon name="notes" size={17} color={T.muted} strokeWidth={1.7} />
                </View>
                <View style={s.noteText}>
                  <Text style={s.noteTitle} numberOfLines={1}>
                    {r.question}
                  </Text>
                  <Text style={s.noteMeta}>
                    {getSubjectConfig(r.subject).shortLabel}
                    {r.topic ? ` · ${r.topic}` : ""} · {timeAgo(r.createdAt)}
                  </Text>
                </View>
              </Pressable>
            ))
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const s = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, zIndex: 82 },
  scrim: { backgroundColor: "rgba(11,13,18,0.32)" },
  drawer: { position: "absolute", left: 0, top: 0, bottom: 0, width: DRAWER_WIDTH, backgroundColor: T.white },

  head: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 18, paddingBottom: 14 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 25, fontWeight: "700", letterSpacing: -0.5, color: T.ink },

  newNote: {
    marginHorizontal: 18,
    marginBottom: 8,
    height: 46,
    borderRadius: 23,
    backgroundColor: T.blue,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  newNoteText: { fontSize: 16, fontWeight: "600", color: T.white },

  scroll: { flex: 1 },
  section: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 6, fontSize: 16, fontWeight: "700", color: T.ink },
  empty: { paddingHorizontal: 22, paddingTop: 4, fontSize: 14, lineHeight: 20, color: T.muted3 },

  note: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 22, paddingVertical: 11 },
  noteIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.option,
    backgroundColor: "#f4f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  noteText: { flex: 1, gap: 2 },
  noteTitle: { fontSize: 16, color: T.ink },
  noteMeta: { fontSize: 12.5, color: T.muted3 },
});
