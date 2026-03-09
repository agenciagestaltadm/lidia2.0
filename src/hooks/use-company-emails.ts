"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import { createClient } from "@/lib/supabase/client";

// ============================================
// TYPES
// ============================================

export interface CompanyEmail {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  isActive: boolean;
  companyName: string | null;
  createdAt: string;
}

// ============================================
// HOOK
// ============================================

/**
 * Hook para buscar e-mails corporativos dos usuários da empresa atual.
 * 
 * Features:
 * - Filtro rigoroso por company_id do usuário logado
 * - Exclui automaticamente dados de outras empresas
 * - Retorna apenas usuários ativos da empresa atual
 * - Inclui informações de nome, e-mail e cargo
 * 
 * @returns Query result com lista de e-mails corporativos
 */
export function useCompanyEmails() {
  const { user } = useAuth();
  const supabase = typeof window !== "undefined" ? createClient() : null;

  return useQuery({
    queryKey: ["company-emails", user?.companyId],
    queryFn: async (): Promise<CompanyEmail[]> => {
      // Verificação rigorosa: só busca se houver companyId e supabase
      if (!user?.companyId || !supabase) {
        return [];
      }

      // Busca usuários da empresa atual apenas
      // Filtro RLS + filtro explícito garantem isolamento total
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          email,
          full_name,
          role,
          is_active,
          created_at,
          companies:company_id (name)
        `)
        .eq("company_id", user.companyId)
        .eq("is_active", true)
        .order("full_name", { ascending: true });

      if (error) {
        throw error;
      }

      // Transforma os dados para o formato esperado
      const emails: CompanyEmail[] = (data || []).map((profile: any) => ({
        id: profile.id,
        email: profile.email,
        fullName: profile.full_name,
        role: profile.role,
        isActive: profile.is_active,
        companyName: profile.companies?.name || null,
        createdAt: profile.created_at,
      }));

      return emails;
    },
    // Só executa quando temos um companyId válido
    enabled: !!user?.companyId,
    // Cache por 5 minutos
    staleTime: 5 * 60 * 1000,
    // Refetch em background quando a janela ganha foco
    refetchOnWindowFocus: true,
  });
}
