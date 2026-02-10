import { Stack } from "expo-router";
import React from "react";
import { StatusBar, ActivityIndicator, View } from "react-native";
import "react-native-reanimated";
import { TranslationProvider, useTranslation } from "../context/TranslationContext";
import { AuthProvider, useAuth } from "../context/AuthContext";

function RootLayoutContent() {
  const { isLoading: translationLoading } = useTranslation();
  const { isLoading: authLoading, isAuthenticated } = useAuth();

  if (translationLoading || authLoading) {
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
          name="login"
          options={{ headerShown: false }}
          redirect={isAuthenticated}
        />
        <Stack.Screen
          name="register"
          options={{ headerShown: false }}
          redirect={isAuthenticated}
        />
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false, title: "reaLang" }}
          redirect={!isAuthenticated}
        />
        <Stack.Screen
          name="listening"
          options={{
            headerShown: false,
            presentation: "fullScreenModal"
          }}
          redirect={!isAuthenticated}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <TranslationProvider>
        <RootLayoutContent />
      </TranslationProvider>
    </AuthProvider>
  );
}