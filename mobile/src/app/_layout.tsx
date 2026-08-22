import { useEffect } from "react";
import { Stack } from "expo-router";
import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";
import { useRouter, useSegments } from "expo-router";
import { useUserStore } from "../store/userStore";
import { setApiTokenGetter } from "../services/api/client";

import "../global.css";

const CLERK_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";

function InitialLayout() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const { onboardingDone, loadFromStorage } = useUserStore();

  useEffect(() => {
    loadFromStorage();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setApiTokenGetter(null);
      return;
    }
    setApiTokenGetter(() => getToken());
    return () => setApiTokenGetter(null);
  }, [isLoaded, isSignedIn, getToken]);

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inOnboarding = segments[0] === "onboarding";

    if (!isSignedIn && !inAuthGroup) {
      router.replace("/(auth)/sign-in");
    } else if (isSignedIn && !onboardingDone && !inOnboarding) {
      router.replace("/onboarding/welcome");
    } else if (isSignedIn && onboardingDone && (inAuthGroup || inOnboarding)) {
      router.replace("/(tabs)");
    }
  }, [isSignedIn, isLoaded, onboardingDone]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="onboarding" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ClerkProvider
      publishableKey={CLERK_KEY}
      tokenCache={{
        getToken: (key) => SecureStore.getItemAsync(key),
        saveToken: (key, value) => SecureStore.setItemAsync(key, value),
      }}
    >
      <InitialLayout />
    </ClerkProvider>
  );
}
