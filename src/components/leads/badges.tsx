import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { COMPETITOR_STATUS_LABELS, LEAD_STATUS_LABELS } from "@/lib/constants";
import type { CompetitorStatus, LeadStatus } from "@/types/database";

export function CompetitorStatusBadge({ status }: { status: CompetitorStatus }) {
  const styles: Record<CompetitorStatus, string> = {
    confirmado: "bg-emerald-100 text-emerald-800 border-emerald-200",
    provavel: "bg-amber-100 text-amber-800 border-amber-200",
    nao_identificado: "bg-zinc-100 text-zinc-600 border-zinc-200",
  };

  return (
    <Badge variant="outline" className={cn("font-medium", styles[status])}>
      {COMPETITOR_STATUS_LABELS[status]}
    </Badge>
  );
}

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  const styles: Record<LeadStatus, string> = {
    novo: "bg-blue-50 text-blue-700 border-blue-200",
    qualificado: "bg-indigo-50 text-indigo-700 border-indigo-200",
    contatar: "bg-cyan-50 text-cyan-700 border-cyan-200",
    contatado: "bg-violet-50 text-violet-700 border-violet-200",
    respondeu: "bg-purple-50 text-purple-700 border-purple-200",
    em_negociacao: "bg-amber-50 text-amber-700 border-amber-200",
    cliente: "bg-emerald-50 text-emerald-700 border-emerald-200",
    sem_interesse: "bg-zinc-100 text-zinc-500 border-zinc-200",
    descartado: "bg-red-50 text-red-600 border-red-200",
  };

  return (
    <Badge variant="outline" className={cn("font-medium", styles[status])}>
      {LEAD_STATUS_LABELS[status]}
    </Badge>
  );
}
