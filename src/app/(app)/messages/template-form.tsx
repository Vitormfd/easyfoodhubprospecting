"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Pencil } from "lucide-react";
import { saveTemplateAction, initialTemplateState } from "./actions";
import { MESSAGE_VARIABLES } from "@/lib/constants";
import type { MessageTemplate } from "@/types/database";

export function TemplateForm({ template }: { template?: MessageTemplate }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState(initialTemplateState);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await saveTemplateAction(state, formData);
      setState(result);
      if (result.success) {
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {template ? (
        <DialogTrigger render={<Button variant="ghost" size="icon" className="size-8" />}>
          <Pencil className="size-4" />
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button size="sm" />}>
          <Plus className="size-4" /> Novo template
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{template ? "Editar template" : "Novo template"}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="id" value={template?.id ?? ""} />
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" defaultValue={template?.name} placeholder="Primeiro contato" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Mensagem</Label>
            <Textarea
              id="content"
              name="content"
              rows={5}
              defaultValue={template?.content}
              placeholder="Oi, pessoal da {{empresa}}! ..."
              required
            />
            <p className="text-xs text-muted-foreground">
              Variáveis disponíveis: {MESSAGE_VARIABLES.map((v) => `{{${v.key}}}`).join(", ")}
            </p>
          </div>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
