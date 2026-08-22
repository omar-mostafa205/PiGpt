import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { T, radius } from "../../constants/theme";
import { Icon, type IconName } from "../ui/Icon";
import { Markdown } from "./Markdown";
import { ThinkingLabel } from "./ThinkingLabel";
import type { ChatMessage } from "../../types";

/** Actions offered under a finished answer. */
const ACTIONS: { label: string; icon: IconName }[] = [
  { label: "Practice Test", icon: "toolTest" },
  { label: "Practice Question", icon: "toolQuestion" },
];

interface Props {
  message: ChatMessage;
  onFollowUp: (label: string) => void;
}

const ChatBubbleBase: React.FC<Props> = ({ message, onFollowUp }) => {
  // The user's own turn keeps a bubble; it reads as something they said.
  if (message.role === "user") {
    return (
      <View style={s.rowEnd}>
        <View style={s.userBubble}>
          <Text style={s.userText}>{message.content}</Text>
        </View>
      </View>
    );
  }

  const streaming = message.isLoading;
  const empty = !message.content;

  // The assistant answer is plain text on the page — no card, no border.
  return (
    <View style={s.answer}>
      {empty && streaming ? (
        <ThinkingLabel subject={message.subject ?? "math"} />
      ) : (
        <Markdown style={s.answerText}>{message.content}</Markdown>
      )}

      {!streaming && !empty && !message.error ? (
        <View style={s.actions}>
          {ACTIONS.map((a) => (
            <Pressable key={a.label} style={s.actionChip} onPress={() => onFollowUp(a.label)}>
              <Icon name={a.icon} size={15} color={T.body} strokeWidth={1.7} />
              <Text style={s.actionText}>{a.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
};

const s = StyleSheet.create({
  rowEnd: { flexDirection: "row", justifyContent: "flex-end" },

  userBubble: {
    maxWidth: "82%",
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: "#f1f2f5",
    borderRadius: radius.bubble,
  },
  userText: { fontSize: 16, lineHeight: 22, color: T.ink },

  answer: { gap: 14, paddingRight: 4 },
  answerText: { fontSize: 16, lineHeight: 25, color: T.ink2 },

  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  actionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: T.border3,
    backgroundColor: T.white,
  },
  actionText: { fontSize: 13.5, fontWeight: "500", color: T.body },
});

/**
 * Typing in the composer re-renders the solver screen; without this the whole
 * transcript re-renders with it. Comparing content still lets the streaming
 * message update on every delta.
 */
export const ChatBubble = React.memo(
  ChatBubbleBase,
  (a, b) =>
    a.message.id === b.message.id &&
    a.message.content === b.message.content &&
    a.message.isLoading === b.message.isLoading &&
    a.onFollowUp === b.onFollowUp
);
