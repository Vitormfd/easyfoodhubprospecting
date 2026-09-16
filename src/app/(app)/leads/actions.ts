"use server";

import Papa from "papaparse";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { buildDedupKey } from "@/lib/dedupe";
import type { LeadInsert, LeadStatus } from "@/types/database";
import { LEAD_STATUS_ORDER } from "@/lib/constants";

export interface ImportActionState {
  error: string | null;
  summary: { total: number; inserted: number; skipped: number; invalid: number } | null;
}

export const initialImportState: ImportActionState = { error: null, summary: null };

type CsvRow = Record<string, string>;

function pick(row: CsvRow, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = row[key];
    if (value && value.trim()) return value.trim();
  }
  return null;
}

export async function importLeadsAction(
  _prev: ImportActionState,
  formData: FormData,
): Promise<ImportActionState> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecione um arquivo CSV.", summary: null };
  }

  const text = await file.text();
  const parsed = Papa.parse<CsvRow>(text, { header: true, skipEmptyLines: true });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada.", summary: null };

  let invalid = 0;
  const rows: LeadInsert[] = [];

  for (const row of parsed.data) {
    const businessName = pick(row, "business_name", "empresa", "nome");
    const city = pick(row, "city", "cidade");
    const state = pick(row, "state", "estado", "uf");

    if (!businessName || !city || !state) {
      invalid++;
      continue;
    }

    const phone = pick(row, "phone", "telefone");
    const website = pick(row, "website", "site");
    const statusRaw = pick(row, "status");
    const status = (LEAD_STATUS_ORDER as string[]).includes(statusRaw ?? "")
      ? (statusRaw as LeadStatus)
      : "novo";

    rows.push({
      user_id: user.id,
      business_name: businessName,
      category: pick(row, "category", "segmento", "categoria"),
      city,
      state: state.toUpperCase(),
      address: pick(row, "address", "endereco", "endereço"),
      phone,
      whatsapp: pick(row, "whatsapp"),
      instagram_username: pick(row, "instagram_username", "instagram"),
      instagram_url: pick(row, "instagram_url"),
      website,
      menu_url: pick(row, "menu_url", "cardapio", "cardápio"),
      notes: pick(row, "notes", "observacoes", "observações"),
      status,
      source: "import_csv",
      dedup_key: buildDedupKey({ businessName, city, state, phone, website }),
    });
  }

  if (rows.length === 0) {
    return {
      error: null,
      summary: { total: parsed.data.length, inserted: 0, skipped: 0, invalid },
    };
  }

  const { data: insertedRows, error } = await supabase
    .from("leads")
    .upsert(rows, { onConflict: "user_id,dedup_key", ignoreDuplicates: true })
    .select("id");

  if (error) {
    return { error: `Erro ao importar: ${error.message}`, summary: null };
  }

  revalidatePath("/leads");
  revalidatePath("/dashboard");

  const inserted = insertedRows?.length ?? 0;

  return {
    error: null,
    summary: { total: parsed.data.length, inserted, skipped: rows.length - inserted, invalid },
  };
}
