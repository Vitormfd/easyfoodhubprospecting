"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { updateProspectingSettingsAction, initialSettingsState } from "./actions";

export function ProspectingForm({
  intervals,
  signature,
}: {
  intervals: number[];
  signature: string | null;
}) {
  const [state, formAction, pending] = useActionState(updateProspectingSettingsAction, initialSettingsState);

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <div className="space-y-2">
        <Label htmlFor="follow_up_intervals">Intervalos de follow-up (dias, separados por vírgula)</Label>
        <Input
          id="follow_up_intervals"
          name="follow_up_intervals"
          defaultValue={intervals.join(", ")}
          placeholder="3, 4, 7"
        />
        <p className="text-xs text-muted-foreground">
          Ex.: &quot;3, 4, 7&quot; agenda o follow-up 1 três dias após o contato inicial, o follow-up 2 quatro dias
          depois do follow-up 1, e assim por diante.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="signature">Assinatura padrão</Label>
        <Textarea id="signature" name="signature" rows={3} defaultValue={signature ?? ""} placeholder="Att, ..." />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.success && <p className="text-sm text-brand-blue">Salvo.</p>}
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Salvar
      </Button>
    </form>
  );
}
