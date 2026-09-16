"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { Loader2, Sparkles, FileText, Copy, AtSign, Send } from "lucide-react";
import { generateMessageAction, logContactAction } from "@/lib/actions/prospecting";
import type { Lead, ContactChannel } from "@/types/database";

export function MessageComposer({
  lead,
  templates,
}: {
  lead: Lead;
  templates: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [templateId, setTemplateId] = useState<string>(templates[0]?.id ?? "");
  const [channel, setChannel] = useState<ContactChannel>(lead.instagram_username ? "instagram" : "whatsapp");
  const [generating, startGenerating] = useTransition();
  const [logging, startLogging] = useTransition();

  function handleGenerate(mode: "ai" | "template") {
    startGenerating(async () => {
      try {
        const { message: generated } = await generateMessageAction({
          leadId: lead.id,
          mode,
          templateId: mode === "template" ? templateId : undefined,
        });
        setMessage(generated);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao gerar mensagem.");
      }
    });
  }

  function handleCopy() {
    if (!message) return;
    navigator.clipboard.writeText(message);
    toast.success("Mensagem copiada.");
  }

  function handleOpenInstagram() {
    const url = lead.instagram_url || (lead.instagram_username ? `https://instagram.com/${lead.instagram_username}` : null);
    if (!url) {
      toast.error("Este lead não tem Instagram cadastrado.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handleLogContact() {
    if (!message.trim()) {
      toast.error("Gere ou escreva uma mensagem antes de registrar o contato.");
      return;
    }
    startLogging(async () => {
      try {
        await logContactAction({ leadId: lead.id, channel, message });
        toast.success("Contato registrado. Follow-up agendado automaticamente.");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao registrar contato.");
      }
    });
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Mensagem de prospecção</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => handleGenerate("ai")} disabled={generating}>
            {generating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Gerar com IA
          </Button>
          <Select value={templateId} onValueChange={(v) => setTemplateId(v ?? "")}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Escolher template" /></SelectTrigger>
            <SelectContent>
              {templates.length === 0 && <SelectItem value="__none__" disabled>Nenhum template criado</SelectItem>}
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleGenerate("template")}
            disabled={generating || !templateId}
          >
            <FileText className="size-4" /> Usar template
          </Button>
        </div>

        <Textarea
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="A mensagem gerada aparece aqui — você pode editar antes de enviar."
        />

        <div className="flex flex-wrap items-center gap-2">
          <Select value={channel} onValueChange={(v) => v && setChannel(v as ContactChannel)}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="telefone">Telefone</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={handleCopy}>
            <Copy className="size-4" /> Copiar mensagem
          </Button>
          <Button size="sm" variant="outline" onClick={handleOpenInstagram}>
            <AtSign className="size-4" /> Abrir Instagram
          </Button>
          <Button size="sm" onClick={handleLogContact} disabled={logging}>
            {logging ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Registrar contato
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          O envio automático pela API do Instagram só é usado quando a integração oficial (Configurações →
          Integrações) permitir. Caso contrário, copie a mensagem e envie manualmente.
        </p>
      </CardContent>
    </Card>
  );
}
