import { CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function Row({ label, ok, detail }: { label: string; ok: boolean; detail: string }) {
  return (
    <div className="flex items-center justify-between border-b py-3 last:border-0">
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
      {ok ? (
        <span className="flex items-center gap-1 text-sm font-medium text-emerald-600">
          <CheckCircle2 className="size-4" /> Ativo
        </span>
      ) : (
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          <XCircle className="size-4" /> Não configurado
        </span>
      )}
    </div>
  );
}

export function IntegrationsStatus({
  hasGooglePlaces,
  hasAnthropic,
  hasInstagramApp,
  instagramConnected,
}: {
  hasGooglePlaces: boolean;
  hasAnthropic: boolean;
  hasInstagramApp: boolean;
  instagramConnected: boolean;
}) {
  return (
    <Card className="max-w-lg">
      <CardContent className="pt-6">
        <Row label="Busca — OpenStreetMap" ok detail="Fonte pública, sempre ativa, sem chave necessária." />
        <Row
          label="Busca — Google Places"
          ok={hasGooglePlaces}
          detail={hasGooglePlaces ? "Chave configurada — resultados combinados com OSM." : "Configure GOOGLE_PLACES_API_KEY no .env para ativar."}
        />
        <Row
          label="Geração de mensagem por IA"
          ok={hasAnthropic}
          detail={hasAnthropic ? "Anthropic configurada." : "Configure ANTHROPIC_API_KEY no .env para ativar."}
        />
        <Row
          label="Instagram — App Meta"
          ok={hasInstagramApp}
          detail={hasInstagramApp ? "Credenciais do app configuradas." : "Configure META_APP_ID/META_APP_SECRET no .env."}
        />
        <Row
          label="Instagram — conta conectada"
          ok={instagramConnected}
          detail={instagramConnected ? "Conta profissional conectada." : "Nenhuma conta conectada — use o fluxo manual (copiar + abrir perfil)."}
        />
        {hasInstagramApp && !instagramConnected && (
          <div className="pt-3">
            <Button size="sm" variant="outline" nativeButton={false} render={<a href="/api/instagram/connect" />}>
              Conectar conta do Instagram
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
