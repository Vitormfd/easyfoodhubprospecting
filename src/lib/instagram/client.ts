import "server-only";

/**
 * Cliente para a API oficial do Instagram (Meta Graph API / Instagram
 * Business Login). Implementa só o que a API permite de forma legítima:
 * - Conectar uma conta profissional via OAuth oficial.
 * - Verificar as permissões concedidas.
 * - Enviar mensagem SOMENTE quando a permissão de messaging estiver
 *   ativa e dentro das regras da própria Meta (ex.: janela de 24h após
 *   o contato ter iniciado a conversa).
 *
 * Nunca automatiza login, nunca usa cookies de sessão de navegador, e
 * nunca tenta contornar limites — se a API recusar, a ação é recusada
 * e a UI deve cair para o fluxo manual (copiar mensagem + abrir perfil).
 */

const GRAPH_API_BASE = "https://graph.instagram.com";
const AUTH_BASE = "https://www.instagram.com/oauth/authorize";
const TOKEN_URL = "https://api.instagram.com/oauth/access_token";

const REQUIRED_SCOPES = [
  "instagram_business_basic",
  "instagram_business_manage_messages",
];

export function isInstagramConfigured(): boolean {
  return Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET);
}

export function getInstagramAuthUrl(state: string): string {
  const appId = process.env.META_APP_ID;
  const redirectUri = process.env.META_REDIRECT_URI;
  if (!appId || !redirectUri) {
    throw new Error("META_APP_ID / META_REDIRECT_URI não configurados.");
  }

  const url = new URL(AUTH_BASE);
  url.searchParams.set("client_id", appId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", REQUIRED_SCOPES.join(","));
  url.searchParams.set("state", state);
  return url.toString();
}

export interface InstagramTokenResult {
  accessToken: string;
  igUserId: string;
  permissions: string[];
}

export async function exchangeCodeForToken(code: string): Promise<InstagramTokenResult> {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const redirectUri = process.env.META_REDIRECT_URI;
  if (!appId || !appSecret || !redirectUri) {
    throw new Error("Integração com Instagram não configurada (META_APP_ID/META_APP_SECRET/META_REDIRECT_URI).");
  }

  const body = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code,
  });

  const res = await fetch(TOKEN_URL, { method: "POST", body });
  if (!res.ok) {
    throw new Error(`Falha ao trocar código por token (${res.status}).`);
  }

  const data = (await res.json()) as { access_token: string; user_id: string };
  const permissions = await getGrantedPermissions(data.access_token);

  return { accessToken: data.access_token, igUserId: data.user_id, permissions };
}

export async function getGrantedPermissions(accessToken: string): Promise<string[]> {
  const res = await fetch(
    `${GRAPH_API_BASE}/me/permissions?access_token=${encodeURIComponent(accessToken)}`,
  );
  if (!res.ok) return [];
  const data = (await res.json()) as { data?: { permission: string; status: string }[] };
  return (data.data ?? []).filter((p) => p.status === "granted").map((p) => p.permission);
}

export function canSendMessages(permissions: string[]): boolean {
  return permissions.includes("instagram_business_manage_messages");
}

export interface SendMessageResult {
  success: boolean;
  reason?: string;
}

/**
 * Tenta enviar via API oficial. Só deve ser chamada quando
 * `canSendMessages` for true — mesmo assim a Meta pode recusar (ex.:
 * fora da janela de 24h de mensagens), e isso deve ser tratado como
 * "use o fluxo manual", nunca contornado.
 */
export async function sendInstagramMessage(
  accessToken: string,
  recipientIgId: string,
  text: string,
): Promise<SendMessageResult> {
  const res = await fetch(`${GRAPH_API_BASE}/me/messages?access_token=${encodeURIComponent(accessToken)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: recipientIgId },
      message: { text },
    }),
  });

  if (res.ok) return { success: true };

  const error = await res.json().catch(() => null);
  return {
    success: false,
    reason: error?.error?.message ?? `A API do Instagram recusou o envio (${res.status}). Use o fluxo manual.`,
  };
}
