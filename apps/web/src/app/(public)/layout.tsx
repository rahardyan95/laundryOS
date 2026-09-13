import { Logo } from "@/components/layout/logo";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center bg-muted/40 px-4 py-10">
      <div className="mb-7">
        <Logo size={40} tone="on-light" />
      </div>
      {children}
    </div>
  );
}
