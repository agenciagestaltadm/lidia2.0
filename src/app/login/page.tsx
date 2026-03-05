"use client";

export const dynamic = "force-dynamic";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, AlertCircle, Mail, Lock, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { GradientMesh } from "@/components/animations/gradient-mesh";
import { FloatingParticles } from "@/components/animations/floating-particles";
import { FloatingGeometric } from "@/components/animations/floating-geometric";
import { GlassCard } from "@/components/ui/glass-card";
import { NeonButton } from "@/components/ui/neon-button";
import { AnimatedInput } from "@/components/ui/animated-input";
import { fadeInUp, staggerContainer, fadeIn, formError } from "@/lib/animations";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const supabase = createClient();

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateEmail(email)) {
      setError("E-mail inválido");
      return;
    }

    if (!password) {
      setError("Senha obrigatória");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (authError.message.includes("Invalid login")) {
          setError("Credenciais incorretas");
        } else {
          setError(authError.message);
        }
        setIsLoading(false);
        return;
      }

      if (!data.user) {
        setError("Erro ao autenticar");
        setIsLoading(false);
        return;
      }

      router.push("/app/central");
      router.refresh();

    } catch (err) {
      setError("Erro ao fazer login. Tente novamente.");
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="relative z-10 w-full max-w-md px-4"
    >
      <GlassCard className="p-8" hover={false} glow="cyan">
        {/* Header */}
        <motion.div variants={fadeInUp} className="text-center mb-8">
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl"
            style={{
              background: "linear-gradient(135deg, rgba(0,240,255,0.2), rgba(139,92,246,0.2))",
              border: "1px solid rgba(0,240,255,0.3)",
            }}
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Sparkles className="w-8 h-8 text-cyan-400" />
          </motion.div>
          
          <h1 className="text-3xl font-bold mb-2">
            <span className="gradient-text">LIDIA</span>
            <span className="text-white"> 2.0</span>
          </h1>
          <p className="text-slate-400 text-sm">
            Entre com suas credenciais para acessar o sistema
          </p>
        </motion.div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                variants={formError}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div variants={fadeInUp}>
            <AnimatedInput
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              icon={<Mail className="w-5 h-5" />}
            />
          </motion.div>

          <motion.div variants={fadeInUp}>
            <AnimatedInput
              label="Senha"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              icon={<Lock className="w-5 h-5" />}
              iconRight={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              }
            />
          </motion.div>

          <motion.div variants={fadeInUp} className="pt-2">
            <NeonButton
              type="submit"
              variant="cyan"
              size="lg"
              loading={isLoading}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Entrando..." : "Entrar no Sistema"}
            </NeonButton>
          </motion.div>
        </form>

        {/* Footer */}
        <motion.div 
          variants={fadeIn}
          className="mt-8 pt-6 border-t border-white/10 text-center"
        >
          <p className="text-xs text-slate-500">
            CRM Inteligente para Gestão de Relacionamentos
          </p>
          <div className="flex justify-center gap-2 mt-3">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" style={{ animationDelay: "0.2s" }} />
            <span className="w-2 h-2 rounded-full bg-fuchsia-500 animate-pulse" style={{ animationDelay: "0.4s" }} />
          </div>
        </motion.div>
      </GlassCard>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#020617]">
      {/* Animated Background */}
      <GradientMesh />
      
      {/* Floating Particles */}
      <FloatingParticles count={25} />
      
      {/* Geometric Elements */}
      <FloatingGeometric />
      
      {/* Grid Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 240, 255, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 240, 255, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Main Content */}
      <Suspense fallback={
        <div className="flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full"
          />
        </div>
      }>
        <LoginForm />
      </Suspense>

      {/* Corner Glows */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-violet-500/10 rounded-full blur-[100px] pointer-events-none" />
    </div>
  );
}
