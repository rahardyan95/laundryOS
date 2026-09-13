interface LogoMarkProps {
  size?: number;
  tone?: "on-light" | "on-dark";
}

export function LogoMark({ size = 32, tone = "on-light" }: LogoMarkProps) {
  const tile = tone === "on-dark" ? "var(--accent)" : "var(--primary)";
  const drop = tone === "on-dark" ? "var(--primary)" : "var(--accent)";
  const wave = tone === "on-dark" ? "var(--accent)" : "var(--primary)";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      role="img"
      aria-label="Logo LaundryOS"
    >
      <rect x="1" y="1" width="30" height="30" rx="9" fill={tile} />
      <path
        d="M16 5.5c3.4 4.4 6.8 8.3 6.8 12a6.8 6.8 0 1 1-13.6 0C9.2 13.8 12.6 9.9 16 5.5z"
        fill={drop}
      />
      <path
        d="M10.6 19.4q2.7-2 5.4 0t5.4 0"
        fill="none"
        stroke={wave}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({
  size = 32,
  tone = "on-light",
  compact = false,
}: LogoMarkProps & { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark size={size} tone={tone} />
      {!compact && (
        <span className="flex flex-col leading-tight">
          <span className="text-[17px] font-extrabold tracking-tight">LaundryOS</span>
        </span>
      )}
    </span>
  );
}
