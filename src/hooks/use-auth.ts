"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/auth-context";
import { User, UserRole } from "@/types";

/**
 * Hook de autenticação que consome o AuthContext centralizado.
 * Mantém a mesma interface pública para compatibilidade com componentes existentes.
 */
export function useAuth() {
  const auth = useAuthContext();
  const router = useRouter();

  // Redirect based on user role - uses router.replace to avoid back-button loop
  const redirectBasedOnRole = useCallback(
    (user: User) => {
      if (user.role === "SUPER_USER") {
        router.replace("/super/plans");
      } else {
        router.replace("/app/central");
      }
      // NOTE: router.refresh() was intentionally removed to prevent
      // middleware re-execution that caused redirect loops
    },
    [router]
  );

  // Sign out with redirect
  const signOut = useCallback(async () => {
    await auth.signOut();
    router.replace("/login");
  }, [auth, router]);

  return {
    user: auth.user,
    isLoading: auth.isLoading,
    error: auth.error,
    signIn: auth.signIn,
    signOut,
    redirectBasedOnRole,
    hasRole: auth.hasRole,
    isSuperUser: auth.isSuperUser,
    hasPermission: auth.hasPermission,
    canManageUsers: auth.canManageUsers,
    updateUserPermissions: auth.updateUserPermissions,
  };
}
