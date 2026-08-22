import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { useOAuth, useSignIn } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { cssInterop } from "nativewind";
import { GoogleLogo } from "@/components/ui/Icons";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../../components/ui/Button";

cssInterop(RNSafeAreaView, { className: "style" });
const SafeAreaView = RNSafeAreaView;

export default function SignIn() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startOAuthFlow: startGoogleFlow } = useOAuth({
    strategy: "oauth_google",
  });
  const { startOAuthFlow: startAppleFlow } = useOAuth({ strategy: "oauth_apple" });
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailSignIn = async () => {
    if (!isLoaded) return;
    setLoading(true);
    setError("");
    try {
      const result = await signIn?.create({
        identifier: email.trim(),
        password,
      });

      if (result?.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/(tabs)");
      } else {
        setError("Sign-in incomplete. Please try again.");
      }
    } catch (e: any) {
      setError(e.errors?.[0]?.message ?? "Sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    try {
      const { createdSessionId, setActive: setOAuthActive } =
        await startGoogleFlow();
      if (createdSessionId) {
        await setOAuthActive?.({ session: createdSessionId });
        router.replace("/(tabs)");
      }
    } catch (e: any) {
      setError(e.errors?.[0]?.message ?? "Google sign-in failed");
    }
  };

  const handleAppleSignIn = async () => {
    setError("");
    try {
      const { createdSessionId, setActive: setOAuthActive } =
        await startAppleFlow();
      if (createdSessionId) {
        await setOAuthActive?.({ session: createdSessionId });
        router.replace("/(tabs)");
      }
    } catch (e: any) {
      setError(e.errors?.[0]?.message ?? "Apple sign-in failed");
    }
  };

  return (
    <ImageBackground
      source={require("../../../assets/images/on.png")}
      resizeMode="cover"
      className="flex-1"
    >
      <SafeAreaView className="flex-1 justify-end">
        <View className="absolute inset-0 bg-black/10" />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="px-6 pb-10"
        >
          <View className="mb-6">
            <Text className="text-white text-5xl font-medium text-center tracking-tight">
            Solve Any Math{"\n"}Problem Instantly
            </Text>
            <Text className="text-white/90 text-base mt-3 leading-6 text-center">
            Take a photo of any problem and get{"\n"}
            clear step-by-step explanations powered by AI.
                        </Text>
          </View>

          <TouchableOpacity
            onPress={handleGoogleSignIn}
            activeOpacity={0.85}
            className="
              bg-white
              rounded-full
              px-6
              py-4
              flex-row
              items-center
              justify-center
              mb-3
              shadow-2xl
            "
          >
            <GoogleLogo size={18} />
            <Text className="text-black text-base font-semibold ml-2">
              Continue with Google
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleAppleSignIn}
            activeOpacity={0.85}
            className="
              bg-neutral-800
              rounded-full
              px-6
              py-4
              flex-row
              items-center
              justify-center
              mb-6
            "
          >
            <Ionicons name="logo-apple" size={23} color="white" />
            <Text className="text-white text-base font-semibold ml-2">
              Continue with Apple
            </Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

