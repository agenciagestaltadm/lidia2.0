"use client";

import { motion } from "framer-motion";
import { Mail, Users, Building2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { GlowBadge } from "@/components/ui/glow-badge";
import { cn } from "@/lib/utils";
import { useCompanyEmails, CompanyEmail } from "@/hooks/use-company-emails";

interface CompanyEmailsWidgetProps {
  className?: string;
}

/**
 * Widget de listagem dinâmica de e-mails corporativos.
 * 
 * Features:
 * - Busca e-mails reais dos usuários da empresa atual
 * - Filtro rigoroso por company_id (exclui dados de outras empresas)
 * - Exibe informações de nome, e-mail e cargo
 * - Interface moderna com animações
 * - Indicadores visuais por status
 */
export function CompanyEmailsWidget({ className }: CompanyEmailsWidgetProps) {
  const { data: emails, isLoading, error, refetch } = useCompanyEmails();

  if (isLoading) {
    return (
      <Card className={cn("dark:bg-[#0a0a0a]/80 bg-white border dark:border-emerald-500/10 border-slate-200", className)}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-8 w-24" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg dark:bg-white/5 bg-slate-50">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("dark:bg-[#0a0a0a]/80 bg-white border dark:border-red-500/20 border-red-200", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium dark:text-slate-200 text-slate-800 flex items-center gap-2">
            <Mail className="w-4 h-4" />
            E-mails Corporativos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <p className="text-sm dark:text-red-400 text-red-600 mb-2">
              Erro ao carregar e-mails
            </p>
            <p className="text-xs dark:text-slate-500 text-slate-400 mb-4">
              {error.message}
            </p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg dark:bg-emerald-500/20 bg-emerald-100 dark:text-emerald-400 text-emerald-700 hover:dark:bg-emerald-500/30 hover:bg-emerald-200 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Tentar novamente
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const emailList = emails || [];

  return (
    <Card className={cn("dark:bg-[#0a0a0a]/80 bg-white border dark:border-emerald-500/10 border-slate-200", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium dark:text-slate-200 text-slate-800 flex items-center gap-2">
            <Mail className="w-4 h-4 text-emerald-500" />
            E-mails Corporativos
          </CardTitle>
          <GlowBadge variant="emerald" size="sm">
            {emailList.length} usuário{emailList.length !== 1 ? "s" : ""}
          </GlowBadge>
        </div>
      </CardHeader>
      <CardContent>
        {emailList.length === 0 ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full dark:bg-slate-800 bg-slate-100 flex items-center justify-center">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-sm dark:text-slate-400 text-slate-500 mb-1">
              Nenhum usuário encontrado
            </p>
            <p className="text-xs dark:text-slate-500 text-slate-400">
              Os usuários da sua empresa aparecerão aqui
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
            {emailList.map((user: CompanyEmail, index: number) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "group flex items-center gap-3 p-3 rounded-lg transition-all duration-200",
                  "dark:bg-white/[0.02] bg-slate-50",
                  "hover:dark:bg-white/5 hover:bg-slate-100",
                  "border border-transparent",
                  "hover:dark:border-emerald-500/20 hover:border-emerald-200"
                )}
              >
                {/* Avatar/Icon */}
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                  "dark:bg-emerald-500/10 bg-emerald-100",
                  "group-hover:dark:bg-emerald-500/20 group-hover:bg-emerald-200",
                  "transition-colors"
                )}>
                  <span className="text-sm font-semibold dark:text-emerald-400 text-emerald-600">
                    {user.fullName?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium dark:text-slate-200 text-slate-800 truncate">
                    {user.fullName || "Nome não informado"}
                  </p>
                  <p className="text-xs dark:text-slate-500 text-slate-400 truncate">
                    {user.email}
                  </p>
                </div>

                {/* Role Badge */}
                <GlowBadge 
                  variant={getRoleVariant(user.role)} 
                  size="sm"
                  className="shrink-0"
                >
                  {formatRole(user.role)}
                </GlowBadge>
              </motion.div>
            ))}
          </div>
        )}

        {/* Summary Footer */}
        {emailList.length > 0 && (
          <div className="mt-4 pt-3 border-t dark:border-emerald-500/10 border-slate-200">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 dark:text-slate-500 text-slate-400" />
                  <span className="dark:text-slate-400 text-slate-500">
                    {emailList[0]?.companyName || "Sua Empresa"}
                  </span>
                </div>
              </div>
              <span className="dark:text-slate-500 text-slate-400">
                Total: {emailList.length}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Formata o nome do cargo para exibição
 */
function formatRole(role: string): string {
  const roleMap: Record<string, string> = {
    "SUPER_USER": "Super Admin",
    "CLIENT_ADMIN": "Admin",
    "CLIENT_MANAGER": "Gerente",
    "CLIENT_AGENT": "Agente",
    "CLIENT_VIEWER": "Visualizador",
  };
  return roleMap[role] || role;
}

/**
 * Retorna a variante do badge baseada no cargo
 */
function getRoleVariant(role: string): "green" | "emerald" | "blue" | "purple" | "amber" | "default" {
  switch (role) {
    case "SUPER_USER":
      return "purple";
    case "CLIENT_ADMIN":
      return "emerald";
    case "CLIENT_MANAGER":
      return "blue";
    case "CLIENT_AGENT":
      return "amber";
    default:
      return "default";
  }
}
