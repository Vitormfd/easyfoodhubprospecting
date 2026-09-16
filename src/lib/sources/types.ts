export interface EstablishmentSearchParams {
  city: string;
  state: string;
  segments: string[];
  /** Limite de resultados por segmento/fonte. */
  limit?: number;
}

export interface RawEstablishment {
  businessName: string;
  category: string | null;
  city: string;
  state: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  /** Fonte que originou o registro (slug estável, ex.: "osm", "google_places"). */
  source: string;
  /** URL/id de referência na fonte original, quando existir. */
  sourceUrl: string | null;
}

export interface EstablishmentSource {
  /** Identificador estável da fonte. */
  slug: string;
  /** Nome amigável, exibido na UI. */
  label: string;
  /** Se a fonte está disponível (ex.: chave de API configurada). */
  isConfigured(): boolean;
  search(params: EstablishmentSearchParams): Promise<RawEstablishment[]>;
}
