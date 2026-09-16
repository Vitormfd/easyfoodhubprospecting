"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { TemplateForm } from "./template-form";
import { deleteTemplateAction } from "./actions";
import type { MessageTemplate } from "@/types/database";

export function TemplatesList({ templates }: { templates: MessageTemplate[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteTemplateAction(id);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao excluir.");
      }
    });
  }

  if (templates.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        Nenhum template criado ainda.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {templates.map((t) => (
        <Card key={t.id}>
          <CardContent className="space-y-2 pt-6">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-medium">{t.name}</h3>
              <div className="flex items-center gap-1">
                <TemplateForm template={t} />
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8"
                  disabled={pending}
                  onClick={() => handleDelete(t.id)}
                >
                  {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4 text-destructive" />}
                </Button>
              </div>
            </div>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{t.content}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
