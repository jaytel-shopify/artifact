"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { waitForQuick, type QuickIdentity } from "@/lib/quick";

/**
 * Quick User type - extends QuickIdentity with our app-specific fields
 */
export interface QuickUser {
  id: string;
  email: string;
  fullName: string;
  firstName: string;
  slackHandle?: string;
  slackId?: string;
  slackImageUrl?: string;
  title?: string;
  github?: string;
}

interface AuthContextValue {
  user: QuickUser | null;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * AuthProvider
 *
 * Simplified authentication - all Shopify employees can access the app.
 * Access control is handled at the resource level (projects/folders).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<QuickUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Check if we're on localhost - bypass auth and create mock user
    const isLocalhost =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        window.location.hostname.startsWith("192.168.") ||
        window.location.hostname.endsWith(".local"));

    if (isLocalhost) {
      // console.log("[AuthProvider] 🔓 Running on localhost - using mock user");

      const localDevUser: QuickUser = {
        id: "123",
        email: "dev@shopify.com",
        fullName: "Local Developer",
        firstName: "Local",
        slackHandle: "local-dev",
        slackImageUrl: "https://i.pravatar.cc/150?u=dev@shopify.com",
        title: "Developer",
      };

      setUser(localDevUser);
      setLoading(false);
      return; // Skip Quick SDK loading
    }

    async function initUser() {
      try {
        console.log("[AuthProvider] Loading Quick SDK...");
        const quick = await waitForQuick();
        console.log("[AuthProvider] Quick SDK loaded");

        // Get user identity from Quick
        console.log("[AuthProvider] Fetching user identity...");
        const userData = await quick.id.waitForUser();

        console.log("[AuthProvider] User loaded:", {
          email: userData.email,
          fullName: userData.fullName,
        });

        if (!isMounted) return;

        const user: QuickUser = {
          id: userData.id,
          email: userData.email,
          fullName: userData.fullName,
          firstName: userData.firstName,
          slackHandle: userData.slackHandle,
          slackId: userData.slackId,
          slackImageUrl: userData.slackImageUrl,
          title: userData.title,
          github: userData.github,
        };

        setUser(user);
        setLoading(false);
      } catch (err) {
        console.error("[AuthProvider] Failed to load user:", err);
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    initUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    isAuthenticated: !!user,
  };

  // Show loading state
  if (loading) {
    return (
      <AuthContext.Provider value={value}>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
            <p className="mt-4 text-small text-text-secondary">Loading...</p>
          </div>
        </div>
      </AuthContext.Provider>
    );
  }

  // All authenticated Shopify users can access the app
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
