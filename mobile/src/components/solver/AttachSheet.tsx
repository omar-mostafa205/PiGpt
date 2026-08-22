import React from "react";
import { View, Text, Pressable, StyleSheet, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { T, radius } from "../../constants/theme";
import { Icon, type IconName } from "../ui/Icon";
import { useUiStore } from "../../store/uiStore";
import { useOverlayAnimation } from "../../hooks/useOverlayAnimation";

export interface AttachHandlers {
  onCamera?: () => void;
  onPhotos?: () => void;
  onFiles?: () => void;
}

const ROWS: { key: keyof AttachHandlers; label: string; icon: IconName; size: number; height?: number }[] = [
  { key: "onCamera", label: "Camera", icon: "camera", size: 20, height: 17 },
  { key: "onPhotos", label: "Photos", icon: "photos", size: 20 },
  { key: "onFiles", label: "Files", icon: "paperclip", size: 20 },
];

/** The menu behind the composer's "+" — camera, photo library, files. */
export const AttachSheet: React.FC<{ handlers?: AttachHandlers }> = ({ handlers }) => {
  const attachOpen = useUiStore((st) => st.attachOpen);
  const closeOverlays = useUiStore((st) => st.closeOverlays);
  const insets = useSafeAreaInsets();
  const { mounted, slide, fade } = useOverlayAnimation(attachOpen, 320);

  if (!mounted) return null;

  return (
    <View style={s.root}>
      <Animated.View style={[StyleSheet.absoluteFill, s.scrim, { opacity: fade }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeOverlays} />
      </Animated.View>

      <Animated.View
        style={[
          s.sheet,
          { paddingBottom: Math.max(insets.bottom, 16) + 12, transform: [{ translateY: slide }] },
        ]}
      >
        <View style={s.grabber} />
        {ROWS.map((row) => (
          <Pressable
            key={row.label}
            style={s.row}
            onPress={() => {
              closeOverlays();
              handlers?.[row.key]?.();
            }}
          >
            <View style={s.chip}>
              <Icon name={row.icon} size={row.size} height={row.height} color={T.muted} strokeWidth={1.7} />
            </View>
            <Text style={s.label}>{row.label}</Text>
          </Pressable>
        ))}
      </Animated.View>
    </View>
  );
};

const s = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, zIndex: 75, justifyContent: "flex-end" },
  scrim: { backgroundColor: "rgba(11,13,18,0.32)" },
  sheet: {
    backgroundColor: T.white,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingTop: 12,
    paddingBottom: 8,
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#d6d9de",
    alignSelf: "center",
    marginBottom: 10,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 22, paddingVertical: 10 },
  chip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f2f2f5",
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontSize: 17.5, color: T.body },
});
