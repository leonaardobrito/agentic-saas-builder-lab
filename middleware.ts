import { createMiddlewareClient } from '@/lib/supabase/middleware';
import { type NextRequest } from 'next/server';

/**
 * Middleware to protect dashboard routes and refresh session cookies.
 * 
 * Public routes: /login, /register, /api/auth/*
 * Protected routes: /app/* (dashboard)
 */
export async function middleware(request: NextRequest) {
  const { supabase, response } = await createMiddlewareClient(request);

  // Refresh session if exists
  await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Public routes
  const publicRoutes = ['/login', '/register', '/logout'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  const isAuthApiRoute = pathname.startsWith('/api/auth');

  if (isPublicRoute || isAuthApiRoute) {
    return response;
  }

  // Protected routes require authentication
  if (pathname.startsWith('/app')) {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/login';
      redirectUrl.searchParams.set('redirect', pathname);
      return Response.redirect(redirectUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
