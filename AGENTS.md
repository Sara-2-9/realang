# AGENTS.md - reaLang App

## Project Overview

reaLang is a React Native mobile application built with Expo and Expo Router. It's a language learning app focused on reading and listening practice with authentication and translation features.

## Tech Stack

- **Framework**: React Native 0.81.5 with Expo ~54.0.33
- **Routing**: Expo Router ~6.0.23 (file-based routing)
- **State Management**: React Context API
  - `AuthContext` - Authentication state
  - `TranslationContext` - Translation/i18n state
- **Animation**: React Native Reanimated ~4.1.1
- **Audio**: Expo AV ~16.0.8
- **Storage**: @react-native-async-storage/async-storage 2.2.0
- **Icons**: @expo/vector-icons ^15.0.3

## Project Structure

```
app/
├── _layout.tsx          # Root layout with Auth & Translation providers
├── login.tsx             # Login screen
├── register.tsx          # Registration screen
├── listening.tsx         # Listening practice screen (full screen modal)
└── (tabs)/               # Tab navigation group
    ├── _layout.tsx       # Tab navigator configuration
    ├── index.tsx         # Home/main screen
    └── settings.tsx      # Settings screen

context/
├── AuthContext.tsx       # Authentication context provider
└── TranslationContext.tsx # Translation/i18n context provider

components/               # Reusable UI components
assets/                   # Static assets (images, fonts, etc.)
api/                      # API client and endpoints
```

## Routing Structure

Expo Router uses file-based routing:
- `/` → Redirects based on auth state
- `/login` → Login screen (redirects if authenticated)
- `/register` → Registration screen (redirects if authenticated)
- `/(tabs)` → Main app with tab navigation (requires auth)
- `/listening` → Listening practice modal (requires auth)

## Coding Conventions

### File Naming
- Use lowercase with dashes for multi-word files: `my-file.tsx`
- Group related routes with parentheses: `(tabs)/`
- Layout files use `_layout.tsx`

### Imports
- Use absolute imports from project root with `~/` alias
- Group imports: React, libraries, contexts, components, utils

### Styles
- Use `StyleSheet.create()` for component styles
- Theme colors:
  - Background: `#FBF8F3` (cream/off-white)
  - Primary: `#8B7355` (brown)
  - Use `barStyle="dark-content"` for StatusBar

### Components
- Prefer functional components with hooks
- Use `React.FC` type for component props when needed

## Authentication Flow

1. App loads → AuthProvider checks stored token
2. If authenticated → Redirect to `/(tabs)`
3. If not authenticated → Show `/login` or `/register`
4. Tab routes and listening screen require authentication

## Environment Variables

Create a `.env` file in project root for sensitive values:
```
EXPO_PUBLIC_ELEVENLABS_API_KEY=your_api_key_here
```

The API key is automatically loaded by the TranslationContext and used as default for all users.

**Note**: Environment variables with `EXPO_PUBLIC_` prefix are embedded at build time and available in the client.

## Running the App

```bash
# Start development server
bun start

# Platform specific
bun android
bun ios
bun web
```

## Build & Deploy

Configured via `eas.json` for EAS Build:
```bash
# Preview build
eas build --profile preview

# Production build
eas build --profile production
```

## Important Notes for AI Agents

1. **Always wrap navigation changes properly** - Use Expo Router's `router` object
2. **Respect auth guards** - Check `useAuth()` before accessing protected routes
3. **Handle loading states** - Auth and Translation contexts have `isLoading` states
4. **Use SafeAreaView** - For screens that need to respect device notches
5. **Test on both platforms** - iOS and Android may have subtle differences
6. **Keep bundle size in mind** - Avoid heavy libraries when possible

## Common Tasks

### Adding a New Screen
1. Create file in `app/` (e.g., `app/new-screen.tsx`)
2. If needed, add Stack.Screen entry in `app/_layout.tsx`
3. Export default component

### Adding a New Context
1. Create file in `context/` folder
2. Follow pattern of existing contexts (AuthContext/TranslationContext)
3. Wrap in `app/_layout.tsx` RootLayout

### Adding an API Endpoint
1. Add function to appropriate file in `api/`
2. Use async/await with proper error handling
3. Update types as needed

## API Key Configuration

The ElevenLabs API key is pre-configured via environment variable (`EXPO_PUBLIC_ELEVENLABS_API_KEY`):

1. Copy `.env.example` to `.env`
2. Add your API key
3. Restart Expo dev server

The key is loaded in `TranslationContext` as default value. Users cannot override it from the UI (settings page shows API as "Connected" without input field).
