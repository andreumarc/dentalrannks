import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full font-mono uppercase tracking-[0.11em] whitespace-nowrap",
  {
    variants: {
      variant: {
        neutral: "bg-mist text-grey",
        cyan: "bg-cyan-tint text-cyan-deep",
        solid: "bg-cyan-brand text-white",
        dark: "bg-anthracite text-white",
        positive: "bg-positive-tint text-positive",
        negative: "bg-negative-tint text-negative",
        warning: "bg-warning-tint text-warning",
        outline: "border border-line text-grey",
      },
      size: {
        sm: "px-2 py-[3px] text-[9.5px]",
        md: "px-2.5 py-[5px] text-[10.5px]",
      },
    },
    defaultVariants: { variant: "neutral", size: "md" },
  },
);

export function Badge({
  className,
  variant,
  size,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}
