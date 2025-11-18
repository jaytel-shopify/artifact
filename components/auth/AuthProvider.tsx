"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { waitForQuick } from "@/lib/quick";
import { type QuickIdentity } from "@/lib/quick/types";

// Mock user for development
const mockUser: QuickIdentity = {
  id: "dev-user",
  email: "dev@shopify.com",
  fullName: "Dev User",
  firstName: "Dev",
  slackHandle: "dev",
  slackId: "dev",
  slackImageUrl: "",
  title: "Developer",
  github: "dev",
};

interface AuthContextValue {
  user: QuickIdentity | null;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<QuickIdentity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const isDev = process.env.NODE_ENV === "development";
    if (isDev) {
      setUser(mockUser);
      setLoading(false);
      return;
    }

    async function initUser() {
      try {
        const quick = await waitForQuick();
        const userData = await quick.id.waitForUser();

        if (!isMounted) return;

        const user: QuickIdentity = {
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
            <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
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
