"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";
import { completeFollowupAction } from "@/lib/actions/prospecting";

export interface FollowupItem {
  id: string;
  lead_id: string;
  step_number: number;
  due_date: string;
  business_name: string;
}

export function FollowupsList({ items }: { items: FollowupItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handle(id: string, status: "done" | "skipped") {
    startTransition(async () => {
      try {
        await completeFollowupAction(id, status);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao atualizar.");
      }
    });
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Nada por aqui.
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="divide-y p-0">
        {items.map((f) => (
          <div key={f.id} className="flex items-center justify-between p-3">
            <div>
              <Link href={`/leads/${f.lead_id}`} className="font-medium hover:underline">
                {f.business_name}
              </Link>
              <p className="text-xs text-muted-foreground">
                Passo {f.step_number} · {format(new Date(f.due_date + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" className="size-8" disabled={pending} onClick={() => handle(f.id, "done")} title="Concluir">
                {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4 text-emerald-600" />}
              </Button>
              <Button size="icon" variant="ghost" className="size-8" disabled={pending} onClick={() => handle(f.id, "skipped")} title="Pular">
                <X className="size-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
