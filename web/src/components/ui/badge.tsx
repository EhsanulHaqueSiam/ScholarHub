import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import type * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-base border-2 border-border px-2.5 py-0.5 text-[13px] font-base w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] overflow-hidden",
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
        new: "bg-main text-main-foreground motion-safe:animate-pulse",
        limitedInfo: "bg-secondary-background text-foreground border-border",
        tag: "bg-transparent text-foreground border-[1.5px] border-[var(--tag-outline-border)] dark:border-[var(--tag-outline-border)] hover:bg-secondary-background cursor-pointer",
        tagSuggested:
          "bg-[var(--tag-suggested-bg)] dark:bg-[var(--tag-suggested-bg)] text-foreground border-[1.5px] border-[var(--tag-suggested-border)] dark:border-[var(--tag-suggested-border)]",
        typeGovernment:
          "bg-type-government-badge text-white border-type-government-border font-heading",
        typeMerit: "bg-type-merit-badge text-black border-type-merit-border font-heading",
        typeNeedBased:
          "bg-type-need-based-badge text-white border-type-need-based-border font-heading",
        typeUniversity:
          "bg-type-university-badge text-white border-type-university-border font-heading",
        typeResearch: "bg-type-research-badge text-white border-type-research-border font-heading",
        typeCountrySpecific:
          "bg-type-country-specific-badge text-white border-type-country-specific-border font-heading",
        typeAthletic: "bg-type-athletic-badge text-white border-type-athletic-border font-heading",
        typeSubjectSpecific:
          "bg-type-subject-specific-badge text-black border-type-subject-specific-border font-heading",
        accent: "bg-accent text-accent-foreground border-accent-foreground/20 font-heading",
        matchStrong: "bg-match-strong-badge text-white border-match-strong-border font-heading",
        matchGood: "bg-match-good-badge text-white border-match-good-border font-heading",
        matchPartial: "bg-match-partial-badge text-black border-match-partial-border font-heading",
        matchPossible:
          "bg-match-possible-badge text-white border-match-possible-border font-heading",
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
