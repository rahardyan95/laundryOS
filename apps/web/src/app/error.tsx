"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="size-6 text-destructive" aria-hidden />
      </span>
      <h1 className="text-xl font-bold tracking-tight">Terjadi kesalahan</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Halaman gagal dimuat. Coba lagi; bila masih gagal, muat ulang aplikasi.
      </p>
      <Button onClick={reset}>Coba lagi</Button>
    </div>
  );
}
