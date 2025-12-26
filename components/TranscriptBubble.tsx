import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface Message {
  id: string;
  participantId: string;
  participantName: string;
  originalText: string;
  translatedText: string;
  originalLanguage: string;
  timestamp: Date;
  speakerColor?: string;
}

interface TranscriptBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  speakerColor?: string;
}

export default function TranscriptBubble({
  message,
  isOwnMessage,
  speakerColor,
}: TranscriptBubbleProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const bubbleColor = speakerColor || (isOwnMessage ? "#9BB068" : "#F5F0E8");
  const isLightBubble = !isOwnMessage && !speakerColor;

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
          <Text style={[styles.language, !isLightBubble && styles.lightTextFaded]}>
            ({message.originalLanguage})
          </Text>
          <Text style={[styles.time, !isLightBubble && styles.lightTextFaded]}>
            {formatTime(message.timestamp)}
          </Text>
        </View>
        <View style={styles.originalContainer}>
          <Text style={[styles.originalLabel, !isLightBubble && styles.lightTextFaded]}>
            Original:
          </Text>
          <Text style={[styles.originalText, !isLightBubble && styles.lightText]}>
            {message.originalText}
          </Text>
        </View>
        <View
          style={[
            styles.translatedContainer,
            { backgroundColor: isLightBubble ? "#EAE4D8" : "rgba(0, 0, 0, 0.15)" },
          ]}
        >
          <Text style={[styles.translatedLabel, !isLightBubble && styles.lightTextFaded]}>
            Translated:
          </Text>
          <Text style={[styles.translatedText, !isLightBubble && styles.lightText]}>
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
    marginBottom: 8,
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
  language: {
    fontSize: 10,
    color: "#A69783",
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
    marginBottom: 8,
  },
  originalLabel: {
    fontSize: 10,
    color: "#A69783",
    marginBottom: 2,
  },
  originalText: {
    fontSize: 14,
    color: "#5C4D3C",
  },
  translatedContainer: {
    backgroundColor: "#EAE4D8",
    padding: 8,
    borderRadius: 8,
  },
  translatedLabel: {
    fontSize: 10,
    color: "#A69783",
    marginBottom: 2,
  },
  translatedText: {
    fontSize: 14,
    color: "#5C4D3C",
    fontStyle: "italic",
  },
});