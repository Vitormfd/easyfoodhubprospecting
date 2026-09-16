# Easy Food Hub — Prospecção Comercial

Sistema web de prospecção comercial para o Easy Food Hub: encontra estabelecimentos de alimentação por cidade, detecta indícios públicos de uso do Anota AI (ou outros concorrentes, de forma extensível), organiza tudo como leads em um CRM e conduz a abordagem comercial (mensagens, fila de prospecção, follow-ups).

## Stack

Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind CSS v4 · shadcn/ui (Base UI) · Supabase (Postgres + Auth + RLS) · Anthropic API (mensagens por IA) · OpenStreetMap Overpass API (busca de estabelecimentos)

## Como rodar localmente

```bash
npm install
cp .env.example .env.local   # já existe .env.local — só preencher as chaves
```

1. Crie um projeto gratuito em [supabase.com](https://supabase.com).
2. Em **SQL Editor**, rode o conteúdo de `supabase/migrations/0001_init.sql` (cria tabelas, RLS e os fingerprints iniciais do Anota AI).
3. Em **Project Settings → API**, copie `Project URL`, `anon public key` e `service_role key` para `.env.local`.
4. (Opcional) Em **Authentication → Providers → Email**, desative "Confirm email" se quiser testar sem precisar confirmar o cadastro por e-mail.
5. `npm run dev` e acesse `http://localhost:3000`.

## O que foi implementado

- **Autenticação** (Supabase Auth, email/senha) com proxy (`src/proxy.ts`) protegendo todas as rotas do app e RLS isolando os dados de cada usuário.
- **Dashboard** (`/dashboard`) com contagens reais (total, confirmado/provável/não classificado, contatados, em negociação, convertidos, descartados), novos leads recentes, últimos contatos, taxa de contato, leads por segmento e por cidade.
- **Pesquisa de estabelecimentos** (`/search`): busca por cidade/estado/segmentos usando OpenStreetMap (Overpass API, sem chave) — arquitetura pronta em `src/lib/sources` para plugar Google Places (basta configurar `GOOGLE_PLACES_API_KEY`). Deduplicação automática ao salvar.
- **Detector de Anota AI**: motor genérico orientado a dados (`src/lib/detectors`) que busca a URL pública do lead (cardápio/site), analisa domínio, scripts/CDN, meta tags, padrões de HTML e headers HTTP contra a tabela `competitor_fingerprints`, e classifica `confirmado` / `provável` / `não identificado` com evidência salva.
- **CRM de leads** (`/leads`): tabela com filtros (concorrente, status, cidade, segmento, contatado, Instagram, WhatsApp), busca por nome, ordenação, e importação/exportação CSV com deduplicação.
- **Página do lead** (`/leads/[id]`): dados completos, evidência da detecção, geração de mensagem (IA ou template), histórico de prospecção, follow-ups, mudança de status e observações.
- **Mensagens** (`/messages`): templates com variáveis `{{nome}} {{empresa}} {{segmento}} {{cidade}}`.
- **Geração de mensagem por IA**: conectada à Anthropic API — usa só dados reais do lead, nunca inventa informação.
- **Fila de prospecção** (`/queue`): um lead por vez, mensagem pronta, abrir Instagram / copiar mensagem / marcar como contatado, com follow-up agendado automaticamente.
- **Follow-ups** (`/followups`): follow-ups de hoje e próximos, com conclusão/pulo e encadeamento automático conforme os intervalos configurados.
- **Configurações** (`/settings`): padrões de pesquisa, intervalos de follow-up, assinatura, status das integrações e gerenciador de fingerprints (adicionar/desativar/remover sinais de detecção sem tocar em código).
- **Instagram**: scaffold para Meta Graph API oficial (OAuth, verificação de permissões, envio quando permitido pela própria API); sem isso configurado, a UI sempre oferece o fluxo manual (copiar mensagem + abrir perfil).

## Estrutura do banco (Supabase/Postgres)

Ver `supabase/migrations/0001_init.sql`. Tabelas principais:

- `leads` — estabelecimentos/leads, com os campos pedidos (dados de contato, `competitor`/`competitor_status`/`competitor_confidence`/`competitor_evidence`, `source`, `status`, etc.) + `dedup_key` (índice único por usuário para evitar duplicata).
- `competitors` / `competitor_fingerprints` — catálogo de concorrentes e as regras de detecção (dados, não código).
- `competitor_detections` — histórico de cada análise rodada para um lead.
- `message_templates`, `contact_history`, `follow_ups`, `settings`, `instagram_accounts`.

Todas as tabelas com `user_id` têm RLS (`auth.uid() = user_id`). `competitors`/`competitor_fingerprints` são catálogo compartilhado: leitura liberada a autenticados, escrita só via service role (server actions em `src/app/(app)/settings/actions.ts`).

## Variáveis de ambiente (`.env.local`)

| Variável | Obrigatória | Descrição |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sim | Projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim (para gerenciar fingerprints) | Nunca exposta ao frontend |
| `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` | Opcional | Geração de mensagem por IA |
| `GOOGLE_PLACES_API_KEY` | Opcional | Fonte de busca adicional (padrão: só OSM) |
| `META_APP_ID` / `META_APP_SECRET` / `META_REDIRECT_URI` | Opcional | Envio de mensagem via Instagram oficial |
| `NEXT_PUBLIC_APP_URL` | Sim | Usada nos redirects OAuth |

## O que depende de credenciais externas

- **Tudo o resto do app** depende só do Supabase (obrigatório).
- **Busca de estabelecimentos** funciona sem nenhuma chave (OpenStreetMap). Google Places é opcional.
- **Geração de mensagem por IA** exige `ANTHROPIC_API_KEY` — sem ela, use os templates manuais.
- **Envio de mensagem direto pelo Instagram** exige um app Meta aprovado para Instagram Messaging API (processo de revisão da Meta, fora do nosso controle) — até lá, a Fila de Prospecção usa sempre "copiar mensagem + abrir perfil".

## Como testar o detector do Anota AI

Sem precisar do Supabase:

```bash
npx tsx scripts/test-detector.ts
```

Roda o motor contra uma URL neutra (controle negativo, deve dar `nao_identificado`) e contra `anota.ai` (deve dar `confirmado`). Para testar a busca de estabelecimentos:

```bash
npx tsx scripts/test-osm.ts "Nome da Cidade" "UF"
```

Com o Supabase conectado, na página de um lead clique em **Rodar detecção**, ou em **Configurações → Fingerprints** para ver/editar as regras usadas.

## Como adicionar novos fingerprints ou concorrentes

Tudo pela UI, em **Configurações → Fingerprints** (usa `SUPABASE_SERVICE_ROLE_KEY` no backend):

- **Novo padrão para o Anota AI**: escolha o tipo de sinal (domínio, script/CDN, meta tag, padrão no HTML ou header HTTP), o padrão e o peso (quanto mais característico, maior o peso).
- **Novo concorrente** (iFood, Goomer, Saipos, Delivery Direto...): insira uma linha em `competitors` (pode ser via SQL Editor do Supabase por enquanto) e depois cadastre os fingerprints dele pela mesma tela — nenhuma alteração de código é necessária, porque o motor em `src/lib/detectors/fingerprint-engine.ts` é 100% orientado pelas regras do banco.

Classificação: soma dos pesos dos sinais encontrados → `confirmado` (≥55), `provável` (≥20), `não identificado` (abaixo disso ou sem URL para analisar).
