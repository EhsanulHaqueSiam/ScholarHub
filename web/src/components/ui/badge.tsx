import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import type * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-base border-2 border-border px-2 py-1 text-caption font-base w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-main text-main-foreground",
        neutral: "bg-secondary-background text-foreground",
        gold: "bg-prestige-gold-badge text-accent-foreground border-prestige-gold-border font-heading",
        silver: "bg-prestige-silver-badge text-accent-foreground border-prestige-silver-border font-heading",
        bronze: "bg-prestige-bronze-badge text-accent-foreground border-prestige-bronze-border font-heading",
        urgencyCritical: "bg-urgency-critical text-main-foreground border-urgency-critical",
        urgencyWarning: "bg-urgency-warning text-accent-foreground border-urgency-warning",
        urgencyOpen: "bg-urgency-open text-main-foreground border-urgency-open",
        urgencyClosed: "bg-urgency-closed text-main-foreground border-urgency-closed",
        new: "bg-main text-main-foreground motion-safe:animate-pulse",
        limitedInfo: "bg-secondary-background text-foreground border-border",
        tag: "bg-transparent text-foreground border-[1.5px] border-[var(--tag-outline-border)] dark:border-[var(--tag-outline-border)] hover:bg-secondary-background cursor-pointer",
        tagSuggested:
          "bg-[var(--tag-suggested-bg)] dark:bg-[var(--tag-suggested-bg)] text-foreground border-[1.5px] border-[var(--tag-suggested-border)] dark:border-[var(--tag-suggested-border)]",
        typeGovernment:
          "bg-type-government-badge text-main-foreground border-type-government-border font-heading",
        typeMerit: "bg-type-merit-badge text-accent-foreground border-type-merit-border font-heading",
        typeNeedBased:
          "bg-type-need-based-badge text-main-foreground border-type-need-based-border font-heading",
        typeUniversity:
          "bg-type-university-badge text-main-foreground border-type-university-border font-heading",
        typeResearch: "bg-type-research-badge text-main-foreground border-type-research-border font-heading",
        typeCountrySpecific:
          "bg-type-country-specific-badge text-main-foreground border-type-country-specific-border font-heading",
        typeAthletic: "bg-type-athletic-badge text-main-foreground border-type-athletic-border font-heading",
        typeSubjectSpecific:
          "bg-type-subject-specific-badge text-accent-foreground border-type-subject-specific-border font-heading",
        accent: "bg-accent text-accent-foreground border-accent-foreground/20 font-heading",
        matchStrong: "bg-match-strong-badge text-main-foreground border-match-strong-border font-heading",
        matchGood: "bg-match-good-badge text-main-foreground border-match-good-border font-heading",
        matchPartial: "bg-match-partial-badge text-accent-foreground border-match-partial-border font-heading",
        matchPossible:
          "bg-match-possible-badge text-main-foreground border-match-possible-border font-heading",
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
