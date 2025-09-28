"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export default function AuthDebugPage() {
  const { user, loading, session } = useAuth();
  const [clientSession, setClientSession] = useState<any>(null);
  const [cookies, setCookies] = useState<string>("");
  const [apiResponse, setApiResponse] = useState<any>(null);

  useEffect(() => {
    // Get session directly from Supabase client
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data }) => {
      setClientSession(data.session);
    });

    // Get all cookies
    setCookies(document.cookie);

    // Test API call
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => setApiResponse(data))
      .catch(err => setApiResponse({ error: err.message }));
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Auth Debug Information</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">AuthProvider State</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(
              {
                loading,
                hasUser: !!user,
                userEmail: user?.email,
                hasSession: !!session,
                sessionUser: session?.user?.email,
              },
              null,
              2
            )}
          </pre>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Direct Supabase Client Session</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(
              {
                hasSession: !!clientSession,
                userEmail: clientSession?.user?.email,
                expiresAt: clientSession?.expires_at,
                tokenType: clientSession?.token_type,
              },
              null,
              2
            )}
          </pre>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Cookies (Supabase Auth)</h2>
          <pre className="text-sm overflow-auto whitespace-pre-wrap break-all">
            {cookies.split(';').filter(c => c.includes('sb-')).join('\n')}
          </pre>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">API Response (/api/projects)</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(apiResponse, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="space-x-4">
            <button 
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
            >
              Go to Home
            </button>
            <button 
              onClick={() => window.location.href = '/auth/login'}
              className="px-4 py-2 bg-green-600 rounded hover:bg-green-700"
            >
              Go to Login
            </button>
            <button 
              onClick={async () => {
                const supabase = getSupabaseBrowserClient();
                await supabase.auth.signOut();
                window.location.href = '/auth/login';
              }}
              className="px-4 py-2 bg-red-600 rounded hover:bg-red-700"
            >
              Sign Out
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
