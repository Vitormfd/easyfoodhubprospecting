import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, CompetitorStatus, Lead, LeadStatus } from "@/types/database";

export interface LeadFilters {
  status?: LeadStatus;
  competitor?: "confirmado" | "provavel" | "any_signal";
  city?: string;
  segment?: string;
  contacted?: "yes" | "no";
  hasInstagram?: boolean;
  hasWhatsapp?: boolean;
  q?: string;
  sort?: "recent" | "confidence" | "no_contact" | "last_contact";
}

const CONTACTED_STATUSES: LeadStatus[] = [
  "contatado",
  "respondeu",
  "em_negociacao",
  "cliente",
  "sem_interesse",
];

export interface LeadListItem extends Lead {
  last_contact_at: string | null;
  next_followup_at: string | null;
}

export async function listLeads(
  supabase: SupabaseClient<Database>,
  userId: string,
  filters: LeadFilters,
): Promise<LeadListItem[]> {
  let query = supabase.from("leads").select("*").eq("user_id", userId);

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.competitor === "confirmado") query = query.eq("competitor_status", "confirmado");
  if (filters.competitor === "provavel") query = query.eq("competitor_status", "provavel");
  if (filters.competitor === "any_signal") query = query.in("competitor_status", ["confirmado", "provavel"]);
  if (filters.city) query = query.ilike("city", filters.city);
  if (filters.segment) query = query.eq("category", filters.segment);
  if (filters.contacted === "yes") query = query.in("status", CONTACTED_STATUSES);
  if (filters.contacted === "no") query = query.not("status", "in", `(${CONTACTED_STATUSES.join(",")})`);
  if (filters.hasInstagram) query = query.not("instagram_username", "is", null);
  if (filters.hasWhatsapp) query = query.not("whatsapp", "is", null);
  if (filters.q) query = query.ilike("business_name", `%${filters.q}%`);

  if (filters.sort === "confidence") {
    query = query.order("competitor_confidence", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data: leads } = await query;
  const rows = leads ?? [];
  if (rows.length === 0) return [];

  const ids = rows.map((l) => l.id);

  const [{ data: contacts }, { data: followups }] = await Promise.all([
    supabase
      .from("contact_history")
      .select("lead_id, sent_at")
      .in("lead_id", ids)
      .order("sent_at", { ascending: false }),
    supabase
      .from("follow_ups")
      .select("lead_id, due_date")
      .in("lead_id", ids)
      .eq("status", "pending")
      .order("due_date", { ascending: true }),
  ]);

  const lastContactMap = new Map<string, string>();
  for (const c of contacts ?? []) {
    if (!lastContactMap.has(c.lead_id)) lastContactMap.set(c.lead_id, c.sent_at);
  }

  const nextFollowupMap = new Map<string, string>();
  for (const f of followups ?? []) {
    if (!nextFollowupMap.has(f.lead_id)) nextFollowupMap.set(f.lead_id, f.due_date);
  }

  let result: LeadListItem[] = rows.map((lead) => ({
    ...lead,
    last_contact_at: lastContactMap.get(lead.id) ?? null,
    next_followup_at: nextFollowupMap.get(lead.id) ?? null,
  }));

  if (filters.sort === "no_contact") {
    result = result
      .filter((l) => !l.last_contact_at)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } else if (filters.sort === "last_contact") {
    result = result.sort((a, b) => {
      if (!a.last_contact_at) return 1;
      if (!b.last_contact_at) return -1;
      return new Date(b.last_contact_at).getTime() - new Date(a.last_contact_at).getTime();
    });
  }

  return result;
}

export async function getDistinctCitiesAndSegments(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  const { data } = await supabase.from("leads").select("city, category").eq("user_id", userId);
  const cities = new Set<string>();
  const segments = new Set<string>();
  for (const row of data ?? []) {
    if (row.city) cities.add(row.city);
    if (row.category) segments.add(row.category);
  }
  return { cities: [...cities].sort(), segments: [...segments].sort() };
}

export function competitorStatusOf(lead: Lead): CompetitorStatus {
  return lead.competitor_status;
}
