import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { T } from "../../constants/theme";
import { Icon, type IconName } from "../ui/Icon";
import { useUiStore } from "../../store/uiStore";

export type HeaderMode = "camera" | "chat" | "voice";

const SEGMENTS: { mode: HeaderMode; label: string; icon: IconName; path: string; w: number; h: number }[] = [
  { mode: "camera", label: "Camera", icon: "camera", path: "/(tabs)/camera", w: 17, h: 15 },
  { mode: "chat", label: "Chat", icon: "chat", path: "/(tabs)", w: 19, h: 14 },
  { mode: "voice", label: "Voice", icon: "mic", path: "/(tabs)/voice", w: 12, h: 16 },
];

/**
 * The camera / chat / voice segmented control from the design canvas, with the
 * active segment as a white pill on a #f1f2f5 track. Every segment is a real
 * destination.
 */
export const AppHeader: React.FC<{
  mode: HeaderMode;
  /** Shows compose + overflow actions; set when the chat has messages. */
  activeChat?: boolean;
  onNewChat?: () => void;
}> = ({ mode, activeChat = false, onNewChat }) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const openSidebar = useUiStore((s) => s.openSidebar);
  const openChatMenu = useUiStore((s) => s.openChatMenu);

  return (
    <View style={[s.header, { paddingTop: insets.top + 4 }]}>
      <Pressable onPress={openSidebar} hitSlop={10} style={s.iconBtn}>
        <Icon name="menu" size={18} height={14} color={T.ink2} strokeWidth={2} />
      </Pressable>

      <View style={s.track}>
        {SEGMENTS.map((seg) => {
          const active = seg.mode === mode;
          if (active) {
            return (
              <View key={seg.mode} style={s.activePill}>
                <Icon name={seg.icon} size={seg.w} height={seg.h} color={T.ink} strokeWidth={1.6} />
                <Text style={s.activeText}>{seg.label}</Text>
              </View>
            );
          }
          return (
            <Pressable key={seg.mode} onPress={() => router.replace(seg.path)} style={s.segBtn} hitSlop={4}>
              <Icon name={seg.icon} size={seg.w} height={seg.h} color={T.muted} strokeWidth={1.6} />
            </Pressable>
          );
        })}
      </View>

      {activeChat ? (
        <View style={s.actions}>
          <Pressable onPress={onNewChat} hitSlop={8} style={s.actionBtn} accessibilityLabel="New chat">
            <Icon name="compose" size={20} color={T.ink} strokeWidth={1.9} />
          </Pressable>
          <Pressable onPress={openChatMenu} hitSlop={8} style={s.actionBtn} accessibilityLabel="More">
            <Text style={s.dots}>•••</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable style={s.upgrade}>
          <Text style={s.upgradeText}>Upgrade</Text>
        </Pressable>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    backgroundColor: T.white,
  },
  iconBtn: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  track: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    padding: 4,
    borderRadius: 14,
    backgroundColor: T.chipBg,
  },
  segBtn: { paddingHorizontal: 12, paddingVertical: 8, alignItems: "center", justifyContent: "center" },
  activePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 11,
    backgroundColor: T.white,
    shadowColor: "#000",
    shadowOpacity: 0.09,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  activeText: { fontSize: 14.5, fontWeight: "600", color: T.ink },
  actions: { flexDirection: "row", alignItems: "center", gap: 4 },
  actionBtn: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  dots: { fontSize: 15, letterSpacing: 0.5, color: T.ink },
  upgrade: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12, backgroundColor: T.blue },
  upgradeText: { fontSize: 15.5, fontWeight: "600", color: T.white },
});
