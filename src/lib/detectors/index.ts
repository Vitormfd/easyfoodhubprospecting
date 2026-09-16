import type { SupabaseClient } from "@supabase/supabase-js";
import type { CompetitorFingerprint, Database } from "@/types/database";
import { runFingerprintDetection } from "./fingerprint-engine";
import type { DetectionResult } from "./types";

export { runFingerprintDetection };
export type { DetectionResult };

export interface LeadUrlCandidate {
  menuUrl: string | null;
  website: string | null;
}

export interface CompetitorContext {
  id: string;
  name: string;
  fingerprints: CompetitorFingerprint[];
}

/** Prioriza a URL do cardápio (mais provável de expor o widget do concorrente). */
export function pickAnalysisUrl(lead: LeadUrlCandidate): string | null {
  return lead.menuUrl || lead.website || null;
}

/**
 * Busca o concorrente + fingerprints ativos uma única vez — reaproveitar
 * este contexto em detecções de vários leads evita refazer as mesmas 2
 * consultas a cada lead de um lote grande.
 */
export async function loadCompetitorContext(
  supabase: SupabaseClient<Database>,
  competitorSlug: string = "anota_ai",
): Promise<CompetitorContext> {
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

  return { id: competitor.id, name: competitor.name, fingerprints: fingerprints ?? [] };
}

/**
 * Roda a detecção do concorrente (por padrão Anota AI) para um lead e
 * persiste o resultado em `competitor_detections` + atualiza o resumo
 * em `leads`. Reaproveitável tanto na página do lead quanto na busca
 * em lote — passe `context` (de `loadCompetitorContext`) para evitar
 * refazer a consulta de fingerprints a cada lead de um lote.
 */
export async function detectCompetitorForLead(
  supabase: SupabaseClient<Database>,
  leadId: string,
  lead: LeadUrlCandidate,
  competitorSlugOrContext: string | CompetitorContext = "anota_ai",
): Promise<DetectionResult> {
  const competitor =
    typeof competitorSlugOrContext === "string"
      ? await loadCompetitorContext(supabase, competitorSlugOrContext)
      : competitorSlugOrContext;

  const url = pickAnalysisUrl(lead);
  const result = await runFingerprintDetection(url, competitor.fingerprints);

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
