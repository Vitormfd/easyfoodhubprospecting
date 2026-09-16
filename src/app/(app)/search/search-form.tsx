"use client";

import { useActionState, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
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
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Search, Sparkles, AlertTriangle } from "lucide-react";
import { BRAZIL_STATES, SEGMENTS } from "@/lib/constants";
import { runSearchAction, detectBatchAction, type SearchActionState } from "./actions";

const initialSearchState: SearchActionState = { error: null, result: null };

export function SearchForm({
  defaultCity,
  defaultState,
  defaultSegments,
}: {
  defaultCity: string;
  defaultState: string;
  defaultSegments: string[];
}) {
  const [state, formAction, pending] = useActionState(runSearchAction, initialSearchState);
  const [city, setCity] = useState(defaultCity || "");
  const [selectedState, setSelectedState] = useState(defaultState || "");
  const [selectedSegments, setSelectedSegments] = useState<string[]>(defaultSegments);
  const [detecting, startDetecting] = useTransition();

  function toggleSegment(segment: string, checked: boolean) {
    setSelectedSegments((prev) =>
      checked ? [...prev, segment] : prev.filter((s) => s !== segment),
    );
  }

  function handleDetectAll() {
    if (!state.result) return;
    const ids = state.result.insertedLeads.map((l) => l.id);
    if (ids.length === 0) return;
    startDetecting(async () => {
      const summary = await detectBatchAction(ids);
      toast.success(
        `Detecção concluída: ${summary.confirmado} confirmado(s), ${summary.provavel} provável(is), ${summary.nao_identificado} não identificado(s).`,
      );
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <form action={formAction} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  name="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Senhor do Bonfim"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Select value={selectedState} onValueChange={(v) => setSelectedState(v ?? "")}>
                  <SelectTrigger id="state" className="w-full">
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRAZIL_STATES.map((uf) => (
                      <SelectItem key={uf} value={uf}>
                        {uf}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input type="hidden" name="state" value={selectedState} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Segmentos</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {SEGMENTS.map((segment) => (
                  <label
                    key={segment}
                    className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent"
                  >
                    <Checkbox
                      name="segments"
                      value={segment}
                      checked={selectedSegments.includes(segment)}
                      onCheckedChange={(checked) => toggleSegment(segment, checked === true)}
                    />
                    {segment}
                  </label>
                ))}
              </div>
            </div>

            {state.error && (
              <Alert variant="destructive">
                <AlertTriangle className="size-4" />
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              {pending ? "Buscando..." : "Buscar estabelecimentos"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {state.result && (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm">
                  <strong>{state.result.total}</strong> encontrados ·{" "}
                  <strong className="text-brand-blue">{state.result.inserted}</strong> novos leads salvos ·{" "}
                  <strong className="text-muted-foreground">{state.result.skipped}</strong> já existiam
                </p>
                <p className="text-xs text-muted-foreground">
                  Fontes: {state.result.sourcesUsed.join(", ") || "nenhuma"}
                </p>
              </div>
              {state.result.insertedLeads.length > 0 && (
                <Button size="sm" variant="outline" onClick={handleDetectAll} disabled={detecting}>
                  {detecting ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                  Detectar Anota AI nesses leads
                </Button>
              )}
            </div>

            {state.result.sourceErrors.length > 0 && (
              <Alert>
                <AlertTriangle className="size-4" />
                <AlertTitle>Algumas fontes falharam</AlertTitle>
                <AlertDescription>
                  {state.result.sourceErrors.map((e) => `${e.source}: ${e.message}`).join(" · ")}
                </AlertDescription>
              </Alert>
            )}

            <div className="divide-y rounded-md border">
              {state.result.insertedLeads.length === 0 && (
                <p className="p-4 text-sm text-muted-foreground">
                  {state.result.total === 0
                    ? "Nenhum estabelecimento encontrado para essa combinação de cidade/segmentos. Tente outros segmentos ou confira a grafia da cidade."
                    : "Nenhum lead novo — todos os resultados já estavam cadastrados."}
                </p>
              )}
              {state.result.insertedLeads.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/leads/${lead.id}`}
                  className="flex items-center justify-between p-3 text-sm hover:bg-accent"
                >
                  <span className="font-medium">{lead.business_name}</span>
                  <span className="text-muted-foreground">
                    {lead.city}/{lead.state}
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
