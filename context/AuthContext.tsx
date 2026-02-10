import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AUTH_STORAGE_KEY = "realang_auth_user";

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user database
const MOCK_USERS: Record<string, { password: string; user: User }> = {
  "demo@realang.app": {
    password: "password123",
    user: {
      id: "usr_1",
      email: "demo@realang.app",
      name: "Demo User",
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
    },
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading stored user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const normalizedEmail = email.trim().toLowerCase();

    const mockEntry = MOCK_USERS[normalizedEmail];
    if (mockEntry && mockEntry.password === password) {
      setUser(mockEntry.user);
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mockEntry.user));
      return { success: true };
    }

    // Also accept any email/password combo where password is at least 6 chars (mock flexibility)
    if (password.length >= 6) {
      const mockUser: User = {
        id: "usr_" + Date.now(),
        email: normalizedEmail,
        name: normalizedEmail.split("@")[0].replace(/[._]/g, " "),
        avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
      };
      setUser(mockUser);
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mockUser));
      return { success: true };
    }

    return { success: false, error: "Invalid email or password. Password must be at least 6 characters." };
  };

  const register = async (
    name: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (!name.trim()) {
      return { success: false, error: "Name is required." };
    }
    if (!email.trim() || !email.includes("@")) {
      return { success: false, error: "A valid email is required." };
    }
    if (password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters." };
    }

    const normalizedEmail = email.trim().toLowerCase();
    const newUser: User = {
      id: "usr_" + Date.now(),
      email: normalizedEmail,
      name: name.trim(),
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    };

    // Save to mock database
    MOCK_USERS[normalizedEmail] = { password, user: newUser };

    setUser(newUser);
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
    return { success: true };
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}