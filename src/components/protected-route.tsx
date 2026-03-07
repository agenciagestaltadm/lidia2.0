"use client";

import { ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { UserPermissions, UserRole } from "@/types";
import { GlassCard } from "@/components/ui/glass-card";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: keyof UserPermissions;
  requiredRoles?: UserRole[];
  fallback?: ReactNode;
}

export function ProtectedRoute({ 
  children, 
  requiredPermission, 
  requiredRoles,
  fallback 
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const { canAccessRoute, hasPermission } = usePermissions();
  const router = useRouter();
  const pathname = usePathname();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-8 h-8 text-emerald-400" />
        </motion.div>
      </div>
    );
  }

  // If no user, show access denied
  if (!user) {
    return (
      <AccessDenied 
        message="Você precisa estar logado para acessar esta página."
        onBack={() => router.push("/login")}
      />
    );
  }

  // Check required roles
  if (requiredRoles && requiredRoles.length > 0) {
    if (!requiredRoles.includes(user.role)) {
      return (
        <AccessDenied 
          message="Você não tem permissão para acessar esta página."
          requiredRoles={requiredRoles}
          onBack={() => router.push("/app/central")}
        />
      );
    }
  }

  // Check required permission
  if (requiredPermission) {
    if (!canAccessRoute(requiredPermission)) {
      return (
        <AccessDenied 
          message="Você não tem permissão para acessar esta funcionalidade."
          onBack={() => router.push("/app/central")}
        />
      );
    }
  }

  // All checks passed, render children
  return <>{children}</>;
}

interface AccessDeniedProps {
  message: string;
  requiredRoles?: UserRole[];
  onBack: () => void;
}

function AccessDenied({ message, requiredRoles, onBack }: AccessDeniedProps) {
  const roleLabels: Record<UserRole, string> = {
    SUPER_USER: "Super Usuário",
    CLIENT_ADMIN: "Administrador",
    CLIENT_MANAGER: "Gerente",
    CLIENT_AGENT: "Agente",
    CLIENT_VIEWER: "Visualizador",
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <GlassCard className="p-8 text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <Shield className="w-8 h-8 text-red-400" />
          </div>
          
          <h2 className="text-xl font-bold dark:text-white text-slate-900 mb-2">
            Acesso Restrito
          </h2>
          
          <p className="dark:text-slate-400 text-slate-500 mb-4">
            {message}
          </p>

          {requiredRoles && requiredRoles.length > 0 && (
            <div className="mb-4 p-3 rounded-lg dark:bg-white/5 bg-slate-100">
              <p className="text-xs dark:text-slate-500 text-slate-400 mb-2">Requer um dos seguintes papéis:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {requiredRoles.map(role => (
                  <span
                    key={role}
                    className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-xs"
                  >
                    {roleLabels[role]}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={onBack}
            className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors text-sm font-medium"
          >
            Voltar
          </button>
        </GlassCard>
      </motion.div>
    </div>
  );
}
