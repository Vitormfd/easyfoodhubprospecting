"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { LEAD_STATUS_ORDER, LEAD_STATUS_LABELS } from "@/lib/constants";
import { updateLeadStatusAction, updateLeadNotesAction } from "@/lib/actions/prospecting";
import type { LeadStatus } from "@/types/database";

export function LeadStatusControl({
  leadId,
  status,
  notes,
}: {
  leadId: string;
  status: LeadStatus;
  notes: string | null;
}) {
  const [currentStatus, setCurrentStatus] = useState(status);
  const [notesValue, setNotesValue] = useState(notes ?? "");
  const [pendingStatus, startStatusTransition] = useTransition();

  // O status pode mudar por outra ação na página (ex.: registrar contato
  // muda o status automaticamente). Re-sincroniza durante a renderização
  // quando o server component pai manda um status novo — ver
  // https://react.dev/reference/react/useState#storing-information-from-previous-renders
  const [prevStatus, setPrevStatus] = useState(status);
  if (status !== prevStatus) {
    setPrevStatus(status);
    setCurrentStatus(status);
  }
  const [pendingNotes, startNotesTransition] = useTransition();

  function handleStatusChange(value: string | null) {
    if (!value) return;
    const newStatus = value as LeadStatus;
    setCurrentStatus(newStatus);
    startStatusTransition(async () => {
      try {
        await updateLeadStatusAction(leadId, newStatus);
        toast.success("Status atualizado.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao atualizar status.");
      }
    });
  }

  function handleSaveNotes() {
    startNotesTransition(async () => {
      try {
        await updateLeadNotesAction(leadId, notesValue);
        toast.success("Observações salvas.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao salvar.");
      }
    });
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Status e observações</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={currentStatus} onValueChange={handleStatusChange} disabled={pendingStatus}>
            <SelectTrigger className="w-full">
              <SelectValue>{(value: string) => LEAD_STATUS_LABELS[value as keyof typeof LEAD_STATUS_LABELS]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {LEAD_STATUS_ORDER.map((s) => (
                <SelectItem key={s} value={s}>{LEAD_STATUS_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Observações</Label>
          <Textarea
            id="notes"
            rows={4}
            value={notesValue}
            onChange={(e) => setNotesValue(e.target.value)}
            placeholder="Anotações internas sobre este lead..."
          />
          <Button size="sm" variant="outline" onClick={handleSaveNotes} disabled={pendingNotes}>
            {pendingNotes && <Loader2 className="size-4 animate-spin" />}
            Salvar observações
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
