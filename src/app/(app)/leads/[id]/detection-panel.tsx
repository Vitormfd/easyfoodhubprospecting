"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CompetitorStatusBadge } from "@/components/leads/badges";
import { Loader2, RefreshCcw } from "lucide-react";
import { runDetectionAction } from "@/lib/actions/prospecting";
import type { Lead } from "@/types/database";

export function DetectionPanel({ lead }: { lead: Lead }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleRun() {
    startTransition(async () => {
      try {
        const result = await runDetectionAction(lead.id);
        toast.success(`Análise concluída: ${result.status} (${result.confidence}%).`);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao analisar.");
      }
    });
  }

  const hasUrl = Boolean(lead.menu_url || lead.website);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Detecção de concorrente — Anota AI</CardTitle>
        <Button size="sm" variant="outline" onClick={handleRun} disabled={pending || !hasUrl}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCcw className="size-4" />}
          Rodar detecção
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {!hasUrl && (
          <p className="text-sm text-muted-foreground">
            Nenhuma URL pública (site ou cardápio) cadastrada — não é possível analisar.
          </p>
        )}

        <div className="flex items-center gap-2">
          <CompetitorStatusBadge status={lead.competitor_status} />
          {lead.competitor_status !== "nao_identificado" && (
            <span className="text-sm font-medium">{lead.competitor_confidence}% de confiança</span>
          )}
        </div>

        {lead.competitor_evidence.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Evidência encontrada</p>
            <ul className="space-y-1.5">
              {lead.competitor_evidence.map((item, i) => (
                <li key={i} className="rounded-md border bg-muted/40 p-2 text-xs">
                  <span className="font-medium">{item.description || item.signal_type}</span>
                  {" — "}
                  <code className="text-muted-foreground">{item.matched}</code>
                  <span className="ml-1 text-muted-foreground">(peso {item.weight})</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhuma evidência registrada ainda. Rode a detecção para analisar a URL pública deste lead.
          </p>
        )}

        <p className="text-xs text-muted-foreground">
          Última atualização: {format(new Date(lead.updated_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
        </p>
      </CardContent>
    </Card>
  );
}
