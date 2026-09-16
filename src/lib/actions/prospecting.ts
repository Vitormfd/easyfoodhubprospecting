"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { detectCompetitorForLead } from "@/lib/detectors";
import { scheduleNextFollowup } from "@/lib/followups";
import { renderTemplate } from "@/lib/messaging/template";
import { generateAiMessage, isAiMessagingConfigured } from "@/lib/messaging/ai";
import type { ContactChannel, LeadStatus } from "@/types/database";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão expirada. Faça login novamente.");
  return { supabase, user };
}

export async function runDetectionAction(leadId: string) {
  const { supabase } = await requireUser();
  const { data: lead } = await supabase
    .from("leads")
    .select("menu_url, website")
    .eq("id", leadId)
    .single();
  if (!lead) throw new Error("Lead não encontrado.");

  const result = await detectCompetitorForLead(supabase, leadId, {
    menuUrl: lead.menu_url,
    website: lead.website,
  });

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  revalidatePath("/dashboard");
  return result;
}

export async function updateLeadStatusAction(leadId: string, status: LeadStatus) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("leads")
    .update({ status })
    .eq("id", leadId)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  revalidatePath("/dashboard");
}

export async function updateLeadNotesAction(leadId: string, notes: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("leads")
    .update({ notes })
    .eq("id", leadId)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath(`/leads/${leadId}`);
}

const PRE_CONTACT_STATUSES: LeadStatus[] = ["novo", "qualificado", "contatar"];

export async function logContactAction(input: {
  leadId: string;
  channel: ContactChannel;
  message: string;
  notes?: string;
}) {
  const { supabase, user } = await requireUser();

  const { data: lead } = await supabase
    .from("leads")
    .select("status")
    .eq("id", input.leadId)
    .single();

  const { error } = await supabase.from("contact_history").insert({
    lead_id: input.leadId,
    user_id: user.id,
    channel: input.channel,
    message_sent: input.message,
    notes: input.notes || null,
  });
  if (error) throw new Error(error.message);

  if (lead && PRE_CONTACT_STATUSES.includes(lead.status)) {
    await supabase.from("leads").update({ status: "contatado" }).eq("id", input.leadId);
  }

  await scheduleNextFollowup(supabase, user.id, input.leadId, 0);

  revalidatePath(`/leads/${input.leadId}`);
  revalidatePath("/leads");
  revalidatePath("/queue");
  revalidatePath("/dashboard");
  revalidatePath("/followups");
}

export async function completeFollowupAction(
  followupId: string,
  status: "done" | "skipped",
) {
  const { supabase, user } = await requireUser();

  const { data: followup, error } = await supabase
    .from("follow_ups")
    .update({ status, completed_at: new Date().toISOString() })
    .eq("id", followupId)
    .eq("user_id", user.id)
    .select("lead_id, step_number")
    .single();

  if (error) throw new Error(error.message);

  if (status === "done" && followup) {
    await scheduleNextFollowup(supabase, user.id, followup.lead_id, followup.step_number);
  }

  revalidatePath("/followups");
  revalidatePath("/dashboard");
  if (followup) revalidatePath(`/leads/${followup.lead_id}`);
}

export async function addManualFollowupAction(input: {
  leadId: string;
  dueDate: string;
  notes?: string;
}) {
  const { supabase, user } = await requireUser();

  const { data: existing } = await supabase
    .from("follow_ups")
    .select("step_number")
    .eq("lead_id", input.leadId)
    .order("step_number", { ascending: false })
    .limit(1);

  const nextStep = (existing?.[0]?.step_number ?? 0) + 1;

  const { error } = await supabase.from("follow_ups").insert({
    lead_id: input.leadId,
    user_id: user.id,
    step_number: nextStep,
    due_date: input.dueDate,
    notes: input.notes || null,
    status: "pending",
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/leads/${input.leadId}`);
  revalidatePath("/followups");
}

export async function generateMessageAction(input: {
  leadId: string;
  mode: "ai" | "template";
  templateId?: string;
}): Promise<{ message: string }> {
  const { supabase, user } = await requireUser();

  const { data: lead } = await supabase
    .from("leads")
    .select("business_name, category, city, state, competitor, competitor_status")
    .eq("id", input.leadId)
    .single();
  if (!lead) throw new Error("Lead não encontrado.");

  const { data: settings } = await supabase
    .from("settings")
    .select("signature")
    .eq("user_id", user.id)
    .single();

  if (input.mode === "ai") {
    if (!isAiMessagingConfigured()) {
      throw new Error("ANTHROPIC_API_KEY não configurada — use um template ou configure a IA em Configurações.");
    }
    const message = await generateAiMessage({
      businessName: lead.business_name,
      category: lead.category,
      city: lead.city,
      state: lead.state,
      competitorName: lead.competitor,
      competitorStatus: lead.competitor_status,
      signature: settings?.signature ?? null,
    });
    return { message };
  }

  if (!input.templateId) throw new Error("Selecione um template.");
  const { data: template } = await supabase
    .from("message_templates")
    .select("content")
    .eq("id", input.templateId)
    .eq("user_id", user.id)
    .single();
  if (!template) throw new Error("Template não encontrado.");

  const message = renderTemplate(template.content, {
    nome: lead.business_name,
    empresa: lead.business_name,
    segmento: lead.category,
    cidade: lead.city,
  });

  const withSignature = settings?.signature ? `${message}\n\n${settings.signature}` : message;
  return { message: withSignature };
}
