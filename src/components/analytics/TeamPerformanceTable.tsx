"use client";

import { TeamMemberPerformance } from "@/hooks/use-analytics";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface TeamPerformanceTableProps {
  data: TeamMemberPerformance[] | undefined;
  isLoading?: boolean;
  className?: string;
}

/**
 * Tabela de desempenho da equipe para o dashboard analítico.
 * 
 * Exibe métricas detalhadas de cada agente em formato tabular.
 */
export function TeamPerformanceTable({
  data,
  isLoading = false,
  className,
}: TeamPerformanceTableProps) {
  if (isLoading) {
    return (
      <Card className={cn("dark:bg-[#0a0a0a]/80 bg-white", className)}>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const members = data || [];

  return (
    <Card className={cn("dark:bg-[#0a0a0a]/80 bg-white", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium dark:text-slate-200 text-slate-800">
          Desempenho da Equipe
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-emerald-500/10 border-slate-200">
                <th className="text-left py-3 px-2 text-xs font-medium dark:text-slate-400 text-slate-500 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="text-center py-3 px-2 text-xs font-medium dark:text-slate-400 text-slate-500 uppercase tracking-wider">
                  Pendentes
                </th>
                <th className="text-center py-3 px-2 text-xs font-medium dark:text-slate-400 text-slate-500 uppercase tracking-wider">
                  Atendendo
                </th>
                <th className="text-center py-3 px-2 text-xs font-medium dark:text-slate-400 text-slate-500 uppercase tracking-wider">
                  Finalizados
                </th>
                <th className="text-center py-3 px-2 text-xs font-medium dark:text-slate-400 text-slate-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="text-center py-3 px-2 text-xs font-medium dark:text-slate-400 text-slate-500 uppercase tracking-wider">
                  Média de Avaliações
                </th>
                <th className="text-center py-3 px-2 text-xs font-medium dark:text-slate-400 text-slate-500 uppercase tracking-wider">
                  Tempo Médio 1ª Resposta
                </th>
                <th className="text-center py-3 px-2 text-xs font-medium dark:text-slate-400 text-slate-500 uppercase tracking-wider">
                  Tempo Médio de Atendimento (TMA)
                </th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-8 text-center text-sm dark:text-slate-500 text-slate-400"
                  >
                    Nenhum dado disponível
                  </td>
                </tr>
              ) : (
                members.map((member, index) => (
                  <tr
                    key={member.userId}
                    className={cn(
                      "border-b dark:border-emerald-500/5 border-slate-100",
                      "hover:dark:bg-white/5 hover:bg-slate-50 transition-colors",
                      index % 2 === 0 ? "dark:bg-white/[0.02] bg-slate-50/50" : ""
                    )}
                  >
                    {/* Usuário */}
                    <td className="py-3 px-2">
                      <div>
                        <p className="text-sm font-medium dark:text-slate-200 text-slate-800">
                          {member.userName}
                        </p>
                        {member.userEmail && (
                          <p className="text-xs dark:text-slate-500 text-slate-400">
                            {member.userEmail}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Pendentes */}
                    <td className="py-3 px-2 text-center">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                          member.pending > 0
                            ? "dark:bg-amber-500/20 bg-amber-100 dark:text-amber-400 text-amber-700"
                            : "dark:text-slate-500 text-slate-400"
                        )}
                      >
                        {member.pending}
                      </span>
                    </td>

                    {/* Atendendo */}
                    <td className="py-3 px-2 text-center">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                          member.attending > 0
                            ? "dark:bg-emerald-500/20 bg-emerald-100 dark:text-emerald-400 text-emerald-700"
                            : "dark:text-slate-500 text-slate-400"
                        )}
                      >
                        {member.attending}
                      </span>
                    </td>

                    {/* Finalizados */}
                    <td className="py-3 px-2 text-center">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                          member.finished > 0
                            ? "dark:bg-blue-500/20 bg-blue-100 dark:text-blue-400 text-blue-700"
                            : "dark:text-slate-500 text-slate-400"
                        )}
                      >
                        {member.finished}
                      </span>
                    </td>

                    {/* Total */}
                    <td className="py-3 px-2 text-center">
                      <span className="text-sm font-semibold dark:text-slate-200 text-slate-800">
                        {member.total}
                      </span>
                    </td>

                    {/* Média de Avaliações */}
                    <td className="py-3 px-2 text-center">
                      <span className="text-sm dark:text-slate-400 text-slate-500">
                        {member.avgRating?.toFixed(1) || "-"}
                      </span>
                    </td>

                    {/* Tempo Médio 1ª Resposta */}
                    <td className="py-3 px-2 text-center">
                      <span className="text-sm dark:text-slate-400 text-slate-500">
                        {member.avgFirstResponse || "-"}
                      </span>
                    </td>

                    {/* TMA */}
                    <td className="py-3 px-2 text-center">
                      <span className="text-sm dark:text-slate-400 text-slate-500">
                        {member.avgTMA || "-"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
