"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { Suspense } from "react";

function AuthSuccessContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo');

  useEffect(() => {
    console.log('Auth success page - User:', user ? user.email : 'None', 'Loading:', loading, 'RedirectTo:', redirectTo);
    
    // Always wait a bit for auth to settle, regardless of loading state
    const redirectTimer = setTimeout(() => {
      if (user) {
        const destination = redirectTo || '/';
        console.log('Auth success: User confirmed, executing redirect to:', destination);
        
        // Force full page navigation to ensure fresh middleware check
        window.location.replace(destination);
      } else {
        console.log('Auth success: No user found after timeout, redirecting to login');
        window.location.replace('/auth/login');
      }
    }, 2000); // Even longer delay to ensure cookies are fully set

    return () => clearTimeout(redirectTimer);
  }, [user, loading, router, redirectTo]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background-primary)]">
      <div className="text-center space-y-4">
        <div className="text-white text-lg font-medium">
          {loading ? 'Completing sign in...' : 'Redirecting to dashboard...'}
        </div>
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
      </div>
    </div>
  );
}

export default function AuthSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-background-primary)]">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      }
    >
      <AuthSuccessContent />
    </Suspense>
  );
}
