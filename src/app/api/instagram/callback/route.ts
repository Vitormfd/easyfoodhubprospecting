import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeCodeForToken } from "@/lib/instagram/client";

export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state"); // user id

  if (!code || !state) {
    return NextResponse.redirect(new URL("/settings?instagram=error", appUrl));
  }

  try {
    const { accessToken, igUserId, permissions } = await exchangeCodeForToken(code);

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== state) {
      return NextResponse.redirect(new URL("/login", appUrl));
    }

    await supabase.from("instagram_accounts").upsert(
      {
        user_id: user.id,
        ig_user_id: igUserId,
        access_token: accessToken,
        permissions,
        connected_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    return NextResponse.redirect(new URL("/settings?instagram=connected", appUrl));
  } catch {
    return NextResponse.redirect(new URL("/settings?instagram=error", appUrl));
  }
}
