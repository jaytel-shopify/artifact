"use client";

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { getSupabaseClient } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";

function LoginContent() {
  const supabase = getSupabaseClient();
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo');
  
  // Get current domain for proper redirects
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL;

  useEffect(() => {
    if (user && !loading) {
      // Redirect to intended destination or homepage
      const destination = redirectTo || '/';
      console.log('Login page: User authenticated, redirecting to:', destination);
      
      // Add a small delay to ensure auth state is fully settled
      const timeoutId = setTimeout(() => {
        router.replace(destination);
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [user, loading, router, redirectTo]);

  // Show loading while auth is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background-primary)]">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  // If user is authenticated, show redirecting state
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background-primary)]">
        <div className="text-center space-y-4">
          <div className="text-white">Redirecting to dashboard...</div>
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background-primary)] p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Welcome to Artifact</h1>
          <p className="text-white/70">Sign in to create and share presentations</p>
        </div>

        <div className="bg-white rounded-lg p-6">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#000000',
                    brandAccent: '#333333',
                  },
                },
              },
            }}
            providers={['google']}
            redirectTo={`${currentOrigin}/auth/callback${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`}
            onlyThirdPartyProviders
            showLinks={false}
            queryParams={{
              access_type: 'offline',
              prompt: 'consent',
            }}
            providerScopes={{
              google: 'openid email profile'
            }}
          />
        </div>

        <div className="text-center mt-6 text-sm text-white/60">
          By signing in, you agree to our terms of service and privacy policy.
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-background-primary)]">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
