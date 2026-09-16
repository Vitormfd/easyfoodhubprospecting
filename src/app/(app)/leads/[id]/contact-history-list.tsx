import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ContactHistoryEntry } from "@/types/database";

const CHANNEL_LABELS: Record<string, string> = {
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  telefone: "Telefone",
  email: "Email",
  outro: "Outro",
};

export function ContactHistoryList({ contacts }: { contacts: ContactHistoryEntry[] }) {
  if (contacts.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum contato registrado ainda.</p>;
  }

  return (
    <ul className="space-y-3">
      {contacts.map((c) => (
        <li key={c.id} className="rounded-md border p-3 text-sm">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-medium">{CHANNEL_LABELS[c.channel] ?? c.channel}</span>
            <span className="text-xs text-muted-foreground">
              {format(new Date(c.sent_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
            </span>
          </div>
          {c.message_sent && <p className="whitespace-pre-wrap text-muted-foreground">{c.message_sent}</p>}
          {c.response && (
            <p className="mt-2 rounded bg-muted/50 p-2 text-xs">
              <span className="font-medium">Resposta: </span>
              {c.response}
            </p>
          )}
          {c.notes && <p className="mt-1 text-xs italic text-muted-foreground">{c.notes}</p>}
        </li>
      ))}
    </ul>
  );
}
