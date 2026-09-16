import type {
  EstablishmentSearchParams,
  EstablishmentSource,
  RawEstablishment,
} from "./types";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

// O servidor público oficial do Overpass costuma ficar sobrecarregado em
// horários de pico. Tentamos, em ordem, alguns espelhos públicos
// conhecidos antes de desistir — todos servem os mesmos dados públicos
// do OpenStreetMap, sem qualquer chave ou custo.
const OVERPASS_URLS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.osm.ch/api/interpreter",
];

// User-Agent exigido pela política de uso do Nominatim/OSM
// (https://operations.osmfoundation.org/policies/nominatim/).
const USER_AGENT = "EasyFoodHubProspeccao/1.0 (+https://easysystem.com.br)";

/**
 * Filtros Overpass QL por segmento. OSM não tem uma taxonomia 1:1 com o
 * vocabulário comercial brasileiro, então cada segmento combina
 * tags estruturadas (amenity/shop/cuisine) com uma busca por nome
 * (regex, case-insensitive) como reforço de recall.
 */
const SEGMENT_QUERIES: Record<string, string[]> = {
  Restaurante: ['node["amenity"="restaurant"]', 'way["amenity"="restaurant"]'],
  Hamburgueria: [
    'node["amenity"~"^(restaurant|fast_food)$"]["cuisine"~"burger",i]',
    'node["name"~"hamburg|burguer|burger",i]["amenity"]',
  ],
  Pizzaria: [
    'node["amenity"~"^(restaurant|fast_food)$"]["cuisine"~"pizza",i]',
    'node["name"~"pizza",i]["amenity"]',
  ],
  Lanchonete: ['node["amenity"="fast_food"]', 'way["amenity"="fast_food"]'],
  "Açaí": [
    'node["name"~"açaí|acai",i]',
    'node["cuisine"~"ice_cream",i]',
  ],
  Delivery: ['node["name"~"delivery",i]["amenity"]'],
  Pastelaria: [
    'node["shop"="pastry"]',
    'node["name"~"pastel",i]["amenity"]',
    'node["name"~"pastel",i]["shop"]',
  ],
  Sorveteria: [
    'node["amenity"="ice_cream"]',
    'node["shop"="ice_cream"]',
    'node["cuisine"~"ice_cream",i]',
  ],
};

interface NominatimResult {
  boundingbox: [string, string, string, string]; // south, north, west, east
}

interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

async function geocodeCity(
  city: string,
  state: string,
): Promise<[south: number, west: number, north: number, east: number] | null> {
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("city", city);
  url.searchParams.set("state", state);
  url.searchParams.set("country", "Brazil");
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");

  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, "Accept-Language": "pt-BR" },
  });
  if (!res.ok) return null;

  const results = (await res.json()) as NominatimResult[];
  if (results.length === 0) return null;

  const [south, north, west, east] = results[0].boundingbox.map(Number);
  return [south, west, north, east];
}

function buildAddress(tags: Record<string, string>): string | null {
  const parts = [
    tags["addr:street"],
    tags["addr:housenumber"],
    tags["addr:suburb"] ?? tags["addr:neighbourhood"],
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

function normalizeWebsite(tags: Record<string, string>): string | null {
  return tags.website ?? tags["contact:website"] ?? null;
}

function normalizePhone(tags: Record<string, string>): string | null {
  return tags.phone ?? tags["contact:phone"] ?? null;
}

async function runOverpassQuery(query: string): Promise<{ elements: OverpassElement[] }> {
  let lastError: string = "todos os espelhos do Overpass falharam";

  for (const endpoint of OVERPASS_URLS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          "User-Agent": USER_AGENT,
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });

      const contentType = res.headers.get("content-type") ?? "";
      if (!res.ok || !contentType.includes("json")) {
        lastError = `${endpoint} respondeu ${res.status} (${contentType || "sem content-type"})`;
        continue;
      }

      return (await res.json()) as { elements: OverpassElement[] };
    } catch (err) {
      lastError = `${endpoint}: ${err instanceof Error ? err.message : "erro desconhecido"}`;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error(`Overpass API indisponível — ${lastError}`);
}

export const osmSource: EstablishmentSource = {
  slug: "osm",
  label: "OpenStreetMap (Overpass API)",
  isConfigured: () => true,

  async search(params: EstablishmentSearchParams): Promise<RawEstablishment[]> {
    const bbox = await geocodeCity(params.city, params.state);
    if (!bbox) return [];

    const [south, west, north, east] = bbox;
    const bboxStr = `${south},${west},${north},${east}`;

    const segments = params.segments.length > 0 ? params.segments : Object.keys(SEGMENT_QUERIES);
    const clauses = segments
      .flatMap((segment) => SEGMENT_QUERIES[segment] ?? [])
      .map((clause) => `  ${clause}(${bboxStr});`);

    if (clauses.length === 0) return [];

    const query = `[out:json][timeout:20];\n(\n${clauses.join("\n")}\n);\nout center tags;`;

    const data = await runOverpassQuery(query);
    const seen = new Set<string>();
    const results: RawEstablishment[] = [];
    const limit = params.limit ?? 200;

    for (const el of data.elements) {
      const tags = el.tags ?? {};
      const name = tags.name;
      if (!name) continue;

      const key = `${el.type}/${el.id}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const matchedSegment =
        segments.find((segment) =>
          (SEGMENT_QUERIES[segment] ?? []).some((clause) =>
            clauseMatchesTags(clause, tags),
          ),
        ) ?? segments[0];

      results.push({
        businessName: name,
        category: matchedSegment ?? null,
        city: params.city,
        state: params.state.toUpperCase(),
        address: buildAddress(tags),
        phone: normalizePhone(tags),
        website: normalizeWebsite(tags),
        source: "osm",
        sourceUrl: `https://www.openstreetmap.org/${el.type}/${el.id}`,
      });

      if (results.length >= limit) break;
    }

    return results;
  },
};

/** Heurística simples para reatribuir o segmento que gerou o match (best-effort, não crítico). */
function clauseMatchesTags(clause: string, tags: Record<string, string>): boolean {
  if (clause.includes('"amenity"="restaurant"') && tags.amenity === "restaurant") return true;
  if (clause.includes('"amenity"="fast_food"') && tags.amenity === "fast_food") return true;
  if (clause.includes('"amenity"="ice_cream"') && tags.amenity === "ice_cream") return true;
  if (clause.includes('"shop"="ice_cream"') && tags.shop === "ice_cream") return true;
  if (clause.includes('"shop"="pastry"') && tags.shop === "pastry") return true;
  if (clause.includes("burger") && /burger|burguer/i.test(tags.cuisine ?? tags.name ?? "")) return true;
  if (clause.includes("pizza") && /pizza/i.test(tags.cuisine ?? tags.name ?? "")) return true;
  if (clause.includes("aça") && /aça|acai/i.test(tags.name ?? "")) return true;
  if (clause.includes("pastel") && /pastel/i.test(tags.name ?? "")) return true;
  if (clause.includes("delivery") && /delivery/i.test(tags.name ?? "")) return true;
  return false;
}
