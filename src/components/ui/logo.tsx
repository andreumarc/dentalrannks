import { cn } from "@/lib/utils";

/** Marca de DentalRank: diente + señal de progreso, sobre bloque antracita. */
export function LogoMark({ className, size = 38 }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      role="img"
      aria-label="DentalRank"
      className={cn("shrink-0", className)}
    >
      <rect width="64" height="64" rx="15" fill="#393F42" />
      <path
        d="M32 10c4.4 0 6.4 1.8 9.4 1.8 3.2 0 5.5-.4 5.5 5.8 0 4.6-1.3 7.3-2.3 11l-2.5 12.9c-.6 2.9-4.4 2.9-5 0l-2.2-10.4c-.5-2.4-4.1-2.4-4.6 0l-2.2 10.4c-.6 2.9-4.4 2.9-5 0L20.6 28.6c-1-3.7-2.3-6.4-2.3-11 0-6.2 2.3-5.8 5.5-5.8 3 0 5-1.8 8.2-1.8z"
        fill="#FFFFFF"
      />
      <path
        d="M38.5 25.5l5.5-6.4 4.4 3.9 6.1-7.3"
        fill="none"
        stroke="#393F42"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M50.5 12.6h5.6v5.6"
        fill="none"
        stroke="#393F42"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M38.5 25.5l5.5-6.4 4.4 3.9 6.1-7.3"
        fill="none"
        stroke="#01ADD0"
        strokeWidth="4.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M50.5 12.6h5.6v5.6"
        fill="none"
        stroke="#01ADD0"
        strokeWidth="4.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({
  className,
  subtitle = "Marketplace dental",
  size = 38,
  inverted = false,
}: {
  className?: string;
  subtitle?: string;
  size?: number;
  inverted?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-3", className)}>
      <LogoMark size={size} />
      <span className="leading-[1.1]">
        <span
          className={cn(
            "block font-display text-[20px] font-bold tracking-[0.1em]",
            inverted ? "text-white" : "text-ink",
          )}
        >
          DENTALRANK
        </span>
        <span
          className={cn(
            "block font-mono text-[8.5px] uppercase tracking-[0.13em]",
            inverted ? "text-grey-soft" : "text-grey",
          )}
        >
          {subtitle}
        </span>
      </span>
    </span>
  );
}
