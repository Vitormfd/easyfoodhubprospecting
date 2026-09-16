"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { BRAZIL_STATES, SEGMENTS } from "@/lib/constants";
import { updateSearchDefaultsAction, type SettingsActionState } from "./actions";

const initialSettingsState: SettingsActionState = { error: null, success: false };

export function SearchDefaultsForm({
  defaultCity,
  defaultState,
  defaultSegments,
}: {
  defaultCity: string;
  defaultState: string;
  defaultSegments: string[];
}) {
  const [state, formAction, pending] = useActionState(updateSearchDefaultsAction, initialSettingsState);
  const [uf, setUf] = useState(defaultState);

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <div className="space-y-2">
        <Label htmlFor="default_city">Cidade padrão</Label>
        <Input id="default_city" name="default_city" defaultValue={defaultCity} />
      </div>
      <div className="space-y-2">
        <Label>Estado padrão</Label>
        <Select value={uf} onValueChange={(v) => setUf(v ?? "")}>
          <SelectTrigger className="w-full"><SelectValue placeholder="UF" /></SelectTrigger>
          <SelectContent>
            {BRAZIL_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <input type="hidden" name="default_state" value={uf} />
      </div>
      <div className="space-y-2">
        <Label>Segmentos padrão</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SEGMENTS.map((s) => (
            <label key={s} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
              <Checkbox name="default_segments" value={s} defaultChecked={defaultSegments.includes(s)} />
              {s}
            </label>
          ))}
        </div>
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
