import { createClient } from "@/lib/supabase/server";
import { FollowupsList, type FollowupItem } from "./followups-list";

export default async function FollowupsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = new Date().toISOString().slice(0, 10);

  const { data: followups } = await supabase
    .from("follow_ups")
    .select("id, lead_id, step_number, due_date, leads(business_name)")
    .eq("user_id", user!.id)
    .eq("status", "pending")
    .order("due_date", { ascending: true })
    .returns<
      { id: string; lead_id: string; step_number: number; due_date: string; leads: { business_name: string } | null }[]
    >();

  const items: FollowupItem[] = (followups ?? []).map((f) => ({
    id: f.id,
    lead_id: f.lead_id,
    step_number: f.step_number,
    due_date: f.due_date,
    business_name: f.leads?.business_name ?? "—",
  }));

  const dueToday = items.filter((i) => i.due_date <= today);
  const upcoming = items.filter((i) => i.due_date > today);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Follow-ups</h1>
        <p className="text-sm text-muted-foreground">
          Os intervalos padrão podem ser ajustados em Configurações.
        </p>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
          Follow-ups de hoje ({dueToday.length})
        </h2>
        <FollowupsList items={dueToday} />
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
          Próximos ({upcoming.length})
        </h2>
        <FollowupsList items={upcoming} />
      </div>
    </div>
  );
}
