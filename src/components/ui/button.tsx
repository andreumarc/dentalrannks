import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-brand font-display font-semibold uppercase tracking-[0.08em] transition-colors disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        primary:
          "bg-cyan-brand text-white border-2 border-cyan-brand hover:bg-cyan-deep hover:border-cyan-deep",
        outline:
          "bg-transparent text-anthracite border-2 border-line hover:bg-anthracite hover:border-anthracite hover:text-white",
        dark: "bg-anthracite text-white border-2 border-anthracite hover:bg-ink hover:border-ink",
        white:
          "bg-white text-anthracite border-2 border-white hover:bg-transparent hover:text-white",
        ghostWhite:
          "bg-transparent text-white border-2 border-white/50 hover:bg-white hover:text-anthracite hover:border-white",
        subtle:
          "bg-cyan-tint text-cyan-deep border-2 border-transparent hover:bg-cyan-brand hover:text-white",
        danger:
          "bg-negative text-white border-2 border-negative hover:opacity-90",
        link: "bg-transparent border-2 border-transparent text-cyan-deep hover:text-cyan-brand normal-case tracking-normal font-medium",
      },
      size: {
        sm: "h-9 px-4 text-[12px]",
        md: "h-11 px-6 text-[13px]",
        lg: "h-[52px] px-8 text-[14px]",
        icon: "h-10 w-10 px-0",
      },
      block: { true: "w-full", false: "" },
    },
    defaultVariants: { variant: "primary", size: "md", block: false },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, block, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, block }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
