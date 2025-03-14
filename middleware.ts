import { NextRequest, NextResponse } from 'next/server';
import { createClient } from './lib/supabase/server';

// Define the protected routes
const protectedRoutes = ['/home', '/history', '/dashboard', '/settings'];

export async function middleware(request: NextRequest) {
  // Create Supabase client instance by awaiting the createClient function
  const supabase = await createClient();

  // Get the user from the session (via cookies)
  const { data: { user }, error } = await supabase.auth.getUser();

  // Check if the requested path matches a protected route
  const pathname = request.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // If the route is protected and no user is authenticated, redirect to login
  if (isProtectedRoute && (!user || error)) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Allow the request to proceed if authenticated or if route isn’t protected
  return NextResponse.next();
}

// Configure the matcher to apply middleware to specific routes
export const config = {
  matcher: ['/home/:path*', '/history/:path*', '/dashboard/:path*', '/settings/:path*'],
};