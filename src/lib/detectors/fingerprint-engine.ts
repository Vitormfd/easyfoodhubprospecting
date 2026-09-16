import type { CompetitorFingerprint, EvidenceItem } from "@/types/database";
import { fetchPageSignals } from "./fetch-page";
import type { DetectionResult, PageSignals } from "./types";

const CONFIRMED_THRESHOLD = 55;
const PROBABLE_THRESHOLD = 20;

/** Extrai src/href de <script>/<link> e o texto de tags <meta>. */
function extractAssets(html: string) {
  const scriptSrcs = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map((m) => m[1]);
  const linkHrefs = [...html.matchAll(/<link[^>]+href=["']([^"']+)["']/gi)].map((m) => m[1]);
  const metaTags = [...html.matchAll(/<meta[^>]+>/gi)].map((m) => m[0]);
  return { scriptSrcs: [...scriptSrcs, ...linkHrefs], metaTags };
}

function matchFingerprint(
  fp: CompetitorFingerprint,
  signals: PageSignals,
  assets: ReturnType<typeof extractAssets>,
): string | null {
  const pattern = fp.pattern.toLowerCase();

  switch (fp.signal_type) {
    case "domain": {
      const host = safeHostname(signals.finalUrl);
      return host.includes(pattern) ? host : null;
    }
    case "script_src": {
      const hit = assets.scriptSrcs.find((src) => src.toLowerCase().includes(pattern));
      return hit ?? null;
    }
    case "meta": {
      const hit = assets.metaTags.find((tag) => tag.toLowerCase().includes(pattern));
      return hit ?? null;
    }
    case "html_pattern": {
      const idx = signals.html.toLowerCase().indexOf(pattern);
      if (idx === -1) return null;
      return signals.html.slice(Math.max(0, idx - 20), idx + pattern.length + 20).trim();
    }
    case "header": {
      const [key, ...rest] = pattern.split(":");
      const expected = rest.join(":").trim();
      const actual = signals.headers[key.trim()];
      if (!actual) return null;
      return !expected || actual.toLowerCase().includes(expected)
        ? `${key.trim()}: ${actual}`
        : null;
    }
    default:
      return null;
  }
}

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

/**
 * Roda o motor de fingerprint genérico contra uma URL pública, usando
 * as regras armazenadas em `competitor_fingerprints` — nenhum padrão é
 * hardcoded aqui. Adicionar/editar sinais de um concorrente (existente
 * ou novo) não exige alteração de código, só de dados.
 */
export async function runFingerprintDetection(
  url: string | null,
  fingerprints: CompetitorFingerprint[],
): Promise<DetectionResult> {
  if (!url) {
    return {
      status: "nao_identificado",
      confidence: 0,
      evidence: [],
      analyzedUrl: null,
      reason: "Nenhuma URL pública (site/cardápio) cadastrada para este lead.",
    };
  }

  const signals = await fetchPageSignals(url);
  if (!signals) {
    return {
      status: "nao_identificado",
      confidence: 0,
      evidence: [],
      analyzedUrl: url,
      reason: "Não foi possível acessar a URL informada (site fora do ar, bloqueado ou não é uma página HTML).",
    };
  }

  const assets = extractAssets(signals.html);
  const evidence: EvidenceItem[] = [];
  let totalWeight = 0;

  for (const fp of fingerprints.filter((f) => f.active)) {
    const matched = matchFingerprint(fp, signals, assets);
    if (matched) {
      totalWeight += fp.weight;
      evidence.push({
        signal_type: fp.signal_type,
        pattern: fp.pattern,
        matched: matched.slice(0, 200),
        weight: fp.weight,
        description: fp.description,
      });
    }
  }

  const confidence = Math.min(100, totalWeight);
  const status =
    confidence >= CONFIRMED_THRESHOLD
      ? "confirmado"
      : confidence >= PROBABLE_THRESHOLD
        ? "provavel"
        : "nao_identificado";

  const reason =
    evidence.length === 0
      ? "Nenhum sinal técnico conhecido foi encontrado na página analisada."
      : `${evidence.length} sinal(is) encontrado(s): ${evidence
          .map((e) => e.description || `${e.signal_type}:${e.pattern}`)
          .join("; ")}.`;

  return {
    status,
    confidence,
    evidence,
    analyzedUrl: signals.finalUrl,
    reason,
  };
}
