import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);

  // Get the pathname
  const pathname = request.nextUrl.pathname;

  // Public routes that don't require authentication
  const publicRoutes = ["/login", "/forgot-password", "/reset-password"];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // If user is not logged in and trying to access protected route
  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If user is logged in and trying to access login page
  if (user && isPublicRoute) {
    // Get user role from user metadata
    const userRole = user.user_metadata?.role || 'agent';
    
    // Redirect based on user role
    if (userRole === 'super_user') {
      return NextResponse.redirect(new URL("/super/plans", request.url));
    } else {
      return NextResponse.redirect(new URL("/app/central", request.url));
    }
  }
  
  // Role-based access control for super user routes
  if (pathname.startsWith("/super")) {
    const userRole = user?.user_metadata?.role;
    if (userRole !== 'super_user') {
      return NextResponse.redirect(new URL("/app/central", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
