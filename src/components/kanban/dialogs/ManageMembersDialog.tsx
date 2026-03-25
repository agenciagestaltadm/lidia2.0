"use client";

import { useState, useMemo } from "react";
import { KanbanModal } from "../ui/KanbanModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { useBoardMembers, KanbanBoard, BoardRole, KanbanBoardMember } from "@/hooks/use-kanban";
import { Users, Search, UserMinus, Loader2, X, Crown, Shield, Eye } from "lucide-react";

interface ManageMembersDialogProps {
  board: KanbanBoard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const roleLabels: Record<BoardRole, { label: string; icon: React.ReactNode; color: string }> = {
  ADMIN: { label: "Administrador", icon: <Crown className="w-3 h-3" />, color: "bg-purple-100 text-purple-700" },
  MANAGER: { label: "Gerente", icon: <Shield className="w-3 h-3" />, color: "bg-blue-100 text-blue-700" },
  MEMBER: { label: "Membro", icon: <Users className="w-3 h-3" />, color: "bg-green-100 text-green-700" },
  VIEWER: { label: "Visualizador", icon: <Eye className="w-3 h-3" />, color: "bg-gray-100 text-gray-700" },
};

const roleOptions = [
  { value: "ADMIN", label: "Administrador" },
  { value: "MANAGER", label: "Gerente" },
  { value: "MEMBER", label: "Membro" },
  { value: "VIEWER", label: "Visualizador" },
];

export function ManageMembersDialog({ board, open, onOpenChange }: ManageMembersDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const { members, isLoading, removeMember, updateMemberRole } = useBoardMembers(board?.id || null);

  // Filter members by search
  const filteredMembers = useMemo(() => {
    if (!searchQuery) return members;
    return members.filter(
      (m: KanbanBoardMember) =>
        m.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [members, searchQuery]);

  const handleRemoveMember = async (memberId: string) => {
    await removeMember.mutateAsync(memberId);
  };

  const handleUpdateRole = async (memberId: string, role: string) => {
    await updateMemberRole.mutateAsync({ memberId, role: role as BoardRole });
  };

  return (
    <KanbanModal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Gerenciar Membros</h2>
            <p className="text-sm text-gray-500">{board?.name}</p>
          </div>
        </div>
      }
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar membros..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            {/* Members List */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">
                Membros ({filteredMembers.length})
              </h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {filteredMembers.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">
                    Nenhum membro encontrado
                  </p>
                ) : (
                  filteredMembers.map((member: KanbanBoardMember) => {
                    const roleInfo = roleLabels[member.role];
                    return (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={member.user?.avatar_url || undefined} />
                            <AvatarFallback>
                              {member.user?.full_name?.charAt(0).toUpperCase() ||
                                member.user?.email?.charAt(0).toUpperCase() ||
                                "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">
                              {member.user?.full_name || member.user?.email}
                            </p>
                            <p className="text-xs text-gray-500">{member.user?.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={member.role}
                            onValueChange={(value) => handleUpdateRole(member.id, value)}
                            options={roleOptions}
                            disabled={updateMemberRole.isPending}
                            className="w-36"
                          />

                          <Badge className={roleInfo.color}>
                            <span className="flex items-center gap-1">
                              {roleInfo.icon}
                              {roleInfo.label}
                            </span>
                          </Badge>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveMember(member.id)}
                            disabled={removeMember.isPending}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            {removeMember.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <UserMinus className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4 mr-2" />
            Fechar
          </Button>
        </div>
      </div>
    </KanbanModal>
  );
}
