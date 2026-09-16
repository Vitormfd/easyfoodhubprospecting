"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { searchEstablishments } from "@/lib/sources";
import { buildDedupKey } from "@/lib/dedupe";
import { detectCompetitorForLead, loadCompetitorContext } from "@/lib/detectors";
import type { LeadInsert } from "@/types/database";

export interface SearchActionState {
  error: string | null;
  result: {
    total: number;
    inserted: number;
    skipped: number;
    sourcesUsed: string[];
    sourceErrors: { source: string; message: string }[];
    insertedLeads: { id: string; business_name: string; city: string; state: string; website: string | null }[];
  } | null;
}

export async function runSearchAction(
  _prev: SearchActionState,
  formData: FormData,
): Promise<SearchActionState> {
  const city = String(formData.get("city") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim().toUpperCase();
  const segments = formData.getAll("segments").map(String);

  if (!city || !state) {
    return { error: "Informe cidade e estado.", result: null };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada.", result: null };

  let aggregated;
  try {
    aggregated = await searchEstablishments({ city, state, segments });
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Falha ao buscar estabelecimentos.",
      result: null,
    };
  }

  if (aggregated.establishments.length === 0) {
    return {
      error: null,
      result: {
        total: 0,
        inserted: 0,
        skipped: 0,
        sourcesUsed: aggregated.sourcesUsed,
        sourceErrors: aggregated.errors,
        insertedLeads: [],
      },
    };
  }

  const rows: LeadInsert[] = aggregated.establishments.map((e) => ({
    user_id: user.id,
    business_name: e.businessName,
    category: e.category,
    city: e.city,
    state: e.state,
    address: e.address,
    phone: e.phone,
    website: e.website,
    source: e.source,
    source_url: e.sourceUrl,
    status: "novo",
    dedup_key: buildDedupKey({
      businessName: e.businessName,
      city: e.city,
      state: e.state,
      phone: e.phone,
      website: e.website,
    }),
  }));

  const { data: insertedRows, error } = await supabase
    .from("leads")
    .upsert(rows, { onConflict: "user_id,dedup_key", ignoreDuplicates: true })
    .select("id, business_name, city, state, website");

  if (error) {
    return { error: `Erro ao salvar leads: ${error.message}`, result: null };
  }

  revalidatePath("/leads");
  revalidatePath("/dashboard");

  const inserted = insertedRows?.length ?? 0;

  return {
    error: null,
    result: {
      total: rows.length,
      inserted,
      skipped: rows.length - inserted,
      sourcesUsed: aggregated.sourcesUsed,
      sourceErrors: aggregated.errors,
      insertedLeads: insertedRows ?? [],
    },
  };
}

const DETECTION_CONCURRENCY = 3;

export async function detectBatchAction(leadIds: string[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão expirada.");

  const { data: leads } = await supabase
    .from("leads")
    .select("id, menu_url, website")
    .in("id", leadIds)
    .eq("user_id", user.id);

  const queue = leads ?? [];
  const summary = { confirmado: 0, provavel: 0, nao_identificado: 0, erros: 0 };
  const competitorContext = await loadCompetitorContext(supabase);

  let index = 0;
  async function worker() {
    while (index < queue.length) {
      const lead = queue[index++];
      try {
        const result = await detectCompetitorForLead(
          supabase,
          lead.id,
          { menuUrl: lead.menu_url, website: lead.website },
          competitorContext,
        );
        summary[result.status]++;
      } catch {
        summary.erros++;
      }
    }
  }

  await Promise.all(Array.from({ length: DETECTION_CONCURRENCY }, worker));

  revalidatePath("/leads");
  revalidatePath("/dashboard");

  return summary;
}
