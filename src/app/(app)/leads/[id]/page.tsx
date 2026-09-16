import { notFound } from "next/navigation";
import { MapPin, Phone, Globe, AtSign, MessageCircle, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompetitorStatusBadge, LeadStatusBadge } from "@/components/leads/badges";
import { LeadStatusControl } from "./lead-status-control";
import { DetectionPanel } from "./detection-panel";
import { MessageComposer } from "./message-composer";
import { ContactHistoryList } from "./contact-history-list";
import { FollowupsPanel } from "./followups-panel";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: lead } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (!lead) notFound();

  const [{ data: templates }, { data: contacts }, { data: followups }] = await Promise.all([
    supabase.from("message_templates").select("id, name").eq("user_id", user!.id).order("name"),
    supabase
      .from("contact_history")
      .select("*")
      .eq("lead_id", id)
      .order("sent_at", { ascending: false }),
    supabase
      .from("follow_ups")
      .select("*")
      .eq("lead_id", id)
      .order("due_date", { ascending: true }),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{lead.business_name}</h1>
          <p className="text-sm text-muted-foreground">
            {lead.category ?? "Sem segmento"} · {lead.city}/{lead.state} · fonte: {lead.source}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LeadStatusBadge status={lead.status} />
          <CompetitorStatusBadge status={lead.competitor_status} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Dados do estabelecimento</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <InfoRow icon={MapPin} label="Endereço" value={lead.address} />
              <InfoRow icon={Phone} label="Telefone" value={lead.phone} />
              <InfoRow icon={MessageCircle} label="WhatsApp" value={lead.whatsapp} />
              <InfoRow
                icon={AtSign}
                label="Instagram"
                value={lead.instagram_username ? `@${lead.instagram_username}` : null}
                href={lead.instagram_url ?? (lead.instagram_username ? `https://instagram.com/${lead.instagram_username}` : null)}
              />
              <InfoRow icon={Globe} label="Site" value={lead.website} href={lead.website} />
              <InfoRow icon={ExternalLink} label="Cardápio" value={lead.menu_url} href={lead.menu_url} />
            </CardContent>
          </Card>

          <DetectionPanel lead={lead} />

          <MessageComposer lead={lead} templates={templates ?? []} />

          <Card>
            <CardHeader><CardTitle className="text-base">Histórico de prospecção</CardTitle></CardHeader>
            <CardContent>
              <ContactHistoryList contacts={contacts ?? []} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <LeadStatusControl leadId={lead.id} status={lead.status} notes={lead.notes} />
          <FollowupsPanel leadId={lead.id} followups={followups ?? []} />
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: string | null;
  href?: string | null;
}) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        {value ? (
          href ? (
            <a href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-blue hover:underline">
              {value}
            </a>
          ) : (
            <p className="font-medium">{value}</p>
          )
        ) : (
          <p className="text-muted-foreground">Não informado</p>
        )}
      </div>
    </div>
  );
}
