"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { FingerprintSignalType } from "@/types/database";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão expirada.");
  return { supabase, user };
}

export interface SettingsActionState {
  error: string | null;
  success: boolean;
}

export const initialSettingsState: SettingsActionState = { error: null, success: false };

export async function updateSearchDefaultsAction(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const { supabase, user } = await requireUser();

  const defaultCity = String(formData.get("default_city") ?? "").trim() || null;
  const defaultState = String(formData.get("default_state") ?? "").trim().toUpperCase() || null;
  const defaultSegments = formData.getAll("default_segments").map(String);

  const { error } = await supabase
    .from("settings")
    .update({ default_city: defaultCity, default_state: defaultState, default_segments: defaultSegments })
    .eq("user_id", user.id);

  if (error) return { error: error.message, success: false };

  revalidatePath("/settings");
  revalidatePath("/search");
  return { error: null, success: true };
}

export async function updateProspectingSettingsAction(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const { supabase, user } = await requireUser();

  const intervalsRaw = String(formData.get("follow_up_intervals") ?? "");
  const intervals = intervalsRaw
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0);

  if (intervals.length === 0) {
    return { error: "Informe ao menos um intervalo válido (ex.: 3,4,7).", success: false };
  }

  const signature = String(formData.get("signature") ?? "").trim() || null;

  const { error } = await supabase
    .from("settings")
    .update({ follow_up_intervals: intervals, signature })
    .eq("user_id", user.id);

  if (error) return { error: error.message, success: false };

  revalidatePath("/settings");
  return { error: null, success: true };
}

function requireAdmin() {
  try {
    return createAdminClient();
  } catch {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY não configurada no .env — necessária para gerenciar fingerprints.",
    );
  }
}

export async function addFingerprintAction(input: {
  competitorId: string;
  signalType: FingerprintSignalType;
  pattern: string;
  weight: number;
  description?: string;
}) {
  await requireUser();
  const admin = requireAdmin();
  const { error } = await admin.from("competitor_fingerprints").insert({
    competitor_id: input.competitorId,
    signal_type: input.signalType,
    pattern: input.pattern,
    weight: input.weight,
    description: input.description || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

export async function toggleFingerprintAction(id: string, active: boolean) {
  await requireUser();
  const admin = requireAdmin();
  const { error } = await admin.from("competitor_fingerprints").update({ active }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

export async function deleteFingerprintAction(id: string) {
  await requireUser();
  const admin = requireAdmin();
  const { error } = await admin.from("competitor_fingerprints").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}
