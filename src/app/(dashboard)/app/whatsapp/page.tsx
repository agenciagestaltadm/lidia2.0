"use client";

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { WhatsAppQRContent } from "./WhatsAppQRContent";

// Loading component
function LoadingState() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white">Carregando...</p>
      </div>
    </div>
  );
}

export default function WhatsAppQRPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <WhatsAppQRContent />
    </Suspense>
  );
}
