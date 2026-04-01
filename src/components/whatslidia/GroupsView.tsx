"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Users,
  Plus,
  Settings,
  Archive,
  Trash2,
  Search,
} from "lucide-react";
import type { WhatsAppGroup, WhatsAppGroupParticipant } from "@/types/whatsapp";

interface GroupsViewProps {
  groups: WhatsAppGroup[];
  participants: WhatsAppGroupParticipant[];
  selectedGroup: WhatsAppGroup | null;
  loading?: boolean;
  onSelectGroup?: (group: WhatsAppGroup) => void;
  onCreateGroup?: () => void;
  onEditGroup?: (group: WhatsAppGroup) => void;
  onDeleteGroup?: (groupId: string) => void;
  onArchiveGroup?: (groupId: string) => void;
  isDarkMode?: boolean;
}

export function GroupsView({
  groups,
  participants,
  selectedGroup,
  loading = false,
  onSelectGroup,
  onCreateGroup,
  onEditGroup,
  onDeleteGroup,
  onArchiveGroup,
  isDarkMode = true,
}: GroupsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  // Filtra grupos
  const filteredGroups = groups.filter((group) => {
    const matchesSearch = group.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesArchived = showArchived ? group.is_archived : !group.is_archived;
    return matchesSearch && matchesArchived;
  });

  // Obtém participantes do grupo selecionado
  const selectedGroupParticipants = selectedGroup
    ? participants.filter((p) => p.group_id === selectedGroup.id)
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
      {/* Lista de grupos */}
      <div
        className={cn(
          "rounded-lg overflow-hidden flex flex-col",
          isDarkMode ? "bg-[#2a3942]" : "bg-white border border-gray-200"
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "p-4 border-b flex items-center justify-between",
            isDarkMode ? "border-[#374045]" : "border-gray-200"
          )}
        >
          <h2
            className={cn(
              "font-semibold flex items-center gap-2",
              isDarkMode ? "text-[#e9edef]" : "text-gray-900"
            )}
          >
            <Users className="w-5 h-5" />
            Grupos
          </h2>
          {onCreateGroup && (
            <button
              onClick={onCreateGroup}
              className="p-1.5 rounded-full bg-[#00a884] text-white hover:bg-[#00a884]/90 transition-colors"
              title="Criar grupo"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Search */}
        <div className="p-3 border-b border-[#374045]">
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg",
              isDarkMode ? "bg-[#1f2c33]" : "bg-gray-100"
            )}
          >
            <Search className="w-4 h-4 text-[#8696a0]" />
            <input
              type="text"
              placeholder="Buscar grupo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "flex-1 bg-transparent outline-none text-sm",
                isDarkMode
                  ? "text-[#e9edef] placeholder-[#8696a0]"
                  : "text-gray-900 placeholder-gray-500"
              )}
            />
          </div>
        </div>

        {/* Filter */}
        <div className="px-3 py-2 border-b border-[#374045]">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={cn(
              "text-xs font-medium transition-colors",
              showArchived
                ? "text-[#00a884]"
                : isDarkMode
                ? "text-[#8696a0] hover:text-[#e9edef]"
                : "text-gray-500 hover:text-gray-900"
            )}
          >
            {showArchived ? "Mostrando arquivados" : "Mostrar arquivados"}
          </button>
        </div>

        {/* Groups List */}
        <div className="flex-1 overflow-y-auto">
          {filteredGroups.length > 0 ? (
            filteredGroups.map((group) => (
              <motion.button
                key={group.id}
                onClick={() => onSelectGroup?.(group)}
                className={cn(
                  "w-full text-left px-4 py-3 border-b transition-colors",
                  isDarkMode ? "border-[#2a3942]" : "border-gray-100",
                  selectedGroup?.id === group.id
                    ? isDarkMode
                      ? "bg-[#374045]"
                      : "bg-blue-50"
                    : isDarkMode
                    ? "hover:bg-[#374045]"
                    : "hover:bg-gray-50"
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                      isDarkMode ? "bg-[#1f2c33]" : "bg-gray-200"
                    )}
                  >
                    {group.profile_picture_url ? (
                      <img
                        src={group.profile_picture_url}
                        alt={group.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <Users className="w-5 h-5 text-[#8696a0]" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "font-medium truncate",
                        isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                      )}
                    >
                      {group.name}
                      {group.is_archived && (
                        <span className="ml-2 text-xs text-[#8696a0]">
                          (arquivado)
                        </span>
                      )}
                    </p>
                    <p
                      className={cn(
                        "text-xs truncate",
                        isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                      )}
                    >
                      {group.participants_count} participante
                      {group.participants_count !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </motion.button>
            ))
          ) : (
            <div
              className={cn(
                "p-8 text-center",
                isDarkMode ? "text-[#8696a0]" : "text-gray-500"
              )}
            >
              Nenhum grupo encontrado
            </div>
          )}
        </div>
      </div>

      {/* Detalhes do grupo */}
      {selectedGroup && (
        <div
          className={cn(
            "lg:col-span-2 rounded-lg overflow-hidden flex flex-col",
            isDarkMode ? "bg-[#2a3942]" : "bg-white border border-gray-200"
          )}
        >
          {/* Header */}
          <div
            className={cn(
              "p-4 border-b flex items-center justify-between",
              isDarkMode ? "border-[#374045]" : "border-gray-200"
            )}
          >
            <div className="flex items-center gap-3">
              {selectedGroup.profile_picture_url && (
                <img
                  src={selectedGroup.profile_picture_url}
                  alt={selectedGroup.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              )}
              <div>
                <h3
                  className={cn(
                    "font-semibold",
                    isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                  )}
                >
                  {selectedGroup.name}
                </h3>
                <p
                  className={cn(
                    "text-xs",
                    isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                  )}
                >
                  {selectedGroupParticipants.length} participante
                  {selectedGroupParticipants.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {onEditGroup && (
                <button
                  onClick={() => onEditGroup(selectedGroup)}
                  className="p-2 rounded-full hover:bg-[#374045] transition-colors"
                  title="Editar"
                >
                  <Settings className="w-5 h-5 text-[#8696a0]" />
                </button>
              )}
              {onArchiveGroup && (
                <button
                  onClick={() => onArchiveGroup(selectedGroup.id)}
                  className="p-2 rounded-full hover:bg-[#374045] transition-colors"
                  title={selectedGroup.is_archived ? "Desarquivar" : "Arquivar"}
                >
                  <Archive className="w-5 h-5 text-[#8696a0]" />
                </button>
              )}
              {onDeleteGroup && (
                <button
                  onClick={() => onDeleteGroup(selectedGroup.id)}
                  className="p-2 rounded-full hover:bg-red-500/20 transition-colors"
                  title="Deletar"
                >
                  <Trash2 className="w-5 h-5 text-red-500" />
                </button>
              )}
            </div>
          </div>

          {/* Description */}
          {selectedGroup.description && (
            <div className="px-4 py-3 border-b border-[#374045]">
              <p
                className={cn(
                  "text-sm",
                  isDarkMode ? "text-[#8696a0]" : "text-gray-600"
                )}
              >
                {selectedGroup.description}
              </p>
            </div>
          )}

          {/* Participants */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <h4
                className={cn(
                  "font-semibold mb-3",
                  isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                )}
              >
                Participantes
              </h4>
              <div className="space-y-2">
                {selectedGroupParticipants.map((participant) => (
                  <div
                    key={participant.id}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-lg",
                      isDarkMode ? "bg-[#1f2c33]" : "bg-gray-50"
                    )}
                  >
                    <div>
                      <p
                        className={cn(
                          "text-sm font-medium",
                          isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                        )}
                      >
                        {participant.participant_name || participant.participant_phone}
                      </p>
                      <p
                        className={cn(
                          "text-xs",
                          isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                        )}
                      >
                        {participant.participant_phone}
                      </p>
                    </div>
                    {participant.is_admin && (
                      <span
                        className={cn(
                          "text-xs font-medium px-2 py-1 rounded",
                          isDarkMode
                            ? "bg-[#00a884] text-white"
                            : "bg-emerald-100 text-emerald-700"
                        )}
                      >
                        Admin
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
