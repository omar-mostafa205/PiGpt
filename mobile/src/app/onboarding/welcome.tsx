import React from "react";
import { View, Text, TouchableOpacity, ImageBackground } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { cssInterop } from "nativewind";
import { Ionicons } from "@expo/vector-icons";

cssInterop(RNSafeAreaView, { className: "style" });
const SafeAreaView = RNSafeAreaView;

const FEATURES = [
  { id: "solutions", text: "Step-by-step AI solutions for Math, Physics, Chemistry & Accounting" },
  { id: "photo",     text: "Snap a photo of any problem and get instant answers" },
  { id: "progress",  text: "Track your progress and identify weak topics" },
  { id: "quiz",      text: "Practice with AI-generated quizzes tailored to you" },
];

export default function Welcome() {
  const router = useRouter();

  return (
    <ImageBackground
      source={require("../../../assets/images/onboarding.png")}
      resizeMode="cover"
      className="flex-1"
    >
      <StatusBar style="light" />

      {/* Scrim — keeps the copy legible wherever the image crops */}
      <View className="absolute inset-0 bg-black/20" />

      <SafeAreaView className="flex-1 justify-end" edges={["top", "bottom"]}>
        <View className="px-6 pb-10">

          <Text className="text-white text-5xl font-medium tracking-tight text-center">
            Welcome to{"\n"}PiGPT
          </Text>
          <Text className="text-white/80 text-base mt-3 leading-6 text-center">
            Your personal STEM tutor, available 24/7
          </Text>

          <View className="mt-8 mb-10 gap-3">
            {FEATURES.map((f) => (
              <View key={f.id} className="flex-row items-start gap-3">
                <Ionicons name="checkmark-circle" size={20} color="#7CB8FF" />
                <Text className="flex-1 text-white/90 text-base leading-6">
                  {f.text}
                </Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            onPress={() => router.push("/onboarding/questions")}
            activeOpacity={0.85}
            className="bg-white rounded-full px-6 py-4 flex-row items-center justify-center"
          >
            <Text className="text-gray-900 text-2xl font-semibold">
              Get Started →
            </Text>
          </TouchableOpacity>

        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}
