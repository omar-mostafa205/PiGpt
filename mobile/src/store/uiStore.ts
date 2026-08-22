import { Keyboard } from "react-native";
import { create } from "zustand";

/**
 * Sidebar, tools, attachments and the quiz window are all overlays that can be
 * opened from more than one screen, so their state lives here.
 *
 * Opening any of them dismisses the keyboard first — otherwise it stays up and
 * covers the bottom of the overlay.
 */
interface UiStore {
  sidebarOpen: boolean;
  toolsOpen: boolean;
  attachOpen: boolean;
  quizOpen: boolean;
  searchOpen: boolean;
  notesOpen: boolean;
  chatMenuOpen: boolean;

  openSidebar: () => void;
  openTools: () => void;
  openAttach: () => void;
  openQuiz: () => void;
  openSearch: () => void;
  openNotes: () => void;
  openChatMenu: () => void;
  closeOverlays: () => void;
}

const allClosed = {
  sidebarOpen: false,
  toolsOpen: false,
  attachOpen: false,
  quizOpen: false,
  searchOpen: false,
  notesOpen: false,
  chatMenuOpen: false,
};

export const useUiStore = create<UiStore>((set) => ({
  ...allClosed,

  openSidebar: () => {
    Keyboard.dismiss();
    set({ ...allClosed, sidebarOpen: true });
  },
  openTools: () => {
    Keyboard.dismiss();
    set({ ...allClosed, toolsOpen: true });
  },
  openAttach: () => {
    Keyboard.dismiss();
    set({ ...allClosed, attachOpen: true });
  },
  openQuiz: () => {
    Keyboard.dismiss();
    set({ ...allClosed, quizOpen: true });
  },
  openSearch: () => {
    Keyboard.dismiss();
    set({ ...allClosed, searchOpen: true });
  },
  openNotes: () => {
    Keyboard.dismiss();
    set({ ...allClosed, notesOpen: true });
  },
  openChatMenu: () => {
    Keyboard.dismiss();
    set({ ...allClosed, chatMenuOpen: true });
  },
  closeOverlays: () => set(allClosed),
}));
