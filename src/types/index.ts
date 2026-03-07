// User roles in the system - Aligned with PostgreSQL enum
export type UserRole = "SUPER_USER" | "CLIENT_ADMIN" | "CLIENT_MANAGER" | "CLIENT_AGENT" | "CLIENT_VIEWER";

// User permissions interface for granular access control
export interface UserPermissions {
  canViewCentral: boolean;        // Página Central
  canViewAttendances: boolean;    // Atendimentos
  canViewContacts: boolean;       // Contatos
  canSendBulk: boolean;           // Disparo em Bulk
  canViewKanban: boolean;         // Kanban
  canManageConnection: boolean;   // Canal de Conexão
  canManageUsers: boolean;        // Usuários
  canViewSettings: boolean;       // Configurações
}

// Default permissions by role
export const DEFAULT_PERMISSIONS: Record<Exclude<UserRole, "SUPER_USER">, UserPermissions> = {
  CLIENT_ADMIN: {
    canViewCentral: true,
    canViewAttendances: true,
    canViewContacts: true,
    canSendBulk: true,
    canViewKanban: true,
    canManageConnection: true,
    canManageUsers: true,
    canViewSettings: true,
  },
  CLIENT_MANAGER: {
    canViewCentral: true,
    canViewAttendances: true,
    canViewContacts: true,
    canSendBulk: false,
    canViewKanban: true,
    canManageConnection: false,
    canManageUsers: false,
    canViewSettings: true,
  },
  CLIENT_AGENT: {
    canViewCentral: true,
    canViewAttendances: true,
    canViewContacts: true,
    canSendBulk: false,
    canViewKanban: false,
    canManageConnection: false,
    canManageUsers: false,
    canViewSettings: true,
  },
  CLIENT_VIEWER: {
    canViewCentral: true,
    canViewAttendances: true,
    canViewContacts: true,
    canSendBulk: false,
    canViewKanban: false,
    canManageConnection: false,
    canManageUsers: false,
    canViewSettings: false,
  },
};

// Base user interface
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  companyId?: string;
  companyName?: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
  permissions?: UserPermissions; // Only for non-super users
}

// Super User specific interface
export interface SuperUser extends User {
  role: "SUPER_USER";
  canManagePlans: boolean;
  canManageCompanies: boolean;
  canManageAllUsers: boolean;
  canConfigureApi: boolean;
}

// Regular user (Client Admin, Manager, Agent) interface
export interface RegularUser extends User {
  role: "CLIENT_ADMIN" | "CLIENT_MANAGER" | "CLIENT_AGENT";
  companyId: string;
  department?: string;
  permissions: UserPermissions;
}

// Navigation item for sidebar
export interface NavItem {
  href: string;
  label: string;
  icon: string;
  children?: NavItem[];
  requiredRole?: UserRole[];
  requiredPermission?: keyof UserPermissions;
}

// Super User Navigation Items
export const SUPER_USER_NAV_ITEMS: NavItem[] = [
  { href: "/super/plans", label: "Planos", icon: "CreditCard" },
  { href: "/super/companies", label: "Empresas", icon: "Building2" },
  { href: "/super/company-users", label: "Usuários Cadastrados das Empresas", icon: "Users" },
  { href: "/super/api-waba", label: "Canal de Conexão", icon: "Webhook" },
  { href: "/super/settings", label: "Configurações", icon: "Settings" },
];

// Client/Company Navigation Items with required permissions
export const CLIENT_NAV_ITEMS: NavItem[] = [
  { href: "/app/central", label: "Página Central", icon: "LayoutDashboard", requiredPermission: "canViewCentral" },
  { href: "/app/attendances", label: "Atendimentos", icon: "MessageSquare", requiredPermission: "canViewAttendances" },
  { href: "/app/contacts", label: "Contatos", icon: "Contact", requiredPermission: "canViewContacts" },
  { href: "/app/bulk", label: "Disparo em Bulk", icon: "Send", requiredPermission: "canSendBulk" },
  { href: "/app/kanban", label: "Kanban", icon: "Kanban", requiredPermission: "canViewKanban" },
  { href: "/app/connection", label: "Canal de Conexão", icon: "Plug", requiredPermission: "canManageConnection" },
  { href: "/app/users", label: "Usuários", icon: "Users", requiredPermission: "canManageUsers" },
];

// Client bottom navigation items
export const CLIENT_BOTTOM_NAV_ITEMS: NavItem[] = [
  { href: "/app/settings", label: "Configurações", icon: "Settings", requiredPermission: "canViewSettings" },
];

// Company interface
export interface Company {
  id: string;
  name: string;
  cnpj: string;
  email: string;
  phone: string;
  address?: string;
  plan: PlanType;
  isActive: boolean;
  maxUsers: number;
  currentUsers: number;
  createdAt: string;
  expiresAt?: string;
}

// Plan types
export type PlanType = "basic" | "professional" | "enterprise" | "custom";

// Plan interface
export interface Plan {
  id: string;
  name: string;
  type: PlanType;
  price: number;
  description: string;
  features: string[];
  maxUsers: number;
  maxAttendances: number;
  hasApiAccess: boolean;
  hasBulkMessaging: boolean;
  hasAdvancedAnalytics: boolean;
}

// API WABA Configuration
export interface WabaConfig {
  id: string;
  companyId: string;
  phoneNumberId: string;
  businessAccountId: string;
  accessToken: string;
  webhookUrl: string;
  isActive: boolean;
  createdAt: string;
}

// Connection status
export interface ConnectionStatus {
  isOnline: boolean;
  lastConnectedAt?: string;
  qrCode?: string;
  status: "connected" | "disconnected" | "connecting";
}

// User with company details (for admin management)
export interface UserWithCompany extends User {
  company: {
    id: string;
    name: string;
  };
}

// Permission change log entry
export interface PermissionChangeLog {
  id: string;
  userId: string;
  changedBy: string;
  oldPermissions: UserPermissions;
  newPermissions: UserPermissions;
  changedAt: string;
}
