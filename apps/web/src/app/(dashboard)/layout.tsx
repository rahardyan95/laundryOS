"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { OutletContext } from "@/components/layout/outlet-context";
import { RequireRole } from "@/components/layout/require-role";
import { Topbar } from "@/components/layout/topbar";
import { api } from "@/lib/api/client";
import type { SessionPayload } from "@/lib/api/types";
import { NavPolicy } from "@/lib/nav-policy";
import { SessionManager } from "@/lib/api/session";
import { HttpClient } from "@/lib/api/laravel/http-client";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [outletId, setOutletId] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    api
      .getMe()
      .then((payload) => {
        if (cancelled) return;
        if (!payload) {
          router.replace("/login");
          return;
        }
        setSession(payload);
        setOutletId(SessionManager.outletId(payload.user.outletId) ?? payload.user.outletId);
      })
      .catch(() => {
        if (cancelled) return;
        router.replace("/login");
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleOutletChange = useCallback((id: string) => {
    SessionManager.setOutletId(id);
    setOutletId(id);
  }, []);

  useEffect(() => {
    const handler = () => {
      SessionManager.clear();
      router.replace("/login");
    };
    window.addEventListener(HttpClient.UNAUTHORIZED_EVENT, handler);
    return () => window.removeEventListener(HttpClient.UNAUTHORIZED_EVENT, handler);
  }, [router]);

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Memuat sesi…</p>
      </div>
    );
  }

  return (
    <OutletContext.Provider value={{ outletId, setOutletId: handleOutletChange }}>
      <SidebarProvider>
        <AppSidebar session={session} />
        <SidebarInset>
          <Topbar session={session} outletId={outletId} onOutletChange={handleOutletChange} />
          <main className="animate-enter flex-1 p-4 sm:p-6">
            <RequireRole key={pathname} allow={NavPolicy.allowForPath(pathname)}>
              {children}
            </RequireRole>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </OutletContext.Provider>
  );
}
