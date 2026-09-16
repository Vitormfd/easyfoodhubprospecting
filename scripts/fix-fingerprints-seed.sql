-- Fix-up: roda só a parte que falhou da migration 0001_init.sql
-- (o erro era um cast de tipo faltando nos literais de signal_type).
-- Seguro rodar mesmo se 'anota_ai' já existir em competitors.

insert into public.competitors (slug, name) values
  ('anota_ai', 'Anota AI')
on conflict (slug) do nothing;

insert into public.competitor_fingerprints (competitor_id, signal_type, pattern, weight, description)
select id, 'domain'::fingerprint_signal_type, 'anota.ai', 60, 'Domínio ou subdomínio oficial do Anota AI (ex.: pedido.anota.ai, loja.anota.ai)'
from public.competitors where slug = 'anota_ai'
union all
select id, 'domain'::fingerprint_signal_type, 'anotaai.com.br', 55, 'Domínio alternativo usado pela plataforma Anota AI'
from public.competitors where slug = 'anota_ai'
union all
select id, 'script_src'::fingerprint_signal_type, 'cdn.anota.ai', 50, 'Script/CDN carregado pelo cardápio digital do Anota AI'
from public.competitors where slug = 'anota_ai'
union all
select id, 'script_src'::fingerprint_signal_type, 'assets.anotaai', 40, 'Bundle JS/CSS com prefixo anotaai em produção'
from public.competitors where slug = 'anota_ai'
union all
select id, 'meta'::fingerprint_signal_type, 'anota ai', 30, 'Meta tag (application-name, generator, og:site_name) mencionando "Anota AI"'
from public.competitors where slug = 'anota_ai'
union all
select id, 'html_pattern'::fingerprint_signal_type, 'data-anotaai', 35, 'Atributo data-* específico de componentes do widget Anota AI'
from public.competitors where slug = 'anota_ai'
union all
select id, 'html_pattern'::fingerprint_signal_type, 'powered by anota', 25, 'Texto de rodapé "powered by Anota AI" ou similar'
from public.competitors where slug = 'anota_ai'
union all
select id, 'header'::fingerprint_signal_type, 'x-powered-by: anota', 45, 'Header HTTP de resposta identificando a infraestrutura Anota AI'
from public.competitors where slug = 'anota_ai';
