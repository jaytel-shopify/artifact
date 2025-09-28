import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const redirectTo = searchParams.get('redirectTo');

  console.log('Auth callback triggered with code:', !!code);

  if (code) {
    let response = NextResponse.redirect(`${origin}${redirectTo || '/'}`);
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: { [key: string]: unknown }) {
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: { [key: string]: unknown }) {
            response.cookies.set({
              name,
              value: '',
              ...options,
              maxAge: 0,
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      console.log('OAuth exchange successful, session created');
      
      // Get the session to verify it's working
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Session verification:', session ? `User: ${session.user.email}` : 'No session');
      
      // Redirect to success page to let auth settle, then to final destination
      const finalDestination = redirectTo === '/auth/login' ? '/' : (redirectTo || '/');
      const successUrl = new URL('/auth/success', origin);
      if (finalDestination !== '/') {
        successUrl.searchParams.set('redirectTo', finalDestination);
      }
      
      console.log('Redirecting to success page:', successUrl.toString());
      response = NextResponse.redirect(successUrl.toString());
      
      return response;
    } else {
      console.error('OAuth exchange failed:', error);
    }
  }

  // Authentication failed - redirect back to login
  console.log('Auth callback failed, redirecting to login');
  return NextResponse.redirect(`${origin}/auth/login`);
}
