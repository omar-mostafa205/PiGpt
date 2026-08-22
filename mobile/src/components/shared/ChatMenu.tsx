import React from "react";
import { View, Text, Pressable, StyleSheet, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { T, radius } from "../../constants/theme";
import { Icon, type IconName } from "../ui/Icon";
import { useUiStore } from "../../store/uiStore";
import { useOverlayAnimation } from "../../hooks/useOverlayAnimation";

export interface ChatMenuHandlers {
  onFindInChat?: () => void;
  onDelete?: () => void;
}

type Row = { label: string; icon: IconName; key: keyof ChatMenuHandlers | "share" | "pin" | "archive"; danger?: boolean };

const ROWS: Row[] = [
  { label: "Share", icon: "share", key: "share" },
  { label: "Pin", icon: "pin", key: "pin" },
  { label: "Uploaded files", icon: "paperclip", key: "share" },
  { label: "Find in chat", icon: "search", key: "onFindInChat" },
  { label: "Archive", icon: "archive", key: "archive" },
  { label: "Delete", icon: "trash", key: "onDelete", danger: true },
];

/** The overflow menu behind the header's "…" once a chat has messages. */
export const ChatMenu: React.FC<{ handlers?: ChatMenuHandlers }> = ({ handlers }) => {
  const chatMenuOpen = useUiStore((st) => st.chatMenuOpen);
  const closeOverlays = useUiStore((st) => st.closeOverlays);
  const insets = useSafeAreaInsets();
  const { mounted, slide, fade } = useOverlayAnimation(chatMenuOpen, 420);

  if (!mounted) return null;

  const run = (row: Row) => {
    closeOverlays();
    if (row.key === "onFindInChat") handlers?.onFindInChat?.();
    else if (row.key === "onDelete") handlers?.onDelete?.();
  };

  return (
    <View style={s.root}>
      <Animated.View style={[StyleSheet.absoluteFill, s.scrim, { opacity: fade }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeOverlays} />
      </Animated.View>

      <Animated.View
        style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 10, transform: [{ translateY: slide }] }]}
      >
        <View style={s.grabber} />
        {ROWS.map((row) => (
          <Pressable key={row.label} style={s.row} onPress={() => run(row)}>
            <Icon
              name={row.icon}
              size={20}
              color={row.danger ? T.badFg : T.ink2}
              strokeWidth={1.7}
            />
            <Text style={[s.label, row.danger && { color: T.badFg }]}>{row.label}</Text>
          </Pressable>
        ))}
      </Animated.View>
    </View>
  );
};

const s = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, zIndex: 78, justifyContent: "flex-end" },
  scrim: { backgroundColor: "rgba(11,13,18,0.32)" },
  sheet: {
    backgroundColor: T.white,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingTop: 12,
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#d6d9de",
    alignSelf: "center",
    marginBottom: 12,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 24, paddingVertical: 14 },
  label: { flex: 1, fontSize: 17.5, color: T.ink },
});
