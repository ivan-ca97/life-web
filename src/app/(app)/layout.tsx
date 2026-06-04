"use client";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthGuard } from "@/lib/auth/guard";
import { DateProvider, useDate } from "@/lib/date/context";
import { DatePicker } from "@/components/date-picker";
import { Separator } from "@/components/ui/separator";

function AppHeader() {
  const { date, setDate } = useDate();
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 !h-4" />
      <DatePicker value={date} onChange={setDate} showTodayButton />
    </header>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <DateProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <AppHeader />
          <main className="flex-1 p-4 md:p-6 max-w-5xl">{children}</main>
        </SidebarInset>
      </SidebarProvider>
      </DateProvider>
    </AuthGuard>
  );
}
