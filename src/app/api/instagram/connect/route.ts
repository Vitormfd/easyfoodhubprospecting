import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getInstagramAuthUrl, isInstagramConfigured } from "@/lib/instagram/client";

/**
 * Inicia o OAuth oficial do Instagram (Business Login). O `state` carrega
 * o id do usuário para associar a conta na volta do callback — nunca
 * usamos cookies de sessão do Instagram nem login automatizado.
 */
export async function GET() {
  if (!isInstagramConfigured()) {
    return NextResponse.json(
      { error: "Integração não configurada. Defina META_APP_ID e META_APP_SECRET no .env." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL));

  const authUrl = getInstagramAuthUrl(user.id);
  return NextResponse.redirect(authUrl);
}
