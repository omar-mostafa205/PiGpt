import React from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, usePathname } from "expo-router";
import { T } from "../../constants/theme";
import { Icon, type IconName } from "../ui/Icon";
import { Logo } from "../ui/Logo";
import { useUiStore } from "../../store/uiStore";
import { useOverlayAnimation } from "../../hooks/useOverlayAnimation";
import { useChatStore } from "../../store/chatStore";
import { useSubjectStore } from "../../store/subjectStore";
import { useLibraryStore } from "../../store/libraryStore";
import { useOpenSaved } from "../../hooks/useOpenSaved";
import { getSubjectConfig } from "../../constants/subjects";

const NAV: { label: string; icon: IconName; path?: string; badge?: string; sheet?: "quiz" | "notes" }[] = [
  { label: "Solve", icon: "navSolve", path: "/(tabs)" },
  { label: "Camera", icon: "navCamera", path: "/(tabs)/camera" },
  { label: "Voice", icon: "navVoice", path: "/(tabs)/voice" },
  { label: "Quiz", icon: "navQuiz", sheet: "quiz" },
  { label: "Notes", icon: "notes", sheet: "notes" },
  { label: "Progress", icon: "navProgress", path: "/(tabs)/progress" },
];

const DRAWER_WIDTH = 322;

const timeAgo = (iso: string) => {
  const hours = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "yesterday" : `${days}d ago`;
};

const isActive = (pathname: string, path?: string) => {
  if (!path) return false;
  return path === "/(tabs)"
    ? pathname === "/" || pathname === "/index"
    : pathname.endsWith(path.split("/").pop()!);
};

