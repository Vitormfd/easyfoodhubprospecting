"use client";

import { useCallback, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { LEAD_STATUS_ORDER, LEAD_STATUS_LABELS } from "@/lib/constants";

const ALL = "__all__";

export function LeadsFilters({
  cities,
  segments,
}: {
  cities: string[];
  segments: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const set = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (!value || value === ALL) params.delete(key);
      else params.set(key, value);
      startTransition(() => router.push(`${pathname}?${params.toString()}`));
    },
    [pathname, router, searchParams],
  );

  const hasFilters = [...searchParams.keys()].length > 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        placeholder="Buscar por nome..."
        defaultValue={searchParams.get("q") ?? ""}
        onChange={(e) => set("q", e.target.value)}
        className="w-56"
      />

      <Select defaultValue={searchParams.get("competitor") ?? ALL} onValueChange={(v) => set("competitor", v)}>
        <SelectTrigger className="w-44"><SelectValue placeholder="Concorrente" /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos os leads</SelectItem>
          <SelectItem value="confirmado">Anota AI confirmado</SelectItem>
          <SelectItem value="provavel">Anota AI provável</SelectItem>
          <SelectItem value="any_signal">Confirmado ou provável</SelectItem>
        </SelectContent>
      </Select>

      <Select defaultValue={searchParams.get("status") ?? ALL} onValueChange={(v) => set("status", v)}>
        <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos os status</SelectItem>
          {LEAD_STATUS_ORDER.map((s) => (
            <SelectItem key={s} value={s}>{LEAD_STATUS_LABELS[s]}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select defaultValue={searchParams.get("city") ?? ALL} onValueChange={(v) => set("city", v)}>
        <SelectTrigger className="w-40"><SelectValue placeholder="Cidade" /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todas as cidades</SelectItem>
          {cities.map((c) => (
            <SelectItem key={c} value={c}>{c}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select defaultValue={searchParams.get("segment") ?? ALL} onValueChange={(v) => set("segment", v)}>
        <SelectTrigger className="w-40"><SelectValue placeholder="Segmento" /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos os segmentos</SelectItem>
          {segments.map((s) => (
            <SelectItem key={s} value={s}>{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select defaultValue={searchParams.get("contacted") ?? ALL} onValueChange={(v) => set("contacted", v)}>
        <SelectTrigger className="w-36"><SelectValue placeholder="Contato" /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos</SelectItem>
          <SelectItem value="yes">Contatados</SelectItem>
          <SelectItem value="no">Não contatados</SelectItem>
        </SelectContent>
      </Select>

      <Select
        defaultValue={searchParams.get("hasInstagram") === "1" ? "1" : ALL}
        onValueChange={(v) => set("hasInstagram", v === "1" ? "1" : null)}
      >
        <SelectTrigger className="w-36"><SelectValue placeholder="Instagram" /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Instagram: todos</SelectItem>
          <SelectItem value="1">Com Instagram</SelectItem>
        </SelectContent>
      </Select>

      <Select
        defaultValue={searchParams.get("hasWhatsapp") === "1" ? "1" : ALL}
        onValueChange={(v) => set("hasWhatsapp", v === "1" ? "1" : null)}
      >
        <SelectTrigger className="w-36"><SelectValue placeholder="WhatsApp" /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>WhatsApp: todos</SelectItem>
          <SelectItem value="1">Com WhatsApp</SelectItem>
        </SelectContent>
      </Select>

      <Select defaultValue={searchParams.get("sort") ?? "recent"} onValueChange={(v) => set("sort", v)}>
        <SelectTrigger className="w-44"><SelectValue placeholder="Ordenar" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="recent">Mais recentes</SelectItem>
          <SelectItem value="confidence">Maior confiança</SelectItem>
          <SelectItem value="no_contact">Sem contato</SelectItem>
          <SelectItem value="last_contact">Último contato</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={() => router.push(pathname)}>
          <X className="size-4" /> Limpar
        </Button>
      )}
    </div>
  );
}
