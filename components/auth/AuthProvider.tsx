"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { waitForQuick, type QuickIdentity } from "@/lib/quick";
import { getOrCreateUser } from "@/lib/quick-users";

/**
 * Quick User type - extends QuickIdentity with our app-specific fields
 * The `id` field is the User UUID from the database (not Quick.id's id)
 */
export interface QuickUser {
  id: string; // User.id from Quick.db (UUID)
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

      // Mock user with a consistent UUID for local development
      // Note: Quick.db is not available on localhost, so we use a hardcoded mock ID
      const localDevUser: QuickUser = {
        id: "local-dev-user-uuid", // Mock UUID (Quick.db not available locally)
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

        // Sync user to database and get/create DB record
        console.log("[AuthProvider] Syncing user to database...");
        const dbUser = await getOrCreateUser({
          email: userData.email,
          fullName: userData.fullName,
          firstName: userData.firstName,
          slackImageUrl: userData.slackImageUrl,
          slackId: userData.slackId,
          slackHandle: userData.slackHandle,
          title: userData.title,
          github: userData.github,
        });

        console.log("[AuthProvider] User synced to DB:", {
          id: dbUser.id,
          email: dbUser.email,
        });

        if (!isMounted) return;

        // Use the DB user's UUID as the canonical ID
        const user: QuickUser = {
          id: dbUser.id, // UUID from Quick.db
          email: dbUser.email,
          fullName: dbUser.name,
          firstName: userData.firstName,
          slackHandle: dbUser.slack_handle,
          slackId: dbUser.slack_id,
          slackImageUrl: dbUser.slack_image_url,
          title: dbUser.title,
          github: dbUser.github,
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
