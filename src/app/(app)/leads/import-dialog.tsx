"use client";

import { useActionState, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Loader2 } from "lucide-react";
import { importLeadsAction, initialImportState } from "./actions";

export function ImportDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(importLeadsAction, initialImportState);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Upload className="size-4" /> Importar CSV
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar leads via CSV</DialogTitle>
          <DialogDescription>
            Colunas aceitas: business_name (obrigatório), city, state, category, address, phone,
            whatsapp, instagram_username, instagram_url, website, menu_url, notes, status.
            Duplicatas (mesmo nome/cidade/telefone/site) são ignoradas automaticamente.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">Arquivo CSV</Label>
            <Input id="file" name="file" type="file" accept=".csv,text/csv" required />
          </div>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          {state.summary && (
            <p className="text-sm text-muted-foreground">
              {state.summary.total} linhas lidas · <strong className="text-brand-blue">{state.summary.inserted}</strong> importados ·{" "}
              {state.summary.skipped} duplicados · {state.summary.invalid} inválidos
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Importar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
