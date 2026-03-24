"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Users, Plus, Trash2 } from "lucide-react";
import { KanbanBoard, useBoardMembers } from "@/hooks/use-kanban";
import { toast } from "sonner";

interface ManageMembersModalProps {
  board: KanbanBoard | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ManageMembersModal({ board, isOpen, onClose }: ManageMembersModalProps) {
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<"ADMIN" | "MANAGER" | "MEMBER" | "VIEWER">("MEMBER");
  
  const { members, isLoading, addMember, removeMember } = useBoardMembers(board?.id || null);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail.trim() || !board) return;

    try {
      await addMember.mutateAsync({
        user_id: newMemberEmail.trim(), // Na prática, buscaríamos o user_id pelo email
        role: selectedRole,
      });
      toast.success("Membro adicionado com sucesso!");
      setNewMemberEmail("");
    } catch (error) {
      toast.error("Erro ao adicionar membro. Verifique se o email existe.");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await removeMember.mutateAsync(memberId);
      toast.success("Membro removido com sucesso!");
    } catch (error) {
      toast.error("Erro ao remover membro");
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      ADMIN: "Administrador",
      MANAGER: "Gerente",
      MEMBER: "Membro",
      VIEWER: "Visualizador",
    };
    return labels[role] || role;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg mx-4"
          >
            <GlassCard className="p-6" hover={false}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-500" />
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Gerenciar Membros
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Formulário para adicionar membro */}
              <form onSubmit={handleAddMember} className="space-y-3 mb-6">
                <div>
                  <Label htmlFor="memberEmail">Adicionar Membro (Email)</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="memberEmail"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      placeholder="email@empresa.com"
                      className="flex-1"
                    />
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as any)}
                      className="px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="MANAGER">Gerente</option>
                      <option value="MEMBER">Membro</option>
                      <option value="VIEWER">Visualizador</option>
                    </select>
                    <Button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700"
                      disabled={!newMemberEmail.trim() || addMember.isPending}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </form>

              {/* Lista de membros */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Membros do Quadro
                </h3>
                
                {isLoading ? (
                  <p className="text-slate-500 text-center py-4">Carregando membros...</p>
                ) : members.length === 0 ? (
                  <p className="text-slate-500 text-center py-4">
                    Nenhum membro adicionado ainda.
                  </p>
                ) : (
                  members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                          <span className="text-emerald-600 text-sm font-medium">
                            {member.user?.full_name?.charAt(0) || member.user?.email?.charAt(0) || "?"}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {member.user?.full_name || member.user?.email || "Usuário"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {getRoleLabel(member.role)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                        disabled={removeMember.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={onClose}
                >
                  Fechar
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
