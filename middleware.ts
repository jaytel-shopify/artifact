import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
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
          });
        },
      },
    }
  );

  // Get current user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Public routes that don't require authentication
  const publicRoutes = [
    '/auth/login',
    '/auth/callback',
  ];

  // Share routes that require authentication but allow viewing shared projects
  const shareRoutes = req.nextUrl.pathname.startsWith('/presentation/');

  // Check if current route is public
  const isPublicRoute = publicRoutes.includes(req.nextUrl.pathname);

  // If not authenticated and not on a public route, redirect to login
  if (!user && !isPublicRoute) {
    const redirectUrl = new URL('/auth/login', req.url);
    
    // Preserve the original URL for redirect after login (only if not root)
    if (req.nextUrl.pathname !== '/') {
      if (!shareRoutes) {
        redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
      } else {
        // For shared presentations, redirect to the share link after login
        redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname + req.nextUrl.search);
      }
    }
    
    console.log('Redirecting unauthenticated user to login:', redirectUrl.toString());
    return NextResponse.redirect(redirectUrl);
  }

  // If authenticated and on login page, redirect to homepage
  if (user && req.nextUrl.pathname === '/auth/login') {
    console.log('Redirecting authenticated user from login to homepage');
    return NextResponse.redirect(new URL('/', req.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes that don't require auth
     */
    '/((?!_next/static|_next/image|favicon.ico|api/embed).*)',
  ],
};
