import { LogOut, Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { signOutAction } from "@/app/(auth)/actions";
import { AppSidebar } from "./sidebar";

export function Topbar({
  email,
  fullName,
  queueCount,
  followupCount,
}: {
  email: string;
  fullName: string | null;
  queueCount: number;
  followupCount: number;
}) {
  const initials = (fullName || email).slice(0, 2).toUpperCase();

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 md:px-6">
      <div className="flex items-center gap-2 md:hidden">
        <Sheet>
          <SheetTrigger render={<Button variant="ghost" size="icon" />}>
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <AppSidebar queueCount={queueCount} followupCount={followupCount} />
          </SheetContent>
        </Sheet>
      </div>
      <div className="hidden md:block" />
      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium leading-tight">{fullName || "Minha conta"}</p>
          <p className="text-xs text-muted-foreground leading-tight">{email}</p>
        </div>
        <Avatar className="size-9">
          <AvatarFallback className="bg-brand-blue text-white">{initials}</AvatarFallback>
        </Avatar>
        <form action={signOutAction}>
          <Button type="submit" variant="ghost" size="icon" title="Sair">
            <LogOut className="size-4" />
          </Button>
        </form>
      </div>
    </header>
  );
}
