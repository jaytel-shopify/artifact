import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // Create a response that we can modify
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  // Create a supabase client with proper cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          // Set the cookie on both request and response
          req.cookies.set({ name, value, ...options });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          // Remove the cookie from both request and response
          req.cookies.set({ name, value: '', ...options });
          response.cookies.set({ name, value: '', ...options, maxAge: 0 });
        },
      },
    }
  );

  // Try to get the session first (more reliable than getUser)
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  const currentPath = req.nextUrl.pathname;
  const user = session?.user;
  
  // Server-side logging (will appear in Vercel functions logs)
  console.log(`[Middleware] Path: ${currentPath}, User: ${user?.email || 'None'}, Session: ${!!session}`);

  // Public routes that don't require authentication
  const publicRoutes = [
    '/auth/login',
    '/auth/callback',
    '/auth/success',
  ];

  // Check if current route is public
  const isPublicRoute = publicRoutes.includes(currentPath);

  // If no session and not on a public route, redirect to login
  if (!session && !isPublicRoute) {
    const redirectUrl = new URL('/auth/login', req.url);
    
    // Preserve the original URL for redirect after login
    if (currentPath !== '/') {
      redirectUrl.searchParams.set('redirectTo', currentPath);
    }
    
    console.log('[Middleware] No session, redirecting to login');
    return NextResponse.redirect(redirectUrl);
  }

  // If we have a session and on login page, redirect to home
  if (session && currentPath === '/auth/login') {
    console.log('[Middleware] Session exists, redirecting from login to home');
    return NextResponse.redirect(new URL('/', req.url));
  }

  // For all other cases, return the response
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api/auth/** (Supabase auth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};