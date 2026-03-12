"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Search,
  User,
  Phone,
  Mail,
  Clock,
  MessageSquare,
  ArrowLeft,
  Plus,
  MoreVertical,
  Filter,
  Grid3X3,
  List,
  Edit3,
  Trash2,
  History,
  Check,
  AlertTriangle,
  Smartphone,
  Building2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Dialog, DialogFooter, DialogContent } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Types
interface Contact {
  id: string;
  name: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  avatar?: string;
  tags?: string[];
  sector?: string;
  status: "active" | "inactive";
  last_contact?: string;
  created_at: string;
  updated_at: string;
  is_online?: boolean;
  has_conversation_history?: boolean;
}

interface ContactsViewProps {
  isDarkMode: boolean;
  onBack: () => void;
  onStartConversation?: (contactId: string) => void;
}

interface ContactFormData {
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  sector: string;
  tags: string[];
  status: "active" | "inactive";
}

// Mock data for demonstration
const mockContacts: Contact[] = [
  {
    id: "1",
    name: "João Silva Santos",
    phone: "(11) 3456-7890",
    whatsapp: "(11) 99999-8888",
    email: "joao.silva@empresa.com",
    avatar: "",
    tags: ["Cliente", "VIP", "Suporte"],
    sector: "Vendas",
    status: "active",
    last_contact: "2026-03-12T10:30:00Z",
    created_at: "2026-01-15T08:00:00Z",
    updated_at: "2026-03-12T10:30:00Z",
    is_online: true,
    has_conversation_history: true,
  },
  {
    id: "2",
    name: "Maria Oliveira Costa",
    phone: "(11) 3456-7891",
    whatsapp: "(11) 98888-7777",
    email: "maria.costa@email.com",
    avatar: "",
    tags: ["Lead", "Marketing"],
    sector: "Marketing",
    status: "active",
    last_contact: "2026-03-11T15:45:00Z",
    created_at: "2026-02-01T09:00:00Z",
    updated_at: "2026-03-11T15:45:00Z",
    is_online: false,
    has_conversation_history: true,
  },
  {
    id: "3",
    name: "Pedro Henrique Lima",
    phone: "(21) 2345-6789",
    whatsapp: "(21) 97777-6666",
    email: "pedro.lima@empresa.com.br",
    avatar: "",
    tags: ["Parceiro"],
    sector: "Financeiro",
    status: "inactive",
    last_contact: "2026-02-28T11:20:00Z",
    created_at: "2026-01-20T10:00:00Z",
    updated_at: "2026-02-28T11:20:00Z",
    is_online: false,
    has_conversation_history: false,
  },
  {
    id: "4",
    name: "Ana Carolina Ferreira",
    phone: "(31) 3456-7892",
    whatsapp: "(31) 96666-5555",
    email: "ana.ferreira@contato.com",
    avatar: "",
    tags: ["Cliente", "Premium"],
    sector: "Suporte",
    status: "active",
    last_contact: "2026-03-10T09:15:00Z",
    created_at: "2026-01-25T11:00:00Z",
    updated_at: "2026-03-10T09:15:00Z",
    is_online: true,
    has_conversation_history: true,
  },
  {
    id: "5",
    name: "Carlos Eduardo Souza",
    phone: "(41) 3456-7893",
    whatsapp: "(41) 95555-4444",
    email: "carlos.souza@parceiro.com",
    avatar: "",
    tags: ["Fornecedor"],
    sector: "Compras",
    status: "active",
    last_contact: "2026-03-08T14:30:00Z",
    created_at: "2026-02-05T08:30:00Z",
    updated_at: "2026-03-08T14:30:00Z",
    is_online: false,
    has_conversation_history: true,
  },
];

const availableTags = ["Cliente", "VIP", "Suporte", "Lead", "Marketing", "Parceiro", "Premium", "Fornecedor"];
const availableSectors = ["Vendas", "Marketing", "Suporte", "Financeiro", "Compras", "TI", "RH"];

