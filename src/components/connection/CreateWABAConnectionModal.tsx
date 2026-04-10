"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  BadgeCheck, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Eye,
  EyeOff,
  Copy,
  Check,
  Webhook,
  Info
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowBadge } from "@/components/ui/glow-badge";
import { cn } from "@/lib/utils";
import { AnimatedInput } from "@/components/ui/animated-input";
import { useWABAConnections } from "@/hooks/use-waba-webhook";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

interface CreateWABAConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const API_VERSIONS = [
  { value: "v17.0", label: "v17.0" },
  { value: "v18.0", label: "v18.0 (Recomendada)" },
  { value: "v19.0", label: "v19.0" },
  { value: "v20.0", label: "v20.0 (Mais recente)" },
];

interface FormData {
  name: string;
  phoneNumberId: string;
  businessAccountId: string;
  accessToken: string;
  apiVersion: string;
}

interface FormErrors {
  name?: string;
  phoneNumberId?: string;
  businessAccountId?: string;
  accessToken?: string;
}

export function CreateWABAConnectionModal({
  isOpen,
  onClose,
  onSuccess
}: CreateWABAConnectionModalProps) {
  const { user } = useAuth();
  const { createConnection, isLoading } = useWABAConnections();
  
  const [formData, setFormData] = useState<FormData>({
    name: "",
    phoneNumberId: "",
    businessAccountId: "",
    accessToken: "",
    apiVersion: "v18.0"
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [showToken, setShowToken] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [testError, setTestError] = useState<string>("");
  const [createdConnection, setCreatedConnection] = useState<{
    id: string;
    webhookUrl: string;
    verifyToken: string;
  } | null>(null);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Nome da conexão é obrigatório";
    }
    
    if (!formData.phoneNumberId.trim()) {
      newErrors.phoneNumberId = "ID do número de telefone é obrigatório";
    } else if (!/^\d+$/.test(formData.phoneNumberId)) {
      newErrors.phoneNumberId = "ID deve conter apenas números";
    }
    
    if (!formData.businessAccountId.trim()) {
      newErrors.businessAccountId = "ID da conta WhatsApp Business é obrigatório";
    } else if (!/^\d+$/.test(formData.businessAccountId)) {
      newErrors.businessAccountId = "ID deve conter apenas números";
    }
    
    if (!formData.accessToken.trim()) {
      newErrors.accessToken = "Token de acesso é obrigatório";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleTestConnection = useCallback(async () => {
    if (!validateForm()) return;
    
    setTestStatus("testing");
    setTestError("");
    
    try {
      const response = await fetch("/api/waba/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_number_id: formData.phoneNumberId,
          business_account_id: formData.businessAccountId,
          access_token: formData.accessToken,
          api_version: formData.apiVersion
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTestStatus("success");
        toast.success("Conexão testada com sucesso!");
      } else {
        setTestStatus("error");
        setTestError(data.error || "Erro ao testar conexão");
        toast.error(data.error || "Erro ao testar conexão");
      }
    } catch (error) {
      setTestStatus("error");
      setTestError("Erro inesperado ao testar conexão");
      toast.error("Erro ao testar conexão");
    }
  }, [formData, validateForm]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;
    if (!user?.companyId) {
      toast.error("Empresa não encontrada");
      return;
    }
    if (!user?.id) {
      toast.error("Usuário não autenticado. Faça login novamente.");
      return;
    }
    
    const result = await createConnection({
      company_id: user.companyId,
      name: formData.name,
      phone_number_id: formData.phoneNumberId,
      business_account_id: formData.businessAccountId,
      access_token: formData.accessToken,
      api_version: formData.apiVersion,
      created_by: user.id
    });
    
    if (result) {
      setCreatedConnection(result);
      toast.success("Conexão criada com sucesso!");
    } else {
      // createConnection already shows toast.error internally
      console.error("[CreateWABAConnectionModal] createConnection returned null - check RLS policies and user permissions");
    }
  }, [formData, user?.companyId, user?.id, createConnection, validateForm]);

  const handleClose = useCallback(() => {
    setFormData({
      name: "",
      phoneNumberId: "",
      businessAccountId: "",
      accessToken: "",
      apiVersion: "v18.0"
    });
    setErrors({});
    setTestStatus("idle");
    setTestError("");
    setCreatedConnection(null);
    onClose();
    onSuccess?.();
  }, [onClose, onSuccess]);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copiado para a área de transferência!");
    } catch {
      toast.error("Erro ao copiar");
    }
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <>
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <GlassCard
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-0"
            glow="blue"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b dark:border-white/10 border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                  <BadgeCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold dark:text-white text-slate-900">
                    WhatsApp API Oficial
                  </h2>
                  <p className="text-sm dark:text-slate-400 text-slate-600">
                    Configure sua conexão com a API oficial da Meta
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg hover:dark:bg-white/10 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 dark:text-slate-400 text-slate-600" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {!createdConnection ? (
                <>
                  {/* Info Alert */}
                  <div className="flex items-start gap-3 p-4 rounded-lg dark:bg-blue-500/10 bg-blue-50 border dark:border-blue-500/20 border-blue-200">
                    <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-blue-400">
                        Onde encontrar estas informações?
                      </p>
                      <p className="text-sm dark:text-slate-300 text-slate-600">
                        Acesse o{" "}
                        <a 
                          href="https://developers.facebook.com/apps" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline"
                        >
                          Facebook Developers
                        </a>{" "}
                        e vá em WhatsApp &gt; Configuração da API.
                      </p>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-4">
                    {/* Connection Name */}
                    <div>
                      <AnimatedInput
                        label="Nome da Conexão"
                        placeholder="Ex: WhatsApp Empresa Principal"
                        value={formData.name}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, name: e.target.value }));
                          if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
                        }}
                        error={errors.name}
                      />
                    </div>

                    {/* Phone Number ID */}
                    <div>
                      <AnimatedInput
                        label="ID do Número de Telefone"
                        placeholder="Ex: 123456789012345"
                        value={formData.phoneNumberId}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, phoneNumberId: e.target.value }));
                          if (errors.phoneNumberId) setErrors(prev => ({ ...prev, phoneNumberId: undefined }));
                        }}
                        error={errors.phoneNumberId}
                      />
                      <p className="mt-1 text-xs dark:text-slate-500 text-slate-400">
                        Encontre em: WhatsApp &gt; Configuração da API &gt; Número de telefone
                      </p>
                    </div>

                    {/* Business Account ID */}
                    <div>
                      <AnimatedInput
                        label="ID da Conta WhatsApp Business"
                        placeholder="Ex: 987654321098765"
                        value={formData.businessAccountId}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, businessAccountId: e.target.value }));
                          if (errors.businessAccountId) setErrors(prev => ({ ...prev, businessAccountId: undefined }));
                        }}
                        error={errors.businessAccountId}
                      />
                      <p className="mt-1 text-xs dark:text-slate-500 text-slate-400">
                        Encontre em: WhatsApp &gt; Configuração &gt; ID da Conta WhatsApp Business
                      </p>
                    </div>

                    {/* Access Token */}
                    <div>
                      <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">
                        Token do Gerenciador de Negócios
                      </label>
                      <div className="relative">
                        <input
                          type={showToken ? "text" : "password"}
                          placeholder="EAA..."
                          value={formData.accessToken}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, accessToken: e.target.value }));
                            if (errors.accessToken) setErrors(prev => ({ ...prev, accessToken: undefined }));
                          }}
                          className={cn(
                            "w-full px-4 py-3 rounded-lg border bg-transparent transition-colors",
                            "dark:text-white text-slate-900",
                            "dark:bg-slate-800 bg-white",
                            errors.accessToken 
                              ? "border-red-500 focus:border-red-500" 
                              : "dark:border-slate-700 border-slate-300 focus:border-blue-500"
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => setShowToken(!showToken)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md dark:text-slate-400 text-slate-500 hover:dark:bg-white/10 hover:bg-slate-100 transition-colors"
                        >
                          {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.accessToken && (
                        <p className="mt-1 text-sm text-red-400">{errors.accessToken}</p>
                      )}
                      <p className="mt-1 text-xs dark:text-slate-500 text-slate-400">
                        Gere um token em: Ferramentas &gt; Gerenciador de Negócios &gt; Configurações do sistema &gt; Tokens
                      </p>
                    </div>

                    {/* API Version */}
                    <div>
                      <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">
                        Versão da API
                      </label>
                      <select
                        value={formData.apiVersion}
                        onChange={(e) => setFormData(prev => ({ ...prev, apiVersion: e.target.value }))}
                        className={cn(
                          "w-full px-4 py-3 rounded-lg border bg-transparent transition-colors",
                          "dark:text-white text-slate-900",
                          "dark:bg-slate-800 bg-white",
                          "dark:border-slate-700 border-slate-300 focus:border-blue-500"
                        )}
                      >
                        {API_VERSIONS.map(version => (
                          <option key={version.value} value={version.value}>
                            {version.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Test Result */}
                  {testStatus === "success" && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                      <span className="text-sm text-emerald-400">
                        Conexão testada com sucesso! Suas credenciais estão válidas.
                      </span>
                    </div>
                  )}

                  {testStatus === "error" && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-sm text-red-400 font-medium">Erro na conexão</span>
                        <p className="text-sm text-red-300 mt-1">{testError}</p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleTestConnection}
                      disabled={isLoading || testStatus === "testing"}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors",
                        testStatus === "success"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "dark:bg-white/10 bg-slate-100 dark:text-white text-slate-700 hover:dark:bg-white/20 hover:bg-slate-200",
                        (isLoading || testStatus === "testing") && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {testStatus === "testing" ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Testando...
                        </>
                      ) : testStatus === "success" ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Conexão OK
                        </>
                      ) : (
                        <>
                          Testar Conexão
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={handleSubmit}
                      disabled={isLoading || testStatus !== "success"}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors",
                        "bg-blue-500 text-white hover:bg-blue-600",
                        (isLoading || testStatus !== "success") && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        "Criar Conexão"
                      )}
                    </button>
                  </div>
                </>
              ) : (
                /* Success State - Show Webhook Info */
                <div className="space-y-6">
                  <div className="flex items-center justify-center">
                    <div className="p-4 rounded-full bg-emerald-500/10">
                      <CheckCircle className="w-12 h-12 text-emerald-400" />
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <h3 className="text-lg font-semibold dark:text-white text-slate-900">
                      Conexão Criada com Sucesso!
                    </h3>
                    <p className="text-sm dark:text-slate-400 text-slate-500 mt-1">
                      Configure o webhook no Facebook Developers para começar a receber mensagens.
                    </p>
                  </div>

                  {/* Webhook URL */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium dark:text-slate-300 text-slate-700">
                      URL do Webhook
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-4 py-3 rounded-lg dark:bg-slate-800 bg-slate-100 border dark:border-slate-700 border-slate-200 font-mono text-sm dark:text-emerald-400 text-emerald-600 truncate">
                        {createdConnection.webhookUrl}
                      </div>
                      <button
                        onClick={() => copyToClipboard(createdConnection.webhookUrl)}
                        className="p-3 rounded-lg dark:bg-white/10 bg-slate-200 dark:text-slate-300 text-slate-600 hover:dark:bg-white/20 hover:bg-slate-300 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Verify Token */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium dark:text-slate-300 text-slate-700">
                      Token de Verificação
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-4 py-3 rounded-lg dark:bg-slate-800 bg-slate-100 border dark:border-slate-700 border-slate-200 font-mono text-sm dark:text-slate-300 text-slate-700">
                        {createdConnection.verifyToken}
                      </div>
                      <button
                        onClick={() => copyToClipboard(createdConnection.verifyToken)}
                        className="p-3 rounded-lg dark:bg-white/10 bg-slate-200 dark:text-slate-300 text-slate-600 hover:dark:bg-white/20 hover:bg-slate-300 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Info Box */}
                  <div className="flex items-start gap-3 p-4 rounded-lg dark:bg-blue-500/10 bg-blue-50 border dark:border-blue-500/20 border-blue-200">
                    <Webhook className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-blue-400">
                        Próximos passos
                      </p>
                      <ol className="text-sm dark:text-slate-300 text-slate-600 list-decimal list-inside space-y-1">
                        <li>Copie a URL do webhook acima</li>
                        <li>Vá para o Facebook Developers &gt; Seu App &gt; WhatsApp &gt; Configuração</li>
                        <li>Cole a URL no campo "URL de callback"</li>
                        <li>Cole o token de verificação</li>
                        <li>Clique em "Verificar e salvar"</li>
                      </ol>
                    </div>
                  </div>

                  <button
                    onClick={handleClose}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    Concluir
                  </button>
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>
      </>
    </AnimatePresence>
  );
}
