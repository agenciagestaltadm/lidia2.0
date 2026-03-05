"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [captchaValue, setCaptchaValue] = useState("");
  const [captchaQuestion, setCaptchaQuestion] = useState({ question: "", answer: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Generate simple math captcha
  useEffect(() => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    setCaptchaQuestion({
      question: `Quanto é ${num1} + ${num2}?`,
      answer: String(num1 + num2),
    });
  }, []);

  // Check for error in URL
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "no_company") {
      setError("Você não tem empresa vinculada. Contate o administrador.");
    } else if (errorParam === "profile_fetch_failed") {
      setError("Erro ao carregar dados do usuário. Tente novamente em alguns instantes.");
    }
  }, [searchParams]);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!validateEmail(email)) {
      setError("E-mail inválido");
      return;
    }

    if (!password) {
      setError("Senha obrigatória");
      return;
    }

    if (!captchaValue) {
      setError("Por favor, responda o verificador humano");
      return;
    }

    if (captchaValue !== captchaQuestion.answer) {
      setError("Resposta do verificador humano incorreta");
      // Generate new captcha
      const num1 = Math.floor(Math.random() * 10) + 1;
      const num2 = Math.floor(Math.random() * 10) + 1;
      setCaptchaQuestion({
        question: `Quanto é ${num1} + ${num2}?`,
        answer: String(num1 + num2),
      });
      setCaptchaValue("");
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

      // Get user profile to determine redirect
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, is_active, company_id")
        .eq("user_id", data.user.id)
        .single();

      if (!profile) {
        setError("Perfil não encontrado");
        setIsLoading(false);
        return;
      }

      if (!profile.is_active) {
        setError("Usuário desativado");
        await supabase.auth.signOut();
        setIsLoading(false);
        return;
      }

      // Redirect based on role
      if (profile.role === "SUPER_USER") {
        router.push("/super/central");
      } else {
        if (!profile.company_id) {
          setError("Você não tem empresa vinculada");
          await supabase.auth.signOut();
          setIsLoading(false);
          return;
        }
        router.push("/app/central");
      }

      router.refresh();
    } catch {
      setError("Erro ao fazer login. Tente novamente.");
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-3xl">L</span>
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">LIDIA 2.0</CardTitle>
        <CardDescription>
          Entre com suas credenciais para acessar o CRM
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="captcha">Verificador humano: {captchaQuestion.question}</Label>
            <Input
              id="captcha"
              type="text"
              placeholder="Digite a resposta"
              value={captchaValue}
              onChange={(e) => setCaptchaValue(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Entrando...
              </div>
            ) : (
              "Entrar"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Link
          href="/forgot-password"
          className="text-sm text-primary hover:underline"
        >
          Esqueceu a senha?
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Suspense fallback={
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </CardContent>
        </Card>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
