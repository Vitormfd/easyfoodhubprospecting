/** Normaliza texto para comparação: minúsculas, sem acento, sem pontuação. */
export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function normalizePhone(phone: string | null | undefined): string {
  return (phone ?? "").replace(/\D/g, "");
}

export function extractDomain(url: string | null | undefined): string {
  if (!url) return "";
  try {
    const withProtocol = url.startsWith("http") ? url : `https://${url}`;
    return new URL(withProtocol).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

/**
 * Chave de deduplicação: prioriza domínio do site (mais confiável),
 * depois telefone, e sempre inclui nome+cidade+estado normalizados como
 * componente base — evita colisões entre empresas de mesma cidade com
 * nomes parecidos, e ainda pega duplicatas exatas de nome/local.
 */
export function buildDedupKey(input: {
  businessName: string;
  city: string;
  state: string;
  phone?: string | null;
  website?: string | null;
}): string {
  const base = `${normalize(input.businessName)}|${normalize(input.city)}|${normalize(
    input.state,
  )}`;
  const domain = extractDomain(input.website);
  const phone = normalizePhone(input.phone);

  if (domain) return `${base}|site:${domain}`;
  if (phone) return `${base}|tel:${phone}`;
  return base;
}
