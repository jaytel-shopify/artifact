import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const redirectTo = searchParams.get('redirectTo');

  if (code) {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Successful authentication
      const destination = redirectTo || '/';
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  // Authentication failed
  return NextResponse.redirect(`${origin}/auth/login`);
}
