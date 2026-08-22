import { Link, Stack } from "expo-router";
import { View } from "react-native";
import { EmptyState } from "../components/shared/EmptyState";

export default function NotFound() {
  return (
    <>
      <Stack.Screen options={{ title: "Not Found" }} />
      <View style={{ flex: 1 }}>
        <EmptyState
          emoji="🔍"
          title="Page not found"
          description="This screen doesn't exist."
        />
        <Link href="/(tabs)">Go home</Link>
      </View>
    </>
  );
}
