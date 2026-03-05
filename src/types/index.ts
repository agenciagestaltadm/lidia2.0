// User roles in the system
export type UserRole = "super_user" | "admin" | "manager" | "agent";

// Base user interface
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  companyId?: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

// Super User specific interface
export interface SuperUser extends User {
  role: "super_user";
  canManagePlans: boolean;
  canManageCompanies: boolean;
  canManageAllUsers: boolean;
  canConfigureApi: boolean;
}

// Regular user (Admin, Manager, Agent) interface
export interface RegularUser extends User {
  role: "admin" | "manager" | "agent";
  companyId: string;
  department?: string;
  permissions: UserPermissions;
}

// User permissions
export interface UserPermissions {
  canViewDashboard: boolean;
  canManageAttendances: boolean;
  canManageContacts: boolean;
  canSendBulk: boolean;
  canViewKanban: boolean;
  canViewAnalytics: boolean;
  canManageUsers: boolean;
  canManageSettings: boolean;
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

// Super User Navigation
export const SUPER_USER_NAV_ITEMS: NavItem[] = [
  { href: "/super/plans", label: "Planos do Super Usuário", icon: "CreditCard" },
  { href: "/super/companies", label: "Empresas", icon: "Building2" },
  { href: "/super/company-users", label: "Usuários Cadastrados na Empresa", icon: "Users" },
  { href: "/super/api-waba", label: "API WABA: Canal de Conexão", icon: "Webhook" },
  { href: "/super/settings", label: "Configurações de Tudo", icon: "Settings" },
];

// Client/Agent Navigation
export const CLIENT_NAV_ITEMS: NavItem[] = [
  { href: "/app/central", label: "Página Central", icon: "LayoutDashboard" },
  { href: "/app/attendances", label: "Atendimentos", icon: "MessageSquare" },
  { href: "/app/contacts", label: "Contatos", icon: "Contact" },
  { href: "/app/bulk", label: "Disparo Bulk", icon: "Send" },
  { href: "/app/kanban", label: "Kanban", icon: "Kanban" },
  { href: "/app/connection", label: "Canal de Conexão", icon: "Link" },
  { href: "/app/users", label: "Usuários", icon: "Users" },
  { href: "/app/settings", label: "Configurações", icon: "Settings" },
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
