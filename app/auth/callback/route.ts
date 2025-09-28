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
          set(name: string, value: string, options: any) {
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: any) {
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
      
      // Force redirect to homepage (not login) to break potential loops
      const destination = redirectTo === '/auth/login' ? '/' : (redirectTo || '/');
      response = NextResponse.redirect(`${origin}${destination}`);
      
      return response;
    } else {
      console.error('OAuth exchange failed:', error);
    }
  }

  // Authentication failed - redirect back to login
  console.log('Auth callback failed, redirecting to login');
  return NextResponse.redirect(`${origin}/auth/login`);
}
