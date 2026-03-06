"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types";

export interface CompanyUser {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  company_id: string | null;
  company?: {
    id: string;
    name: string;
  };
  is_active: boolean;
  last_sign_in_at: string | null;
  created_at: string;
  updated_at: string;
}

interface CompanyUsersState {
  users: CompanyUser[];
  loading: boolean;
  error: string | null;
  totalCount: number;
}

interface UserFormData {
  email: string;
  full_name?: string;
  role?: UserRole;
  company_id?: string;
  is_active?: boolean;
  password?: string;
}

export function useCompanyUsers() {
  const [state, setState] = useState<CompanyUsersState>({
    users: [],
    loading: true,
    error: null,
    totalCount: 0,
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const supabase = useMemo(() => createClient(), []);

  const fetchUsers = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      // Fetch users with company details
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          *,
          company:company_id (id, name)
        `)
        .neq("role", "SUPER_USER")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get total count (excluding super users)
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .neq("role", "SUPER_USER");

      setState({
        users: (data as CompanyUser[]) || [],
        loading: false,
        error: null,
        totalCount: count || 0,
      });
    } catch (err) {
      console.error("Error fetching users:", err);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Erro ao carregar usuários",
      }));
    }
  }, [supabase]);

  const createUser = useCallback(
    async (userData: UserFormData): Promise<{ success: boolean; error?: string }> => {
      try {
        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: userData.email,
          password: userData.password || "tempPassword123!",
          options: {
            data: {
              full_name: userData.full_name,
            },
          },
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("Failed to create user");

        // Create profile
        const { error: profileError } = await supabase.from("profiles").insert({
          user_id: authData.user.id,
          email: userData.email,
          full_name: userData.full_name,
          role: userData.role || "CLIENT_AGENT",
          company_id: userData.company_id,
          is_active: userData.is_active ?? true,
        });

        if (profileError) throw profileError;

        await fetchUsers();
        return { success: true };
      } catch (err) {
        console.error("Error creating user:", err);
        return {
          success: false,
          error: err instanceof Error ? err.message : "Erro ao criar usuário",
        };
      }
    },
    [supabase, fetchUsers]
  );

  const updateUser = useCallback(
    async (
      userId: string,
      userData: Partial<UserFormData>
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const { error } = await supabase
          .from("profiles")
          .update({
            ...userData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        if (error) throw error;

        await fetchUsers();
        return { success: true };
      } catch (err) {
        console.error("Error updating user:", err);
        return {
          success: false,
          error: err instanceof Error ? err.message : "Erro ao atualizar usuário",
        };
      }
    },
    [supabase, fetchUsers]
  );

  const deleteUser = useCallback(
    async (userId: string): Promise<{ success: boolean; error?: string }> => {
      try {
        // Delete profile first (cascades to auth via trigger)
        const { error } = await supabase
          .from("profiles")
          .delete()
          .eq("id", userId);

        if (error) throw error;

        await fetchUsers();
        return { success: true };
      } catch (err) {
        console.error("Error deleting user:", err);
        return {
          success: false,
          error: err instanceof Error ? err.message : "Erro ao excluir usuário",
        };
      }
    },
    [supabase, fetchUsers]
  );

  const toggleUserStatus = useCallback(
    async (userId: string, isActive: boolean): Promise<{ success: boolean; error?: string }> => {
      try {
        const { error } = await supabase
          .from("profiles")
          .update({
            is_active: isActive,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        if (error) throw error;

        await fetchUsers();
        return { success: true };
      } catch (err) {
        console.error("Error toggling user status:", err);
        return {
          success: false,
          error: err instanceof Error ? err.message : "Erro ao alterar status",
        };
      }
    },
    [supabase, fetchUsers]
  );

  const changeUserRole = useCallback(
    async (userId: string, role: UserRole): Promise<{ success: boolean; error?: string }> => {
      try {
        const { error } = await supabase
          .from("profiles")
          .update({
            role,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        if (error) throw error;

        await fetchUsers();
        return { success: true };
      } catch (err) {
        console.error("Error changing user role:", err);
        return {
          success: false,
          error: err instanceof Error ? err.message : "Erro ao alterar função",
        };
      }
    },
    [supabase, fetchUsers]
  );

  const changeUserCompany = useCallback(
    async (userId: string, companyId: string | null): Promise<{ success: boolean; error?: string }> => {
      try {
        const { error } = await supabase
          .from("profiles")
          .update({
            company_id: companyId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        if (error) throw error;

        await fetchUsers();
        return { success: true };
      } catch (err) {
        console.error("Error changing user company:", err);
        return {
          success: false,
          error: err instanceof Error ? err.message : "Erro ao alterar empresa",
        };
      }
    },
    [supabase, fetchUsers]
  );

  const resetPassword = useCallback(
    async (email: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) throw error;

        return { success: true };
      } catch (err) {
        console.error("Error resetting password:", err);
        return {
          success: false,
          error: err instanceof Error ? err.message : "Erro ao resetar senha",
        };
      }
    },
    [supabase]
  );

  // Subscribe to real-time changes
  useEffect(() => {
    fetchUsers();

    const subscription = supabase
      .channel("profiles-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => fetchUsers()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUsers, supabase]);

  return {
    ...state,
    refetch: fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    changeUserRole,
    changeUserCompany,
    resetPassword,
  };
}
