import { Tabs } from "expo-router";

/**
 * Navigation happens through the sidebar and the header's segmented control,
 * so the tab bar is hidden. The quiz is not a destination — it opens as a
 * window over whichever screen you are on.
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none" },
        animation: "fade",
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="camera" />
      <Tabs.Screen name="voice" />
      <Tabs.Screen name="progress" />
    </Tabs>
  );
}
