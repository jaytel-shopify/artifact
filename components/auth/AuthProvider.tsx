"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { waitForQuick, type QuickIdentity } from "@/lib/quick";
import { UnauthorizedAccess } from "./UnauthorizedAccess";
import { isAdmin } from "@/lib/admin-config";
import { isUserAllowed } from "@/lib/allowed-users-db";

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
  isAuthorized: boolean | null;
  isAdmin: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<QuickUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [userIsAdmin, setUserIsAdmin] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkAuthorization(email: string): Promise<boolean> {
      try {
        console.log('[AuthProvider] Checking authorization for:', email);
        
        // FIRST: Check if user is admin (hardcoded)
        if (isAdmin(email)) {
          console.log('[AuthProvider] ✅ User is ADMIN:', email);
          return true;
        }
        
        // SECOND: Check database for allowed users
        const allowed = await isUserAllowed(email);
        
        console.log('[AuthProvider] Authorization check result:', {
          email,
          isAdmin: false,
          isAllowed: allowed,
        });
        
        return allowed;
      } catch (err) {
        console.error('[AuthProvider] Error checking authorization:', err);
        return false;
      }
    }

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
        
        if (!isMounted) return;
        
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
        
        // Check if user is admin
        const adminStatus = isAdmin(user.email);
        
        // STRICT: Check authorization BEFORE setting user or showing any content
        const authorized = await checkAuthorization(user.email);
        
        if (isMounted) {
          setUser(user);
          setUserIsAdmin(adminStatus);
          setIsAuthorized(authorized);
          setLoading(false);
          console.log('[AuthProvider] Authorization complete:', {
            email: user.email,
            isAdmin: adminStatus,
            authorized,
          });
        }
      } catch (err) {
        console.error('[AuthProvider] Failed to load Quick user:', err);
        if (isMounted) {
          setIsAuthorized(false);
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
    isAuthorized,
    isAdmin: userIsAdmin,
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

  // Show loading state while checking authorization
  if (loading || isAuthorized === null) {
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

  // Show unauthorized page if user is not on allowlist
  if (isAuthorized === false) {
    return (
      <AuthContext.Provider value={value}>
        <UnauthorizedAccess userEmail={user?.email} />
      </AuthContext.Provider>
    );
  }

  // Only render app content if user is authorized
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}