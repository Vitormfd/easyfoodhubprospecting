import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { runFingerprintDetection } from "./fingerprint-engine";
import type { DetectionResult } from "./types";

export { runFingerprintDetection };
export type { DetectionResult };

export interface LeadUrlCandidate {
  menuUrl: string | null;
  website: string | null;
}

/** Prioriza a URL do cardápio (mais provável de expor o widget do concorrente). */
export function pickAnalysisUrl(lead: LeadUrlCandidate): string | null {
  return lead.menuUrl || lead.website || null;
}

/**
 * Roda a detecção do concorrente (por padrão Anota AI) para um lead e
 * persiste o resultado em `competitor_detections` + atualiza o resumo
 * em `leads`. Reaproveitável tanto na página do lead quanto na busca
 * em lote.
 */
export async function detectCompetitorForLead(
  supabase: SupabaseClient<Database>,
  leadId: string,
  lead: LeadUrlCandidate,
  competitorSlug: string = "anota_ai",
): Promise<DetectionResult> {
  const { data: competitor } = await supabase
    .from("competitors")
    .select("id, name")
    .eq("slug", competitorSlug)
    .single();

  if (!competitor) {
    throw new Error(`Concorrente "${competitorSlug}" não encontrado no catálogo.`);
  }

  const { data: fingerprints } = await supabase
    .from("competitor_fingerprints")
    .select("*")
    .eq("competitor_id", competitor.id)
    .eq("active", true);

  const url = pickAnalysisUrl(lead);
  const result = await runFingerprintDetection(url, fingerprints ?? []);

  await supabase.from("competitor_detections").insert({
    lead_id: leadId,
    competitor_id: competitor.id,
    status: result.status,
    confidence: result.confidence,
    evidence: result.evidence,
    analyzed_url: result.analyzedUrl,
    reason: result.reason,
  });

  await supabase
    .from("leads")
    .update({
      competitor: result.status === "nao_identificado" ? null : competitor.name,
      competitor_status: result.status,
      competitor_confidence: result.confidence,
      competitor_evidence: result.evidence,
    })
    .eq("id", leadId);

  return result;
}
