"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  Settings,
  ArrowLeft,
  Bell,
  Moon,
  Volume2,
  Languages,
  Shield,
  User,
  MessageSquare,
  Camera,
  Save,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface WhatsLidiaSettings {
  notifications_enabled: boolean;
  sound_enabled: boolean;
  dark_mode: boolean;
  language: string;
  read_receipts: boolean;
  typing_indicators: boolean;
  auto_download_media: boolean;
  compact_view: boolean;
}

interface SettingsViewProps {
  isDarkMode: boolean;
  onBack: () => void;
}

export function SettingsView({ isDarkMode, onBack }: SettingsViewProps) {
  const [settings, setSettings] = useState<WhatsLidiaSettings>({
    notifications_enabled: true,
    sound_enabled: true,
    dark_mode: isDarkMode,
    language: "pt-BR",
    read_receipts: true,
    typing_indicators: true,
    auto_download_media: false,
    compact_view: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setSettings({
          ...settings,
          ...data,
        });
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { error } = await supabase
        .from("user_settings")
        .upsert({
          user_id: user.id,
          ...settings,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "user_id"
        });

      if (error) throw error;
      toast.success("Configurações salvas");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  }

  const handleToggle = (key: keyof WhatsLidiaSettings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (loading) {
    return (
      <div className={cn("flex-1 flex flex-col", isDarkMode ? "bg-[#0b141a]" : "bg-gray-50")}>
        <div className={cn("p-4 border-b", isDarkMode ? "bg-[#1f2c33] border-[#2a2a2a]" : "bg-white border-gray-200")}>
          <div className="flex items-center gap-3">
            <button onClick={onBack} className={cn("p-2 rounded-full", isDarkMode ? "text-[#aebac1] hover:bg-[#2a3942]" : "text-gray-600 hover:bg-gray-100")}>
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className={cn("font-semibold text-lg", isDarkMode ? "text-[#e9edef]" : "text-gray-900")}>Configurações</h2>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-[#8696a0]">Carregando...</div>
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
        <h2 className={cn("font-semibold text-lg flex-1", isDarkMode ? "text-[#e9edef]" : "text-gray-900")}>Configurações</h2>
        <button 
          onClick={saveSettings}
          disabled={saving}
          className={cn("px-4 py-2 rounded-lg flex items-center gap-2 transition-colors", isDarkMode ? "bg-[#00a884] hover:bg-[#00a884]/90 text-white" : "bg-[#00a884] hover:bg-[#00a884]/90 text-white")}
        >
          <Save className="w-4 h-4" />
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Notifications Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("rounded-xl overflow-hidden", isDarkMode ? "bg-[#1f2c33]" : "bg-white")}
          >
            <div className={cn("p-4 border-b", isDarkMode ? "border-[#2a2a2a]" : "border-gray-200")}>
              <h3 className={cn("font-semibold flex items-center gap-2", isDarkMode ? "text-[#e9edef]" : "text-gray-900")}>
                <Bell className="w-5 h-5 text-[#00a884]" /> Notificações
              </h3>
            </div>
            <div className="divide-y divide-[#2a2a2a]/20">
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className={cn("font-medium", isDarkMode ? "text-[#e9edef]" : "text-gray-900")}>Notificações push</p>
                  <p className={cn("text-sm", isDarkMode ? "text-[#8696a0]" : "text-gray-500")}>Receber notificações de novas mensagens</p>
                </div>
                <Switch
                  checked={settings.notifications_enabled}
                  onCheckedChange={() => handleToggle("notifications_enabled")}
                />
              </div>
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className={cn("font-medium", isDarkMode ? "text-[#e9edef]" : "text-gray-900")}>Sons</p>
                  <p className={cn("text-sm", isDarkMode ? "text-[#8696a0]" : "text-gray-500")}>Reproduzir sons ao receber mensagens</p>
                </div>
                <Switch
                  checked={settings.sound_enabled}
                  onCheckedChange={() => handleToggle("sound_enabled")}
                />
              </div>
            </div>
          </motion.div>

          {/* Privacy Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={cn("rounded-xl overflow-hidden", isDarkMode ? "bg-[#1f2c33]" : "bg-white")}
          >
            <div className={cn("p-4 border-b", isDarkMode ? "border-[#2a2a2a]" : "border-gray-200")}>
              <h3 className={cn("font-semibold flex items-center gap-2", isDarkMode ? "text-[#e9edef]" : "text-gray-900")}>
                <Shield className="w-5 h-5 text-[#00a884]" /> Privacidade
              </h3>
            </div>
            <div className="divide-y divide-[#2a2a2a]/20">
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className={cn("font-medium", isDarkMode ? "text-[#e9edef]" : "text-gray-900")}>Confirmações de leitura</p>
                  <p className={cn("text-sm", isDarkMode ? "text-[#8696a0]" : "text-gray-500")}>Mostrar quando mensagens foram lidas</p>
                </div>
                <Switch
                  checked={settings.read_receipts}
                  onCheckedChange={() => handleToggle("read_receipts")}
                />
              </div>
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className={cn("font-medium", isDarkMode ? "text-[#e9edef]" : "text-gray-900")}>Indicadores de digitação</p>
                  <p className={cn("text-sm", isDarkMode ? "text-[#8696a0]" : "text-gray-500")}>Mostrar quando alguém está digitando</p>
                </div>
                <Switch
                  checked={settings.typing_indicators}
                  onCheckedChange={() => handleToggle("typing_indicators")}
                />
              </div>
            </div>
          </motion.div>

          {/* Appearance Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={cn("rounded-xl overflow-hidden", isDarkMode ? "bg-[#1f2c33]" : "bg-white")}
          >
            <div className={cn("p-4 border-b", isDarkMode ? "border-[#2a2a2a]" : "border-gray-200")}>
              <h3 className={cn("font-semibold flex items-center gap-2", isDarkMode ? "text-[#e9edef]" : "text-gray-900")}>
                <Moon className="w-5 h-5 text-[#00a884]" /> Aparência
              </h3>
            </div>
            <div className="divide-y divide-[#2a2a2a]/20">
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className={cn("font-medium", isDarkMode ? "text-[#e9edef]" : "text-gray-900")}>Modo escuro</p>
                  <p className={cn("text-sm", isDarkMode ? "text-[#8696a0]" : "text-gray-500")}>Usar tema escuro na interface</p>
                </div>
                <Switch
                  checked={settings.dark_mode}
                  onCheckedChange={() => handleToggle("dark_mode")}
                />
              </div>
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className={cn("font-medium", isDarkMode ? "text-[#e9edef]" : "text-gray-900")}>Visual compacto</p>
                  <p className={cn("text-sm", isDarkMode ? "text-[#8696a0]" : "text-gray-500")}>Reduzir espaçamento entre elementos</p>
                </div>
                <Switch
                  checked={settings.compact_view}
                  onCheckedChange={() => handleToggle("compact_view")}
                />
              </div>
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className={cn("font-medium", isDarkMode ? "text-[#e9edef]" : "text-gray-900")}>Download automático de mídia</p>
                  <p className={cn("text-sm", isDarkMode ? "text-[#8696a0]" : "text-gray-500")}>Baixar fotos e vídeos automaticamente</p>
                </div>
                <Switch
                  checked={settings.auto_download_media}
                  onCheckedChange={() => handleToggle("auto_download_media")}
                />
              </div>
            </div>
          </motion.div>

          {/* Language Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={cn("rounded-xl overflow-hidden", isDarkMode ? "bg-[#1f2c33]" : "bg-white")}
          >
            <div className={cn("p-4 border-b", isDarkMode ? "border-[#2a2a2a]" : "border-gray-200")}>
              <h3 className={cn("font-semibold flex items-center gap-2", isDarkMode ? "text-[#e9edef]" : "text-gray-900")}>
                <Languages className="w-5 h-5 text-[#00a884]" /> Idioma
              </h3>
            </div>
            <div className="p-4">
              <select
                value={settings.language}
                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                className={cn("w-full p-3 rounded-lg", isDarkMode ? "bg-[#2a3942] text-[#e9edef] border-[#374045]" : "bg-gray-100 border-gray-200")}
              >
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
              </select>
            </div>
          </motion.div>

          {/* About Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={cn("rounded-xl overflow-hidden text-center p-6", isDarkMode ? "bg-[#1f2c33]" : "bg-white")}
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#00a884] to-[#005c4b] flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <h3 className={cn("font-semibold mb-1", isDarkMode ? "text-[#e9edef]" : "text-gray-900")}>WhatsLidia</h3>
            <p className={cn("text-sm mb-4", isDarkMode ? "text-[#8696a0]" : "text-gray-500")}>Versão 2.0.0</p>
            <p className={cn("text-xs", isDarkMode ? "text-[#54656f]" : "text-gray-400")}>
              © 2026 Lidia. Todos os direitos reservados.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
