import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { StyleSheet, Text, View, Animated } from "react-native";

interface Speaker {
  id: string;
  name: string;
  language: string;
  color: string;
  isSpeaking: boolean;
  lastActive: Date;
}

interface SpeakerBubbleProps {
  speaker: Speaker;
}

export default function SpeakerBubble({ speaker }: SpeakerBubbleProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (speaker.isSpeaking) {
      Animated.parallel([
        Animated.loop(
          Animated.sequence([
            Animated.timing(scaleAnim, {
              toValue: 1.1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
          ])
        ),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(1);
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [speaker.isSpeaking]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.speakingRing,
          {
            borderColor: speaker.color,
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.bubble,
          { backgroundColor: speaker.color },
          { transform: [{ scale: speaker.isSpeaking ? scaleAnim : 1 }] },
        ]}
      >
        <Ionicons name="person" size={28} color="#fff" />
        {speaker.isSpeaking && (
          <View style={styles.speakingIndicator}>
            <View style={styles.soundWave}>
              <View style={[styles.soundBar, styles.soundBar1]} />
              <View style={[styles.soundBar, styles.soundBar2]} />
              <View style={[styles.soundBar, styles.soundBar3]} />
            </View>
          </View>
        )}
      </Animated.View>
      <Text style={styles.name}>{speaker.name}</Text>
      <View style={[styles.languageTag, { backgroundColor: speaker.color + "30" }]}>
        <Text style={[styles.languageText, { color: speaker.color }]}>
          {speaker.language}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    width: 100,
  },
  speakingRing: {
    position: "absolute",
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    top: 0,
  },
  bubble: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  speakingIndicator: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  soundWave: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  soundBar: {
    width: 3,
    backgroundColor: "#9BB068",
    borderRadius: 1.5,
  },
  soundBar1: {
    height: 6,
  },
  soundBar2: {
    height: 10,
  },
  soundBar3: {
    height: 6,
  },
  name: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#5C4D3C",
    textAlign: "center",
    marginBottom: 4,
  },
  languageTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  languageText: {
    fontSize: 10,
    fontWeight: "600",
  },
});