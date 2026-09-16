import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { DEFAULT_FOLLOW_UP_INTERVALS } from "@/lib/constants";

function addDays(date: Date, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Agenda o próximo passo de follow-up para um lead, respeitando os
 * intervalos configurados pelo usuário (settings.follow_up_intervals).
 * `previousStep` = 0 para o primeiro follow-up após o contato inicial.
 */
export async function scheduleNextFollowup(
  supabase: SupabaseClient<Database>,
  userId: string,
  leadId: string,
  previousStep: number,
): Promise<void> {
  const { data: settings } = await supabase
    .from("settings")
    .select("follow_up_intervals")
    .eq("user_id", userId)
    .single();

  const intervals =
    settings?.follow_up_intervals && settings.follow_up_intervals.length > 0
      ? settings.follow_up_intervals
      : DEFAULT_FOLLOW_UP_INTERVALS;

  if (previousStep >= intervals.length) return; // sem mais passos configurados

  const daysToWait = intervals[previousStep];
  const dueDate = addDays(new Date(), daysToWait);

  await supabase.from("follow_ups").insert({
    lead_id: leadId,
    user_id: userId,
    step_number: previousStep + 1,
    due_date: dueDate,
    status: "pending",
  });
}
