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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "../../context/TranslationContext";
import { useAuth } from "../../context/AuthContext";

export default function SettingsScreen() {
  const router = useRouter();
  const { userLanguage, targetLanguage } = useTranslation();
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Settings</Text>

        {/* User Profile Section */}
        <View style={styles.section}>
          <View style={styles.profileRow}>
            <Image
              source={{ uri: user?.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop" }}
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
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>API Status</Text>
            <View style={styles.statusContainer}>
              <View style={[styles.statusDot, styles.statusActive]} />
              <Text style={styles.settingValue}>Connected</Text>
            </View>
          </View>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Data Storage</Text>
            <Text style={styles.settingValue}>Local (On Device)</Text>
          </View>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Speech-to-Text API</Text>
            <Text style={styles.settingValue}>ElevenLabs Scribe v1</Text>
          </View>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Translation API</Text>
            <Text style={styles.settingValue}>ElevenLabs Dubbing</Text>
          </View>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Text-to-Speech API</Text>
            <Text style={styles.settingValue}>ElevenLabs Multilingual v2</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>
            reaLang uses ElevenLabs AI technology to provide real-time
            voice translation between multiple users speaking different
            languages.
          </Text>
          <Text style={styles.aboutText}>
            Your language preferences are stored locally on your device for privacy and convenience.
          </Text>
          <Text style={styles.versionText}>Version 1.0.0</Text>
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
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#5C4D3C",
    marginBottom: 30,
  },
  section: {
    backgroundColor: "#F5F0E8",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#8B7355",
    marginBottom: 8,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E8DFD0",
  },
  settingLabel: {
    fontSize: 16,
    color: "#A69783",
  },
  settingValue: {
    fontSize: 16,
    color: "#5C4D3C",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusActive: {
    backgroundColor: "#9BB068",
  },
  aboutText: {
    fontSize: 14,
    color: "#6B5D4D",
    lineHeight: 22,
    marginBottom: 8,
  },
  versionText: {
    fontSize: 12,
    color: "#B5A898",
    marginTop: 12,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 14,
    borderWidth: 2,
    borderColor: "#E8DFD0",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#5C4D3C",
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 14,
    color: "#A69783",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FBF8F3",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D4574A",
    gap: 8,
  },
  logoutButtonText: {
    color: "#D4574A",
    fontSize: 15,
    fontWeight: "bold",
  },
});
