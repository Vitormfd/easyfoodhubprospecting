import { createClient } from "@/lib/supabase/server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchDefaultsForm } from "./search-defaults-form";
import { ProspectingForm } from "./prospecting-form";
import { IntegrationsStatus } from "./integrations-status";
import { FingerprintsManager } from "./fingerprints-manager";
import { isAiMessagingConfigured } from "@/lib/messaging/ai";
import { isInstagramConfigured } from "@/lib/instagram/client";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: settings }, { data: competitor }, { data: instagramAccount }] = await Promise.all([
    supabase.from("settings").select("*").eq("user_id", user!.id).single(),
    supabase.from("competitors").select("id, name").eq("slug", "anota_ai").single(),
    supabase.from("instagram_accounts").select("id").eq("user_id", user!.id).maybeSingle(),
  ]);

  const { data: fingerprints } = competitor
    ? await supabase
        .from("competitor_fingerprints")
        .select("*")
        .eq("competitor_id", competitor.id)
        .order("weight", { ascending: false })
    : { data: [] };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground">Preferências de busca, prospecção e integrações.</p>
      </div>

      <Tabs defaultValue="search">
        <TabsList>
          <TabsTrigger value="search">Pesquisa</TabsTrigger>
          <TabsTrigger value="prospecting">Prospecção</TabsTrigger>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
          <TabsTrigger value="fingerprints">Fingerprints</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="pt-4">
          <SearchDefaultsForm
            defaultCity={settings?.default_city ?? ""}
            defaultState={settings?.default_state ?? ""}
            defaultSegments={settings?.default_segments ?? []}
          />
        </TabsContent>

        <TabsContent value="prospecting" className="pt-4">
          <ProspectingForm
            intervals={settings?.follow_up_intervals ?? [3, 4, 7]}
            signature={settings?.signature ?? null}
          />
        </TabsContent>

        <TabsContent value="integrations" className="pt-4">
          <IntegrationsStatus
            hasGooglePlaces={Boolean(process.env.GOOGLE_PLACES_API_KEY)}
            hasAnthropic={isAiMessagingConfigured()}
            hasInstagramApp={isInstagramConfigured()}
            instagramConnected={Boolean(instagramAccount)}
          />
        </TabsContent>

        <TabsContent value="fingerprints" className="pt-4">
          {competitor ? (
            <FingerprintsManager
              competitorId={competitor.id}
              competitorName={competitor.name}
              fingerprints={fingerprints ?? []}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Catálogo de concorrentes ainda não configurado — rode as migrations do Supabase.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
