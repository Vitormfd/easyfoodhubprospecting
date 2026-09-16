import { osmSource } from "./osm";
import { googlePlacesSource } from "./google-places";
import type {
  EstablishmentSearchParams,
  EstablishmentSource,
  RawEstablishment,
} from "./types";
import { buildDedupKey } from "@/lib/dedupe";

export type { EstablishmentSearchParams, RawEstablishment };

/**
 * Registro de fontes de busca. Para adicionar uma nova fonte (ex.:
 * outro provedor de dados de estabelecimentos), implemente
 * `EstablishmentSource` e inclua a instância nesta lista — nenhuma
 * outra parte do sistema precisa mudar.
 */
export const ALL_SOURCES: EstablishmentSource[] = [osmSource, googlePlacesSource];

export function getActiveSources(): EstablishmentSource[] {
  return ALL_SOURCES.filter((source) => source.isConfigured());
}

export interface AggregatedSearchResult {
  establishments: RawEstablishment[];
  sourcesUsed: string[];
  errors: { source: string; message: string }[];
}

/** Roda todas as fontes configuradas e deduplica os resultados combinados. */
export async function searchEstablishments(
  params: EstablishmentSearchParams,
): Promise<AggregatedSearchResult> {
  const sources = getActiveSources();
  const errors: AggregatedSearchResult["errors"] = [];

  const settled = await Promise.allSettled(
    sources.map((source) => source.search(params)),
  );

  const raw: RawEstablishment[] = [];
  settled.forEach((result, i) => {
    if (result.status === "fulfilled") {
      raw.push(...result.value);
    } else {
      errors.push({
        source: sources[i].slug,
        message: result.reason instanceof Error ? result.reason.message : "Erro desconhecido",
      });
    }
  });

  const byKey = new Map<string, RawEstablishment>();
  for (const item of raw) {
    const key = buildDedupKey({
      businessName: item.businessName,
      city: item.city,
      state: item.state,
      phone: item.phone,
      website: item.website,
    });
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, item);
    } else {
      // Mescla campos vazios com dados de outra fonte (ex.: OSM sem
      // telefone + Google Places com telefone).
      byKey.set(key, {
        ...existing,
        phone: existing.phone ?? item.phone,
        website: existing.website ?? item.website,
        address: existing.address ?? item.address,
      });
    }
  }

  return {
    establishments: Array.from(byKey.values()),
    sourcesUsed: sources.map((s) => s.slug),
    errors,
  };
}
