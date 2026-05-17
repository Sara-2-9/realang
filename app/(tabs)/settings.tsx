import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "../../context/TranslationContext";
import { useAuth } from "../../context/AuthContext";
import { clearTranslationCache } from "../../lib/translationCache";

export default function SettingsScreen() {
  const router = useRouter();
  const { userLanguage, targetLanguage, enableSpeechOutput, setEnableSpeechOutput } =
    useTranslation();
  const { user, logout } = useAuth();

  const handleClearCache = () => {
    Alert.alert(
      "Clear Cache",
      "Are you sure you want to clear the translation cache?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            await clearTranslationCache();
            Alert.alert("Cache Cleared", "Translation cache has been cleared.");
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Settings</Text>

        {/* User Profile Section */}
        <View style={styles.section}>
          <View style={styles.profileRow}>
            <Image
              source={{
                uri:
                  user?.avatarUrl ||
                  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
              }}
              style={styles.avatar}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name || "User"}</Text>
              <Text style={styles.profileEmail}>{user?.email || ""}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => {
              Alert.alert(
                "Sign Out",
                "Are you sure you want to sign out?",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Sign Out",
                    style: "destructive",
                    onPress: async () => {
                      await logout();
                      router.replace("/login");
                    },
                  },
                ]
              );
            }}
          >
            <Ionicons name="log-out-outline" size={20} color="#D4574A" />
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Settings</Text>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Your Language</Text>
            <Text style={styles.settingValue}>{userLanguage}</Text>
          </View>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Translate To</Text>
            <Text style={styles.settingValue}>{targetLanguage}</Text>
          </View>
          <View style={[styles.settingItem, styles.toggleRow]}>
            <Text style={styles.settingLabel}>Enable Speech Output</Text>
            <Switch
              value={enableSpeechOutput}
              onValueChange={setEnableSpeechOutput}
              trackColor={{ false: "#d3d3d3", true: "#8B7355" }}
              thumbColor={enableSpeechOutput ? "#FBF8F3" : "#f4f3f4"}
            />
          </View>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Data Storage</Text>
            <Text style={styles.settingValue}>Local (On Device)</Text>
          </View>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Speech-to-Text</Text>
            <Text style={styles.settingValue}>Apple Intelligence (On-Device)</Text>
          </View>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Translation</Text>
            <Text style={styles.settingValue}>Apple Intelligence LLM (On-Device)</Text>
          </View>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Text-to-Speech</Text>
            <Text style={styles.settingValue}>Apple AVSpeechSynthesizer (On-Device)</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cache</Text>
          <TouchableOpacity style={styles.cacheButton} onPress={handleClearCache}>
            <Ionicons name="trash-outline" size={20} color="#D4574A" />
            <Text style={styles.cacheButtonText}>Clear Translation Cache</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>
            reaLang uses Apple Intelligence on-device models to provide real-time
            voice transcription, translation, and speech synthesis with full
            privacy — no data ever leaves your device.
          </Text>
          <Text style={styles.aboutText}>
            Your language preferences and translation cache are stored locally on
            your device.
          </Text>
          <Text style={styles.versionText}>Version 2.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FBF8F3",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1a1a2e",
    marginTop: 20,
    marginBottom: 24,
  },
  section: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    backgroundColor: "#e5e5e5",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a2e",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: "#666",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF0EE",
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  logoutButtonText: {
    color: "#D4574A",
    fontSize: 15,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8B7355",
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  toggleRow: {
    paddingRight: 0,
  },
  settingLabel: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
    flexShrink: 1,
    marginRight: 12,
  },
  settingValue: {
    fontSize: 15,
    color: "#666",
    fontWeight: "400",
  },
  cacheButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF0EE",
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  cacheButtonText: {
    color: "#D4574A",
    fontSize: 15,
    fontWeight: "600",
  },
  aboutText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 22,
    marginBottom: 12,
  },
  versionText: {
    fontSize: 13,
    color: "#999",
    textAlign: "center",
    marginTop: 8,
  },
});
