import * as React from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-brand border border-dashed border-line bg-mist px-6 py-14 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="mb-4 grid size-12 place-items-center rounded-full bg-cyan-tint text-cyan-deep">
          {icon}
        </div>
      ) : null}
      <p className="font-display text-[16px] font-semibold uppercase tracking-[0.05em] text-ink">
        {title}
      </p>
      {description ? (
        <p className="mt-2 max-w-[46ch] text-[14.5px] text-grey">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-brand bg-mist", className)} />;
}

export function ErrorNote({
  title = "Algo no ha ido bien",
  message,
  action,
}: {
  title?: string;
  message?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-brand border border-negative/40 bg-negative-tint px-5 py-4">
      <p className="font-display text-[15px] font-semibold uppercase tracking-[0.05em] text-negative">
        {title}
      </p>
      {message ? <p className="mt-1.5 text-[14.5px] text-ink/80">{message}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

export function InfoNote({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "cyan" | "warning";
}) {
  const tones = {
    neutral: "border-line bg-mist text-grey",
    cyan: "border-cyan-brand/30 bg-cyan-tint text-cyan-deep",
    warning: "border-warning/30 bg-warning-tint text-warning",
  } as const;
  return (
    <div className={cn("rounded-brand border px-4 py-3 text-[13.5px] leading-relaxed", tones[tone])}>
      {children}
    </div>
  );
}
