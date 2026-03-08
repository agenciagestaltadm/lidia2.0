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
  phone: string | null;
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

export interface UserFormData {
  email: string;
  full_name?: string;
  phone?: string;
  role?: UserRole;
  company_id?: string;
  is_active?: boolean;
  password?: string;
}

// Interface para filtros dinâmicos
export interface UserFilters {
  companyId?: string | null;
  role?: UserRole | null;
  status?: "all" | "active" | "inactive";
  searchTerm?: string;
}

// Interface para opções de criação de usuário
export interface CreateUserOptions {
  autoVerifyEmail?: boolean;
}

// Opções de roles disponíveis
export const allRoleOptions = [
  { value: "CLIENT_ADMIN", label: "Administrador" },
  { value: "CLIENT_MANAGER", label: "Gerente" },
  { value: "CLIENT_AGENT", label: "Agente" },
  { value: "CLIENT_VIEWER", label: "Visualizador" },
];

export function useCompanyUsers(initialCompanyId?: string | null) {
  const [state, setState] = useState<CompanyUsersState>({
    users: [],
    loading: true,
    error: null,
    totalCount: 0,
  });

  const [filters, setFilters] = useState<UserFilters>({
    companyId: initialCompanyId || null,
    role: null,
    status: "all",
    searchTerm: "",
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const supabase = useMemo(() => createClient(), []);

  // Função para buscar usuários com filtros dinâmicos
  const fetchUsers = useCallback(
    async (appliedFilters?: UserFilters) => {
      const currentFilters = appliedFilters || filters;

      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        let query = supabase
          .from("profiles")
          .select(
            `
          *,
          company:company_id (id, name)
        `
          )
          .neq("role", "SUPER_USER")
          .order("created_at", { ascending: false });

        // Aplicar filtro por empresa
        if (currentFilters.companyId) {
          query = query.eq("company_id", currentFilters.companyId);
        }

        // Aplicar filtro por role
        if (currentFilters.role) {
          query = query.eq("role", currentFilters.role);
        }

        // Aplicar filtro por status
        if (currentFilters.status && currentFilters.status !== "all") {
          query = query.eq("is_active", currentFilters.status === "active");
        }

        const { data, error } = await query;

        if (error) throw error;

        // Aplicar filtro de busca por termo (client-side)
        let filteredData = (data as CompanyUser[]) || [];
        if (currentFilters.searchTerm) {
          const term = currentFilters.searchTerm.toLowerCase();
          filteredData = filteredData.filter(
            (user) =>
              user.full_name?.toLowerCase().includes(term) ||
              user.email.toLowerCase().includes(term) ||
              user.company?.name.toLowerCase().includes(term)
          );
        }

        // Get total count (com mesmos filtros, exceto busca)
        let countQuery = supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .neq("role", "SUPER_USER");

        if (currentFilters.companyId) {
          countQuery = countQuery.eq("company_id", currentFilters.companyId);
        }

        if (currentFilters.role) {
          countQuery = countQuery.eq("role", currentFilters.role);
        }

        if (currentFilters.status && currentFilters.status !== "all") {
          countQuery = countQuery.eq(
            "is_active",
            currentFilters.status === "active"
          );
        }

        const { count } = await countQuery;

        setState({
          users: filteredData,
          loading: false,
          error: null,
          totalCount: count || 0,
        });
      } catch (err) {
        console.error("Error fetching users:", err);
        setState((prev) => ({
          ...prev,
          loading: false,
          error:
            err instanceof Error ? err.message : "Erro ao carregar usuários",
        }));
      }
    },
    [supabase, filters]
  );

  // Função para atualizar filtros e recarregar dados
  const updateFilters = useCallback(
    (newFilters: Partial<UserFilters>) => {
      const updatedFilters = { ...filters, ...newFilters };
      setFilters(updatedFilters);
      fetchUsers(updatedFilters);
    },
    [filters, fetchUsers]
  );

  // Função para resetar filtros
  const resetFilters = useCallback(() => {
    const defaultFilters = {
      companyId: initialCompanyId || null,
      role: null,
      status: "all" as const,
      searchTerm: "",
    };
    setFilters(defaultFilters);
    fetchUsers(defaultFilters);
  }, [fetchUsers, initialCompanyId]);

  // Função para obter roles disponíveis para uma empresa específica
  const getAvailableRoles = useCallback(
    (companyId: string | null) => {
      if (!companyId) {
        // Se não há empresa selecionada, retornar todas as roles
        return allRoleOptions;
      }

      // Filtrar usuários da empresa selecionada
      const companyUsers = state.users.filter(
        (u) => u.company_id === companyId
      );

      // Se não há usuários na empresa, mostrar todas as roles
      if (companyUsers.length === 0) {
        return allRoleOptions;
      }

      // Obter roles únicas usadas na empresa
      const usedRoles = new Set(companyUsers.map((u) => u.role));

      // Marcar roles como disponíveis (não desabilitar nenhuma, apenas mostrar contexto)
      return allRoleOptions.map((role) => ({
        ...role,
        label: usedRoles.has(role.value as UserRole)
          ? `${role.label} (${companyUsers.filter((u) => u.role === role.value).length})`
          : role.label,
      }));
    },
    [state.users]
  );

  // Função para criar usuário com verificação automática de email
  const createUser = useCallback(
    async (
      userData: UserFormData,
      options: CreateUserOptions = { autoVerifyEmail: true }
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        // 1. Criar usuário no Auth
        const { data: authData, error: authError } = await supabase.auth.signUp(
          {
            email: userData.email,
            password: userData.password || generateSecurePassword(),
            options: {
              data: {
                full_name: userData.full_name,
              },
            },
          }
        );

        if (authError) throw authError;
        if (!authData.user) throw new Error("Falha ao criar usuário");

        let verificationError = null;

        // 2. VERIFICAÇÃO AUTOMÁTICA DE EMAIL (se habilitado)
        if (options.autoVerifyEmail) {
          try {
            const { error: verifyError } = await supabase.rpc(
              "admin_confirm_user_email",
              { user_id: authData.user.id }
            );

            if (verifyError) {
              console.warn(
                "Não foi possível verificar email automaticamente:",
                verifyError
              );
              verificationError = verifyError;
              // Não falhar a criação, apenas logar o warning
            }
          } catch (verifyErr) {
            console.warn("Erro ao verificar email:", verifyErr);
            // Continuar mesmo se verificação falhar
          }
        }

        // 3. Criar profile
        const { error: profileError } = await supabase.from("profiles").insert({
          user_id: authData.user.id,
          email: userData.email,
          full_name: userData.full_name,
          phone: userData.phone,
          role: userData.role || "CLIENT_AGENT",
          company_id: userData.company_id,
          is_active: userData.is_active ?? true,
        });

        if (profileError) {
          // Rollback: tentar deletar usuário do auth se profile falhar
          try {
            await supabase.rpc("admin_delete_user", {
              user_id: authData.user.id,
            });
          } catch (rollbackErr) {
            console.error("Erro no rollback:", rollbackErr);
          }
          throw profileError;
        }

        await fetchUsers();

        return {
          success: true,
          error: verificationError
            ? "Usuário criado, mas não foi possível verificar o email automaticamente"
            : undefined,
        };
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
          error:
            err instanceof Error ? err.message : "Erro ao atualizar usuário",
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
          error:
            err instanceof Error ? err.message : "Erro ao excluir usuário",
        };
      }
    },
    [supabase, fetchUsers]
  );

  const toggleUserStatus = useCallback(
    async (
      userId: string,
      isActive: boolean
    ): Promise<{ success: boolean; error?: string }> => {
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
          error:
            err instanceof Error ? err.message : "Erro ao alterar status",
        };
      }
    },
    [supabase, fetchUsers]
  );

  const changeUserRole = useCallback(
    async (
      userId: string,
      role: UserRole
    ): Promise<{ success: boolean; error?: string }> => {
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
          error:
            err instanceof Error ? err.message : "Erro ao alterar função",
        };
      }
    },
    [supabase, fetchUsers]
  );

  const changeUserCompany = useCallback(
    async (
      userId: string,
      companyId: string | null
    ): Promise<{ success: boolean; error?: string }> => {
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
          error:
            err instanceof Error ? err.message : "Erro ao alterar empresa",
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
          error:
            err instanceof Error ? err.message : "Erro ao resetar senha",
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
    filters,
    refresh: fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    changeUserRole,
    changeUserCompany,
    resetPassword,
    // Novas funções de filtragem
    updateFilters,
    resetFilters,
    getAvailableRoles,
    allRoleOptions,
  };
}

// Função auxiliar para gerar senha segura temporária
function generateSecurePassword(): string {
  const length = 16;
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}
