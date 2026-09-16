import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export const QUEUE_STATUSES = ["novo", "qualificado", "contatar"] as const;

export async function getQueueCount(supabase: SupabaseClient<Database>, userId: string) {
  const { count } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("status", QUEUE_STATUSES);
  return count ?? 0;
}

export async function getFollowupCountToday(supabase: SupabaseClient<Database>, userId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const { count } = await supabase
    .from("follow_ups")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "pending")
    .lte("due_date", today);
  return count ?? 0;
}
