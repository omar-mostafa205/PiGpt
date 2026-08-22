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
import { useSignUp, useOAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { Button } from "../../components/ui/Button";
import { cssInterop } from "nativewind";
import { GoogleLogo } from "@/components/ui/Icons";
import { Ionicons } from "@expo/vector-icons";

cssInterop(RNSafeAreaView, { className: "style" });
const SafeAreaView = RNSafeAreaView;

export default function SignUp() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const { startOAuthFlow: startGoogleFlow } = useOAuth({ strategy: "oauth_google" });
  const { startOAuthFlow: startAppleFlow } = useOAuth({ strategy: "oauth_apple" });
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!isLoaded) return;
    setLoading(true);
    setError("");
    try {
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (e: any) {
      setError(e.errors?.[0]?.message ?? "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!isLoaded) return;
    setLoading(true);
    setError("");
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      await setActive({ session: result.createdSessionId });
      router.replace("/onboarding/welcome");
    } catch (e: any) {
      setError(e.errors?.[0]?.message ?? "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { createdSessionId, setActive: setOAuthActive } = await startGoogleFlow();
      if (createdSessionId) {
        await setOAuthActive?.({ session: createdSessionId });
        router.replace("/onboarding/welcome");
      }
    } catch (e: any) {
      setError(e.errors?.[0]?.message ?? "Google sign-in failed");
    }
  };

  const handleAppleSignIn = async () => {
    try {
      const { createdSessionId, setActive: setOAuthActive } = await startAppleFlow();
      if (createdSessionId) {
        await setOAuthActive?.({ session: createdSessionId });
        router.replace("/onboarding/welcome");
      }
    } catch (e: any) {
      setError(e.errors?.[0]?.message ?? "Apple sign-in failed");
    }
  };

  // ── Verification screen ──────────────────────────────────────────────────
  if (pendingVerification) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          className="flex-1 justify-center px-6 py-8"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Text className="text-2xl font-extrabold text-center text-gray-900 mb-1">
            Check your email
          </Text>
          <Text className="text-sm text-center text-gray-400 mb-8">
            Enter the 6-digit code we sent you
          </Text>

          <Text className="text-xs font-semibold text-gray-500 mb-1.5">
            Verification Code
          </Text>
          <TextInput
            className="border border-gray-200 rounded-2xl px-4 py-3.5 text-base text-gray-900 bg-gray-50"
            value={code}
            onChangeText={setCode}
            placeholder="123456"
            placeholderTextColor="#9ca3af"
            keyboardType="number-pad"
            maxLength={6}
          />

          {error ? (
            <Text className="text-red-500 text-xs mt-2">{error}</Text>
          ) : null}

          <View className="mt-6">
            <Button label="Verify Email" onPress={handleVerify} loading={loading} fullWidth />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Sign-up screen ───────────────────────────────────────────────────────
  return (
    <ImageBackground
      source={require("../../../assets/images/on.png")}
      resizeMode="cover"
      className="flex-1"
    >
      <SafeAreaView className="flex-1 justify-end">
        {/* Dark overlay */}
        <View className="absolute inset-0 bg-black/10" />

        {/* Bottom Content */}
        <KeyboardAvoidingView
          className="px-6 pb-10"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* Headline */}
          <View className="mb-8">
            <Text className="text-white text-5xl font-medium text-center  tracking-tight">
            Solve Any Math{"\n"}Problem Instantly
            </Text>

            <Text className="text-white text-base mt-3 leading-6 text-center">
            Take a photo of any problem and get{"\n"}
            clear step-by-step explanations powered by AI.
            </Text>
          </View>

          {/* Continue with Google */}
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
              {/* Google "G" icon placeholder — swap for your SVG/Image */}
              <GoogleLogo  size={18}/>
            <Text className="text-black text-base font-semibold ml-2">
              Continue with Google
            </Text>
          </TouchableOpacity>

          {/* Continue with Apple */}
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
              mb-5
            "
          >
            {/* Apple icon placeholder — swap for your SVG/Image */}
            <Ionicons name="logo-apple" size={23} color="white"/>
            <Text className="text-white text-base font-semibold ml-2">
              Continue with Apple
            </Text>
          </TouchableOpacity>

          {/* Email sign-up */}
          <View className="bg-white/95 rounded-3xl p-4 mt-2">
            <Text className="text-xs font-semibold text-gray-500 mb-1.5">
              Email
            </Text>
            <TextInput
              className="border border-gray-200 rounded-2xl px-4 py-3.5 text-base text-gray-900 bg-gray-50 mb-3"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
            />

            <Text className="text-xs font-semibold text-gray-500 mb-1.5">
              Password
            </Text>
            <TextInput
              className="border border-gray-200 rounded-2xl px-4 py-3.5 text-base text-gray-900 bg-gray-50"
              value={password}
              onChangeText={setPassword}
              placeholder="Create a password"
              placeholderTextColor="#9ca3af"
              secureTextEntry
              textContentType="newPassword"
            />

            {error ? (
              <Text className="text-red-500 text-xs mt-2">{error}</Text>
            ) : null}

            <View className="mt-4">
              <Button
                label="Create account"
                onPress={handleSignUp}
                loading={loading}
                fullWidth
                disabled={!email.trim() || !password}
              />
            </View>

            <View className="flex-row justify-center mt-4">
              <Text className="text-gray-600 text-sm">Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/sign-in")}>
                <Text className="text-gray-900 text-sm font-semibold">
                  Sign in
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}