export const Sidebar: React.FC = () => {
  const sidebarOpen = useUiStore((st) => st.sidebarOpen);
  const closeOverlays = useUiStore((st) => st.closeOverlays);
  const openQuiz = useUiStore((st) => st.openQuiz);
  const openSearch = useUiStore((st) => st.openSearch);
  const openNotes = useUiStore((st) => st.openNotes);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const subject = useSubjectStore((st) => st.activeSubject);
  const clearChat = useChatStore((st) => st.clearChat);
  const { recents, quizzes, refresh } = useLibraryStore();
  const openSaved = useOpenSaved();

  // Pull the library the first time the drawer is opened.
  // Refetch on every open — a chat created since the last open must show up.
  React.useEffect(() => {
    if (sidebarOpen) refresh();
  }, [sidebarOpen, refresh]);

  const { mounted, slide, fade } = useOverlayAnimation(sidebarOpen, -DRAWER_WIDTH);

  if (!mounted) return null;

  const go = (path: string) => {
    closeOverlays();
    router.push(path);
  };

  return (
    <View style={s.root} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, s.scrim, { opacity: fade }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeOverlays} />
      </Animated.View>

      <Animated.View
        style={[s.drawer, { paddingTop: insets.top + 12, transform: [{ translateX: slide }] }]}
      >
        <View style={s.brandRow}>
          <View style={s.brandMark}>
            <Logo size={22} color={T.ink} />
            <Text style={s.brand}>PiGPT</Text>
          </View>
          <Pressable onPress={openSearch} hitSlop={8} style={s.circleBtn}>
            <Icon name="search" size={19} color={T.ink2} strokeWidth={2} />
          </Pressable>
        </View>

        <View style={s.nav}>
          {NAV.map((n) => {
            const active = isActive(pathname, n.path);
            return (
              <Pressable
                key={n.label}
                onPress={() => (n.sheet === "quiz" ? openQuiz() : n.sheet === "notes" ? openNotes() : go(n.path!))}
                style={[s.navItem, active && s.navItemActive]}
              >
                <Icon name={n.icon} size={22} color={T.ink} strokeWidth={1.8} />
                <Text style={[s.navLabel, { fontWeight: active ? "600" : "500" }]}>{n.label}</Text>
                {n.badge ? (
                  <View style={s.badge}>
                    <Text style={s.badgeText}>{n.badge}</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        {quizzes.length > 0 ? (
          <>
            <Text style={s.sectionPinned}>Pinned</Text>
            {quizzes.slice(0, 2).map((q) => (
              <Pressable key={q.id} onPress={openQuiz} style={s.pinnedItem}>
                <Icon name="pinned" size={20} color={T.ink2} strokeWidth={1.7} />
                <Text style={s.pinnedLabel} numberOfLines={1}>
                  {q.topic ?? getSubjectConfig(q.subject).shortLabel}
                </Text>
              </Pressable>
            ))}
          </>
        ) : null}

        <Text style={s.sectionRecents}>Recents</Text>
        <ScrollView style={s.historyScroll} contentContainerStyle={{ paddingBottom: 96 }}>
          {recents.length === 0 ? (
            <Text style={s.historyEmpty}>Nothing yet — solve a problem to start your history.</Text>
          ) : (
            recents.map((r) => (
              <Pressable key={r.id} onPress={() => openSaved(r.id)} style={s.historyItem}>
                <Text style={s.historyTitle} numberOfLines={1}>{r.question}</Text>
                <Text style={s.historyMeta}>
                  {getSubjectConfig(r.subject).shortLabel} · {timeAgo(r.createdAt)}
                </Text>
              </Pressable>
            ))
          )}
        </ScrollView>

        <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 14) + 12 }]}>
          <Pressable
            onPress={() => {
              clearChat(subject);
              go("/(tabs)");
            }}
            style={s.newChat}
          >
            <Icon name="compose" size={19} color={T.white} strokeWidth={1.8} />
            <Text style={s.newChatText}>Chat</Text>
          </Pressable>
          <Pressable style={s.gearBtn} onPress={closeOverlays}>
            <Icon name="gear" size={21} color={T.ink} strokeWidth={1.7} />
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
};

const s = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, zIndex: 80 },
  scrim: { backgroundColor: "rgba(11,13,18,0.32)" },
  drawer: { position: "absolute", left: 0, top: 0, bottom: 0, width: DRAWER_WIDTH, backgroundColor: T.white },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 14,
  },
  brandMark: { flexDirection: "row", alignItems: "center", gap: 9 },
  brand: { fontSize: 25, fontWeight: "700", letterSpacing: -0.5, color: T.ink },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },

  nav: { paddingHorizontal: 10 },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 12,
    borderRadius: 14,
  },
  navItemActive: { backgroundColor: "#f3f4f6" },
  navLabel: { flex: 1, fontSize: 17.5, lineHeight: 21, color: T.ink },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 9, backgroundColor: "#eef2ff" },
  badgeText: { fontSize: 12, fontWeight: "600", color: T.blue },

  sectionPinned: { paddingHorizontal: 22, paddingTop: 22, paddingBottom: 6, fontSize: 16, fontWeight: "700", color: T.ink },
  pinnedItem: { flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 22, paddingVertical: 11 },
  pinnedLabel: { fontSize: 17, lineHeight: 20, fontWeight: "500", color: T.ink },

  sectionRecents: { paddingHorizontal: 22, paddingTop: 20, paddingBottom: 4, fontSize: 16, fontWeight: "700", color: T.ink },
  historyScroll: { flex: 1 },
  historyItem: { paddingHorizontal: 22, paddingVertical: 12, gap: 3 },
  historyTitle: { fontSize: 16.5, lineHeight: 21, color: T.ink },
  historyMeta: { fontSize: 12.5, color: T.muted3 },
  historyEmpty: { paddingHorizontal: 22, paddingTop: 6, fontSize: 14, lineHeight: 20, color: T.muted3 },

  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 14,
    backgroundColor: T.white,
  },
  newChat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 26,
    backgroundColor: T.blue,
    shadowColor: T.blue,
    shadowOpacity: 0.32,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  newChatText: { fontSize: 17, fontWeight: "600", color: T.white },
  gearBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
});
