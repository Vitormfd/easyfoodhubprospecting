import Papa from "papaparse";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listLeads, type LeadFilters } from "@/lib/queries/leads";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const params = request.nextUrl.searchParams;
  const filters: LeadFilters = {
    status: (params.get("status") as LeadFilters["status"]) || undefined,
    competitor: (params.get("competitor") as LeadFilters["competitor"]) || undefined,
    city: params.get("city") || undefined,
    segment: params.get("segment") || undefined,
    contacted: (params.get("contacted") as LeadFilters["contacted"]) || undefined,
    hasInstagram: params.get("hasInstagram") === "1",
    hasWhatsapp: params.get("hasWhatsapp") === "1",
    q: params.get("q") || undefined,
    sort: (params.get("sort") as LeadFilters["sort"]) || undefined,
  };

  const leads = await listLeads(supabase, user.id, filters);

  const csv = Papa.unparse(
    leads.map((l) => ({
      business_name: l.business_name,
      category: l.category,
      city: l.city,
      state: l.state,
      address: l.address,
      phone: l.phone,
      whatsapp: l.whatsapp,
      instagram_username: l.instagram_username,
      instagram_url: l.instagram_url,
      website: l.website,
      menu_url: l.menu_url,
      competitor: l.competitor,
      competitor_status: l.competitor_status,
      competitor_confidence: l.competitor_confidence,
      source: l.source,
      source_url: l.source_url,
      status: l.status,
      notes: l.notes,
      last_contact_at: l.last_contact_at,
      next_followup_at: l.next_followup_at,
      created_at: l.created_at,
    })),
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-${Date.now()}.csv"`,
    },
  });
}
