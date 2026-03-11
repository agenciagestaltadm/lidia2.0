"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
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
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  tags?: string[];
  last_contact?: string;
  created_at: string;
}

interface ContactsViewProps {
  isDarkMode: boolean;
  onBack: () => void;
  onStartConversation?: (contactId: string) => void;
}

export function ContactsView({ isDarkMode, onBack, onStartConversation }: ContactsViewProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    loadContacts();
  }, []);

  async function loadContacts() {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error("Error loading contacts:", error);
      toast.error("Erro ao carregar contatos");
    } finally {
      setLoading(false);
    }
  }

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      search === "" ||
      contact.name.toLowerCase().includes(search.toLowerCase()) ||
      contact.phone.includes(search);

    const matchesTag = selectedTag === null || contact.tags?.includes(selectedTag);

    return matchesSearch && matchesTag;
  });

  const allTags = Array.from(new Set(contacts.flatMap((c) => c.tags || [])));

  if (loading) {
    return (
      <div className={cn("flex-1 flex flex-col", isDarkMode ? "bg-[#0b141a]" : "bg-gray-50")}>
        <div className="p-4 border-b border-[#2a2a2a]">
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex-1 p-4 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex-1 flex flex-col h-full", isDarkMode ? "bg-[#0b141a]" : "bg-gray-50")}>
      {/* Header */}
      <div className={cn("flex items-center gap-3 p-4 border-b", isDarkMode ? "bg-[#1f2c33] border-[#2a2a2a]" : "bg-white border-gray-200")}>
        <button onClick={onBack} className={cn("p-2 rounded-full transition-colors", isDarkMode ? "text-[#aebac1] hover:bg-[#2a3942]" : "text-gray-600 hover:bg-gray-100")}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className={cn("font-semibold text-lg flex-1", isDarkMode ? "text-[#e9edef]" : "text-gray-900")}>
          Contatos Cadastrados
        </h2>
        <span className={cn("text-sm", isDarkMode ? "text-[#8696a0]" : "text-gray-500")}>
          {filteredContacts.length} contatos
        </span>
      </div>

      {/* Search */}
      <div className={cn("p-4 border-b", isDarkMode ? "bg-[#1f2c33] border-[#2a2a2a]" : "bg-white border-gray-200")}>
        <div className="relative mb-4">
          <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5", isDarkMode ? "text-[#8696a0]" : "text-gray-400")} />
          <Input
            placeholder="Buscar contatos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn("pl-10", isDarkMode ? "bg-[#2a3942] border-[#2a3942] text-[#e9edef]" : "bg-gray-100 border-gray-200")}
          />
        </div>

        {allTags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className={cn("w-4 h-4", isDarkMode ? "text-[#8696a0]" : "text-gray-500")} />
            <button onClick={() => setSelectedTag(null)} className={cn("px-3 py-1 rounded-full text-sm", selectedTag === null ? "bg-[#00a884] text-white" : isDarkMode ? "bg-[#2a3942] text-[#aebac1]" : "bg-gray-200 text-gray-600")}>
              Todos
            </button>
            {allTags.map((tag) => (
              <button key={tag} onClick={() => setSelectedTag(tag === selectedTag ? null : tag)} className={cn("px-3 py-1 rounded-full text-sm", selectedTag === tag ? "bg-[#00a884] text-white" : isDarkMode ? "bg-[#2a3942] text-[#aebac1]" : "bg-gray-200 text-gray-600")}>
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto">
        {filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <User className={cn("w-16 h-16 mb-4", isDarkMode ? "text-[#374045]" : "text-gray-300")} />
            <p className={cn("text-lg font-medium", isDarkMode ? "text-[#e9edef]" : "text-gray-900")}>Nenhum contato encontrado</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredContacts.map((contact, index) => (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className={cn("flex items-center gap-3 p-3 rounded-lg cursor-pointer group", isDarkMode ? "hover:bg-[#2a3942]" : "hover:bg-gray-100")}
              >
                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-white font-medium", contact.avatar ? "" : "bg-gradient-to-br from-[#00a884] to-[#005c4b]")}>
                  {contact.avatar ? (
                    <img src={contact.avatar} alt={contact.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    contact.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={cn("font-medium truncate", isDarkMode ? "text-[#e9edef]" : "text-gray-900")}>{contact.name}</h3>
                  <div className={cn("flex items-center gap-3 text-sm mt-1", isDarkMode ? "text-[#8696a0]" : "text-gray-500")}>
                    <Phone className="w-3 h-3" /> {contact.phone}
                  </div>
                </div>
                {onStartConversation && (
                  <button onClick={() => onStartConversation(contact.id)} className="p-2 rounded-full text-[#00a884]">
                    <MessageSquare className="w-5 h-5" />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
