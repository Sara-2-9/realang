# 🌐 reaLang

A React Native mobile application that breaks down language barriers. Communicate with people who speak different languages quickly and confidently — without the fear of not knowing the language. Real-time translation and AI-powered audio help you have natural conversations across languages.

## 🚀 Technologies Used

This app is built with modern technologies for a smooth mobile experience:

- ⚛️ **[React Native](https://reactnative.dev)** 0.81.5 for cross-platform mobile development
- 📱 **[Expo](https://expo.dev)** ~54.0.33 for streamlined development and builds
- 🛣️ **[Expo Router](https://docs.expo.dev/router/introduction/)** ~6.0.23 for file-based navigation
- 🎨 **[React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)** ~4.1.1 for smooth animations
- 🔊 **[Expo AV](https://docs.expo.dev/versions/latest/sdk/av/)** ~16.0.8 for audio playback
- 🗣️ **[ElevenLabs API](https://elevenlabs.io)** for high-quality text-to-speech
- 🔐 **Custom Authentication** with Async Storage for session management
- 🌍 **Multi-language Support** (i18n) for international users
- 🎨 **[Expo Vector Icons](https://docs.expo.dev/guides/icons/)** for beautiful UI icons
- 💾 **[@react-native-async-storage/async-storage](https://github.com/react-native-async-storage/async-storage)** 2.2.0 for local data persistence
- 📐 **[TypeScript](https://www.typescriptlang.org)** for type-safe code

### 🛠️ Development Tools

- 🤖 **[Michelangelo](https://apps.apple.com/us/app/michelangelo-vibe-coding/id6744751580)** — iOS AI vibe coding app that powered the initial development
- 🦞 **[OpenClaw](https://github.com/openclaw/openclaw)** — AI agent framework for implementing new features and automation
- 🌙 **[Moonshot AI](https://www.moonshot.ai)** (Kimi K2.5) — LLM for code generation and feature implementation

## ✨ Key Features

- **💬 Real-time Translation:** Instantly translate messages between languages for seamless communication
- **🎧 AI-Powered Audio:** Listen to translations with natural, native-like pronunciation via ElevenLabs
- **🔐 User Authentication:** Secure login and registration system
- **🌍 Multi-language Support:** Communicate in multiple languages with full i18n support
- **📱 Cross-Platform:** Works on both iOS and Android devices
- **⚡ Quick & Direct:** No language learning curve — just speak and understand

## ⚙️ Coming Soon

- **🎯 Conversation History:** Save and review past translated conversations
- **🎭 Voice Selection:** Choose different voices and accents for audio playback
- **⭐ Quick Phrases:** Pre-defined phrases for common travel/social situations
- **📸 Image Translation:** Translate text from photos in real-time
- **🤖 AI Conversation Assistant:** Smart suggestions for continuing conversations
- **🔔 Push Notifications:** Stay updated on new messages

## 🛠️ Setup and Installation

1. **Requirements:**<br>
   **[Node.js](https://nodejs.org)** >= v20<br>
   **[Bun](https://bun.sh)** (recommended) or npm/yarn<br>
   **[Expo Go App](https://expo.dev/go)** on your mobile device (for testing)

2. **Clone the repository:**
   ```sh
   git clone https://github.com/yourusername/realang.git
   cd realang
   ```

3. **Install dependencies:**
   ```sh
   bun install
   ```

4. **Configure environment variables:**<br>
   Create a `.env` file in the project root:
   ```env
   EXPO_PUBLIC_ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
   ```
   > Get your API key from [ElevenLabs](https://elevenlabs.io)

5. **Start the development server:**
   ```sh
   bun start
   ```

6. **Run on your device:**<br>
   - Scan the QR code with **Expo Go** (iOS/Android)
   - Or press `i` for iOS simulator / `a` for Android emulator

## 📱 Building for Production

### EAS Build (Recommended)

```sh
# Preview build
eas build --profile preview

# Production build
eas build --profile production
```

## 🏗️ Project Structure

```
app/
├── _layout.tsx          # Root layout with providers
├── login.tsx             # Authentication screen
├── register.tsx          # Registration screen
├── listening.tsx         # Full-screen listening modal
└── (tabs)/               # Main tab navigation
    ├── _layout.tsx       # Tab configuration
    ├── index.tsx         # Home screen
    └── settings.tsx      # Settings screen

context/
├── AuthContext.tsx       # Authentication state management
└── TranslationContext.tsx # i18n and translation logic

components/               # Reusable UI components
api/                      # API clients and endpoints
assets/                   # Images, fonts, and static files
```

## 🎨 Design System

- **Background:** `#FBF8F3` (warm cream)
- **Primary:** `#8B7355` (earth brown)
- **StatusBar:** Dark content for optimal readability

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## 📄 License

0BSD — Free to use and modify.

---

🦉 Built with love for language learners everywhere
