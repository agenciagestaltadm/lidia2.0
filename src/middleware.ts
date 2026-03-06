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

  // If user is logged in and trying to access login page, redirect to dashboard
  if (user && isPublicRoute) {
    const userRole = user.user_metadata?.role;

    // Redirect based on user role - default to /app/central if role is unknown
    if (userRole === "SUPER_USER") {
      return NextResponse.redirect(new URL("/super/plans", request.url));
    } else {
      // For any other role (including undefined), go to app dashboard
      return NextResponse.redirect(new URL("/app/central", request.url));
    }
  }

  // Role-based access control for super user routes
  if (pathname.startsWith("/super")) {
    const userRole = user?.user_metadata?.role;
    if (userRole !== "SUPER_USER") {
      // If role is undefined, let the user through to /app/central
      // The frontend ProtectedRoute will handle proper auth checks
      return NextResponse.redirect(new URL("/app/central", request.url));
    }
  }

  // Role-based access control for app routes (company users)
  if (pathname.startsWith("/app")) {
    const userRole = user?.user_metadata?.role;
    // Only redirect if we KNOW the user is a super user
    // If role is undefined, let them through - the frontend will handle it
    if (userRole === "SUPER_USER") {
      return NextResponse.redirect(new URL("/super/plans", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
