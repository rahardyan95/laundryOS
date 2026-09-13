"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@/lib/api/types";
import { NavPolicy } from "@/lib/nav-policy";
import { SessionManager } from "@/lib/api/session";

export function RequireRole({ allow, children }: { allow: Role[]; children: React.ReactNode }) {
  const router = useRouter();
  const session = SessionManager.get();
  const allowed = session !== null && allow.includes(session.user.role);
  const fallbackHref =
    session !== null
      ? (NavPolicy.itemsFor(session.user.role)[0]?.href ?? "/login")
      : "/login";
  const hasSession = session !== null;

  useEffect(() => {
    if (!hasSession || !allowed) {
      router.replace(!hasSession ? "/login" : fallbackHref);
    }
  }, [router, hasSession, allowed, fallbackHref]);

  if (!allowed) {
    return (
      <div className="flex min-h-40 items-center justify-center">
        <p className="text-sm text-muted-foreground">Memeriksa akses…</p>
      </div>
    );
  }

  return <>{children}</>;
}
