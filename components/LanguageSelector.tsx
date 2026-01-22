import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Portuguese",
  "Polish",
  "Russian",
  "Japanese",
  "Korean",
  "Chinese",
  "Arabic",
  "Hindi",
  "Turkish",
  "Dutch",
  "Swedish",
  "Norwegian",
  "Danish",
  "Finnish",
  "Greek",
  "Czech",
  "Romanian",
  "Hungarian",
  "Ukrainian",
  "Vietnamese",
  "Thai",
  "Indonesian",
  "Malay",
  "Filipino",
];

interface LanguageSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (language: string) => void;
  selectedLanguage: string;
  title?: string;
}

export default function LanguageSelector({
  visible,
  onClose,
  onSelect,
  selectedLanguage,
  title = "Select Language",
}: LanguageSelectorProps) {
  const renderLanguage = ({ item }: any) => (
    <TouchableOpacity
      style={[
        styles.languageItem,
        item === selectedLanguage && styles.languageItemSelected,
      ]}
      onPress={() => onSelect(item)}
    >
      <Text
        style={[
          styles.languageText,
          item === selectedLanguage && styles.languageTextSelected,
        ]}
      >
        {item}
      </Text>
      {item === selectedLanguage && (
        <Ionicons name="checkmark-circle" size={24} color="#8B7355" />
      )}
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#5C4D3C" />
          </TouchableOpacity>
        </View>
        <FlatList
          data={LANGUAGES}
          renderItem={renderLanguage}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.list}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FBF8F3",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E8DFD0",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#5C4D3C",
  },
  closeButton: {
    padding: 4,
  },
  list: {
    padding: 16,
  },
  languageItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F5F0E8",
    borderRadius: 12,
    marginBottom: 8,
  },
  languageItemSelected: {
    borderWidth: 2,
    borderColor: "#8B7355",
  },
  languageText: {
    fontSize: 16,
    color: "#6B5D4D",
  },
  languageTextSelected: {
    color: "#8B7355",
    fontWeight: "bold",
  },
});