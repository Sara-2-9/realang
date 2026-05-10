import { Stack, useRouter, useSegments } from "expo-router";
import React, { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar, ActivityIndicator, View } from "react-native";
import { TranslationProvider, useTranslation } from "../context/TranslationContext";
import { AuthProvider, useAuth } from "../context/AuthContext";

function RootLayoutContent() {
  const { isLoading: translationLoading } = useTranslation();
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (authLoading || translationLoading) return;

    const inAuthGroup = segments[0] === "(tabs)" || segments[0] === "listening";

    if (!isAuthenticated && inAuthGroup) {
      router.replace("/login");
    } else if (isAuthenticated && (segments[0] === "login" || segments[0] === "register")) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, authLoading, translationLoading, segments, router]);

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
        />
        <Stack.Screen
          name="register"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false, title: "reaLang" }}
        />
        <Stack.Screen
          name="listening"
          options={{
            headerShown: false
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <TranslationProvider>
          <RootLayoutContent />
        </TranslationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}