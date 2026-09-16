import Link from "next/link";
import {
  Building2,
  ShieldCheck,
  ShieldQuestion,
  ShieldAlert,
  PhoneCall,
  Handshake,
  Trophy,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getDashboardData } from "@/lib/queries/dashboard";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompetitorStatusBadge } from "@/components/leads/badges";
import { Progress } from "@/components/ui/progress";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const data = await getDashboardData(supabase, user!.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Visão geral da sua prospecção comercial.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total de estabelecimentos" value={data.total} icon={Building2} accent="navy" />
        <StatCard
          label="Anota AI confirmado"
          value={data.byCompetitorStatus.confirmado}
          icon={ShieldCheck}
          accent="blue"
        />
        <StatCard
          label="Leads prováveis"
          value={data.byCompetitorStatus.provavel}
          icon={ShieldQuestion}
          accent="cyan"
        />
        <StatCard
          label="Não classificados"
          value={data.byCompetitorStatus.nao_identificado}
          icon={ShieldAlert}
        />
        <StatCard label="Contatados" value={data.contactedCount} icon={PhoneCall} accent="blue" />
        <StatCard label="Em negociação" value={data.byStatus.em_negociacao} icon={Handshake} accent="cyan" />
        <StatCard label="Convertidos (clientes)" value={data.byStatus.cliente} icon={Trophy} accent="navy" />
        <StatCard label="Descartados" value={data.byStatus.descartado} icon={XCircle} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Novos leads recentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentLeads.length === 0 && (
              <EmptyHint text="Nenhum lead ainda. Comece pela busca de estabelecimentos." href="/search" />
            )}
            {data.recentLeads.map((lead) => (
              <Link
                key={lead.id}
                href={`/leads/${lead.id}`}
                className="flex items-center justify-between rounded-lg border p-3 text-sm transition-colors hover:bg-accent"
              >
                <div>
                  <p className="font-medium">{lead.business_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {lead.city}/{lead.state} ·{" "}
                    {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
                <CompetitorStatusBadge status={lead.competitor_status} />
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Últimos contatos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentContacts.length === 0 && (
              <EmptyHint text="Nenhum contato registrado ainda." href="/queue" />
            )}
            {data.recentContacts.map((c) => (
              <Link
                key={c.id}
                href={`/leads/${c.lead_id}`}
                className="block rounded-lg border p-3 text-sm transition-colors hover:bg-accent"
              >
                <p className="font-medium">{c.lead_name}</p>
                <p className="text-xs text-muted-foreground">
                  via {c.channel} ·{" "}
                  {formatDistanceToNow(new Date(c.sent_at), { addSuffix: true, locale: ptBR })}
                </p>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Taxa de leads contatados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2 text-3xl font-bold">{data.contactRate}%</p>
            <Progress value={data.contactRate} />
            <p className="mt-2 text-xs text-muted-foreground">
              {data.contactedCount} de {data.total} leads contatados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Leads por segmento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.bySegment.length === 0 && <p className="text-sm text-muted-foreground">Sem dados ainda.</p>}
            {data.bySegment.slice(0, 6).map((s) => (
              <div key={s.segment} className="flex items-center justify-between text-sm">
                <span>{s.segment}</span>
                <span className="font-medium">{s.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Leads por cidade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.byCity.length === 0 && <p className="text-sm text-muted-foreground">Sem dados ainda.</p>}
            {data.byCity.slice(0, 6).map((c) => (
              <div key={c.city} className="flex items-center justify-between text-sm">
                <span>{c.city}</span>
                <span className="font-medium">{c.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EmptyHint({ text, href }: { text: string; href: string }) {
  return (
    <Link href={href} className="block rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground hover:bg-accent">
      {text}
    </Link>
  );
}
