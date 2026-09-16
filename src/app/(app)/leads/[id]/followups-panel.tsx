"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check, X, Plus, Loader2 } from "lucide-react";
import { completeFollowupAction, addManualFollowupAction } from "@/lib/actions/prospecting";
import type { FollowUp } from "@/types/database";
import { cn } from "@/lib/utils";

export function FollowupsPanel({ leadId, followups }: { leadId: string; followups: FollowUp[] }) {
  const router = useRouter();
  const [newDate, setNewDate] = useState("");
  const [pending, startTransition] = useTransition();

  function handleComplete(id: string, status: "done" | "skipped") {
    startTransition(async () => {
      try {
        await completeFollowupAction(id, status);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao atualizar follow-up.");
      }
    });
  }

  function handleAdd() {
    if (!newDate) return;
    startTransition(async () => {
      try {
        await addManualFollowupAction({ leadId, dueDate: newDate });
        setNewDate("");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao agendar follow-up.");
      }
    });
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Follow-ups</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {followups.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhum follow-up agendado. Registre um contato para agendar automaticamente.
          </p>
        )}
        <ul className="space-y-2">
          {followups.map((f) => {
            const overdue = f.status === "pending" && f.due_date < today;
            return (
              <li key={f.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                <div>
                  <p className="font-medium">Passo {f.step_number}</p>
                  <p className={cn("text-xs text-muted-foreground", overdue && "font-medium text-destructive")}>
                    {format(new Date(f.due_date + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
                {f.status === "pending" ? (
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="size-7" disabled={pending} onClick={() => handleComplete(f.id, "done")} title="Concluir">
                      <Check className="size-4 text-emerald-600" />
                    </Button>
                    <Button size="icon" variant="ghost" className="size-7" disabled={pending} onClick={() => handleComplete(f.id, "skipped")} title="Pular">
                      <X className="size-4 text-muted-foreground" />
                    </Button>
                  </div>
                ) : (
                  <Badge variant="outline" className="capitalize">{f.status === "done" ? "Concluído" : "Pulado"}</Badge>
                )}
              </li>
            );
          })}
        </ul>
        <div className="flex items-center gap-2 pt-2">
          <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="h-8" />
          <Button size="sm" variant="outline" onClick={handleAdd} disabled={!newDate || pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
