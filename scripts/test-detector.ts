/**
 * Testa o motor de detecção de fingerprints isoladamente (sem Supabase).
 * Usa os mesmos padrões seedados em supabase/migrations/0001_init.sql.
 *
 * Rodar: npx tsx scripts/test-detector.ts
 */
import { runFingerprintDetection } from "../src/lib/detectors/fingerprint-engine";
import type { CompetitorFingerprint } from "../src/types/database";

const ANOTA_AI_FINGERPRINTS: CompetitorFingerprint[] = [
  { id: "1", competitor_id: "c", signal_type: "domain", pattern: "anota.ai", weight: 60, description: "Domínio Anota AI", active: true, created_at: "", updated_at: "" },
  { id: "2", competitor_id: "c", signal_type: "domain", pattern: "anotaai.com.br", weight: 55, description: "Domínio alternativo", active: true, created_at: "", updated_at: "" },
  { id: "3", competitor_id: "c", signal_type: "script_src", pattern: "cdn.anota.ai", weight: 50, description: "CDN Anota AI", active: true, created_at: "", updated_at: "" },
  { id: "4", competitor_id: "c", signal_type: "html_pattern", pattern: "powered by anota", weight: 25, description: "Rodapé", active: true, created_at: "", updated_at: "" },
];

const TEST_URLS = [
  // Site institucional simples SEM Anota AI — espera-se "nao_identificado" (controle negativo).
  "https://www.nextjs.org",
  // Site do próprio Anota AI — espera-se sinais de domínio ("confirmado" ou "provavel").
  "https://anota.ai",
];

async function main() {
  for (const url of TEST_URLS) {
    console.log(`\n=== ${url} ===`);
    const result = await runFingerprintDetection(url, ANOTA_AI_FINGERPRINTS);
    console.log(JSON.stringify(result, null, 2));
  }
}

main();
