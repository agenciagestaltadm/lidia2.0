"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { WhatsLidiaRealLayout } from "@/components/whatslidia/WhatsLidiaRealLayout";
import { useWhatsAppSessions } from "@/hooks/use-whatsapp-sessions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Smartphone, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export function WhatsAppQRContent() {
  const searchParams = useSearchParams();
  const sessionIdFromUrl = searchParams.get("session");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(sessionIdFromUrl);
  
  const { sessions, loading, refetch: refreshSessions } = useWhatsAppSessions();

  // Filter active sessions
  const activeSessions = sessions.filter(s => s.status === "active");
  
  // Update selected session if URL param changes
  useEffect(() => {
    if (sessionIdFromUrl) {
      setSelectedSessionId(sessionIdFromUrl);
    }
  }, [sessionIdFromUrl]);

  // If a session is selected, show the chat interface
  if (selectedSessionId) {
    return <WhatsLidiaRealLayout sessionId={selectedSessionId} />;
  }

  // Show session selection screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/app/connection">
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-200">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <Smartphone className="h-7 w-7 text-emerald-500" />
                WhatsApp QR
              </h1>
              <p className="text-slate-400 mt-1">
                Selecione uma conexão ativa para iniciar as conversas
              </p>
            </div>
          </div>
          
          <Button
            variant="outline"
            onClick={refreshSessions}
            disabled={loading}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Active Sessions */}
        {activeSessions.length > 0 ? (
          <div className="grid gap-4">
            <h2 className="text-lg font-semibold text-white">Conexões Ativas</h2>
            {activeSessions.map((session) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.01 }}
                className="cursor-pointer"
                onClick={() => setSelectedSessionId(session.id)}
              >
                <Card className="bg-slate-900/50 border-slate-800 hover:border-emerald-500/50 transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                          <Smartphone className="h-7 w-7 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{session.name}</h3>
                          <p className="text-slate-400">
                            {session.phone_number || "Número não sincronizado"}
                          </p>
                          {session.push_name && (
                            <p className="text-sm text-emerald-400">{session.push_name}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                          Conectado
                        </Badge>
                        <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600">
                          Abrir Chat
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          /* No active sessions */
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="text-center">
              <div className="mx-auto w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                <Smartphone className="h-10 w-10 text-slate-500" />
              </div>
              <CardTitle className="text-white text-xl">Nenhuma Conexão Ativa</CardTitle>
              <CardDescription className="text-slate-400">
                Você precisa ter pelo menos uma conexão WhatsApp QR ativa para usar o chat.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center gap-4">
              <Link href="/app/connection">
                <Button className="bg-emerald-500 hover:bg-emerald-600">
                  <Smartphone className="h-4 w-4 mr-2" />
                  Criar Conexão
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Inactive Sessions */}
        {sessions.filter(s => s.status !== "active").length > 0 && (
          <div className="grid gap-4">
            <h2 className="text-lg font-semibold text-slate-400">Outras Conexões</h2>
            {sessions
              .filter(s => s.status !== "active")
              .map((session) => (
                <Card key={session.id} className="bg-slate-900/30 border-slate-800/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center">
                          <Smartphone className="h-5 w-5 text-slate-500" />
                        </div>
                        <div>
                          <h3 className="text-white font-medium">{session.name}</h3>
                          <p className="text-sm text-slate-500">
                            Status: {session.status === 'connecting' ? 'Conectando...' : 
                                    session.status === 'waiting_qr' ? 'Aguardando QR' : 'Desconectado'}
                          </p>
                        </div>
                      </div>
                      <Link href="/app/connection">
                        <Button variant="outline" size="sm" className="border-slate-700 text-slate-300">
                          Gerenciar
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
