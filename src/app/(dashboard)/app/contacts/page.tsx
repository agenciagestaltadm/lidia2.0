"use client";

export const dynamic = "force-dynamic";

import { motion, AnimatePresence } from "framer-motion";
import {
  Contact,
  Search,
  Plus,
  Phone,
  Mail,
  Building,
  MoreVertical,
  Filter,
  Edit3,
  Trash2,
  X,
  User,
  Tag,
  FileText,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowBadge } from "@/components/ui/glow-badge";
import { NeonButton } from "@/components/ui/neon-button";
import { AnimatedInput } from "@/components/ui/animated-input";
import { staggerContainer, fadeInUp } from "@/lib/animations";
import { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useContacts,
  useContactStats,
  useContactTags,
  useCreateContact,
  useUpdateContact,
  useDeleteContact,
  useContactsRealtime,
} from "@/hooks/use-contacts";
import type { Contact as ContactType, ContactFormData, ContactStatus, ContactSource } from "@/types/contacts";

// Status config
const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: "Ativo", color: "bg-emerald-500/20 text-emerald-400" },
  inactive: { label: "Inativo", color: "bg-red-500/20 text-red-400" },
  lead: { label: "Lead", color: "bg-amber-500/20 text-amber-400" },
  client: { label: "Cliente", color: "bg-blue-500/20 text-blue-400" },
  prospect: { label: "Prospecto", color: "bg-purple-500/20 text-purple-400" },
};

const tagColors: Record<string, string> = {
  Cliente: "bg-emerald-500/20 text-emerald-400",
  VIP: "bg-purple-500/20 text-purple-400",
  Lead: "bg-amber-500/20 text-amber-400",
  Parceiro: "bg-blue-500/20 text-blue-400",
  Premium: "bg-pink-500/20 text-pink-400",
  Fornecedor: "bg-cyan-500/20 text-cyan-400",
  Suporte: "bg-orange-500/20 text-orange-400",
  Marketing: "bg-violet-500/20 text-violet-400",
};

const defaultFormData: ContactFormData = {
  name: "",
  email: "",
  phone: "",
  company: "",
  tags: [],
  notes: "",
  status: "active",
  source: "manual",
};

