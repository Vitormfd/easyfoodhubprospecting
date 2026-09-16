"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { CompetitorStatusBadge } from "@/components/leads/badges";
import { Sparkles, Copy, AtSign, Check, SkipForward, Loader2, PartyPopper } from "lucide-react";
import { generateMessageAction, logContactAction } from "@/lib/actions/prospecting";
import type { ContactChannel } from "@/types/database";

interface QueueLead {
  id: string;
  business_name: string;
  category: string | null;
  city: string;
  state: string;
  instagram_username: string | null;
  instagram_url: string | null;
  whatsapp: string | null;
  competitor: string | null;
  competitor_status: "confirmado" | "provavel" | "nao_identificado";
  competitor_confidence: number;
}

export function QueueRunner({
  leads,
  templates,
}: {
  leads: QueueLead[];
  templates: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [message, setMessage] = useState("");
  const [generating, startGenerating] = useTransition();
  const [acting, startActing] = useTransition();

  const lead = leads[index];

  if (!lead) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
          <PartyPopper className="size-8 text-brand-blue" />
          <p className="font-medium">Fila zerada por hoje!</p>
          <p className="text-sm text-muted-foreground">Nenhum lead pendente de contato.</p>
        </CardContent>
      </Card>
    );
  }

  function handleGenerate() {
    startGenerating(async () => {
      try {
        const defaultTemplate = templates[0];
        const { message: generated } = await generateMessageAction(
          defaultTemplate
            ? { leadId: lead.id, mode: "template", templateId: defaultTemplate.id }
            : { leadId: lead.id, mode: "ai" },
        );
        setMessage(generated);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao gerar mensagem.");
      }
    });
  }

  function handleOpenInstagram() {
    const url = lead.instagram_url || (lead.instagram_username ? `https://instagram.com/${lead.instagram_username}` : null);
    if (!url) {
      toast.error("Este lead não tem Instagram cadastrado.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handleCopy() {
    if (!message) return;
    navigator.clipboard.writeText(message);
    toast.success("Mensagem copiada.");
  }

  function advance() {
    setMessage("");
    setIndex((i) => i + 1);
  }

  function handleMarkContacted() {
    const channel: ContactChannel = lead.instagram_username ? "instagram" : lead.whatsapp ? "whatsapp" : "outro";
    startActing(async () => {
      try {
        await logContactAction({ leadId: lead.id, channel, message: message || "(contato manual, sem mensagem registrada)" });
        toast.success("Marcado como contatado.");
        router.refresh();
        advance();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao registrar.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <Progress value={((index) / leads.length) * 100} />
      <p className="text-center text-xs text-muted-foreground">
        {index + 1} de {leads.length}
      </p>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-lg">
              <Link href={`/leads/${lead.id}`} className="hover:underline">{lead.business_name}</Link>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {lead.category ?? "—"} · {lead.city}/{lead.state}
            </p>
          </div>
          <div className="text-right">
            <CompetitorStatusBadge status={lead.competitor_status} />
            {lead.competitor && <p className="mt-1 text-xs text-muted-foreground">{lead.competitor}</p>}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleGenerate} disabled={generating}>
              {generating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              Gerar mensagem
            </Button>
            {templates.length > 0 && (
              <Select onValueChange={(id: string | null) => {
                if (!id) return;
                startGenerating(async () => {
                  const { message: generated } = await generateMessageAction({ leadId: lead.id, mode: "template", templateId: id });
                  setMessage(generated);
                });
              }}>
                <SelectTrigger className="w-44"><SelectValue placeholder="Outro template..." /></SelectTrigger>
                <SelectContent>
                  {templates.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>

          <Textarea
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Mensagem pronta para ${lead.business_name} aparece aqui...`}
          />

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={handleOpenInstagram}>
              <AtSign className="size-4" /> Abrir Instagram
            </Button>
            <Button size="sm" variant="outline" onClick={handleCopy}>
              <Copy className="size-4" /> Copiar mensagem
            </Button>
            <Button size="sm" onClick={handleMarkContacted} disabled={acting}>
              {acting ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              Marcar como contatado
            </Button>
            <Button size="sm" variant="ghost" onClick={advance}>
              <SkipForward className="size-4" /> Pular
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
