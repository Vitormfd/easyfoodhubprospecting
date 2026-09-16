import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  accent?: "blue" | "cyan" | "navy" | "muted";
}) {
  const accentClass =
    accent === "blue"
      ? "bg-brand-blue/10 text-brand-blue"
      : accent === "cyan"
        ? "bg-brand-cyan/15 text-brand-cyan"
        : accent === "navy"
          ? "bg-brand-navy/10 text-brand-navy"
          : "bg-muted text-muted-foreground";

  return (
    <Card className="py-0">
      <CardContent className="flex items-center gap-4 p-4">
        {Icon && (
          <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", accentClass)}>
            <Icon className="size-5" />
          </div>
        )}
        <div>
          <p className="text-2xl font-bold leading-tight">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
