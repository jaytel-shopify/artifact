"use client";

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function LoginContent() {
  const supabase = getSupabaseBrowserClient();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo');
  const error = searchParams.get('error');
  const [currentOrigin, setCurrentOrigin] = useState<string>('');

  useEffect(() => {
    // Set the current origin for redirects
    setCurrentOrigin(window.location.origin);
    
    // Check if already authenticated
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        console.log('[Login Page] User already authenticated:', session.user.email);
        console.log('[Login Page] Redirecting to home...');
        window.location.href = '/';
      }
    });
  }, [supabase]);

  if (!currentOrigin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background-primary)]">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background-primary)]">
      <div className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-white">Welcome to Artifact</h1>
          <p className="text-gray-400">Sign in with your Google account to continue</p>
        </div>
        
        {error && (
          <div className="p-4 bg-red-900/20 border border-red-500 rounded-lg text-red-400 text-sm">
            Authentication failed. Please try again.
          </div>
        )}

        <div className="bg-[var(--color-background-secondary)] rounded-xl p-6">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#3b82f6',
                    brandAccent: '#2563eb',
                  },
                },
              },
              className: {
                container: 'auth-container',
                button: 'auth-button',
              },
            }}
            theme="dark"
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

        <div className="text-center">
          <a 
            href="/auth/debug" 
            className="text-xs text-gray-500 hover:text-gray-400 underline"
          >
            Debug Auth Issues
          </a>
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