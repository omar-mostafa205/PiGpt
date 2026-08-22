import AsyncStorage from "@react-native-async-storage/async-storage";

export async function storageGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function storageSet<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // silently fail
  }
}

export async function storageRemove(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // silently fail
  }
}

export const STORAGE_KEYS = {
  CHAT_HISTORY: (subject: string) => `chat_history_${subject}`,
  ONBOARDING_DONE: "onboarding_done",
  ROLE: "onboarding_role",
  GOAL: "onboarding_goal",
  SUBJECTS: "subjects",
  SOURCE: "onboarding_source",
  PROGRESS_CACHE: "progress_cache",
  RECORDING_COUNT: "recording_count",
} as const;
