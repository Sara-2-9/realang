import { Stack } from "expo-router";
import React from "react";
import { StatusBar, ActivityIndicator, View } from "react-native";
import "react-native-reanimated";
import { TranslationProvider, useTranslation } from "../context/TranslationContext";

function RootLayoutContent() {
  const { isLoading } = useTranslation();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FBF8F3" }}>
        <ActivityIndicator size="large" color="#8B7355" />
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <Stack>
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false, title: "reaLang" }}
        />
        <Stack.Screen
          name="listening"
          options={{
            headerShown: false,
            presentation: "fullScreenModal"
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <TranslationProvider>
      <RootLayoutContent />
    </TranslationProvider>
  );
}