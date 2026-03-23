"use client";

import { useState, useMemo } from "react";
import { 
  Users, 
  UserCheck, 
  Upload, 
  Search,
  Check,
  AlertCircle,
  Loader2
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowBadge } from "@/components/ui/glow-badge";
import { NeonButton } from "@/components/ui/neon-button";
import { useContacts } from "@/hooks/use-contacts";
import { CSVContactImporter } from "@/components/bulk/CSVContactImporter";
import type { Contact } from "@/types/contacts";
import type { ContactSelectionMode, CSVContact } from "@/types/campaigns";
import { cn } from "@/lib/utils";

interface ContactSelectorProps {
  companyId?: string;
  mode: ContactSelectionMode;
  selectedIds: string[];
  csvData: CSVContact[];
  onChange: (mode: ContactSelectionMode, ids?: string[], csvData?: CSVContact[]) => void;
}

export function ContactSelector({ 
  companyId, 
  mode, 
  selectedIds, 
  csvData,
  onChange 
}: ContactSelectorProps) {
  const { data: contacts, isLoading } = useContacts({ status: 'active' });
  const [searchTerm, setSearchTerm] = useState("");
  const [showContactModal, setShowContactModal] = useState(false);

  const filteredContacts = useMemo(() => {
    if (!contacts) return [];
    if (!searchTerm) return contacts;
    
    const term = searchTerm.toLowerCase();
    return contacts.filter(c => 
      c.name.toLowerCase().includes(term) ||
      c.phone.toLowerCase().includes(term) ||
      (c.email && c.email.toLowerCase().includes(term))
    );
  }, [contacts, searchTerm]);

  const selectedContacts = useMemo(() => {
    if (!contacts) return [];
    return contacts.filter(c => selectedIds.includes(c.id));
  }, [contacts, selectedIds]);

  const toggleContact = (contactId: string) => {
    const newIds = selectedIds.includes(contactId)
      ? selectedIds.filter(id => id !== contactId)
      : [...selectedIds, contactId];
    onChange('manual', newIds);
  };

  const selectAll = () => {
    if (!filteredContacts) return;
    const allIds = filteredContacts.map(c => c.id);
    const newIds = [...new Set([...selectedIds, ...allIds])];
    onChange('manual', newIds);
  };

  const deselectAll = () => {
    if (!filteredContacts) return;
    const filteredIds = filteredContacts.map(c => c.id);
    const newIds = selectedIds.filter(id => !filteredIds.includes(id));
    onChange('manual', newIds);
  };

  const handleCSVImport = (data: CSVContact[]) => {
    onChange('csv', undefined, data);
  };

  const renderSelectionMode = () => {
    switch (mode) {
      case 'all':
        return (
          <div className="p-4 rounded-lg dark:bg-emerald-500/10 bg-emerald-50 border dark:border-emerald-500/30 border-emerald-200">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="dark:text-white text-slate-900 font-medium">
                  Todos os contatos
                </p>
                <p className="text-sm dark:text-slate-400 text-slate-500">
                  {contacts?.length || 0} contatos serão incluídos
                </p>
              </div>
            </div>
          </div>
        );

      case 'manual':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm dark:text-slate-400 text-slate-500">
                {selectedIds.length} contatos selecionados
              </p>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="text-xs text-emerald-400 hover:text-emerald-300"
                >
                  Selecionar visíveis
                </button>
                <span className="dark:text-slate-600 text-slate-300">|</span>
                <button
                  onClick={deselectAll}
                  className="text-xs text-slate-400 hover:text-slate-300"
                >
                  Remover visíveis
                </button>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar contatos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg dark:bg-white/5 bg-slate-100 dark:border-white/10 border-slate-200 border dark:text-white text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredContacts?.map((contact) => {
                  const isSelected = selectedIds.includes(contact.id);
                  return (
                    <button
                      key={contact.id}
                      onClick={() => toggleContact(contact.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                        isSelected 
                          ? "dark:bg-emerald-500/20 bg-emerald-50 border dark:border-emerald-500/30 border-emerald-200" 
                          : "dark:bg-white/5 bg-slate-50 dark:hover:bg-white/10 hover:bg-slate-100"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                        isSelected 
                          ? "bg-emerald-500 border-emerald-500" 
                          : "dark:border-white/20 border-slate-300"
                      )}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="dark:text-white text-slate-900 font-medium truncate">
                          {contact.name}
                        </p>
                        <p className="text-sm dark:text-slate-400 text-slate-500">
                          {contact.phone}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {selectedContacts.length > 0 && (
              <div className="pt-4 border-t dark:border-white/10 border-slate-200">
                <p className="text-sm dark:text-slate-300 text-slate-700 mb-2">
                  Contatos selecionados ({selectedContacts.length}):
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedContacts.slice(0, 10).map(contact => (
                    <GlowBadge key={contact.id} variant="green">
                      {contact.name}
                    </GlowBadge>
                  ))}
                  {selectedContacts.length > 10 && (
                    <GlowBadge variant="default">
                      +{selectedContacts.length - 10} mais
                    </GlowBadge>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 'csv':
        return (
          <CSVContactImporter 
            onImport={handleCSVImport}
            importedData={csvData}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => onChange('all')}
          className={cn(
            "p-4 rounded-lg border text-center transition-all",
            mode === 'all'
              ? "dark:bg-emerald-500/20 bg-emerald-50 border-emerald-500/50"
              : "dark:bg-white/5 bg-slate-50 dark:border-white/10 border-slate-200 dark:hover:bg-white/10 hover:bg-slate-100"
          )}
        >
          <Users className={cn(
            "w-6 h-6 mx-auto mb-2",
            mode === 'all' ? "text-emerald-400" : "dark:text-slate-400 text-slate-500"
          )} />
          <p className={cn(
            "text-sm font-medium",
            mode === 'all' ? "dark:text-white text-slate-900" : "dark:text-slate-300 text-slate-700"
          )}>
            Todos
          </p>
        </button>

        <button
          onClick={() => onChange('manual')}
          className={cn(
            "p-4 rounded-lg border text-center transition-all",
            mode === 'manual'
              ? "dark:bg-emerald-500/20 bg-emerald-50 border-emerald-500/50"
              : "dark:bg-white/5 bg-slate-50 dark:border-white/10 border-slate-200 dark:hover:bg-white/10 hover:bg-slate-100"
          )}
        >
          <UserCheck className={cn(
            "w-6 h-6 mx-auto mb-2",
            mode === 'manual' ? "text-emerald-400" : "dark:text-slate-400 text-slate-500"
          )} />
          <p className={cn(
            "text-sm font-medium",
            mode === 'manual' ? "dark:text-white text-slate-900" : "dark:text-slate-300 text-slate-700"
          )}>
            Manual
          </p>
        </button>

        <button
          onClick={() => onChange('csv')}
          className={cn(
            "p-4 rounded-lg border text-center transition-all",
            mode === 'csv'
              ? "dark:bg-emerald-500/20 bg-emerald-50 border-emerald-500/50"
              : "dark:bg-white/5 bg-slate-50 dark:border-white/10 border-slate-200 dark:hover:bg-white/10 hover:bg-slate-100"
          )}
        >
          <Upload className={cn(
            "w-6 h-6 mx-auto mb-2",
            mode === 'csv' ? "text-emerald-400" : "dark:text-slate-400 text-slate-500"
          )} />
          <p className={cn(
            "text-sm font-medium",
            mode === 'csv' ? "dark:text-white text-slate-900" : "dark:text-slate-300 text-slate-700"
          )}>
            CSV
          </p>
        </button>
      </div>

      <GlassCard className="p-4">
        {renderSelectionMode()}
      </GlassCard>
    </div>
  );
}