export function ContactsView({ isDarkMode, onBack, onStartConversation }: ContactsViewProps) {
  // State
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [sectorFilter, setSectorFilter] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    phone: "",
    whatsapp: "",
    email: "",
    sector: "",
    tags: [],
    status: "active",
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load contacts
  useEffect(() => {
    loadContacts();
  }, []);

  async function loadContacts() {
    try {
      setLoading(true);
      setTimeout(() => {
        setContacts(mockContacts);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error("Error loading contacts:", error);
      toast.error("Erro ao carregar contatos");
      setLoading(false);
    }
  }

  // Filter and search logic
  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase().trim();
      const matchesSearch =
        searchLower === "" ||
        contact.name.toLowerCase().includes(searchLower) ||
        contact.phone.includes(searchQuery) ||
        (contact.whatsapp && contact.whatsapp.includes(searchQuery)) ||
        (contact.email && contact.email.toLowerCase().includes(searchLower));

      // Status filter
      const matchesStatus = statusFilter === "all" || contact.status === statusFilter;

      // Tag filter
      const matchesTag =
        tagFilter.length === 0 || tagFilter.some((tag) => contact.tags?.includes(tag));

      // Sector filter
      const matchesSector =
        sectorFilter.length === 0 || sectorFilter.includes(contact.sector || "");

      // Date filter
      let matchesDate = true;
      if (dateFilter !== "all" && contact.last_contact) {
        const lastContact = new Date(contact.last_contact);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (dateFilter) {
          case "today":
            matchesDate = diffDays === 0;
            break;
          case "week":
            matchesDate = diffDays <= 7;
            break;
          case "month":
            matchesDate = diffDays <= 30;
            break;
        }
      }

      return matchesSearch && matchesStatus && matchesTag && matchesSector && matchesDate;
    });
  }, [contacts, searchQuery, statusFilter, tagFilter, sectorFilter, dateFilter]);

  // Form validation
  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof ContactFormData, string>> = {};

    if (!formData.name.trim()) {
      errors.name = "Nome é obrigatório";
    }

    if (!formData.phone.trim()) {
      errors.phone = "Telefone é obrigatório";
    } else if (!/^(\(\d{2}\)\s?)?\d{4,5}-?\d{4}$/.test(formData.phone.replace(/\s/g, ""))) {
      errors.phone = "Formato de telefone inválido";
    }

    if (formData.whatsapp && !/^(\(\d{2}\)\s?)?\d{4,5}-?\d{4}$/.test(formData.whatsapp.replace(/\s/g, ""))) {
      errors.whatsapp = "Formato de WhatsApp inválido";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Email inválido";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form handlers
  const handleOpenAddModal = () => {
    setEditingContact(null);
    setFormData({
      name: "",
      phone: "",
      whatsapp: "",
      email: "",
      sector: "",
      tags: [],
      status: "active",
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      phone: contact.phone,
      whatsapp: contact.whatsapp || "",
      email: contact.email || "",
      sector: contact.sector || "",
      tags: contact.tags || [],
      status: contact.status,
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const handleSubmitForm = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (editingContact) {
        setContacts((prev) =>
          prev.map((c) =>
            c.id === editingContact.id
              ? {
                  ...c,
                  ...formData,
                  updated_at: new Date().toISOString(),
                }
              : c
          )
        );
        toast.success("Contato atualizado com sucesso!");
      } else {
        const newContact: Contact = {
          id: `new-${Date.now()}`,
          ...formData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          has_conversation_history: false,
        };
        setContacts((prev) => [...prev, newContact]);
        toast.success("Contato adicionado com sucesso!");
      }
      setIsFormModalOpen(false);
    } catch (error) {
      toast.error("Erro ao salvar contato");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteContact = async () => {
    if (!contactToDelete) return;

    try {
      setContacts((prev) => prev.filter((c) => c.id !== contactToDelete.id));
      toast.success("Contato excluído com sucesso!");
      setIsDeleteModalOpen(false);
      setContactToDelete(null);
    } catch (error) {
      toast.error("Erro ao excluir contato");
    }
  };

  const handleViewHistory = (contact: Contact) => {
    setSelectedContact(contact);
    setIsHistoryModalOpen(true);
  };

  const handleConfirmDelete = (contact: Contact) => {
    setContactToDelete(contact);
    setIsDeleteModalOpen(true);
  };

  // Helper functions
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Nunca";
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hoje";
    if (diffDays === 1) return "Ontem";
    if (diffDays < 7) return `${diffDays} dias atrás`;
    return date.toLocaleDateString("pt-BR");
  };

  const toggleTag = (tag: string) => {
    setTagFilter((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const toggleSector = (sector: string) => {
    setSectorFilter((prev) =>
      prev.includes(sector) ? prev.filter((s) => s !== sector) : [...prev, sector]
    );
  };

  // Loading state
  if (loading) {
    return (
      <div
        className={cn(
          "flex-1 flex flex-col h-full",
          isDarkMode ? "bg-[#0b141a]" : "bg-gray-50"
        )}
      >
        <div className={cn("p-4 border-b", isDarkMode ? "border-[#2a2a2a]" : "border-gray-200")}>
          <Skeleton className="h-10 w-full max-w-md" />
        </div>
        <div className="flex-1 p-4 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex-1 flex flex-col h-full overflow-hidden",
        isDarkMode ? "bg-[#0b141a]" : "bg-gray-50"
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center justify-between p-4 border-b",
          isDarkMode ? "bg-[#1f2c33] border-[#2a2a2a]" : "bg-white border-gray-200"
        )}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className={cn(
              "p-2 rounded-full transition-colors",
              isDarkMode
                ? "text-[#aebac1] hover:bg-[#2a3942]"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2
              className={cn(
                "font-semibold text-lg",
                isDarkMode ? "text-[#e9edef]" : "text-gray-900"
              )}
            >
              Contatos
            </h2>
            <p
              className={cn(
                "text-sm",
                isDarkMode ? "text-[#8696a0]" : "text-gray-500"
              )}
            >
              {filteredContacts.length} de {contacts.length} contatos
            </p>
          </div>
        </div>
        <Button
          onClick={handleOpenAddModal}
          className="bg-[#00a884] hover:bg-[#008f72] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Contato
        </Button>
      </div>

      {/* Search and Filters Bar */}
      <div
        className={cn(
          "p-4 border-b",
          isDarkMode ? "bg-[#1f2c33] border-[#2a2a2a]" : "bg-white border-gray-200"
        )}
      >
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5",
                isDarkMode ? "text-[#8696a0]" : "text-gray-400"
              )}
            />
            <Input
              placeholder="Buscar por nome, telefone ou WhatsApp..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "pl-10",
                isDarkMode
                  ? "bg-[#2a3942] border-[#2a3942] text-[#e9edef] placeholder:text-[#8696a0]"
                  : "bg-gray-100 border-gray-200"
              )}
            />
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
                showFilters
                  ? "bg-[#00a884] text-white"
                  : isDarkMode
                  ? "bg-[#2a3942] text-[#aebac1] hover:bg-[#374045]"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              <Filter className="w-4 h-4" />
              Filtros
              {(tagFilter.length > 0 || sectorFilter.length > 0 || statusFilter !== "all" || dateFilter !== "all") && (
                <Badge className="ml-1 bg-white text-[#00a884]">
                  {tagFilter.length + sectorFilter.length + (statusFilter !== "all" ? 1 : 0) + (dateFilter !== "all" ? 1 : 0)}
                </Badge>
              )}
            </button>

            <div
              className={cn(
                "flex rounded-lg overflow-hidden",
                isDarkMode ? "bg-[#2a3942]" : "bg-gray-100"
              )}
            >
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === "grid"
                    ? "bg-[#00a884] text-white"
                    : isDarkMode
                    ? "text-[#8696a0] hover:text-[#aebac1]"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === "list"
                    ? "bg-[#00a884] text-white"
                    : isDarkMode
                    ? "text-[#8696a0] hover:text-[#aebac1]"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-4 border-t border-dashed border-[#2a2a2a]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Status Filter */}
                  <div>
                    <Label
                      className={cn(
                        "text-xs mb-2 block",
                        isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                      )}
                    >
                      Status
                    </Label>
                    <div className="flex gap-2">
                      {(["all", "active", "inactive"] as const).map((status) => (
                        <button
                          key={status}
                          onClick={() => setStatusFilter(status)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-sm transition-colors",
                            statusFilter === status
                              ? "bg-[#00a884] text-white"
                              : isDarkMode
                              ? "bg-[#2a3942] text-[#aebac1] hover:bg-[#374045]"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          )}
                        >
                          {status === "all" ? "Todos" : status === "active" ? "Ativos" : "Inativos"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date Filter */}
                  <div>
                    <Label
                      className={cn(
                        "text-xs mb-2 block",
                        isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                      )}
                    >
                      Último Contato
                    </Label>
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value as typeof dateFilter)}
                      className={cn(
                        "w-full px-3 py-1.5 rounded-lg text-sm",
                        isDarkMode
                          ? "bg-[#2a3942] text-[#e9edef] border-[#2a3942]"
                          : "bg-gray-100 text-gray-700 border-gray-200"
                      )}
                    >
                      <option value="all">Qualquer data</option>
                      <option value="today">Hoje</option>
                      <option value="week">Última semana</option>
                      <option value="month">Último mês</option>
                    </select>
                  </div>

                  {/* Sector Filter */}
                  <div>
                    <Label
                      className={cn(
                        "text-xs mb-2 block",
                        isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                      )}
                    >
                      Setores
                    </Label>
                    <div className="flex flex-wrap gap-1">
                      {availableSectors.map((sector) => (
                        <button
                          key={sector}
                          onClick={() => toggleSector(sector)}
                          className={cn(
                            "px-2 py-1 rounded-full text-xs transition-colors",
                            sectorFilter.includes(sector)
                              ? "bg-[#00a884] text-white"
                              : isDarkMode
                              ? "bg-[#2a3942] text-[#aebac1] hover:bg-[#374045]"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          )}
                        >
                          {sector}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tag Filter */}
                  <div>
                    <Label
                      className={cn(
                        "text-xs mb-2 block",
                        isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                      )}
                    >
                      Tags
                    </Label>
                    <div className="flex flex-wrap gap-1">
                      {availableTags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={cn(
                            "px-2 py-1 rounded-full text-xs transition-colors",
                            tagFilter.includes(tag)
                              ? "bg-[#00a884] text-white"
                              : isDarkMode
                              ? "bg-[#2a3942] text-[#aebac1] hover:bg-[#374045]"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          )}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Clear Filters */}
                {(tagFilter.length > 0 || sectorFilter.length > 0 || statusFilter !== "all" || dateFilter !== "all") && (
                  <button
                    onClick={() => {
                      setStatusFilter("all");
                      setTagFilter([]);
                      setSectorFilter([]);
                      setDateFilter("all");
                    }}
                    className="mt-4 text-sm text-[#00a884] hover:underline"
                  >
                    Limpar todos os filtros
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Contacts Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <User
              className={cn(
                "w-16 h-16 mb-4",
                isDarkMode ? "text-[#374045]" : "text-gray-300"
              )}
            />
            <p
              className={cn(
                "text-lg font-medium mb-2",
                isDarkMode ? "text-[#e9edef]" : "text-gray-900"
              )}
            >
              Nenhum contato encontrado
            </p>
            <p
              className={cn(
                "text-sm",
                isDarkMode ? "text-[#8696a0]" : "text-gray-500"
              )}
            >
              Tente ajustar os filtros ou adicione um novo contato
            </p>
          </div>
        ) : viewMode === "grid" ? (
          // Grid View
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredContacts.map((contact, index) => (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "relative rounded-xl p-4 transition-all",
                  isDarkMode
                    ? "bg-[#1f2c33] border border-[#2a2a2a] hover:border-[#00a884]/50"
                    : "bg-white border border-gray-200 hover:border-[#00a884]/50 shadow-sm"
                )}
              >
                {/* Status Indicator */}
                <div className="absolute top-4 right-4">
                  <div
                    className={cn(
                      "w-2.5 h-2.5 rounded-full",
                      contact.status === "active" ? "bg-emerald-500" : "bg-gray-400"
                    )}
                    title={contact.status === "active" ? "Ativo" : "Inativo"}
                  />
                </div>

                {/* Header */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="relative">
                    <div
                      className={cn(
                        "w-14 h-14 rounded-full flex items-center justify-center text-white font-semibold text-lg",
                        contact.avatar
                          ? ""
                          : "bg-gradient-to-br from-[#00a884] to-[#005c4b]"
                      )}
                    >
                      {contact.avatar ? (
                        <img
                          src={contact.avatar}
                          alt={contact.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        getInitials(contact.name)
                      )}
                    </div>
                    {contact.is_online && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#1f2c33]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className={cn(
                        "font-semibold truncate",
                        isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                      )}
                    >
                      {contact.name}
                    </h3>
                    {contact.sector && (
                      <p
                        className={cn(
                          "text-sm flex items-center gap-1",
                          isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                        )}
                      >
                        <Building2 className="w-3 h-3" />
                        {contact.sector}
                      </p>
                    )}
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 mb-4">
                  {contact.whatsapp && (
                    <div
                      className={cn(
                        "flex items-center gap-2 text-sm",
                        isDarkMode ? "text-[#aebac1]" : "text-gray-600"
                      )}
                    >
                      <Smartphone className="w-4 h-4 text-[#00a884]" />
                      <span>{contact.whatsapp}</span>
                      {contact.is_online && (
                        <span className="text-xs text-emerald-500 font-medium">
                          online
                        </span>
                      )}
                    </div>
                  )}
                  <div
                    className={cn(
                      "flex items-center gap-2 text-sm",
                      isDarkMode ? "text-[#aebac1]" : "text-gray-600"
                    )}
                  >
                    <Phone className="w-4 h-4" />
                    <span>{contact.phone}</span>
                  </div>
                  {contact.email && (
                    <div
                      className={cn(
                        "flex items-center gap-2 text-sm",
                        isDarkMode ? "text-[#aebac1]" : "text-gray-600"
                      )}
                    >
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{contact.email}</span>
                    </div>
                  )}
                  <div
                    className={cn(
                      "flex items-center gap-2 text-sm",
                      isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                    )}
                  >
                    <Clock className="w-4 h-4" />
                    <span>Último contato: {formatDate(contact.last_contact)}</span>
                  </div>
                </div>

                {/* Tags */}
                {contact.tags && contact.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {contact.tags.map((tag) => (
                      <span
                        key={tag}
                        className={cn(
                          "px-2 py-0.5 rounded-full text-xs",
                          isDarkMode
                            ? "bg-[#2a3942] text-[#aebac1]"
                            : "bg-gray-100 text-gray-600"
                        )}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-dashed border-[#2a2a2a]">
                  {onStartConversation && (
                    <Button
                      size="sm"
                      onClick={() => onStartConversation(contact.id)}
                      className="flex-1 bg-[#00a884] hover:bg-[#008f72] text-white"
                    >
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Conversar
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <Button
                        size="sm"
                        variant="ghost"
                        className={cn(
                          isDarkMode
                            ? "text-[#aebac1] hover:bg-[#2a3942]"
                            : "text-gray-600 hover:bg-gray-100"
                        )}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className={cn(
                        isDarkMode
                          ? "bg-[#1f2c33] border-[#2a2a2a] text-[#e9edef]"
                          : "bg-white border-gray-200"
                      )}
                    >
                      <DropdownMenuItem
                        onClick={() => handleOpenEditModal(contact)}
                        className={cn(
                          isDarkMode
                            ? "text-[#e9edef] focus:bg-[#2a3942] focus:text-[#e9edef]"
                            : ""
                        )}
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      {contact.has_conversation_history && (
                        <DropdownMenuItem
                          onClick={() => handleViewHistory(contact)}
                          className={cn(
                            isDarkMode
                              ? "text-[#e9edef] focus:bg-[#2a3942] focus:text-[#e9edef]"
                              : ""
                          )}
                        >
                          <History className="w-4 h-4 mr-2" />
                          Ver Histórico
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator
                        className={isDarkMode ? "bg-[#2a2a2a]" : ""}
                      />
                      <DropdownMenuItem
                        onClick={() => handleConfirmDelete(contact)}
                        className="text-red-500 focus:text-red-500"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          // List View
          <div className="space-y-2">
            {filteredContacts.map((contact, index) => (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className={cn(
                  "flex items-center gap-4 p-3 rounded-xl transition-all",
                  isDarkMode
                    ? "bg-[#1f2c33] border border-[#2a2a2a] hover:border-[#00a884]/50"
                    : "bg-white border border-gray-200 hover:border-[#00a884]/50 shadow-sm"
                )}
              >
                {/* Avatar */}
                <div className="relative">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center text-white font-medium",
                      contact.avatar
                        ? ""
                        : "bg-gradient-to-br from-[#00a884] to-[#005c4b]"
                    )}
                  >
                    {contact.avatar ? (
                      <img
                        src={contact.avatar}
                        alt={contact.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      getInitials(contact.name)
                    )}
                  </div>
                  {contact.is_online && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#1f2c33]" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3
                      className={cn(
                        "font-medium",
                        isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                      )}
                    >
                      {contact.name}
                    </h3>
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        contact.status === "active" ? "bg-emerald-500" : "bg-gray-400"
                      )}
                    />
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    {contact.whatsapp && (
                      <span
                        className={cn(
                          "text-sm flex items-center gap-1",
                          isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                        )}
                      >
                        <Smartphone className="w-3 h-3 text-[#00a884]" />
                        {contact.whatsapp}
                      </span>
                    )}
                    <span
                      className={cn(
                        "text-sm flex items-center gap-1",
                        isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                      )}
                    >
                      <Phone className="w-3 h-3" />
                      {contact.phone}
                    </span>
                    {contact.sector && (
                      <span
                        className={cn(
                          "text-sm hidden lg:flex items-center gap-1",
                          isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                        )}
                      >
                        <Building2 className="w-3 h-3" />
                        {contact.sector}
                      </span>
                    )}
                  </div>
                </div>

                {/* Tags */}
                <div className="hidden md:flex items-center gap-1">
                  {contact.tags?.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className={cn(
                        "px-2 py-0.5 rounded-full text-xs",
                        isDarkMode
                          ? "bg-[#2a3942] text-[#aebac1]"
                          : "bg-gray-100 text-gray-600"
                      )}
                    >
                      {tag}
                    </span>
                  ))}
                  {contact.tags && contact.tags.length > 2 && (
                    <span
                      className={cn(
                        "text-xs",
                        isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                      )}
                    >
                      +{contact.tags.length - 2}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {onStartConversation && (
                    <Button
                      size="sm"
                      onClick={() => onStartConversation(contact.id)}
                      className="bg-[#00a884] hover:bg-[#008f72] text-white"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpenEditModal(contact)}
                    className={cn(
                      isDarkMode
                        ? "text-[#aebac1] hover:bg-[#2a3942]"
                        : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  {contact.has_conversation_history && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleViewHistory(contact)}
                      className={cn(
                        isDarkMode
                          ? "text-[#aebac1] hover:bg-[#2a3942]"
                          : "text-gray-600 hover:bg-gray-100"
                      )}
                    >
                      <History className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleConfirmDelete(contact)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Contact Modal */}
      <Dialog
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        maxWidth="lg"
        title={editingContact ? "Editar Contato" : "Novo Contato"}
        description={editingContact ? "Atualize as informações do contato" : "Preencha os dados para adicionar um novo contato"}
      >
        <DialogContent>
          <div className="space-y-4">
            {/* Name */}
            <div>
              <Label
                htmlFor="name"
                className={cn(
                  isDarkMode ? "text-[#aebac1]" : "text-gray-700"
                )}
              >
                Nome Completo *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Ex: João Silva"
                className={cn(
                  "mt-1",
                  isDarkMode
                    ? "bg-[#2a3942] border-[#2a3942] text-[#e9edef] placeholder:text-[#8696a0]"
                    : "bg-gray-50 border-gray-200"
                )}
              />
              {formErrors.name && (
                <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
              )}
            </div>

            {/* Phone and WhatsApp */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="phone"
                  className={cn(
                    isDarkMode ? "text-[#aebac1]" : "text-gray-700"
                  )}
                >
                  Telefone *
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="(11) 3456-7890"
                  className={cn(
                    "mt-1",
                    isDarkMode
                      ? "bg-[#2a3942] border-[#2a3942] text-[#e9edef] placeholder:text-[#8696a0]"
                      : "bg-gray-50 border-gray-200"
                  )}
                />
                {formErrors.phone && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>
                )}
              </div>
              <div>
                <Label
                  htmlFor="whatsapp"
                  className={cn(
                    isDarkMode ? "text-[#aebac1]" : "text-gray-700"
                  )}
                >
                  WhatsApp
                </Label>
                <Input
                  id="whatsapp"
                  value={formData.whatsapp}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, whatsapp: e.target.value }))
                  }
                  placeholder="(11) 99999-8888"
                  className={cn(
                    "mt-1",
                    isDarkMode
                      ? "bg-[#2a3942] border-[#2a3942] text-[#e9edef] placeholder:text-[#8696a0]"
                      : "bg-gray-50 border-gray-200"
                  )}
                />
                {formErrors.whatsapp && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.whatsapp}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <Label
                htmlFor="email"
                className={cn(
                  isDarkMode ? "text-[#aebac1]" : "text-gray-700"
                )}
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="email@exemplo.com"
                className={cn(
                  "mt-1",
                  isDarkMode
                    ? "bg-[#2a3942] border-[#2a3942] text-[#e9edef] placeholder:text-[#8696a0]"
                    : "bg-gray-50 border-gray-200"
                )}
              />
              {formErrors.email && (
                <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
              )}
            </div>

            {/* Sector */}
            <div>
              <Label
                htmlFor="sector"
                className={cn(
                  isDarkMode ? "text-[#aebac1]" : "text-gray-700"
                )}
              >
                Setor
              </Label>
              <select
                id="sector"
                value={formData.sector}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, sector: e.target.value }))
                }
                className={cn(
                  "w-full mt-1 px-3 py-2 rounded-md text-sm",
                  isDarkMode
                    ? "bg-[#2a3942] border border-[#2a3942] text-[#e9edef]"
                    : "bg-gray-50 border border-gray-200 text-gray-700"
                )}
              >
                <option value="">Selecione um setor</option>
                {availableSectors.map((sector) => (
                  <option key={sector} value={sector}>
                    {sector}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div>
              <Label
                className={cn(
                  isDarkMode ? "text-[#aebac1]" : "text-gray-700"
                )}
              >
                Tags
              </Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        tags: prev.tags.includes(tag)
                          ? prev.tags.filter((t) => t !== tag)
                          : [...prev.tags, tag],
                      }))
                    }
                    className={cn(
                      "px-3 py-1 rounded-full text-sm transition-colors",
                      formData.tags.includes(tag)
                        ? "bg-[#00a884] text-white"
                        : isDarkMode
                        ? "bg-[#2a3942] text-[#aebac1] hover:bg-[#374045]"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    {formData.tags.includes(tag) && (
                      <Check className="w-3 h-3 inline mr-1" />
                    )}
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Status */}
            <div>
              <Label
                className={cn(
                  isDarkMode ? "text-[#aebac1]" : "text-gray-700"
                )}
              >
                Status
              </Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="active"
                    checked={formData.status === "active"}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        status: e.target.value as "active" | "inactive",
                      }))
                    }
                    className="accent-[#00a884]"
                  />
                  <span
                    className={cn(
                      isDarkMode ? "text-[#e9edef]" : "text-gray-700"
                    )}
                  >
                    Ativo
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="inactive"
                    checked={formData.status === "inactive"}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        status: e.target.value as "active" | "inactive",
                      }))
                    }
                    className="accent-[#00a884]"
                  />
                  <span
                    className={cn(
                      isDarkMode ? "text-[#e9edef]" : "text-gray-700"
                    )}
                  >
                    Inativo
                  </span>
                </label>
              </div>
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsFormModalOpen(false)}
            className={cn(
              isDarkMode
                ? "border-[#2a3942] text-[#e9edef] hover:bg-[#2a3942]"
                : ""
            )}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmitForm}
            disabled={isSubmitting}
            className="bg-[#00a884] hover:bg-[#008f72] text-white"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Salvando...
              </>
            ) : editingContact ? (
              "Salvar Alterações"
            ) : (
              "Adicionar Contato"
            )}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        maxWidth="md"
        title="Confirmar Exclusão"
      >
        <DialogContent>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-500/10 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className={cn(
                isDarkMode ? "text-[#e9edef]" : "text-gray-900"
              )}>
                Tem certeza que deseja excluir o contato{" "}
                <strong>{contactToDelete?.name}</strong>?
              </p>
              <p className={cn(
                "text-sm mt-1",
                isDarkMode ? "text-[#8696a0]" : "text-gray-500"
              )}>
                Esta ação não pode ser desfeita.
              </p>
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsDeleteModalOpen(false)}
            className={cn(
              isDarkMode
                ? "border-[#2a3942] text-[#e9edef] hover:bg-[#2a3942]"
                : ""
            )}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDeleteContact}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir Contato
          </Button>
        </DialogFooter>
      </Dialog>

      {/* History Modal */}
      <Dialog
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        maxWidth="2xl"
        title="Histórico de Conversas"
        description={`Visualize todo o histórico de interações com ${selectedContact?.name}`}
      >
        <DialogContent>
          <div className="space-y-4">
            {/* Contact Info Summary */}
            <div
              className={cn(
                "p-4 rounded-xl",
                isDarkMode ? "bg-[#2a3942]" : "bg-gray-50"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00a884] to-[#005c4b] flex items-center justify-center text-white font-medium">
                  {selectedContact?.name ? getInitials(selectedContact.name) : "?"}
                </div>
                <div>
                  <p
                    className={cn(
                      "font-medium",
                      isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                    )}
                  >
                    {selectedContact?.name}
                  </p>
                  <p
                    className={cn(
                      "text-sm",
                      isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                    )}
                  >
                    {selectedContact?.whatsapp || selectedContact?.phone}
                  </p>
                </div>
              </div>
            </div>

            {/* Mock Conversation History */}
            <div className="space-y-3">
              <h4
                className={cn(
                  "font-medium",
                  isDarkMode ? "text-[#aebac1]" : "text-gray-700"
                )}
              >
                Conversas Recentes
              </h4>
              
              {/* Mock conversation items */}
              {[
                {
                  date: "12/03/2026",
                  time: "10:30",
                  message: "Olá! Gostaria de saber mais sobre os planos disponíveis.",
                  type: "received",
                },
                {
                  date: "12/03/2026",
                  time: "10:35",
                  message: "Claro! Temos várias opções que podem atender suas necessidades. Posso te enviar um catálogo?",
                  type: "sent",
                },
                {
                  date: "12/03/2026",
                  time: "10:40",
                  message: "Perfeito, por favor envie!",
                  type: "received",
                },
                {
                  date: "11/03/2026",
                  time: "15:20",
                  message: "Obrigado pelo atendimento!",
                  type: "received",
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className={cn(
                    "p-3 rounded-lg",
                    isDarkMode ? "bg-[#2a3942]" : "bg-gray-50"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={cn(
                        "text-xs font-medium",
                        item.type === "sent"
                          ? "text-[#00a884]"
                          : isDarkMode
                          ? "text-[#aebac1]"
                          : "text-gray-600"
                      )}
                    >
                      {item.type === "sent" ? "Enviado" : "Recebido"}
                    </span>
                    <span
                      className={cn(
                        "text-xs",
                        isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                      )}
                    >
                      {item.date} às {item.time}
                    </span>
                  </div>
                  <p
                    className={cn(
                      "text-sm",
                      isDarkMode ? "text-[#e9edef]" : "text-gray-700"
                    )}
                  >
                    {item.message}
                  </p>
                </div>
              ))}
            </div>

            {/* Load More */}
            <button
              className={cn(
                "w-full py-2 text-sm text-center rounded-lg transition-colors",
                isDarkMode
                  ? "text-[#00a884] hover:bg-[#2a3942]"
                  : "text-[#00a884] hover:bg-gray-50"
              )}
            >
              Carregar mais conversas...
            </button>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button
            onClick={() => setIsHistoryModalOpen(false)}
            className="bg-[#00a884] hover:bg-[#008f72] text-white"
          >
            Fechar
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
