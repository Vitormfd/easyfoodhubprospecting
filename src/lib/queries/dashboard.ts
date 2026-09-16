import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, CompetitorStatus, LeadStatus } from "@/types/database";

export interface DashboardData {
  total: number;
  byStatus: Record<LeadStatus, number>;
  byCompetitorStatus: Record<CompetitorStatus, number>;
  contactedCount: number;
  contactRate: number;
  bySegment: { segment: string; count: number }[];
  byCity: { city: string; count: number }[];
  recentLeads: {
    id: string;
    business_name: string;
    city: string;
    state: string;
    competitor_status: CompetitorStatus;
    created_at: string;
  }[];
  recentContacts: {
    id: string;
    lead_id: string;
    channel: string;
    sent_at: string;
    lead_name: string;
  }[];
}

const EMPTY_STATUS: Record<LeadStatus, number> = {
  novo: 0,
  qualificado: 0,
  contatar: 0,
  contatado: 0,
  respondeu: 0,
  em_negociacao: 0,
  cliente: 0,
  sem_interesse: 0,
  descartado: 0,
};

const EMPTY_COMPETITOR_STATUS: Record<CompetitorStatus, number> = {
  confirmado: 0,
  provavel: 0,
  nao_identificado: 0,
};

const CONTACTED_STATUSES: LeadStatus[] = [
  "contatado",
  "respondeu",
  "em_negociacao",
  "cliente",
  "sem_interesse",
];

export async function getDashboardData(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<DashboardData> {
  const { data: leads } = await supabase
    .from("leads")
    .select("id, business_name, city, state, category, status, competitor_status, created_at")
    .eq("user_id", userId);

  const rows = leads ?? [];

  const byStatus = { ...EMPTY_STATUS };
  const byCompetitorStatus = { ...EMPTY_COMPETITOR_STATUS };
  const segmentCounts = new Map<string, number>();
  const cityCounts = new Map<string, number>();

  for (const lead of rows) {
    byStatus[lead.status] = (byStatus[lead.status] ?? 0) + 1;
    byCompetitorStatus[lead.competitor_status] = (byCompetitorStatus[lead.competitor_status] ?? 0) + 1;
    if (lead.category) segmentCounts.set(lead.category, (segmentCounts.get(lead.category) ?? 0) + 1);
    cityCounts.set(lead.city, (cityCounts.get(lead.city) ?? 0) + 1);
  }

  const contactedCount = CONTACTED_STATUSES.reduce((sum, s) => sum + byStatus[s], 0);

  const recentLeads = [...rows]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6)
    .map((l) => ({
      id: l.id,
      business_name: l.business_name,
      city: l.city,
      state: l.state,
      competitor_status: l.competitor_status,
      created_at: l.created_at,
    }));

  const { data: contacts } = await supabase
    .from("contact_history")
    .select("id, lead_id, channel, sent_at, leads(business_name)")
    .eq("user_id", userId)
    .order("sent_at", { ascending: false })
    .limit(6)
    .returns<
      { id: string; lead_id: string; channel: string; sent_at: string; leads: { business_name: string } | null }[]
    >();

  const recentContacts = (contacts ?? []).map((c) => ({
    id: c.id,
    lead_id: c.lead_id,
    channel: c.channel,
    sent_at: c.sent_at,
    lead_name: c.leads?.business_name ?? "—",
  }));

  return {
    total: rows.length,
    byStatus,
    byCompetitorStatus,
    contactedCount,
    contactRate: rows.length > 0 ? Math.round((contactedCount / rows.length) * 100) : 0,
    bySegment: [...segmentCounts.entries()]
      .map(([segment, count]) => ({ segment, count }))
      .sort((a, b) => b.count - a.count),
    byCity: [...cityCounts.entries()]
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count),
    recentLeads,
    recentContacts,
  };
}
