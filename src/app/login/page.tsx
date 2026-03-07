"use client";

export const dynamic = "force-dynamic";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, AlertCircle, Mail, Lock } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/hooks/use-auth";
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
  const { signIn, isLoading, error: authError } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

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

    const result = await signIn(email, password);

    if (result.success && result.user) {
      // Redirect based on user role using replace to prevent back-button loop
      if (result.user.role === "SUPER_USER") {
        router.replace("/super/plans");
      } else {
        router.replace("/app/central");
      }
    } else if (result.error) {
      setError(result.error);
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="relative z-10 w-full max-w-md px-4"
    >
      <GlassCard className="p-8" hover={false} glow="green">
        {/* Header */}
        <motion.div variants={fadeInUp} className="text-center mb-8">
          <motion.div
            className="inline-flex items-center justify-center w-20 h-20 mb-4 rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.2))",
              border: "1px solid rgba(16,185,129,0.3)",
            }}
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Image
              src="/1.png"
              alt="LIDIA"
              width={64}
              height={64}
              className="object-contain"
              priority
            />
          </motion.div>
          
          <h1 className="text-3xl font-bold mb-2">
            <span className="gradient-text">LIDIA</span>
            <span className="dark:text-white text-slate-900"> 2.0</span>
          </h1>
          <p className="dark:text-slate-400 text-slate-600 text-sm">
            Entre com suas credenciais para acessar o sistema
          </p>
        </motion.div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <AnimatePresence mode="wait">
            {(error || authError) && (
              <motion.div
                variants={formError}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error || authError}</span>
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
                  className="text-slate-400 hover:text-emerald-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              }
            />
          </motion.div>

          <motion.div variants={fadeInUp} className="pt-2">
            <NeonButton
              type="submit"
              variant="green"
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
          className="mt-8 pt-6 border-t dark:border-white/10 border-slate-200 text-center"
        >
          <p className="text-xs dark:text-slate-500 text-slate-400">
            CRM Inteligente para Gestão de Relacionamentos
          </p>
          <div className="flex justify-center gap-2 mt-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" style={{ animationDelay: "0.2s" }} />
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" style={{ animationDelay: "0.4s" }} />
          </div>
        </motion.div>
      </GlassCard>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden dark:bg-black bg-slate-50">
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
            linear-gradient(rgba(16, 185, 129, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16, 185, 129, 0.5) 1px, transparent 1px)
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
            className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full"
          />
        </div>
      }>
        <LoginForm />
      </Suspense>

      {/* Corner Glows */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
    </div>
  );
}
