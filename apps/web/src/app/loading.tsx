import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-4 w-64" />
      <p className="sr-only">Memuat halaman…</p>
    </div>
  );
}
