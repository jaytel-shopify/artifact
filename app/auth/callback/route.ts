import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const redirectTo = searchParams.get('redirectTo');

  console.log('[Auth Callback] Code received:', !!code, 'RedirectTo:', redirectTo);

  if (code) {
    const cookieStore = await cookies();
    
    // Create a Supabase client with server-side cookie handling
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: { [key: string]: unknown }) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: { [key: string]: unknown }) {
            cookieStore.delete({ name, ...options });
          },
        },
      }
    );

    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      console.log('[Auth Callback] Session exchange successful');
      
      // Verify the session was created
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[Auth Callback] Session verified:', session ? `User: ${session.user.email}` : 'No session');
      
      // Redirect to the success page or intended destination
      const destination = redirectTo || '/';
      console.log('[Auth Callback] Redirecting to:', destination);
      
      return NextResponse.redirect(new URL(destination, origin));
    } else {
      console.error('[Auth Callback] Session exchange failed:', error.message);
      return NextResponse.redirect(new URL('/auth/login?error=auth_failed', origin));
    }
  }

  console.log('[Auth Callback] No code provided, redirecting to login');
  return NextResponse.redirect(new URL('/auth/login', origin));
}