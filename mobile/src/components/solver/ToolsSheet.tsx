import React from "react";
import { View, Text, Pressable, StyleSheet, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { T, radius } from "../../constants/theme";
import { Icon, type IconName } from "../ui/Icon";
import { useUiStore } from "../../store/uiStore";
import { useOverlayAnimation } from "../../hooks/useOverlayAnimation";

export interface ToolHandlers {
  onMathInput?: () => void;
  onUploadPdf?: () => void;
  onPickPhoto?: () => void;
}

type Action = "quiz" | "camera" | "voice" | "math" | "pdf" | "photo";

const TOOLS: { label: string; icon: IconName; action: Action }[] = [
  { label: "Math input keyboard", icon: "toolMath", action: "math" },
  { label: "Choose a photo", icon: "photos", action: "photo" },
  { label: "Upload a worksheet", icon: "paperclip", action: "pdf" },
  { label: "Scan a problem", icon: "camera", action: "camera" },
  { label: "Record a lecture", icon: "mic", action: "voice" },
  { label: "Create practice test", icon: "toolTest", action: "quiz" },
  { label: "Create practice question", icon: "toolQuestion", action: "quiz" },
];

export const ToolsSheet: React.FC<{ handlers?: ToolHandlers }> = ({ handlers }) => {
  const toolsOpen = useUiStore((st) => st.toolsOpen);
  const closeOverlays = useUiStore((st) => st.closeOverlays);
  const openQuiz = useUiStore((st) => st.openQuiz);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { mounted, slide: rise, fade } = useOverlayAnimation(toolsOpen, 520);

  if (!mounted) return null;

  const run = (action: Action) => {
    closeOverlays();
    if (action === "quiz") openQuiz();
    else if (action === "camera") router.navigate("/(tabs)/camera");
    else if (action === "voice") router.navigate("/(tabs)/voice");
    else if (action === "math") handlers?.onMathInput?.();
    else if (action === "pdf") handlers?.onUploadPdf?.();
    else if (action === "photo") handlers?.onPickPhoto?.();
  };

  // Only offer the composer-bound tools on screens that provide them.
  const items = TOOLS.filter((t) => {
    if (t.action === "math") return !!handlers?.onMathInput;
    if (t.action === "pdf") return !!handlers?.onUploadPdf;
    if (t.action === "photo") return !!handlers?.onPickPhoto;
    return true;
  });

  return (
    <View style={s.root}>
      <Animated.View style={[StyleSheet.absoluteFill, s.scrim, { opacity: fade }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeOverlays} />
      </Animated.View>

      <Animated.View
        style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 14, transform: [{ translateY: rise }] }]}
      >
        <View style={s.grabber} />
        <Text style={s.heading}>Tools</Text>
        {items.map((t) => (
          <Pressable key={t.label} style={s.row} onPress={() => run(t.action)}>
            <Icon name={t.icon} size={20} color={T.ink2} strokeWidth={1.7} />
            <Text style={s.rowLabel}>{t.label}</Text>
            <Icon name="chevronRight" size={8} height={13} color="#c3c7cd" strokeWidth={1.8} />
          </Pressable>
        ))}
      </Animated.View>
    </View>
  );
};

const s = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, zIndex: 70, justifyContent: "flex-end" },
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
    marginBottom: 14,
  },
  heading: { paddingHorizontal: 22, paddingBottom: 10, fontSize: 17, fontWeight: "700", color: T.ink },
  row: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 22, paddingVertical: 13 },
  rowLabel: { flex: 1, fontSize: 16, lineHeight: 20, fontWeight: "500", color: T.ink2 },
});
