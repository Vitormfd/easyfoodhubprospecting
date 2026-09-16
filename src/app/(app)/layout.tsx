import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppSidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { getQueueCount, getFollowupCountToday } from "@/lib/queries/counts";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const [queueCount, followupCount] = await Promise.all([
    getQueueCount(supabase, user.id),
    getFollowupCountToday(supabase, user.id),
  ]);

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar queueCount={queueCount} followupCount={followupCount} />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar
          email={user.email ?? ""}
          fullName={profile?.full_name ?? null}
          queueCount={queueCount}
          followupCount={followupCount}
        />
        <main className="flex-1 bg-muted/30 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
