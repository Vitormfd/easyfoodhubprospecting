import type {
  EstablishmentSearchParams,
  EstablishmentSource,
  RawEstablishment,
} from "./types";

const TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";

interface GooglePlace {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  websiteUri?: string;
}

/**
 * Fonte opcional (Places API - New, Text Search). Só ativa quando
 * GOOGLE_PLACES_API_KEY está configurada. Complementa o OpenStreetMap
 * com dados mais completos (telefone/site formatados).
 */
export const googlePlacesSource: EstablishmentSource = {
  slug: "google_places",
  label: "Google Places API",
  isConfigured: () => Boolean(process.env.GOOGLE_PLACES_API_KEY),

  async search(params: EstablishmentSearchParams): Promise<RawEstablishment[]> {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) return [];

    const segments = params.segments.length > 0 ? params.segments : ["Restaurante"];
    const limit = params.limit ?? 60;
    const results: RawEstablishment[] = [];

    for (const segment of segments) {
      const textQuery = `${segment} em ${params.city}, ${params.state}`;

      const res = await fetch(TEXT_SEARCH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri",
        },
        body: JSON.stringify({ textQuery, languageCode: "pt-BR" }),
      });

      if (!res.ok) continue;

      const data = (await res.json()) as { places?: GooglePlace[] };
      for (const place of data.places ?? []) {
        if (!place.displayName?.text) continue;
        results.push({
          businessName: place.displayName.text,
          category: segment,
          city: params.city,
          state: params.state.toUpperCase(),
          address: place.formattedAddress ?? null,
          phone: place.nationalPhoneNumber ?? null,
          website: place.websiteUri ?? null,
          source: "google_places",
          sourceUrl: `https://www.google.com/maps/place/?q=place_id:${place.id}`,
        });
        if (results.length >= limit) return results;
      }
    }

    return results;
  },
};
