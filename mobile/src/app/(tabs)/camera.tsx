import React, { useRef } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import Svg, { Path, Rect } from "react-native-svg";
import { T } from "../../constants/theme";
import { AppScreen } from "../../components/shared/AppScreen";
import { AppHeader } from "../../components/shared/AppHeader";
import { useCamera } from "../../hooks/useCamera";
import { useChat } from "../../hooks/useChat";
import { useSubject } from "../../hooks/useSubject";
import { useUserStore } from "../../store/userStore";
import { getSubjectConfig } from "../../constants/subjects";
import type { OnboardingSubject } from "../../types/user";

const ALL: OnboardingSubject[] = ["Math", "Physics", "Chemistry", "Statistics", "Accounting"];

export default function CameraScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { pickFromGallery } = useCamera();
  const { send } = useChat();
  const { activeSubject, activeLabel, setSubjectByLabel } = useSubject();
  const chosen = useUserStore((s) => s.subjects);

  // Ask on mount so the preview is live as soon as the screen opens.
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  React.useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) requestPermission();
  }, [permission, requestPermission]);

  const tabs = chosen.length ? chosen : ALL;
  const config = getSubjectConfig(activeSubject);
  const subjectWord = config.shortLabel.toLowerCase();

  const solve = (base64: string) => {
    router.navigate("/(tabs)");
    send(`Solve this ${subjectWord} problem from my photo`, base64);
  };

  const shoot = async () => {
    const photo = await cameraRef.current?.takePictureAsync({ base64: true, quality: 0.7 });
    if (photo?.base64) solve(photo.base64);
  };

  const fromGallery = async () => {
    const base64 = await pickFromGallery();
    if (base64) solve(base64);
  };

  return (
    <AppScreen>
      <AppHeader mode="camera" />

      <View style={s.middle}>
        <Text style={s.prompt}>Take a picture of a {subjectWord} problem</Text>

        <View style={s.frame}>
          {permission?.granted ? (
            <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
          ) : (
            <View style={s.permissionBox}>
              <Text style={s.permissionText}>
                {permission?.canAskAgain === false
                  ? "Camera access is off. Enable it in Settings to scan problems."
                  : "Allow camera access to scan a problem."}
              </Text>
              {permission?.canAskAgain !== false ? (
                <Pressable onPress={requestPermission} style={s.permissionBtn}>
                  <Text style={s.permissionBtnText}>Allow camera</Text>
                </Pressable>
              ) : null}
            </View>
          )}

          <View style={s.cornerTL} pointerEvents="none" />
          <View style={s.cornerBR} pointerEvents="none" />
        </View>

        <Text style={s.hint}>Fit the whole question inside the frame</Text>
      </View>

      <View style={[s.bottom, { paddingBottom: Math.max(insets.bottom, 18) + 20 }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabs}>
          {tabs.map((label) => {
            // Compare labels, not API subjects — Statistics maps onto math and
            // would otherwise light up alongside Math.
            const active = label === activeLabel;
            return (
              <Pressable
                key={label}
                onPress={() => setSubjectByLabel(label)}
                style={[
                  s.tab,
                  active
                    ? { backgroundColor: T.ink, borderColor: T.ink }
                    : { backgroundColor: T.white, borderColor: T.border2 },
                ]}
              >
                <Text style={[s.tabText, { color: active ? T.white : T.muted }]}>{label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={s.shutterRow}>
          <Pressable onPress={fromGallery} style={s.galleryBtn} hitSlop={10}>
            <Svg width={26} height={24} viewBox="0 0 26 24" fill="none">
              <Rect x={6} y={1} width={19} height={16} rx={2.5} stroke={T.body} strokeWidth={1.8} strokeLinejoin="round" />
              <Path d="M6 21H3V5" stroke={T.body} strokeWidth={1.8} strokeLinejoin="round" />
              <Path d="M9 13l4-4 4 4 3-3 3 3" stroke={T.body} strokeWidth={1.8} strokeLinejoin="round" />
            </Svg>
          </Pressable>

          <Pressable
            onPress={shoot}
            disabled={!permission?.granted}
            style={[s.shutter, !permission?.granted && s.shutterOff]}
          />
        </View>
      </View>
    </AppScreen>
  );
}

const s = StyleSheet.create({
  middle: { flex: 1, justifyContent: "center", paddingHorizontal: 18, gap: 14 },
  prompt: { textAlign: "center", fontSize: 17, lineHeight: 22.1, fontWeight: "600", color: T.ink },
  frame: {
    height: 300,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: T.blue,
    backgroundColor: "#f6f7f9",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  permissionBox: { paddingHorizontal: 26, alignItems: "center", gap: 14 },
  permissionText: { textAlign: "center", fontSize: 15, lineHeight: 21, color: T.muted2 },
  permissionBtn: { paddingHorizontal: 18, paddingVertical: 11, borderRadius: 22, backgroundColor: T.blue },
  permissionBtnText: { fontSize: 15, fontWeight: "600", color: T.white },

  cornerTL: {
    position: "absolute",
    top: 12,
    left: 12,
    width: 26,
    height: 26,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: T.blue,
    borderTopLeftRadius: 8,
  },
  cornerBR: {
    position: "absolute",
    bottom: 12,
    right: 12,
    width: 26,
    height: 26,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: T.blue,
    borderBottomRightRadius: 8,
  },
  hint: { textAlign: "center", fontSize: 13, lineHeight: 18.2, color: T.muted3 },

  bottom: { gap: 20 },
  tabs: { gap: 6, paddingHorizontal: 16 },
  tab: { paddingHorizontal: 15, paddingVertical: 9, borderRadius: 12, borderWidth: 1 },
  tabText: { fontSize: 15, fontWeight: "600" },

  shutterRow: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  galleryBtn: { position: "absolute", left: 44, padding: 8 },
  shutter: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 4,
    borderColor: T.blue,
    backgroundColor: T.tintBg2,
  },
  shutterOff: { opacity: 0.4 },
});
