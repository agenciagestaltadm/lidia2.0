"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User, UserRole } from "@/types";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

// Lazy client creation to avoid build-time errors
let clientInstance: ReturnType<typeof createClient> | null = null;
const getClient = () => {
  if (!clientInstance && typeof window !== "undefined") {
    try {
      clientInstance = createClient();
    } catch (e) {
      console.warn("Supabase client creation failed:", e);
    }
  }
  return clientInstance;
};

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
  });
  const router = useRouter();
  const supabaseRef = useRef(getClient());

  // Fetch user profile with role
  const fetchUserProfile = useCallback(async (userId: string) => {
    const supabase = supabaseRef.current;
    if (!supabase) return null;
    
    try {
      // First check if user is a super user
      const { data: superUser, error: superError } = await supabase
        .from("super_users")
        .select("*")
        .eq("id", userId)
        .single();

      if (superUser) {
        return {
          id: superUser.id,
          email: superUser.email,
          name: superUser.name,
          role: "super_user" as UserRole,
          isActive: superUser.is_active,
          createdAt: superUser.created_at,
          lastLoginAt: superUser.last_login_at,
        } as User;
      }

      // If not super user, check regular users
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError || !profile) {
        return null;
      }

      return {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role as UserRole,
        companyId: profile.company_id,
        isActive: profile.is_active,
        createdAt: profile.created_at,
        lastLoginAt: profile.last_login_at,
      } as User;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    const supabase = supabaseRef.current;
    if (!supabase) {
      setState({
        user: null,
        isLoading: false,
        error: "Auth not available",
      });
      return;
    }

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          setState({
            user: profile,
            isLoading: false,
            error: null,
          });
        } else {
          setState({
            user: null,
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        setState({
          user: null,
          isLoading: false,
          error: "Failed to initialize auth",
        });
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: { user: { id: string } } | null) => {
        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          setState({
            user: profile,
            isLoading: false,
            error: null,
          });
        } else {
          setState({
            user: null,
            isLoading: false,
            error: null,
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    const supabase = supabaseRef.current;
    if (!supabase) {
      return { success: false, error: "Auth not available" };
    }

    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setState((prev) => ({ ...prev, isLoading: false, error: error.message }));
        return { success: false, error: error.message };
      }

      if (data.user) {
        const profile = await fetchUserProfile(data.user.id);
        setState({
          user: profile,
          isLoading: false,
          error: null,
        });
        return { success: true, user: profile };
      }

      return { success: false, error: "No user found" };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
      return { success: false, error: message };
    }
  };

  // Sign out
  const signOut = async () => {
    const supabase = supabaseRef.current;
    if (!supabase) return;

    try {
      await supabase.auth.signOut();
      setState({
        user: null,
        isLoading: false,
        error: null,
      });
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Redirect based on user role
  const redirectBasedOnRole = useCallback((user: User) => {
    if (user.role === "super_user") {
      router.push("/super/plans");
    } else {
      router.push("/app/central");
    }
    router.refresh();
  }, [router]);

  // Check if user has required role
  const hasRole = useCallback((roles: UserRole[]) => {
    if (!state.user) return false;
    return roles.includes(state.user.role);
  }, [state.user]);

  // Check if user is super user
  const isSuperUser = useCallback(() => {
    return state.user?.role === "super_user";
  }, [state.user]);

  return {
    ...state,
    signIn,
    signOut,
    redirectBasedOnRole,
    hasRole,
    isSuperUser,
  };
}
