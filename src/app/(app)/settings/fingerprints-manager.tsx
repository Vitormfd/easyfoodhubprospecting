"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus, Loader2 } from "lucide-react";
import { addFingerprintAction, toggleFingerprintAction, deleteFingerprintAction } from "./actions";
import type { CompetitorFingerprint, FingerprintSignalType } from "@/types/database";

const SIGNAL_LABELS: Record<FingerprintSignalType, string> = {
  domain: "Domínio",
  script_src: "Script/CDN",
  meta: "Meta tag",
  html_pattern: "Padrão no HTML",
  header: "Header HTTP",
};

export function FingerprintsManager({
  competitorId,
  competitorName,
  fingerprints,
}: {
  competitorId: string;
  competitorName: string;
  fingerprints: CompetitorFingerprint[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [signalType, setSignalType] = useState<FingerprintSignalType>("domain");
  const [pattern, setPattern] = useState("");
  const [weight, setWeight] = useState("30");
  const [description, setDescription] = useState("");

  function handleAdd() {
    if (!pattern.trim()) {
      toast.error("Informe o padrão a ser detectado.");
      return;
    }
    startTransition(async () => {
      try {
        await addFingerprintAction({
          competitorId,
          signalType,
          pattern: pattern.trim(),
          weight: Number(weight) || 10,
          description: description.trim(),
        });
        setPattern("");
        setDescription("");
        toast.success("Fingerprint adicionado.");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao adicionar.");
      }
    });
  }

  function handleToggle(id: string, active: boolean) {
    startTransition(async () => {
      try {
        await toggleFingerprintAction(id, active);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao atualizar.");
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteFingerprintAction(id);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao excluir.");
      }
    });
  }

  return (
    <div className="max-w-2xl space-y-4">
      <p className="text-sm text-muted-foreground">
        Regras usadas pelo motor de detecção para o concorrente <strong>{competitorName}</strong>. Adicionar um
        padrão aqui muda o resultado da próxima detecção — sem precisar alterar código.
      </p>

      <Card>
        <CardContent className="divide-y p-0">
          {fingerprints.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">Nenhum fingerprint cadastrado.</p>
          )}
          {fingerprints.map((fp) => (
            <div key={fp.id} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{SIGNAL_LABELS[fp.signal_type]}</Badge>
                  <code className="truncate text-sm">{fp.pattern}</code>
                  <span className="shrink-0 text-xs text-muted-foreground">peso {fp.weight}</span>
                </div>
                {fp.description && <p className="mt-0.5 text-xs text-muted-foreground">{fp.description}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Switch checked={fp.active} disabled={pending} onCheckedChange={(v) => handleToggle(fp.id, v)} />
                <Button size="icon" variant="ghost" className="size-8" disabled={pending} onClick={() => handleDelete(fp.id)}>
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <p className="text-sm font-medium">Adicionar novo fingerprint</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Tipo de sinal</Label>
              <Select value={signalType} onValueChange={(v) => setSignalType(v as FingerprintSignalType)}>
                <SelectTrigger className="w-full">
                  <SelectValue>{(value: FingerprintSignalType) => SIGNAL_LABELS[value]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(SIGNAL_LABELS) as FingerprintSignalType[]).map((k) => (
                    <SelectItem key={k} value={k}>{SIGNAL_LABELS[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Peso (1-100)</Label>
              <Input type="number" min={1} max={100} value={weight} onChange={(e) => setWeight(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Padrão</Label>
            <Input
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder={signalType === "header" ? "x-powered-by: anota" : "anota.ai"}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Descrição (opcional)</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="O que esse sinal indica" />
          </div>
          <Button size="sm" onClick={handleAdd} disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Adicionar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
