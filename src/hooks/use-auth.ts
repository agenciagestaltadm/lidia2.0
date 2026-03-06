"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User, UserRole, UserPermissions, DEFAULT_PERMISSIONS } from "@/types";

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

  // Fetch user profile with role and permissions
  const fetchUserProfile = useCallback(async (userId: string): Promise<User | null> => {
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
          role: "SUPER_USER" as UserRole,
          isActive: superUser.is_active,
          createdAt: superUser.created_at,
          lastLoginAt: superUser.last_login_at,
        } as User;
      }

      // If not super user, check regular users with company info
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select(`
          *,
          companies:company_id (name)
        `)
        .eq("user_id", userId)
        .single();

      if (profileError || !profile) {
        console.error("Error fetching profile:", profileError);
        return null;
      }

      // Parse permissions from JSONB or use defaults based on role
      const userRole = profile.role as UserRole;
      let permissions: UserPermissions;

      if (profile.permissions) {
        permissions = profile.permissions as UserPermissions;
      } else {
        // Use default permissions based on role
        permissions = userRole !== "SUPER_USER" 
          ? DEFAULT_PERMISSIONS[userRole as Exclude<UserRole, "SUPER_USER">]
          : DEFAULT_PERMISSIONS.CLIENT_ADMIN;
      }

      return {
        id: profile.id,
        email: profile.email,
        name: profile.full_name || profile.email,
        role: userRole,
        companyId: profile.company_id,
        companyName: profile.companies?.name,
        isActive: profile.is_active,
        createdAt: profile.created_at,
        lastLoginAt: profile.last_sign_in_at,
        permissions: permissions,
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
        
        if (profile) {
          // Update user metadata with role for middleware access
          await supabase.auth.updateUser({
            data: { 
              role: profile.role,
              company_id: profile.companyId,
            },
          });

          // Update last login timestamp
          if (profile.role === "SUPER_USER") {
            await supabase
              .from("super_users")
              .update({ last_login_at: new Date().toISOString() })
              .eq("id", profile.id);
          } else {
            await supabase
              .from("profiles")
              .update({ last_sign_in_at: new Date().toISOString() })
              .eq("id", profile.id);
          }

          setState({
            user: profile,
            isLoading: false,
            error: null,
          });

          return { success: true, user: profile };
        }

        return { success: false, error: "Profile not found" };
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
    if (user.role === "SUPER_USER") {
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
    return state.user?.role === "SUPER_USER";
  }, [state.user]);

  // Check if user has a specific permission
  const hasPermission = useCallback((permission: keyof UserPermissions): boolean => {
    if (!state.user) return false;
    
    // Super users and company admins have all permissions
    if (state.user.role === "SUPER_USER" || state.user.role === "CLIENT_ADMIN") {
      return true;
    }
    
    // Check specific permission
    return state.user.permissions?.[permission] ?? false;
  }, [state.user]);

  // Check if user can manage other users
  const canManageUsers = useCallback((): boolean => {
    if (!state.user) return false;
    return state.user.role === "SUPER_USER" || 
           state.user.role === "CLIENT_ADMIN" ||
           (state.user.role === "CLIENT_MANAGER" && state.user.permissions?.canManageUsers === true);
  }, [state.user]);

  // Update user permissions (for admins only)
  const updateUserPermissions = async (userId: string, permissions: UserPermissions) => {
    const supabase = supabaseRef.current;
    if (!supabase || !state.user) {
      return { success: false, error: "Not authorized" };
    }

    // Only super users and company admins can update permissions
    if (!canManageUsers()) {
      return { success: false, error: "Not authorized" };
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ permissions })
        .eq("id", userId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return { success: false, error: message };
    }
  };

  return {
    ...state,
    signIn,
    signOut,
    redirectBasedOnRole,
    hasRole,
    isSuperUser,
    hasPermission,
    canManageUsers,
    updateUserPermissions,
  };
}
