import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Everything stored here is per account.
 *
 * Keys used to be global ("chat_history_math"), so signing in with a second
 * account on the same device showed the first account's conversations and
 * onboarding answers. Every key is now namespaced by the signed-in user id,
 * which keeps accounts isolated on a shared device.
 */
let scope = "anon";

/** Point storage at a user. Pass null when signed out. */
export function setStorageScope(userId: string | null): void {
  scope = userId ?? "anon";
}

export function getStorageScope(): string {
  return scope;
}

const scoped = (key: string) => `u:${scope}:${key}`;

export async function storageGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(scoped(key));
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function storageSet<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(scoped(key), JSON.stringify(value));
  } catch {
    // silently fail
  }
}

export async function storageRemove(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(scoped(key));
  } catch {
    // silently fail
  }
}

/** Wipe everything belonging to the current scope, e.g. on sign-out. */
export async function storageClearScope(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const mine = keys.filter((k) => k.startsWith(`u:${scope}:`));
    if (mine.length) await AsyncStorage.multiRemove(mine);
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
