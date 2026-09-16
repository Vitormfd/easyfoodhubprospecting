-- ============================================================
-- Easy Food Hub — Prospecção Comercial
-- Schema inicial: leads, detecção de concorrentes, mensagens,
-- fila de prospecção, follow-ups, configurações e Instagram.
-- ============================================================

-- ------------------------------------------------------------
-- Extensões
-- ------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- Enums
-- ------------------------------------------------------------
create type lead_status as enum (
  'novo',
  'qualificado',
  'contatar',
  'contatado',
  'respondeu',
  'em_negociacao',
  'cliente',
  'sem_interesse',
  'descartado'
);

create type competitor_status as enum (
  'confirmado',
  'provavel',
  'nao_identificado'
);

create type fingerprint_signal_type as enum (
  'domain',
  'script_src',
  'meta',
  'html_pattern',
  'header'
);

create type contact_channel as enum (
  'instagram',
  'whatsapp',
  'telefone',
  'email',
  'outro'
);

create type followup_status as enum (
  'pending',
  'done',
  'skipped'
);

-- ------------------------------------------------------------
-- profiles — espelha auth.users, criado via trigger no signup
-- ------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');

  insert into public.settings (user_id) values (new.id);

  return new;
end;
$$;

-- ------------------------------------------------------------
-- competitors — catálogo global de concorrentes
-- ------------------------------------------------------------
create table public.competitors (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.competitors enable row level security;

create policy "competitors_select_authenticated" on public.competitors
  for select to authenticated using (true);

-- ------------------------------------------------------------
-- competitor_fingerprints — regras de detecção, orientadas a
-- dados (novos padrões/concorrentes sem alterar código)
-- ------------------------------------------------------------
create table public.competitor_fingerprints (
  id uuid primary key default gen_random_uuid(),
  competitor_id uuid not null references public.competitors (id) on delete cascade,
  signal_type fingerprint_signal_type not null,
  pattern text not null,
  weight int not null default 10 check (weight > 0 and weight <= 100),
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.competitor_fingerprints enable row level security;

create policy "fingerprints_select_authenticated" on public.competitor_fingerprints
  for select to authenticated using (true);

create index fingerprints_competitor_idx on public.competitor_fingerprints (competitor_id) where active;

-- ------------------------------------------------------------
-- leads
-- ------------------------------------------------------------
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  business_name text not null,
  category text,
  city text not null,
  state text not null,
  address text,
  phone text,
  whatsapp text,
  instagram_username text,
  instagram_url text,
  website text,
  menu_url text,

  competitor text,
  competitor_status competitor_status not null default 'nao_identificado',
  competitor_confidence numeric(5, 2) not null default 0 check (competitor_confidence >= 0 and competitor_confidence <= 100),
  competitor_evidence jsonb not null default '[]'::jsonb,

  source text not null default 'manual',
  source_url text,

  status lead_status not null default 'novo',
  notes text,

  dedup_key text not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.leads enable row level security;

create policy "leads_select_own" on public.leads
  for select using (auth.uid() = user_id);
create policy "leads_insert_own" on public.leads
  for insert with check (auth.uid() = user_id);
create policy "leads_update_own" on public.leads
  for update using (auth.uid() = user_id);
create policy "leads_delete_own" on public.leads
  for delete using (auth.uid() = user_id);

create unique index leads_user_dedup_idx on public.leads (user_id, dedup_key);
create index leads_user_status_idx on public.leads (user_id, status);
create index leads_user_city_idx on public.leads (user_id, city);
create index leads_user_competitor_status_idx on public.leads (user_id, competitor_status);
create index leads_user_created_idx on public.leads (user_id, created_at desc);

create function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger leads_set_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- competitor_detections — histórico de cada análise
-- ------------------------------------------------------------
create table public.competitor_detections (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  competitor_id uuid not null references public.competitors (id) on delete cascade,
  status competitor_status not null,
  confidence numeric(5, 2) not null default 0,
  evidence jsonb not null default '[]'::jsonb,
  analyzed_url text,
  reason text,
  analyzed_at timestamptz not null default now()
);

alter table public.competitor_detections enable row level security;

create policy "detections_select_own" on public.competitor_detections
  for select using (
    exists (select 1 from public.leads l where l.id = lead_id and l.user_id = auth.uid())
  );
create policy "detections_insert_own" on public.competitor_detections
  for insert with check (
    exists (select 1 from public.leads l where l.id = lead_id and l.user_id = auth.uid())
  );

create index detections_lead_idx on public.competitor_detections (lead_id, analyzed_at desc);

-- ------------------------------------------------------------
-- message_templates
-- ------------------------------------------------------------
create table public.message_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  content text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.message_templates enable row level security;

create policy "templates_all_own" on public.message_templates
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger templates_set_updated_at
  before update on public.message_templates
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- contact_history
-- ------------------------------------------------------------
create table public.contact_history (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  template_id uuid references public.message_templates (id) on delete set null,
  channel contact_channel not null,
  message_sent text,
  sent_at timestamptz not null default now(),
  response text,
  responded_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.contact_history enable row level security;

create policy "contact_history_all_own" on public.contact_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index contact_history_lead_idx on public.contact_history (lead_id, sent_at desc);

-- ------------------------------------------------------------
-- follow_ups
-- ------------------------------------------------------------
create table public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  step_number int not null default 1,
  due_date date not null,
  status followup_status not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.follow_ups enable row level security;

create policy "follow_ups_all_own" on public.follow_ups
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index follow_ups_user_due_idx on public.follow_ups (user_id, due_date) where status = 'pending';
create index follow_ups_lead_idx on public.follow_ups (lead_id);

-- ------------------------------------------------------------
-- settings — 1 linha por usuário
-- ------------------------------------------------------------
create table public.settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  default_city text,
  default_state text,
  default_segments text[] not null default array[]::text[],
  follow_up_intervals int[] not null default array[3, 4, 7]::int[],
  signature text,
  contact_preferences jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.settings enable row level security;

create policy "settings_all_own" on public.settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger settings_set_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- instagram_accounts — token nunca exposto ao frontend
-- ------------------------------------------------------------
create table public.instagram_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  ig_user_id text not null,
  ig_username text,
  access_token text not null,
  token_expires_at timestamptz,
  permissions jsonb not null default '[]'::jsonb,
  connected_at timestamptz not null default now()
);

alter table public.instagram_accounts enable row level security;

create policy "instagram_accounts_all_own" on public.instagram_accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- RLS aqui só garante que cada usuário só acessa a própria linha (não a
-- de outros usuários). A app nunca deve ler/enviar access_token para o
-- client: sempre consultar esta tabela a partir de server actions/route
-- handlers, e nunca retornar o campo access_token em uma resposta.

-- Trigger de criação de usuário (profiles + settings)
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- Seed: concorrente Anota AI + fingerprints iniciais
-- ------------------------------------------------------------
insert into public.competitors (slug, name) values
  ('anota_ai', 'Anota AI');

insert into public.competitor_fingerprints (competitor_id, signal_type, pattern, weight, description)
select id, 'domain', 'anota.ai', 60, 'Domínio ou subdomínio oficial do Anota AI (ex.: pedido.anota.ai, loja.anota.ai)'
from public.competitors where slug = 'anota_ai'
union all
select id, 'domain', 'anotaai.com.br', 55, 'Domínio alternativo usado pela plataforma Anota AI'
from public.competitors where slug = 'anota_ai'
union all
select id, 'script_src', 'cdn.anota.ai', 50, 'Script/CDN carregado pelo cardápio digital do Anota AI'
from public.competitors where slug = 'anota_ai'
union all
select id, 'script_src', 'assets.anotaai', 40, 'Bundle JS/CSS com prefixo anotaai em produção'
from public.competitors where slug = 'anota_ai'
union all
select id, 'meta', 'anota ai', 30, 'Meta tag (application-name, generator, og:site_name) mencionando "Anota AI"'
from public.competitors where slug = 'anota_ai'
union all
select id, 'html_pattern', 'data-anotaai', 35, 'Atributo data-* específico de componentes do widget Anota AI'
from public.competitors where slug = 'anota_ai'
union all
select id, 'html_pattern', 'powered by anota', 25, 'Texto de rodapé "powered by Anota AI" ou similar'
from public.competitors where slug = 'anota_ai'
union all
select id, 'header', 'x-powered-by: anota', 45, 'Header HTTP de resposta identificando a infraestrutura Anota AI'
from public.competitors where slug = 'anota_ai';
