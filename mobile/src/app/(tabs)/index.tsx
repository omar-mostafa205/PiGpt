import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { T } from "../../constants/theme";
import { getSubjectConfig } from "../../constants/subjects";
import { AppScreen } from "../../components/shared/AppScreen";
import { AppHeader } from "../../components/shared/AppHeader";
import { ChatBubble } from "../../components/solver/ChatBubble";
import { MathKeyboard } from "../../components/solver/MathKeyboard";
import { Icon, type IconName } from "../../components/ui/Icon";
import { useChat } from "../../hooks/useChat";
import { useCamera } from "../../hooks/useCamera";
import { useFilePicker } from "../../hooks/useFilePicker";
import { useSubject } from "../../hooks/useSubject";
import { useDictation } from "../../hooks/useDictation";
import { useUiStore } from "../../store/uiStore";

export default function SolverScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { messages, isLoading, send, stop, clearChat } = useChat();
  const { activeSubject } = useSubject();
  const { pickPdf } = useFilePicker();
  const { takePicture, pickFromGallery } = useCamera();
  const openTools = useUiStore((st) => st.openTools);
  const openAttach = useUiStore((st) => st.openAttach);
  const openSearch = useUiStore((st) => st.openSearch);

  // The mic dictates into the composer; the lecture recorder lives on its own tab.
  const dictation = useDictation((text) =>
    setInput((v) => (v ? `${v.trim()} ${text}` : text))
  );
  const openQuiz = useUiStore((st) => st.openQuiz);

  const [input, setInput] = useState("");
  const [mathOpen, setMathOpen] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const config = getSubjectConfig(activeSubject);
  const subjectWord = config.shortLabel.toLowerCase();

  const submit = (text: string, imageBase64?: string) => {
    const value = text.trim();
    if (!value || isLoading) return;
    setInput("");
    setMathOpen(false);
    // Drop the keyboard so the composer settles at the bottom while the
    // answer streams in, instead of staying pinned above it.
    Keyboard.dismiss();
    send(value, imageBase64);
  };

  // The action chips feed the conversation rather than navigating away.
  const FOLLOW_UP_PROMPTS: Record<string, string> = {
    "Practice Test": "Create a practice test on this topic.",
    "Practice Question": "Give me one more practice question on this topic.",
  };

  const onFollowUp = (label: string) => submit(FOLLOW_UP_PROMPTS[label] ?? label);

  const attachPdf = async () => {
    const text = await pickPdf();
    if (text) submit(`Please solve the following from my worksheet:\n\n${text}`);
  };

  const snapPhoto = async () => {
    const base64 = await takePicture();
    if (base64) submit(`Solve this ${subjectWord} problem from my photo`, base64);
  };

  const choosePhoto = async () => {
    const base64 = await pickFromGallery();
    if (base64) submit(`Solve this ${subjectWord} problem from my photo`, base64);
  };

  const suggestions: { label: string; icon: IconName; run: () => void }[] = [
    { label: "Scan a problem", icon: "navCamera", run: () => router.navigate("/(tabs)/camera") },
    { label: "Upload a worksheet", icon: "paperclip", run: attachPdf },
  ];

  const hasText = input.trim().length > 0;
  const isEmpty = messages.length === 0;

  return (
    <AppScreen
      toolHandlers={{ onMathInput: () => setMathOpen(true), onUploadPdf: attachPdf, onPickPhoto: choosePhoto }}
      attachHandlers={{ onCamera: snapPhoto, onPhotos: choosePhoto, onFiles: attachPdf }}
      chatMenuHandlers={{ onFindInChat: openSearch, onDelete: clearChat }}
    >
      <AppHeader mode="chat" activeChat={!isEmpty} onNewChat={clearChat} />

      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {isEmpty ? (
          <View style={s.flex} />
        ) : (
          <ScrollView
            ref={scrollRef}
            style={s.flex}
            contentContainerStyle={s.messages}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {messages.map((m) => (
              <ChatBubble key={m.id} message={m} onFollowUp={onFollowUp} />
            ))}
          </ScrollView>
        )}

        {isEmpty ? (
          <View style={s.suggestions}>
            {suggestions.map((sug) => (
              <Pressable key={sug.label} onPress={sug.run} style={s.suggestionRow}>
                <Icon name={sug.icon} size={26} color={T.muted3} strokeWidth={1.7} />
                <Text style={s.suggestionLabel}>{sug.label}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {mathOpen ? <MathKeyboard onKey={(k) => setInput((v) => v + k)} /> : null}

        <View style={[s.composerWrap, { paddingBottom: Math.max(insets.bottom, 10) + 2 }]}>
          <View style={s.composer}>
            <TextInput
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => submit(input)}
              placeholder={`Ask about ${subjectWord}`}
              placeholderTextColor="#9a9aa0"
              style={s.input}
              returnKeyType="send"
              multiline
            />

            <View style={s.composerRow}>
              <View style={s.group}>
                <ComposerButton icon="plus" onPress={openAttach} label="Add an attachment" />

                <Pressable
                  onPress={() => setMathOpen((v) => !v)}
                  hitSlop={6}
                  accessibilityLabel="Math input"
                  style={s.labelBtn}
                >
                  <Text style={[s.sigma, { color: mathOpen ? T.blue : T.body }]}>Σ</Text>
                  <Text numberOfLines={1} style={[s.btnLabel, { color: mathOpen ? T.blue : T.body }]}>
                    Math Input
                  </Text>
                </Pressable>

                <Pressable onPress={openTools} hitSlop={6} accessibilityLabel="Tools" style={s.labelBtn}>
                  <Icon name="tools" size={17} height={16} color={T.body} strokeWidth={1.6} />
                  <Text numberOfLines={1} style={s.btnLabel}>
                    Tools
                  </Text>
                </Pressable>
              </View>

              <View style={s.group}>
                <Pressable
                  onPress={dictation.toggle}
                  hitSlop={6}
                  accessibilityLabel="Dictate"
                  style={[s.btn, dictation.isRecording && s.micLive]}
                >
                  {dictation.transcribing ? (
                    <ActivityIndicator size="small" color={T.blue} />
                  ) : (
                    <Icon
                      name="mic"
                      size={13}
                      height={17}
                      color={dictation.isRecording ? T.white : T.body}
                      strokeWidth={1.8}
                    />
                  )}
                </Pressable>
                <Pressable
                  onPress={() => (isLoading ? stop() : submit(input))}
                  style={[s.send, { backgroundColor: isLoading || hasText ? T.blue : T.blueSend }]}
                  accessibilityLabel={isLoading ? "Stop" : "Send"}
                >
                  {isLoading ? (
                    <View style={s.stopSquare} />
                  ) : (
                    <Icon name="send" size={15} height={16} color={T.white} strokeWidth={2.1} />
                  )}
                </Pressable>
              </View>
            </View>
          </View>

          <Text style={s.disclaimer}>
            {dictation.isRecording
              ? "Listening — tap the mic to stop"
              : dictation.error ?? "PiGPT can make mistakes. Check important info."}
          </Text>
        </View>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

/** One composer action. Fixed 34x34 box so every control lines up. */
const ComposerButton: React.FC<{
  icon: IconName;
  onPress: () => void;
  label: string;
  width?: number;
  height?: number;
}> = ({ icon, onPress, label, width = 18, height }) => (
  <Pressable onPress={onPress} hitSlop={6} accessibilityLabel={label} style={s.btn}>
    <Icon name={icon} size={width} height={height} color={T.body} strokeWidth={1.8} />
  </Pressable>
);

const BTN = 34;

const s = StyleSheet.create({
  flex: { flex: 1 },
  messages: { padding: 16, paddingTop: 12, paddingBottom: 8, gap: 14 },

  suggestions: { paddingHorizontal: 26, paddingBottom: 14 },
  suggestionRow: { flexDirection: "row", alignItems: "center", gap: 22, paddingVertical: 15 },
  suggestionLabel: { fontSize: 19, color: "#3a3a3c" },

  composerWrap: { paddingHorizontal: 14, paddingTop: 4, backgroundColor: T.white },
  composer: {
    borderRadius: 24,
    backgroundColor: "#f4f4f6",
    paddingTop: 14,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  input: {
    fontSize: 17,
    lineHeight: 22,
    color: T.ink,
    paddingTop: 0,
    paddingBottom: 10,
    paddingHorizontal: 4,
    maxHeight: 140,
  },
  composerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  group: { flexDirection: "row", alignItems: "center", gap: 2, flexShrink: 1 },
  btn: { width: BTN, height: BTN, alignItems: "center", justifyContent: "center" },
  micLive: { borderRadius: BTN / 2, backgroundColor: T.bad },
  /** Same 34px height as the icon-only buttons, so the row stays aligned. */
  labelBtn: {
    height: BTN,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 6,
    flexShrink: 1,
  },
  btnLabel: { fontSize: 14.5, fontWeight: "600", flexShrink: 1 },
  sigma: { fontSize: 17, fontWeight: "700", lineHeight: 20 },
  send: { width: BTN, height: BTN, borderRadius: BTN / 2, alignItems: "center", justifyContent: "center" },
  stopSquare: { width: 13, height: 13, borderRadius: 3, backgroundColor: T.white },

  disclaimer: { textAlign: "center", paddingTop: 8, fontSize: 11.5, color: T.faint },
});
