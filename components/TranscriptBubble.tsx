import React from "react";
import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Message {
  id: string;
  participantId: string;
  participantName: string;
  originalText: string;
  translatedText: string;
  originalLanguage: string;
  timestamp: Date;
  speakerColor?: string;
  isTranslating?: boolean;
}

interface TranscriptBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  speakerColor?: string;
  targetLanguage?: string;
}

export default function TranscriptBubble({
  message,
  isOwnMessage,
  speakerColor,
  targetLanguage = "English",
}: TranscriptBubbleProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const bubbleColor = speakerColor || (isOwnMessage ? "#9BB068" : "#F5F0E8");
  const isLightBubble = !isOwnMessage && !speakerColor;
  const showTranslation = message.originalLanguage !== "English" || message.originalText !== message.translatedText;
  const isAlreadySameLanguage = message.originalLanguage === targetLanguage;

  return (
    <View
      style={[
        styles.container,
        isOwnMessage ? styles.containerOwn : styles.containerOther,
      ]}
    >
      {speakerColor && (
        <View style={[styles.speakerIndicator, { backgroundColor: speakerColor }]} />
      )}
      <View
        style={[
          styles.bubbleContent,
          { backgroundColor: isLightBubble ? "#F5F0E8" : bubbleColor },
        ]}
      >
        <View style={styles.header}>
          <Text style={[styles.name, !isLightBubble && styles.lightText]}>
            {message.participantName}
          </Text>
          <View style={styles.languageBadge}>
            <Text style={[styles.language, !isLightBubble && styles.lightTextFaded]}>
              {message.originalLanguage}
            </Text>
          </View>
          <Text style={[styles.time, !isLightBubble && styles.lightTextFaded]}>
            {formatTime(message.timestamp)}
          </Text>
        </View>
        
        {/* Original Text */}
        <View style={styles.originalContainer}>
          <View style={styles.labelRow}>
            <Ionicons 
              name="text" 
              size={12} 
              color={isLightBubble ? "#A69783" : "rgba(255, 255, 255, 0.7)"} 
            />
            <Text style={[styles.originalLabel, !isLightBubble && styles.lightTextFaded]}>
              Original ({message.originalLanguage})
            </Text>
          </View>
          <Text style={[styles.originalText, !isLightBubble && styles.lightText]}>
            {message.originalText}
          </Text>
        </View>

        {/* English Translation - Always shown */}
        <View
          style={[
            styles.translatedContainer,
            { backgroundColor: isLightBubble ? "#E8F5E9" : "rgba(255, 255, 255, 0.2)" },
          ]}
        >
          <View style={styles.translatedHeader}>
            <Ionicons 
              name="language" 
              size={12} 
              color={isLightBubble ? "#4CAF50" : "#fff"} 
            />
            <Text style={[styles.translatedLabel, isLightBubble ? styles.englishLabel : styles.lightTextFaded]}>
              {targetLanguage} Translation
            </Text>
            {message.isTranslating && (
              <ActivityIndicator 
                size="small" 
                color={isLightBubble ? "#4CAF50" : "#fff"} 
                style={styles.loadingIndicator} 
              />
            )}
            {isAlreadySameLanguage && !message.isTranslating && (
              <View style={styles.sameLangBadge}>
                <Text style={styles.sameLangText}>Same</Text>
              </View>
            )}
          </View>
          <Text style={[styles.translatedText, isLightBubble ? styles.englishText : styles.lightText]}>
            {message.translatedText}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    maxWidth: "90%",
  },
  containerOwn: {
    alignSelf: "flex-end",
    marginLeft: "10%",
  },
  containerOther: {
    alignSelf: "flex-start",
    marginRight: "10%",
  },
  speakerIndicator: {
    width: 4,
    borderRadius: 2,
    marginRight: 8,
  },
  bubbleContent: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 6,
  },
  name: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#5C4D3C",
  },
  lightText: {
    color: "#fff",
  },
  languageBadge: {
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  language: {
    fontSize: 10,
    color: "#A69783",
    fontWeight: "600",
  },
  lightTextFaded: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  time: {
    fontSize: 10,
    color: "#B5A898",
    marginLeft: "auto",
  },
  originalContainer: {
    marginBottom: 10,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  originalLabel: {
    fontSize: 10,
    color: "#A69783",
    fontWeight: "500",
  },
  originalText: {
    fontSize: 14,
    color: "#5C4D3C",
    lineHeight: 20,
  },
  translatedContainer: {
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#4CAF50",
  },
  translatedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  translatedLabel: {
    fontSize: 10,
    color: "#A69783",
    fontWeight: "600",
  },
  englishLabel: {
    color: "#4CAF50",
  },
  loadingIndicator: {
    marginLeft: 8,
  },
  sameLangBadge: {
    backgroundColor: "#E0E0E0",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  sameLangText: {
    fontSize: 9,
    color: "#757575",
    fontWeight: "600",
  },
  translatedText: {
    fontSize: 14,
    color: "#5C4D3C",
    fontWeight: "500",
    lineHeight: 20,
  },
  englishText: {
    color: "#2E7D32",
  },
});