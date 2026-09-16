"use client";

import {
  LayoutDashboard,
  Search,
  Users,
  ListChecks,
  CalendarClock,
  MessageSquareText,
  Settings,
} from "lucide-react";
import { NavLink } from "./nav-link";

export function AppSidebar({
  queueCount,
  followupCount,
}: {
  queueCount: number;
  followupCount: number;
}) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex h-16 items-center gap-2 px-5">
        <span className="font-heading text-lg font-extrabold text-white">
          Easy<span className="text-brand-cyan">Food</span>Hub
        </span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
        <NavLink href="/dashboard" label="Dashboard" icon={LayoutDashboard} />
        <NavLink href="/search" label="Pesquisar" icon={Search} />
        <NavLink href="/leads" label="Leads" icon={Users} />
        <NavLink href="/queue" label="Fila de prospecção" icon={ListChecks} badge={queueCount} />
        <NavLink href="/followups" label="Follow-ups" icon={CalendarClock} badge={followupCount} />
        <NavLink href="/messages" label="Mensagens" icon={MessageSquareText} />
        <NavLink href="/settings" label="Configurações" icon={Settings} />
      </nav>
      <div className="border-t border-white/10 px-5 py-4 text-xs text-white/40">
        Easy Food Hub — Prospecção
      </div>
    </aside>
  );
}
