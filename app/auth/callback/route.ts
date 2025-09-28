import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const redirectTo = searchParams.get('redirectTo');

  if (code) {
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
            cookieStore.set(name, value, options);
          },
          remove(name: string, options: any) {
            cookieStore.set(name, '', { ...options, maxAge: 0 });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Successful authentication - redirect to destination
      const destination = redirectTo || '/';
      console.log('OAuth success, redirecting to:', destination);
      
      // Create response with proper headers
      const response = NextResponse.redirect(`${origin}${destination}`);
      
      // Ensure cookies are properly set in the response
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('Session created successfully for user:', session.user.email);
      }
      
      return response;
    } else {
      console.error('OAuth exchange error:', error);
    }
  }

  // Authentication failed - redirect back to login
  return NextResponse.redirect(`${origin}/auth/login`);
}
