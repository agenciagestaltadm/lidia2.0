"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  CheckSquare,
  ArrowLeft,
  Plus,
  Calendar,
  Clock,
  User,
  Trash2,
  MoreVertical,
  Check,
  AlertCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Task {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "in_progress" | "completed";
  assignee?: string;
  assignee_name?: string;
  created_at: string;
  contact_id?: string;
  contact_name?: string;
}

interface TasksViewProps {
  isDarkMode: boolean;
  onBack: () => void;
}

export function TasksView({ isDarkMode, onBack }: TasksViewProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [isAdding, setIsAdding] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium" as Task["priority"],
    due_date: "",
  });

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("tasks")
        .select(`*, contact:contacts(name)`)
        .order("due_date", { ascending: true });

      if (error) throw error;

      const formattedTasks: Task[] = (data || []).map((task: Record<string, unknown>) => ({
        id: task.id as string,
        title: task.title as string,
        description: task.description as string | undefined,
        due_date: task.due_date as string | undefined,
        priority: task.priority as Task["priority"],
        status: task.status as Task["status"],
        assignee: task.assignee as string | undefined,
        assignee_name: task.assignee_name as string | undefined,
        created_at: task.created_at as string,
        contact_id: task.contact_id as string | undefined,
        contact_name: (task.contact as Record<string, unknown>)?.name as string | undefined,
      }));

      setTasks(formattedTasks);
    } catch (error) {
      console.error("Error loading tasks:", error);
      toast.error("Erro ao carregar tarefas");
    } finally {
      setLoading(false);
    }
  }

  async function addTask() {
    if (!newTask.title.trim()) return;

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from("tasks").insert({
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        due_date: newTask.due_date || null,
        status: "pending",
        assignee: user?.id,
        created_by: user?.id,
      });

      if (error) throw error;

      setNewTask({ title: "", description: "", priority: "medium", due_date: "" });
      setIsAdding(false);
      loadTasks();
      toast.success("Tarefa criada");
    } catch (error) {
      toast.error("Erro ao criar tarefa");
    }
  }

  async function toggleTaskStatus(id: string, currentStatus: Task["status"]) {
    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("tasks")
        .update({ status: newStatus })
        .eq("id", id);
      if (error) throw error;
      loadTasks();
    } catch (error) {
      toast.error("Erro ao atualizar tarefa");
    }
  }

  async function deleteTask(id: string) {
    try {
      const supabase = createClient();
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
      loadTasks();
      toast.success("Tarefa removida");
    } catch (error) {
      toast.error("Erro ao remover tarefa");
    }
  }

  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true;
    if (filter === "pending") return task.status !== "completed";
    return task.status === "completed";
  });

  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "high": return "bg-red-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
    }
  };

  if (loading) {
    return (
      <div className={cn("flex-1 flex flex-col", isDarkMode ? "bg-[#0b141a]" : "bg-gray-50")}>
        <div className="p-4"><Skeleton className="h-10 w-full" /></div>
        <div className="flex-1 p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
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
        <button onClick={onBack} className={cn("p-2 rounded-full", isDarkMode ? "text-[#aebac1] hover:bg-[#2a3942]" : "text-gray-600 hover:bg-gray-100")}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className={cn("font-semibold text-lg flex-1", isDarkMode ? "text-[#e9edef]" : "text-gray-900")}>Criar Tarefas</h2>
        <button onClick={() => setIsAdding(true)} className="p-2 bg-[#00a884] text-white rounded-full hover:bg-[#00a884]/90">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Filters */}
      <div className={cn("flex items-center gap-2 p-4 border-b", isDarkMode ? "bg-[#1f2c33] border-[#2a2a2a]" : "bg-white border-gray-200")}>
        {(["all", "pending", "completed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
              filter === f
                ? "bg-[#00a884] text-white"
                : isDarkMode
                  ? "bg-[#2a3942] text-[#aebac1] hover:bg-[#374045]"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {f === "all" ? "Todas" : f === "pending" ? "Pendentes" : "Concluídas"}
          </button>
        ))}
        <span className={cn("ml-auto text-sm", isDarkMode ? "text-[#8696a0]" : "text-gray-500")}>
          {filteredTasks.length} tarefas
        </span>
      </div>

      {/* Add Task Form */}
      {isAdding && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className={cn("p-4 border-b", isDarkMode ? "bg-[#1f2c33] border-[#2a2a2a]" : "bg-white border-gray-200")}
        >
          <div className="space-y-3">
            <Input
              placeholder="Título da tarefa"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              className={isDarkMode ? "bg-[#2a3942] border-[#374045] text-[#e9edef]" : ""}
            />
            <textarea
              placeholder="Descrição (opcional)"
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              className={cn("w-full p-3 rounded-lg resize-none h-20", isDarkMode ? "bg-[#2a3942] text-[#e9edef] border-[#374045]" : "bg-gray-100")}
            />
            <div className="flex gap-3">
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Task["priority"] })}
                className={cn("flex-1 p-2 rounded-lg", isDarkMode ? "bg-[#2a3942] text-[#e9edef]" : "bg-gray-100")}
              >
                <option value="low">Baixa prioridade</option>
                <option value="medium">Média prioridade</option>
                <option value="high">Alta prioridade</option>
              </select>
              <input
                type="date"
                value={newTask.due_date}
                onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                className={cn("flex-1 p-2 rounded-lg", isDarkMode ? "bg-[#2a3942] text-[#e9edef]" : "bg-gray-100")}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm rounded-lg hover:bg-gray-200">Cancelar</button>
              <button onClick={addTask} className="px-4 py-2 bg-[#00a884] text-white text-sm rounded-lg hover:bg-[#00a884]/90">Criar</button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tasks List */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <CheckSquare className={cn("w-16 h-16 mb-4", isDarkMode ? "text-[#374045]" : "text-gray-300")} />
            <p className={cn("text-lg font-medium", isDarkMode ? "text-[#e9edef]" : "text-gray-900")}>Nenhuma tarefa</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className={cn(
                  "p-3 rounded-lg group relative",
                  isDarkMode ? "bg-[#1f2c33]" : "bg-white",
                  task.status === "completed" && "opacity-60"
                )}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleTaskStatus(task.id, task.status)}
                    className={cn(
                      "mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                      task.status === "completed"
                        ? "bg-[#00a884] border-[#00a884]"
                        : isDarkMode
                          ? "border-[#8696a0]"
                          : "border-gray-400"
                    )}
                  >
                    {task.status === "completed" && <Check className="w-3 h-3 text-white" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <h3 className={cn("font-medium", isDarkMode ? "text-[#e9edef]" : "text-gray-900", task.status === "completed" && "line-through")}>
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className={cn("text-sm mt-1", isDarkMode ? "text-[#8696a0]" : "text-gray-500")}>{task.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <span className={cn("px-2 py-0.5 rounded-full text-white", getPriorityColor(task.priority))}>
                        {task.priority === "high" ? "Alta" : task.priority === "medium" ? "Média" : "Baixa"}
                      </span>
                      {task.due_date && (
                        <span className={cn("flex items-center gap-1", isDarkMode ? "text-[#8696a0]" : "text-gray-500")}>
                          <Calendar className="w-3 h-3" />
                          {format(new Date(task.due_date), "dd/MM/yyyy")}
                        </span>
                      )}
                      {task.assignee_name && (
                        <span className={cn("flex items-center gap-1", isDarkMode ? "text-[#8696a0]" : "text-gray-500")}>
                          <User className="w-3 h-3" /> {task.assignee_name}
                        </span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => deleteTask(task.id)} className={cn("p-1 rounded opacity-0 group-hover:opacity-100", isDarkMode ? "hover:bg-[#2a3942] text-[#8696a0]" : "hover:bg-gray-100 text-gray-400")}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
