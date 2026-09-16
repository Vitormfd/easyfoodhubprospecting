import type { PageSignals } from "./types";

const USER_AGENT =
  "Mozilla/5.0 (compatible; EasyFoodHubProspeccaoBot/1.0; +https://easysystem.com.br)";
const FETCH_TIMEOUT_MS = 10_000;
const MAX_HTML_BYTES = 1_500_000;

/**
 * Busca uma URL pública (site/cardápio do estabelecimento) para análise
 * de fingerprints. Só faz um GET simples e respeita redirecionamentos
 * normais do navegador — nada de login, CAPTCHA bypass ou scraping
 * agressivo (sem paralelismo alto, sem repetição, timeout curto).
 */
export async function fetchPageSignals(url: string): Promise<PageSignals | null> {
  const withProtocol = /^https?:\/\//i.test(url) ? url : `https://${url}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(withProtocol, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "pt-BR,pt;q=0.9",
      },
    });

    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("xhtml")) {
      return null;
    }

    const reader = res.body?.getReader();
    let html = "";
    if (reader) {
      const decoder = new TextDecoder();
      let bytesRead = 0;
      while (bytesRead < MAX_HTML_BYTES) {
        const { done, value } = await reader.read();
        if (done) break;
        bytesRead += value.byteLength;
        html += decoder.decode(value, { stream: true });
      }
      await reader.cancel().catch(() => {});
    } else {
      html = await res.text();
    }

    const headers: Record<string, string> = {};
    res.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    return { finalUrl: res.url || withProtocol, html, headers };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
