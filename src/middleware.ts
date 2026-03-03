import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user, supabase } = await updateSession(request);

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
    // Check user role and redirect accordingly
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (profile?.role === "SUPER_USER") {
      return NextResponse.redirect(new URL("/super/central", request.url));
    } else {
      return NextResponse.redirect(new URL("/app/central", request.url));
    }
  }

  // Role-based access control for super routes
  if (pathname.startsWith("/super")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user!.id)
      .single();

    if (!profile || profile.role !== "SUPER_USER") {
      return NextResponse.redirect(new URL("/app/central", request.url));
    }
  }

  // Role-based access control for client routes
  if (pathname.startsWith("/app")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, company_id")
      .eq("user_id", user!.id)
      .single();

    // Check if user has company_id for client routes
    if (!profile || !profile.company_id) {
      // If super user trying to access client routes, redirect to super dashboard
      if (profile?.role === "SUPER_USER") {
        return NextResponse.redirect(new URL("/super/central", request.url));
      }
      return NextResponse.redirect(new URL("/login?error=no_company", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
