import type { LeadStatus, CompetitorStatus } from "@/types/database";

export const SEGMENTS = [
  "Restaurante",
  "Hamburgueria",
  "Pizzaria",
  "Lanchonete",
  "Açaí",
  "Delivery",
  "Pastelaria",
  "Sorveteria",
] as const;

export const BRAZIL_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO",
  "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI",
  "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  novo: "Novo",
  qualificado: "Qualificado",
  contatar: "Contatar",
  contatado: "Contatado",
  respondeu: "Respondeu",
  em_negociacao: "Em negociação",
  cliente: "Cliente",
  sem_interesse: "Sem interesse",
  descartado: "Descartado",
};

export const LEAD_STATUS_ORDER: LeadStatus[] = [
  "novo",
  "qualificado",
  "contatar",
  "contatado",
  "respondeu",
  "em_negociacao",
  "cliente",
  "sem_interesse",
  "descartado",
];

export const COMPETITOR_STATUS_LABELS: Record<CompetitorStatus, string> = {
  confirmado: "Confirmado",
  provavel: "Provável",
  nao_identificado: "Não identificado",
};

export const DEFAULT_FOLLOW_UP_INTERVALS = [3, 4, 7];

export const MESSAGE_VARIABLES = [
  { key: "nome", label: "Nome do contato" },
  { key: "empresa", label: "Nome do estabelecimento" },
  { key: "segmento", label: "Segmento" },
  { key: "cidade", label: "Cidade" },
] as const;
