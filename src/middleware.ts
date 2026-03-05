import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Helper function to fetch profile with timeout
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchProfileWithTimeout(supabase: any, userId: string, timeoutMs = 10000) {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Profile fetch timeout")), timeoutMs);
  });

  try {
    const queryPromise = supabase
      .from("profiles")
      .select("role, company_id")
      .eq("user_id", userId)
      .single();

    const result = await Promise.race([queryPromise, timeoutPromise]);
    return result as { data: { role: string; company_id: string | null } | null; error: Error | null };
  } catch (error) {
    console.error("Failed to fetch profile:", error);
    return { data: null, error: error as Error };
  }
}

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
    const { data: profile, error } = await fetchProfileWithTimeout(supabase, user.id);

    if (error) {
      // If we can't fetch profile, redirect to login with error
      console.error("Middleware: Failed to fetch user profile during login redirect", error);
      return NextResponse.redirect(new URL("/login?error=profile_fetch_failed", request.url));
    }

    if (profile?.role === "SUPER_USER") {
      return NextResponse.redirect(new URL("/super/central", request.url));
    } else {
      return NextResponse.redirect(new URL("/app/central", request.url));
    }
  }

  // Role-based access control for super routes
  if (pathname.startsWith("/super")) {
    const { data: profile, error } = await fetchProfileWithTimeout(supabase, user!.id);

    if (error || !profile) {
      console.error("Middleware: Failed to fetch profile for super route check", error);
      // On error, redirect to app central as safe fallback
      return NextResponse.redirect(new URL("/app/central", request.url));
    }

    if (profile.role !== "SUPER_USER") {
      return NextResponse.redirect(new URL("/app/central", request.url));
    }
  }

  // Role-based access control for client routes
  if (pathname.startsWith("/app")) {
    const { data: profile, error } = await fetchProfileWithTimeout(supabase, user!.id);

    if (error || !profile) {
      console.error("Middleware: Failed to fetch profile for app route check", error);
      // On error, redirect to login
      return NextResponse.redirect(new URL("/login?error=profile_fetch_failed", request.url));
    }

    // Check if user has company_id for client routes
    if (!profile.company_id) {
      // If super user trying to access client routes, redirect to super dashboard
      if (profile.role === "SUPER_USER") {
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
