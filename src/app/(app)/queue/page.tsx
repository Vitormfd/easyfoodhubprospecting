import { createClient } from "@/lib/supabase/server";
import { QUEUE_STATUSES } from "@/lib/queries/counts";
import { QueueRunner } from "./queue-runner";

export default async function QueuePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: leads } = await supabase
    .from("leads")
    .select("id, business_name, category, city, state, instagram_username, instagram_url, whatsapp, competitor, competitor_status, competitor_confidence, status")
    .eq("user_id", user!.id)
    .in("status", QUEUE_STATUSES)
    .order("created_at", { ascending: true });

  const { data: templates } = await supabase
    .from("message_templates")
    .select("id, name")
    .eq("user_id", user!.id)
    .order("name");

  const priority: Record<string, number> = { confirmado: 0, provavel: 1, nao_identificado: 2 };
  const queue = [...(leads ?? [])].sort((a, b) => priority[a.competitor_status] - priority[b.competitor_status]);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Fila de prospecção</h1>
        <p className="text-sm text-muted-foreground">
          {queue.length} lead{queue.length === 1 ? "" : "s"} para contato hoje.
        </p>
      </div>
      <QueueRunner leads={queue} templates={templates ?? []} />
    </div>
  );
}
