import Link from "next/link";
import { Download, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { listLeads, getDistinctCitiesAndSegments, type LeadFilters } from "@/lib/queries/leads";
import { LeadsFilters } from "./leads-filters";
import { LeadsTable } from "./leads-table";
import { ImportDialog } from "./import-dialog";
import { Button } from "@/components/ui/button";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const filters: LeadFilters = {
    status: params.status as LeadFilters["status"],
    competitor: params.competitor as LeadFilters["competitor"],
    city: params.city,
    segment: params.segment,
    contacted: params.contacted as LeadFilters["contacted"],
    hasInstagram: params.hasInstagram === "1",
    hasWhatsapp: params.hasWhatsapp === "1",
    q: params.q,
    sort: (params.sort as LeadFilters["sort"]) ?? "recent",
  };

  const [leads, { cities, segments }] = await Promise.all([
    listLeads(supabase, user!.id, filters),
    getDistinctCitiesAndSegments(supabase, user!.id),
  ]);

  const exportQuery = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v) as [string, string][],
  ).toString();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-sm text-muted-foreground">{leads.length} lead(s) encontrados</p>
        </div>
        <div className="flex items-center gap-2">
          <ImportDialog />
          <Button
            variant="outline"
            size="sm"
            render={<a href={`/api/leads/export${exportQuery ? `?${exportQuery}` : ""}`} />}
          >
            <Download className="size-4" /> Exportar CSV
          </Button>
          <Button size="sm" render={<Link href="/search" />}>
            <Search className="size-4" /> Buscar mais
          </Button>
        </div>
      </div>

      <LeadsFilters cities={cities} segments={segments} />
      <LeadsTable leads={leads} />
    </div>
  );
}
