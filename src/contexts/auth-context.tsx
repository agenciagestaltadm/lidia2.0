"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { User, UserRole, UserPermissions, DEFAULT_PERMISSIONS } from "@/types";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  signOut: () => Promise<void>;
  hasRole: (roles: UserRole[]) => boolean;
  isSuperUser: () => boolean;
  hasPermission: (permission: keyof UserPermissions) => boolean;
  canManageUsers: () => boolean;
  updateUserPermissions: (userId: string, permissions: UserPermissions) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Singleton Supabase client
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
  });

  const supabaseRef = useRef(getClient());
  // Guard flag to prevent onAuthStateChange from interfering during signIn
  const isSigningInRef = useRef(false);
  // Track if we already initialized to avoid double-init in StrictMode
  const initializedRef = useRef(false);

  // Fetch user profile with role and permissions
  const fetchUserProfile = useCallback(
    async (userId: string): Promise<User | null> => {
      const supabase = supabaseRef.current;
      if (!supabase) return null;

      try {
        // First check if user is a super user
        const { data: superUser } = await supabase
          .from("super_users")
          .select("*")
          .eq("id", userId)
          .maybeSingle();

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
          .select(
            `
            *,
            companies:company_id (name)
          `
          )
          .eq("user_id", userId)
          .maybeSingle();

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
          permissions =
            userRole !== "SUPER_USER"
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
    },
    []
  );

  // Initialize auth state - runs once
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

    // Prevent double initialization in React StrictMode
    if (initializedRef.current) return;
    initializedRef.current = true;

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          setState({
            user: profile,
            isLoading: false,
            error: profile ? null : "Profile not found",
          });
        } else {
          setState({
            user: null,
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        setState({
          user: null,
          isLoading: false,
          error: "Failed to initialize auth",
        });
      }
    };

    initializeAuth();

    // Listen for auth changes - but respect the isSigningIn guard
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event: string, session: { user: { id: string } } | null) => {
        // Skip if we're in the middle of a signIn flow
        if (isSigningInRef.current) {
          return;
        }

        // Only react to meaningful events
        if (event === "SIGNED_OUT") {
          setState({
            user: null,
            isLoading: false,
            error: null,
          });
          return;
        }

        if (event === "TOKEN_REFRESHED" || event === "SIGNED_IN") {
          if (session?.user) {
            const profile = await fetchUserProfile(session.user.id);
            setState({
              user: profile,
              isLoading: false,
              error: null,
            });
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  // Sign in with email and password
  const signIn = useCallback(
    async (email: string, password: string) => {
      const supabase = supabaseRef.current;
      if (!supabase) {
        return { success: false, error: "Auth not available" };
      }

      try {
        // Set guard to prevent onAuthStateChange from interfering
        isSigningInRef.current = true;

        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          isSigningInRef.current = false;
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: error.message,
          }));
          return { success: false, error: error.message };
        }

        if (data.user) {
          const profile = await fetchUserProfile(data.user.id);

          if (profile) {
            // Update state first
            setState({
              user: profile,
              isLoading: false,
              error: null,
            });

            // Update user metadata in background (non-blocking)
            // This won't cause a loop because isSigningInRef is still true
            supabase.auth
              .updateUser({
                data: {
                  role: profile.role,
                  company_id: profile.companyId,
                },
              })
              .then(() => {
                // Update last login timestamp in background
                if (profile.role === "SUPER_USER") {
                  supabase
                    .from("super_users")
                    .update({ last_login_at: new Date().toISOString() })
                    .eq("id", profile.id)
                    .then(() => {});
                } else {
                  supabase
                    .from("profiles")
                    .update({ last_sign_in_at: new Date().toISOString() })
                    .eq("id", profile.id)
                    .then(() => {});
                }
              })
              .finally(() => {
                // Release the guard after metadata update completes
                // Small delay to ensure onAuthStateChange events from updateUser are ignored
                setTimeout(() => {
                  isSigningInRef.current = false;
                }, 1000);
              });

            return { success: true, user: profile };
          }

          // Profile not found
          isSigningInRef.current = false;
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: "Profile not found",
          }));
          return { success: false, error: "Profile not found" };
        }

        isSigningInRef.current = false;
        return { success: false, error: "No user found" };
      } catch (error) {
        isSigningInRef.current = false;
        const message =
          error instanceof Error ? error.message : "Unknown error";
        setState((prev) => ({ ...prev, isLoading: false, error: message }));
        return { success: false, error: message };
      }
    },
    [fetchUserProfile]
  );

  // Sign out
  const signOut = useCallback(async () => {
    const supabase = supabaseRef.current;
    if (!supabase) return;

    try {
      await supabase.auth.signOut();
      setState({
        user: null,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }, []);

  // Check if user has required role
  const hasRole = useCallback(
    (roles: UserRole[]) => {
      if (!state.user) return false;
      return roles.includes(state.user.role);
    },
    [state.user]
  );

  // Check if user is super user
  const isSuperUser = useCallback(() => {
    return state.user?.role === "SUPER_USER";
  }, [state.user]);

  // Check if user has a specific permission
  const hasPermission = useCallback(
    (permission: keyof UserPermissions): boolean => {
      if (!state.user) return false;

      // Super users and company admins have all permissions
      if (
        state.user.role === "SUPER_USER" ||
        state.user.role === "CLIENT_ADMIN"
      ) {
        return true;
      }

      // Check specific permission
      return state.user.permissions?.[permission] ?? false;
    },
    [state.user]
  );

  // Check if user can manage other users
  const canManageUsers = useCallback((): boolean => {
    if (!state.user) return false;
    return (
      state.user.role === "SUPER_USER" ||
      state.user.role === "CLIENT_ADMIN" ||
      (state.user.role === "CLIENT_MANAGER" &&
        state.user.permissions?.canManageUsers === true)
    );
  }, [state.user]);

  // Update user permissions (for admins only)
  const updateUserPermissions = useCallback(
    async (userId: string, permissions: UserPermissions) => {
      const supabase = supabaseRef.current;
      if (!supabase || !state.user) {
        return { success: false, error: "Not authorized" };
      }

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
        const message =
          error instanceof Error ? error.message : "Unknown error";
        return { success: false, error: message };
      }
    },
    [state.user, canManageUsers]
  );

  const value: AuthContextValue = {
    ...state,
    signIn,
    signOut,
    hasRole,
    isSuperUser,
    hasPermission,
    canManageUsers,
    updateUserPermissions,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
