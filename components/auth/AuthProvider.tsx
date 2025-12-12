"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { waitForQuick } from "@/lib/quick";
import { getOrCreateUser } from "@/lib/quick-users";
import type { User } from "@/types";
import { LoadingLottie } from "@/components/ui/LoadingLottie";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ============================================================
// DEBUG: Spoof user ID for testing other users' experiences
// Priority: URL param > localStorage > null
// 
// Usage:
//   URL param:    ?spoof=18609
//   Console:      localStorage.setItem('spoof_user_id', '18609')
//   Clear:        localStorage.removeItem('spoof_user_id')
// ============================================================
function getSpoofUserId(): string | null {
  if (typeof window === "undefined") return null;
  
  // Check URL param first (highest priority)
  const urlParams = new URLSearchParams(window.location.search);
  const urlSpoof = urlParams.get("spoof");
  if (urlSpoof) return urlSpoof;
  
  // Check localStorage
  const storedSpoof = localStorage.getItem("spoof_user_id");
  if (storedSpoof) return storedSpoof;
  
  return null;
}
// ============================================================

/**
 * AuthProvider
 *
 * Simplified authentication - all Shopify employees can access the app.
 * Access control is handled at the resource level (projects/folders).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
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
      // Mock user with a consistent UUID for local development
      // Note: Quick.db is not available on localhost, so we use a hardcoded mock ID
      const localDevUser: User = {
        id: "local-dev-user-uuid",
        email: "dev@shopify.com",
        name: "Local Developer",
        slack_handle: "local-dev",
        slack_image_url: "https://i.pravatar.cc/150?u=dev@shopify.com",
      };

      setUser(localDevUser);
      setLoading(false);
      return; // Skip Quick SDK loading
    }

    async function initUser() {
      try {
        const quick = await waitForQuick();

        // Get user identity from Quick
        let userData = await quick.id.waitForUser();

        // DEBUG: Spoof user ID if set (for testing other users' experiences)
        const spoofId = getSpoofUserId();
        if (spoofId) {
          console.warn(`[AuthProvider] SPOOFING USER ID: ${spoofId}`);
          userData = {
            ...userData,
            id: spoofId,
          };
        }

        if (!isMounted) return;

        // Sync user to database and get/create DB record
        const dbUser = await getOrCreateUser({
          id: userData.id,
          email: userData.email,
          fullName: userData.fullName,
          firstName: userData.firstName,
          slackImageUrl: userData.slackImageUrl,
          slackId: userData.slackId,
          slackHandle: userData.slackHandle,
          title: userData.title,
        });

        if (!isMounted) return;

        // Identify users in quicklytics
        (window as any).quicklytics?.identify(dbUser.email);

        // dbUser is already the User type from the database
        setUser(dbUser);
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

  // Show loading state with spinner (hardcoded dark bg to prevent white flash)
  if (loading) {
    return (
      <AuthContext.Provider value={value}>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <LoadingLottie />
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
