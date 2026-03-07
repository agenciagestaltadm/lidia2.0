"use client";

import { useCallback } from "react";
import { useAuth } from "./use-auth";
import { UserPermissions, UserRole, DEFAULT_PERMISSIONS } from "@/types";

export function usePermissions() {
  const { user, isSuperUser, hasPermission } = useAuth();

  // Check if user can manage other users
  const checkCanManageUsers = useCallback((): boolean => {
    if (!user) return false;
    return user.role === "SUPER_USER" || 
           user.role === "CLIENT_ADMIN" ||
           (user.role === "CLIENT_MANAGER" && user.permissions?.canManageUsers === true);
  }, [user]);

  // Get effective permissions for current user
  const getEffectivePermissions = useCallback((): UserPermissions => {
    if (!user) {
      return {
        canViewCentral: false,
        canViewAttendances: false,
        canViewContacts: false,
        canSendBulk: false,
        canViewKanban: false,
        canManageConnection: false,
        canManageUsers: false,
        canViewSettings: false,
      };
    }

    // Super users have all permissions
    if (user.role === "SUPER_USER") {
      return {
        canViewCentral: true,
        canViewAttendances: true,
        canViewContacts: true,
        canSendBulk: true,
        canViewKanban: true,
        canManageConnection: true,
        canManageUsers: true,
        canViewSettings: true,
      };
    }

    // Return user's permissions or defaults based on role
    return user.permissions || DEFAULT_PERMISSIONS[user.role as Exclude<UserRole, "SUPER_USER">];
  }, [user]);

  // Check if user has a specific permission
  const checkPermission = useCallback((permission: keyof UserPermissions): boolean => {
    return hasPermission(permission);
  }, [hasPermission]);

  // Check if user can access a specific route based on permission
  const canAccessRoute = useCallback((requiredPermission?: keyof UserPermissions): boolean => {
    if (!user) return false;
    if (user.role === "SUPER_USER") return true;
    if (user.role === "CLIENT_ADMIN") return true;
    if (!requiredPermission) return true;
    
    return checkPermission(requiredPermission);
  }, [user, checkPermission]);

  // Get user role display name
  const getRoleDisplayName = useCallback((role?: UserRole): string => {
    const roleNames: Record<UserRole, string> = {
      SUPER_USER: "Super Usuário",
      CLIENT_ADMIN: "Administrador",
      CLIENT_MANAGER: "Gerente",
      CLIENT_AGENT: "Agente",
      CLIENT_VIEWER: "Visualizador",
    };
    return roleNames[role || user?.role || "CLIENT_AGENT"];
  }, [user?.role]);

  // Check if user is company admin
  const isCompanyAdmin = useCallback((): boolean => {
    return user?.role === "CLIENT_ADMIN";
  }, [user?.role]);

  // Check if user is at least a manager
  const isManagerOrAbove = useCallback((): boolean => {
    return user?.role === "SUPER_USER" || 
           user?.role === "CLIENT_ADMIN" || 
           user?.role === "CLIENT_MANAGER";
  }, [user?.role]);

  // Get all permissions list for UI display
  const getPermissionsList = useCallback(() => {
    const permissions: { key: keyof UserPermissions; label: string; description: string }[] = [
      {
        key: "canViewCentral",
        label: "Página Central",
        description: "Acesso à página central do dashboard",
      },
      {
        key: "canViewAttendances",
        label: "Atendimentos",
        description: "Visualizar e gerenciar atendimentos",
      },
      {
        key: "canViewContacts",
        label: "Contatos",
        description: "Visualizar e gerenciar contatos",
      },
      {
        key: "canSendBulk",
        label: "Disparo em Bulk",
        description: "Enviar mensagens em massa",
      },
      {
        key: "canViewKanban",
        label: "Kanban",
        description: "Acesso ao pipeline Kanban",
      },
      {
        key: "canManageConnection",
        label: "Canal de Conexão",
        description: "Configurar canais de comunicação",
      },
      {
        key: "canManageUsers",
        label: "Gerenciar Usuários",
        description: "Criar e editar usuários da empresa",
      },
      {
        key: "canViewSettings",
        label: "Configurações",
        description: "Acesso às configurações do sistema",
      },
    ];

    return permissions;
  }, []);

  return {
    // User info
    user,
    userRole: user?.role,
    isSuperUser: isSuperUser,
    isCompanyAdmin,
    isManagerOrAbove,
    canManageUsers: checkCanManageUsers,
    
    // Permissions
    permissions: getEffectivePermissions(),
    hasPermission: checkPermission,
    canAccessRoute,
    
    // Utilities
    getRoleDisplayName,
    getPermissionsList,
  };
}
