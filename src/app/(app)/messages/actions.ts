"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface TemplateActionState {
  error: string | null;
  success: boolean;
}

export const initialTemplateState: TemplateActionState = { error: null, success: false };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão expirada.");
  return { supabase, user };
}

export async function saveTemplateAction(
  _prev: TemplateActionState,
  formData: FormData,
): Promise<TemplateActionState> {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();

  if (!name || !content) {
    return { error: "Preencha nome e mensagem.", success: false };
  }

  try {
    const { supabase, user } = await requireUser();

    if (id) {
      const { error } = await supabase
        .from("message_templates")
        .update({ name, content })
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase
        .from("message_templates")
        .insert({ user_id: user.id, name, content });
      if (error) throw new Error(error.message);
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao salvar.", success: false };
  }

  revalidatePath("/messages");
  return { error: null, success: true };
}

export async function deleteTemplateAction(id: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("message_templates")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/messages");
}
