import React from "react";
import { View, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Sidebar } from "./Sidebar";
import { ToolsSheet, type ToolHandlers } from "../solver/ToolsSheet";
import { AttachSheet, type AttachHandlers } from "../solver/AttachSheet";
import { QuizSheet } from "../quiz/QuizSheet";
import { SearchSheet } from "./SearchSheet";
import { NotesPanel } from "./NotesPanel";
import { ChatMenu, type ChatMenuHandlers } from "./ChatMenu";

/**
 * Hosts every overlay the app shares across screens. Only one screen is
 * mounted at a time, so rendering them per-screen keeps the open state simple
 * while still drawing above everything on that screen.
 */
export const AppScreen: React.FC<{
  children: React.ReactNode;
  background?: string;
  /** Screen-specific actions the tools sheet can trigger. */
  toolHandlers?: ToolHandlers;
  /** Screen-specific actions behind the composer's "+". */
  attachHandlers?: AttachHandlers;
  /** Actions for the active-chat overflow menu. */
  chatMenuHandlers?: ChatMenuHandlers;
}> = ({ children, background = "#ffffff", toolHandlers, attachHandlers, chatMenuHandlers }) => (
  <View style={[s.root, { backgroundColor: background }]}>
    <StatusBar style="dark" />
    {children}
    <AttachSheet handlers={attachHandlers} />
    <ToolsSheet handlers={toolHandlers} />
    <ChatMenu handlers={chatMenuHandlers} />
    <Sidebar />
    <NotesPanel />
    <QuizSheet />
    <SearchSheet />
  </View>
);

const s = StyleSheet.create({ root: { flex: 1 } });
