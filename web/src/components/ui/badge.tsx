import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import type * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-base border-2 border-border px-2.5 py-0.5 text-xs font-base w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-main text-main-foreground",
        neutral: "bg-secondary-background text-foreground",
        gold: "bg-prestige-gold-badge text-black border-prestige-gold-border font-heading",
        silver: "bg-prestige-silver-badge text-black border-prestige-silver-border font-heading",
        bronze: "bg-prestige-bronze-badge text-black border-prestige-bronze-border font-heading",
        urgencyCritical: "bg-urgency-critical text-white border-urgency-critical",
        urgencyWarning: "bg-urgency-warning text-black border-urgency-warning",
        urgencyOpen: "bg-urgency-open text-white border-urgency-open",
        urgencyClosed: "bg-urgency-closed text-white border-urgency-closed",
        new: "bg-main text-main-foreground animate-pulse",
        limitedInfo: "bg-secondary-background text-foreground border-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
