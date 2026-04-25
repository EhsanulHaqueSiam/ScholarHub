import {
  ArrowUpRight,
  Banknote,
  CreditCard,
  FileSignature,
  Lightbulb,
  Plane,
  ShieldAlert,
  Stamp,
  Stethoscope,
  Ticket,
  TriangleAlert,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { type CategoryAccent, PLAYBOOK, type PlaybookCard } from "@/data/resources";
import { ChapterHeader } from "./ChapterHeader";

const ICONS: Record<PlaybookCard["icon"], LucideIcon> = {
  Banknote,
  FileSignature,
  Stethoscope,
  CreditCard,
  Stamp,
  ShieldAlert,
  Plane,
  Ticket,
  Lightbulb,
};

const ACCENT_BG: Record<CategoryAccent, string> = {
  main: "bg-main text-main-foreground",
  pink: "bg-accent-pink text-accent-foreground",
  lime: "bg-accent-lime text-accent-foreground",
  sky: "bg-accent-sky text-accent-foreground",
  amber: "bg-accent text-accent-foreground",
};

export function BangladeshPlaybook() {
  return (
    <section
      id="bangladesh-playbook"
      aria-labelledby="bd-playbook-heading"
      className="py-16 md:py-24 border-t-4 border-border bg-[var(--accent-pink)]/8 dark:bg-[var(--accent-pink)]/12"
    >
      <div className="max-w-[1280px] mx-auto px-4">
        {/* Diagonal-stripe BD strip */}
        <div className="relative inline-flex items-center gap-2 border-2 border-border bg-foreground text-background font-heading text-caption uppercase tracking-[0.2em] px-3 py-1.5 mb-8 shadow-shadow">
          <span className="size-2 bg-accent-lime" aria-hidden />
          Bangladesh playbook
          <span className="size-2 bg-accent-pink" aria-hidden />
        </div>

        <ChapterHeader
          number="04"
          kicker="The hard local stuff"
          title="The 9 things every BD applicant trips on — solved."
        >
          Student File, WES, dual-currency cards, IOM medical, MOFA attestation, source-of-funds
          visa traps, airline baggage hacks. Every section here is something you would have
          learned by losing money or losing time. Read first.
        </ChapterHeader>

        {/* Horizontal snap on mobile, grid on desktop */}
        <div className="mt-12 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 -mx-4 md:mx-0 px-4 md:px-0 flex md:block gap-4 overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none pb-4 md:pb-0 [scrollbar-width:thin]">
          {PLAYBOOK.map((card) => (
            <PlaybookCardView key={card.id} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PlaybookCardView({ card }: { card: PlaybookCard }) {
  const Icon = ICONS[card.icon];
  return (
    <article className="snap-start shrink-0 w-[85%] md:w-auto border-2 border-border bg-secondary-background shadow-shadow flex flex-col motion-safe:transition-transform motion-safe:duration-150 ease-out-expo hover:-translate-y-0.5">
      {/* Header strip */}
      <header
        className={`${ACCENT_BG[card.accent]} border-b-2 border-border px-4 py-3 flex items-center gap-3`}
      >
        <div className="bg-foreground text-background border-2 border-border p-1.5 shadow-[2px_2px_0_0_var(--border)] shrink-0">
          <Icon className="size-4" aria-hidden />
        </div>
        <h3 className="font-heading text-base md:text-lg leading-tight">{card.title}</h3>
      </header>

      <div className="px-4 pt-4 pb-5 flex flex-col gap-4 flex-1">
        {/* Headline metric pill */}
        <div className="inline-flex items-center self-start border-2 border-border bg-background font-mono text-caption px-2.5 py-1 shadow-[2px_2px_0_0_var(--border)]">
          {card.metric}
        </div>

        <p className="font-base text-sm text-foreground/75 leading-relaxed">{card.summary}</p>

        <ul className="space-y-1.5 border-t-2 border-dashed border-border pt-3 mt-auto">
          {card.bullets.map((b) => (
            <li key={b} className="flex items-start gap-2 text-caption md:text-sm leading-snug">
              <span
                aria-hidden
                className="size-1.5 bg-foreground/55 mt-[8px] shrink-0"
              />
              <span className="text-foreground/80">{b}</span>
            </li>
          ))}
        </ul>

        {card.warning ? (
          <div className="border-2 border-[var(--urgency-critical)] bg-[var(--urgency-critical)]/10 px-3 py-2 flex items-start gap-2">
            <TriangleAlert
              className="size-4 text-[var(--urgency-critical)] shrink-0 mt-0.5"
              aria-hidden
            />
            <p className="font-base text-caption leading-snug text-foreground/85">
              {card.warning}
            </p>
          </div>
        ) : null}

        {card.link ? (
          <a
            href={card.link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 self-start border-2 border-border bg-foreground text-background px-3 py-1.5 font-heading text-caption hover:translate-x-[3px] hover:translate-y-[3px] motion-safe:transition-transform"
          >
            {card.link.label}
            <ArrowUpRight className="size-3" />
          </a>
        ) : null}
      </div>
    </article>
  );
}
