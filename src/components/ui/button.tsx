import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-base font-bold cursor-pointer transition-colors text-center focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border-2 border-primary bg-elevated text-foreground shadow-soft hover:bg-elevated-hover",
        info: "border-2 border-info bg-elevated text-foreground shadow-soft hover:bg-elevated-hover",
        // Red is reserved for SOCORRO / danger. Do not use for ordinary deletion.
        sos: "border-2 border-sos-light bg-sos text-sos-foreground shadow-lift hover:bg-sos/90 [&_svg]:text-current",
        safe: "border-2 border-safe-light bg-safe text-safe-foreground shadow-lift hover:bg-safe/90 [&_svg]:text-current",
        destructive: "border-2 border-sos-light bg-sos text-sos-foreground shadow-soft hover:bg-sos/90 [&_svg]:text-current",
        outline:
          "border-2 border-input bg-card text-foreground hover:bg-elevated hover:text-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-foreground underline decoration-primary decoration-2 underline-offset-4 hover:decoration-foreground",
      },
      size: {
        default: "min-h-11 px-5 py-2",
        sm: "min-h-9 px-3 py-1.5 text-sm",
        lg: "min-h-14 px-6 py-3 text-lg",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
