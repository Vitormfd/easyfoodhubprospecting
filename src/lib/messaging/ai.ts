import "server-only";
import Anthropic from "@anthropic-ai/sdk";

export interface AiMessageInput {
  businessName: string;
  category: string | null;
  city: string;
  state: string;
  competitorName: string | null;
  competitorStatus: "confirmado" | "provavel" | "nao_identificado";
  signature: string | null;
}

export function isAiMessagingConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

const SYSTEM_PROMPT = `Você escreve mensagens curtas de prospecção comercial para o Easy Food Hub, um sistema de gestão e pedidos para restaurantes, hamburguerias, pizzarias e outros estabelecimentos de alimentação.

Regras obrigatórias:
- A mensagem é para o primeiro contato via Instagram/WhatsApp com o dono ou gestor do estabelecimento.
- Use APENAS as informações fornecidas no input. NUNCA invente dados, números, resultados ou funcionalidades que não foram informados.
- Se um concorrente confirmado ou provável for informado, mencione de forma natural e não agressiva que percebeu que eles já usam uma solução de pedidos/cardápio digital.
- Se nenhum concorrente for informado, não mencione concorrente nenhum.
- Tom: natural, direto, comercial mas não agressivo, como uma conversa real — não como propaganda.
- Português do Brasil, sem emojis em excesso (no máximo 1, opcional).
- Máximo 3-4 frases curtas.
- Responda APENAS com o texto da mensagem, sem aspas, sem explicações.`;

export async function generateAiMessage(input: AiMessageInput): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY não configurada — gere a mensagem por template ou configure a chave em .env.");
  }

  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";

  const facts = [
    `Nome do estabelecimento: ${input.businessName}`,
    input.category ? `Segmento: ${input.category}` : null,
    `Cidade: ${input.city}/${input.state}`,
    input.competitorStatus !== "nao_identificado" && input.competitorName
      ? `Concorrente identificado (${input.competitorStatus}): ${input.competitorName}`
      : "Nenhum concorrente identificado com confiança suficiente para mencionar.",
    input.signature ? `Assine como: ${input.signature}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const message = await client.messages.create({
    model,
    max_tokens: 300,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Gere a mensagem de prospecção com base nestes dados reais:\n\n${facts}`,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("A IA não retornou texto.");
  }

  return textBlock.text.trim();
}
