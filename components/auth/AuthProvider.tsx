"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { waitForQuick, type QuickIdentity } from "@/lib/quick";

/**
 * Quick User type - extends QuickIdentity with our app-specific fields
 */
export interface QuickUser {
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
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<QuickUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function initUser() {
      try {
        console.log('[AuthProvider] Waiting for Quick SDK...');
        // Wait for Quick SDK to load
        const quick = await waitForQuick();
        console.log('[AuthProvider] Quick SDK loaded');
        
        // Get user identity from Quick
        console.log('[AuthProvider] Waiting for user identity...');
        const userData = await quick.id.waitForUser();
        
        console.log('[AuthProvider] User loaded:', {
          email: userData.email,
          fullName: userData.fullName,
          hasSlackImage: !!userData.slackImageUrl,
        });
        
        if (isMounted) {
          const user = {
            email: userData.email,
            fullName: userData.fullName,
            firstName: userData.firstName,
            slackHandle: userData.slackHandle,
            slackId: userData.slackId,
            slackImageUrl: userData.slackImageUrl,
            title: userData.title,
            github: userData.github,
          };
          console.log('[AuthProvider] Setting user state:', user);
          setUser(user);
          setLoading(false);
        }
      } catch (err) {
        console.error('[AuthProvider] Failed to load Quick user:', err);
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
    signIn: async () => {
      // Quick handles authentication automatically via Google OAuth
      // If the user isn't authenticated, they'll be redirected to sign in
      // For now, we just reload the page to trigger Quick's auth flow
      window.location.reload();
    },
    signOut: async () => {
      // Quick doesn't have a built-in signOut method exposed in the docs
      // The user can sign out by clearing cookies or navigating to a logout URL
      // For Shopify internal tools, users are typically always authenticated
      console.warn('Sign out is handled by Quick platform - redirect to logout if needed');
      // You may need to redirect to a specific logout URL provided by Quick
      // window.location.href = '/logout';
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}