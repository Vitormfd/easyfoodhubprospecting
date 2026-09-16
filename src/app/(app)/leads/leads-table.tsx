"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AtSign, MessageCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CompetitorStatusBadge, LeadStatusBadge } from "@/components/leads/badges";
import type { LeadListItem } from "@/lib/queries/leads";

export function LeadsTable({ leads }: { leads: LeadListItem[] }) {
  if (leads.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        Nenhum lead encontrado com esses filtros.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Empresa</TableHead>
            <TableHead>Segmento</TableHead>
            <TableHead>Cidade</TableHead>
            <TableHead>Instagram</TableHead>
            <TableHead>WhatsApp</TableHead>
            <TableHead>Concorrente</TableHead>
            <TableHead>Confiança</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Último contato</TableHead>
            <TableHead>Próx. follow-up</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id} className="cursor-pointer">
              <TableCell className="p-0">
                <Link href={`/leads/${lead.id}`} className="block px-4 py-2.5 font-medium">
                  {lead.business_name}
                </Link>
              </TableCell>
              <TableCell>{lead.category ?? "—"}</TableCell>
              <TableCell>{lead.city}/{lead.state}</TableCell>
              <TableCell>
                {lead.instagram_username ? (
                  <span className="flex items-center gap-1 text-sm">
                    <AtSign className="size-3.5 text-muted-foreground" /> {lead.instagram_username}
                  </span>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>
                {lead.whatsapp ? (
                  <span className="flex items-center gap-1 text-sm">
                    <MessageCircle className="size-3.5 text-muted-foreground" /> {lead.whatsapp}
                  </span>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>{lead.competitor ?? "—"}</TableCell>
              <TableCell>
                <CompetitorStatusBadge status={lead.competitor_status} />
                {lead.competitor_status !== "nao_identificado" && (
                  <span className="ml-1 text-xs text-muted-foreground">{lead.competitor_confidence}%</span>
                )}
              </TableCell>
              <TableCell><LeadStatusBadge status={lead.status} /></TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {lead.last_contact_at ? format(new Date(lead.last_contact_at), "dd/MM/yyyy", { locale: ptBR }) : "—"}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {lead.next_followup_at ? format(new Date(lead.next_followup_at), "dd/MM/yyyy", { locale: ptBR }) : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