export default function ContactsPage() {
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ContactStatus | "all">("all");
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [showFilters, setShowFilters] = useState(false);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactType | null>(null);
  const [contactToDelete, setContactToDelete] = useState<ContactType | null>(null);
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<ContactFormData>(defaultFormData);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({});
  const [tagInput, setTagInput] = useState("");

  // Data hooks
  const filters = useMemo(() => ({
    search: searchQuery || undefined,
    status: statusFilter,
    tags: tagFilter.length > 0 ? tagFilter : undefined,
    dateFilter,
  }), [searchQuery, statusFilter, tagFilter, dateFilter]);

  const { data: contacts = [], isLoading: isLoadingContacts } = useContacts(filters);
  const { data: stats } = useContactStats();
  const { data: availableTags = [] } = useContactTags();
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();

  // Realtime subscription
  useContactsRealtime();

  // Form validation
  const validateForm = useCallback((): boolean => {
    const errors: Partial<Record<keyof ContactFormData, string>> = {};

    if (!formData.name.trim()) {
      errors.name = "Nome é obrigatório";
    } else if (formData.name.trim().length < 2) {
      errors.name = "Nome deve ter pelo menos 2 caracteres";
    }

    if (!formData.phone.trim()) {
      errors.phone = "Telefone é obrigatório";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Email inválido";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // Form handlers
  const handleOpenAddModal = useCallback(() => {
    setEditingContact(null);
    setFormData(defaultFormData);
    setFormErrors({});
    setTagInput("");
    setIsFormModalOpen(true);
  }, []);

  const handleOpenEditModal = useCallback((contact: ContactType) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      email: contact.email || "",
      phone: contact.phone,
      company: contact.company || "",
      tags: contact.tags || [],
      notes: contact.notes || "",
      status: contact.status,
      source: contact.source,
    });
    setFormErrors({});
    setTagInput("");
    setIsFormModalOpen(true);
    setOpenActionMenu(null);
  }, []);

  const handleSubmitForm = useCallback(async () => {
    if (!validateForm()) return;

    try {
      if (editingContact) {
        await updateContact.mutateAsync({ id: editingContact.id, data: formData });
      } else {
        await createContact.mutateAsync(formData);
      }
      setIsFormModalOpen(false);
    } catch {
      // Error is handled by the hook
    }
  }, [validateForm, editingContact, formData, updateContact, createContact]);

  const handleConfirmDelete = useCallback((contact: ContactType) => {
    setContactToDelete(contact);
    setIsDeleteModalOpen(true);
    setOpenActionMenu(null);
  }, []);

  const handleDeleteContact = useCallback(async () => {
    if (!contactToDelete) return;
    try {
      await deleteContact.mutateAsync(contactToDelete.id);
      setIsDeleteModalOpen(false);
      setContactToDelete(null);
    } catch {
      // Error is handled by the hook
    }
  }, [contactToDelete, deleteContact]);

  // Tag management
  const handleAddTag = useCallback(() => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagInput("");
    }
  }, [tagInput, formData.tags]);

  const handleRemoveTag = useCallback((tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  }, []);

  const handleTagKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  }, [handleAddTag]);

  // Toggle tag filter
  const toggleTagFilter = useCallback((tag: string) => {
    setTagFilter((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  // Helper functions
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Nunca";
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hoje";
    if (diffDays === 1) return "Ontem";
    if (diffDays < 7) return `${diffDays} dias atrás`;
    return date.toLocaleDateString("pt-BR");
  };

  const isSubmitting = createContact.isPending || updateContact.isPending;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <GlowBadge variant="green">Contatos</GlowBadge>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold dark:text-white text-slate-900">
            Gerenciamento de Contatos
          </h1>
          <p className="dark:text-slate-400 text-slate-500 mt-1">
            Organize e gerencie seus contatos e clientes
          </p>
        </div>
        <NeonButton variant="green" onClick={handleOpenAddModal}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Contato
        </NeonButton>
      </motion.div>

      {/* Stats */}
      <motion.div
        variants={staggerContainer}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: "Total de Contatos", value: stats?.total ?? 0, icon: Contact },
          { label: "Clientes", value: stats?.clients ?? 0, icon: Building },
          { label: "Leads", value: stats?.leads ?? 0, icon: Filter },
          { label: "Novos Este Mês", value: stats?.newThisMonth ?? 0, icon: Plus },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} variants={fadeInUp} custom={index}>
              <GlassCard className="p-4" glow="green">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg dark:bg-white/5 bg-slate-100">
                    <Icon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="dark:text-slate-400 text-slate-500 text-xs">{stat.label}</p>
                    <p className="text-xl font-bold dark:text-white text-slate-900">{stat.value}</p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Search and Filters */}
      <motion.div variants={fadeInUp}>
        <GlassCard className="p-4" hover={false}>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <AnimatedInput
                  placeholder="Buscar por nome, email, telefone ou empresa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon={<Search className="w-5 h-5 dark:text-slate-400 text-slate-500" />}
                />
              </div>
              <div className="flex gap-2">
                <NeonButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(showFilters && "bg-emerald-500/10 text-emerald-400")}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                  {(statusFilter !== "all" || tagFilter.length > 0 || dateFilter !== "all") && (
                    <Badge className="ml-2 bg-emerald-500 text-white text-xs px-1.5 py-0">
                      {(statusFilter !== "all" ? 1 : 0) + tagFilter.length + (dateFilter !== "all" ? 1 : 0)}
                    </Badge>
                  )}
                </NeonButton>
              </div>
            </div>

            {/* Expanded Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 border-t dark:border-white/10 border-slate-200 space-y-4">
                    {/* Status Filter */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <Label className="dark:text-slate-400 text-slate-500 text-sm mb-2 block">Status</Label>
                        <div className="relative">
                          <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as ContactStatus | "all")}
                            className="w-full px-3 py-2 rounded-lg dark:bg-white/5 bg-slate-100 dark:text-white text-slate-900 border dark:border-white/10 border-slate-200 text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                          >
                            <option value="all">Todos os status</option>
                            <option value="active">Ativo</option>
                            <option value="inactive">Inativo</option>
                            <option value="lead">Lead</option>
                            <option value="client">Cliente</option>
                            <option value="prospect">Prospecto</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-slate-400 text-slate-500 pointer-events-none" />
                        </div>
                      </div>

                      {/* Date Filter */}
                      <div className="flex-1">
                        <Label className="dark:text-slate-400 text-slate-500 text-sm mb-2 block">Último Contato</Label>
                        <div className="relative">
                          <select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value as "all" | "today" | "week" | "month")}
                            className="w-full px-3 py-2 rounded-lg dark:bg-white/5 bg-slate-100 dark:text-white text-slate-900 border dark:border-white/10 border-slate-200 text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                          >
                            <option value="all">Qualquer período</option>
                            <option value="today">Hoje</option>
                            <option value="week">Esta semana</option>
                            <option value="month">Este mês</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-slate-400 text-slate-500 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    {/* Tags Filter */}
                    {availableTags.length > 0 && (
                      <div>
                        <Label className="dark:text-slate-400 text-slate-500 text-sm mb-2 block">Tags</Label>
                        <div className="flex flex-wrap gap-2">
                          {availableTags.map((tag) => (
                            <button
                              key={tag}
                              onClick={() => toggleTagFilter(tag)}
                              className={cn(
                                "text-xs px-3 py-1 rounded-full transition-all border",
                                tagFilter.includes(tag)
                                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                  : "dark:bg-white/5 bg-slate-100 dark:text-slate-400 text-slate-600 dark:border-white/10 border-slate-200 hover:border-emerald-500/30"
                              )}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Clear Filters */}
                    {(statusFilter !== "all" || tagFilter.length > 0 || dateFilter !== "all" || searchQuery) && (
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setStatusFilter("all");
                            setTagFilter([]);
                            setDateFilter("all");
                            setSearchQuery("");
                          }}
                          className="text-slate-500 hover:text-red-400"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Limpar filtros
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </GlassCard>
      </motion.div>

      {/* Contacts Grid */}
      {isLoadingContacts ? (
        <motion.div
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.div key={i} variants={fadeInUp} custom={i}>
              <GlassCard className="p-5" hover={false}>
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
                <div className="flex gap-2 mt-4">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-12 rounded-full" />
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      ) : contacts.length === 0 ? (
        <motion.div variants={fadeInUp}>
          <GlassCard className="p-12 text-center" hover={false}>
            <div className="w-16 h-16 rounded-full dark:bg-white/5 bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Contact className="w-8 h-8 dark:text-slate-500 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium dark:text-white text-slate-900 mb-2">
              Nenhum contato encontrado
            </h3>
            <p className="dark:text-slate-400 text-slate-500 mb-4">
              {searchQuery || statusFilter !== "all" || tagFilter.length > 0 || dateFilter !== "all"
                ? "Tente ajustar os filtros de busca"
                : "Comece adicionando seu primeiro contato"}
            </p>
            {!searchQuery && statusFilter === "all" && tagFilter.length === 0 && dateFilter === "all" && (
              <NeonButton variant="green" onClick={handleOpenAddModal}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Contato
              </NeonButton>
            )}
          </GlassCard>
        </motion.div>
      ) : (
        <motion.div
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {contacts.map((contact, index) => (
            <motion.div
              key={contact.id}
              variants={fadeInUp}
              custom={index}
            >
              <GlassCard className="p-5 group cursor-pointer" glow="green">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white font-medium text-sm">
                      {getInitials(contact.name)}
                    </div>
                    <div>
                      <h3 className="font-medium dark:text-white text-slate-900">{contact.name}</h3>
                      <p className="text-sm dark:text-slate-400 text-slate-500">{contact.company || "Sem empresa"}</p>
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenActionMenu(openActionMenu === contact.id ? null : contact.id);
                      }}
                      className="p-2 rounded-lg dark:hover:bg-white/5 hover:bg-slate-100 dark:text-slate-400 text-slate-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* Action Menu */}
                    <AnimatePresence>
                      {openActionMenu === contact.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -5 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -5 }}
                          transition={{ duration: 0.1 }}
                          className="absolute right-0 top-full mt-1 z-50 w-40 rounded-lg dark:bg-[#233138] bg-white border dark:border-white/10 border-slate-200 shadow-xl overflow-hidden"
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditModal(contact);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm dark:text-slate-300 text-slate-700 dark:hover:bg-white/5 hover:bg-slate-50 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                            Editar
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConfirmDelete(contact);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 dark:hover:bg-white/5 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Excluir
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {contact.email && (
                    <div className="flex items-center gap-2 text-sm dark:text-slate-400 text-slate-500">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{contact.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm dark:text-slate-400 text-slate-500">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span>{contact.phone}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex gap-1 flex-wrap">
                    {contact.tags?.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          tagColors[tag] || "dark:bg-white/10 bg-slate-200 dark:text-slate-400 text-slate-600"
                        )}
                      >
                        {tag}
                      </span>
                    ))}
                    {contact.tags?.length > 3 && (
                      <span className="text-xs px-2 py-0.5 rounded-full dark:bg-white/10 bg-slate-200 dark:text-slate-400 text-slate-600">
                        +{contact.tags.length - 3}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {statusConfig[contact.status] && (
                      <span className={cn("text-xs px-2 py-0.5 rounded-full", statusConfig[contact.status].color)}>
                        {statusConfig[contact.status].label}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t dark:border-white/5 border-slate-100">
                  <span className="text-xs dark:text-slate-500 text-slate-400">
                    Último contato: {formatDate(contact.last_contact_at)}
                  </span>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Click outside to close action menu */}
      {openActionMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpenActionMenu(null)}
        />
      )}

      {/* Create/Edit Contact Modal */}
      <Dialog
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingContact ? "Editar Contato" : "Novo Contato"}
        maxWidth="lg"
      >
        <DialogContent>
          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="dark:text-slate-300 text-slate-700">
                Nome *
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-slate-500 text-slate-400" />
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome completo"
                  className={cn(
                    "pl-10 dark:bg-white/5 bg-slate-50 dark:text-white text-slate-900 border dark:border-white/10 border-slate-200",
                    formErrors.name && "border-red-500 focus:ring-red-500/50"
                  )}
                />
              </div>
              {formErrors.name && (
                <p className="text-xs text-red-400">{formErrors.name}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="dark:text-slate-300 text-slate-700">
                Telefone *
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-slate-500 text-slate-400" />
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="(00) 00000-0000"
                  className={cn(
                    "pl-10 dark:bg-white/5 bg-slate-50 dark:text-white text-slate-900 border dark:border-white/10 border-slate-200",
                    formErrors.phone && "border-red-500 focus:ring-red-500/50"
                  )}
                />
              </div>
              {formErrors.phone && (
                <p className="text-xs text-red-400">{formErrors.phone}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="dark:text-slate-300 text-slate-700">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-slate-500 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                  className={cn(
                    "pl-10 dark:bg-white/5 bg-slate-50 dark:text-white text-slate-900 border dark:border-white/10 border-slate-200",
                    formErrors.email && "border-red-500 focus:ring-red-500/50"
                  )}
                />
              </div>
              {formErrors.email && (
                <p className="text-xs text-red-400">{formErrors.email}</p>
              )}
            </div>

            {/* Company */}
            <div className="space-y-2">
              <Label htmlFor="company" className="dark:text-slate-300 text-slate-700">
                Empresa
              </Label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-slate-500 text-slate-400" />
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData((prev) => ({ ...prev, company: e.target.value }))}
                  placeholder="Nome da empresa"
                  className="pl-10 dark:bg-white/5 bg-slate-50 dark:text-white text-slate-900 border dark:border-white/10 border-slate-200"
                />
              </div>
            </div>

            {/* Status and Source */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="dark:text-slate-300 text-slate-700">Status</Label>
                <div className="relative">
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as ContactStatus }))}
                    className="w-full px-3 py-2 rounded-lg dark:bg-white/5 bg-slate-50 dark:text-white text-slate-900 border dark:border-white/10 border-slate-200 text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                    <option value="lead">Lead</option>
                    <option value="client">Cliente</option>
                    <option value="prospect">Prospecto</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-slate-400 text-slate-500 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="dark:text-slate-300 text-slate-700">Origem</Label>
                <div className="relative">
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData((prev) => ({ ...prev, source: e.target.value as ContactSource }))}
                    className="w-full px-3 py-2 rounded-lg dark:bg-white/5 bg-slate-50 dark:text-white text-slate-900 border dark:border-white/10 border-slate-200 text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    <option value="manual">Manual</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                    <option value="email">Email</option>
                    <option value="website">Website</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-slate-400 text-slate-500 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label className="dark:text-slate-300 text-slate-700">Tags</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-slate-500 text-slate-400" />
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="Adicionar tag..."
                    className="pl-10 dark:bg-white/5 bg-slate-50 dark:text-white text-slate-900 border dark:border-white/10 border-slate-200"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddTag}
                  className="dark:border-white/10 border-slate-200 dark:text-slate-300 text-slate-700"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-red-400 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="dark:text-slate-300 text-slate-700">
                Observações
              </Label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-4 h-4 dark:text-slate-500 text-slate-400" />
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Adicione observações sobre o contato..."
                  rows={3}
                  className="w-full pl-10 pr-3 py-2 rounded-lg dark:bg-white/5 bg-slate-50 dark:text-white text-slate-900 border dark:border-white/10 border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setIsFormModalOpen(false)}
              className="dark:text-slate-400 text-slate-600"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitForm}
              disabled={isSubmitting}
              className="bg-[#00a884] hover:bg-[#008f72] text-white"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : editingContact ? (
                "Salvar Alterações"
              ) : (
                "Criar Contato"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar Exclusão"
        maxWidth="sm"
      >
        <DialogContent>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <p className="dark:text-slate-400 text-slate-500">
            Tem certeza que deseja excluir o contato{" "}
            <span className="font-medium dark:text-white text-slate-900">{contactToDelete?.name}</span>?
            Esta ação não pode ser desfeita.
          </p>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setIsDeleteModalOpen(false)}
              className="dark:text-slate-400 text-slate-600"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteContact}
              disabled={deleteContact.isPending}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {deleteContact.isPending ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Excluir"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
