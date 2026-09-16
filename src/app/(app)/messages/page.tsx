import { createClient } from "@/lib/supabase/server";
import { TemplateForm } from "./template-form";
import { TemplatesList } from "./templates-list";

export default async function MessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: templates } = await supabase
    .from("message_templates")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Mensagens</h1>
          <p className="text-sm text-muted-foreground">Modelos de mensagem para a prospecção.</p>
        </div>
        <TemplateForm />
      </div>
      <TemplatesList templates={templates ?? []} />
    </div>
  );
}
