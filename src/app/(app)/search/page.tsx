import { createClient } from "@/lib/supabase/server";
import { SearchForm } from "./search-form";

export default async function SearchPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: settings } = await supabase
    .from("settings")
    .select("default_city, default_state, default_segments")
    .eq("user_id", user!.id)
    .single();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pesquisar estabelecimentos</h1>
        <p className="text-sm text-muted-foreground">
          Busque estabelecimentos de alimentação por cidade e segmento usando fontes públicas
          (OpenStreetMap{process.env.GOOGLE_PLACES_API_KEY ? " + Google Places" : ""}).
        </p>
      </div>

      <SearchForm
        defaultCity={settings?.default_city ?? ""}
        defaultState={settings?.default_state ?? ""}
        defaultSegments={settings?.default_segments ?? []}
      />
    </div>
  );
}
