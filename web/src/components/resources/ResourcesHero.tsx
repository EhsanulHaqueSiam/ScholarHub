import { ArrowDown, Layers, MapPin, Sparkles } from "lucide-react";
import { CATEGORIES, totalLinkCount } from "@/data/resources";

const STAT_BG = ["bg-accent-pink", "bg-accent-lime", "bg-accent-sky"] as const;

export function ResourcesHero() {
  const total = totalLinkCount();
  const cats = CATEGORIES.length;

  return (
    <section
      aria-labelledby="resources-hero-heading"
      className="relative overflow-hidden border-b-4 border-border pt-24 md:pt-28 pb-12 md:pb-20"
    >
      {/* Decorative diagonal stripe — bottom right */}
      <div
        aria-hidden
        className="absolute -bottom-24 -right-24 w-96 h-96 bg-accent-pink border-2 border-border rotate-12 opacity-15 dark:opacity-25"
      />
      <div
        aria-hidden
        className="absolute top-20 right-10 w-32 h-32 bg-accent-lime border-2 border-border -rotate-6 opacity-25 dark:opacity-30 hidden md:block"
      />

      <div className="relative max-w-[1280px] mx-auto px-4 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-10 items-end">
        <div className="space-y-5 max-w-3xl">
          <div className="inline-flex items-center gap-2 border-2 border-border bg-foreground text-background font-heading text-caption uppercase tracking-[0.25em] px-3 py-1.5 shadow-shadow">
            <MapPin className="size-3" aria-hidden />
            Bangladesh-first toolbox
          </div>

          <h1
            id="resources-hero-heading"
            className="font-heading text-display-sm sm:text-display md:text-display-lg leading-[0.95] tracking-tight"
          >
            Stop drowning
            <br />
            in tabs.{" "}
            <span className="inline-block bg-accent-pink text-accent-foreground border-2 border-border px-2 -rotate-1 shadow-shadow translate-y-1">
              Pick a plan.
            </span>
          </h1>

          <p className="font-base text-foreground/70 text-base md:text-lg leading-relaxed max-w-xl">
            One curated stack of search engines, scholarship databases, predictors, communities,
            and BD-only operational hacks — organised by the layer of the funnel they belong to.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href="#minimum-stack"
              className="inline-flex items-center gap-2 bg-foreground text-background border-2 border-border font-heading text-sm px-4 py-2.5 shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none motion-safe:transition-[transform,box-shadow] active:scale-[0.97]"
            >
              <Sparkles className="size-4" />
              The starting six
            </a>
            <a
              href="#bangladesh-playbook"
              className="inline-flex items-center gap-2 bg-accent-pink text-accent-foreground border-2 border-border font-heading text-sm px-4 py-2.5 shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none motion-safe:transition-[transform,box-shadow] active:scale-[0.97]"
            >
              Jump to BD playbook
              <ArrowDown className="size-4" />
            </a>
          </div>
        </div>

        {/* Stat dashboard */}
        <ul className="grid grid-cols-3 gap-3 lg:flex lg:flex-col lg:gap-2 lg:w-56">
          {[
            { num: cats, label: "categories", desc: "of curated tools" },
            { num: total, label: "tools", desc: "all hand-picked" },
            { num: 9, label: "BD playbooks", desc: "the local-only stuff" },
          ].map((stat, i) => (
            <li
              key={stat.label}
              className={`${STAT_BG[i]} border-2 border-border shadow-shadow text-accent-foreground px-3 py-3 lg:py-4`}
            >
              <div className="flex items-baseline gap-1">
                <span className="font-heading text-3xl md:text-4xl tabular-nums leading-none">
                  {stat.num}
                </span>
                <span className="font-heading text-caption uppercase tracking-widest">
                  {stat.label}
                </span>
              </div>
              <p className="font-base text-caption opacity-80 mt-1 leading-snug">
                {stat.desc}
              </p>
            </li>
          ))}
        </ul>
      </div>

      {/* Quote / mantra ribbon — chapter 01 marker */}
      <div className="relative max-w-[1280px] mx-auto px-4 mt-12 md:mt-16">
        <div
          id="manifesto"
          className="border-2 border-border bg-secondary-background shadow-shadow grid grid-cols-1 md:grid-cols-[auto_1fr] items-center"
        >
          <div className="bg-foreground text-background border-r-2 border-border px-4 md:px-6 py-3 md:py-5 flex items-center gap-3">
            <Layers className="size-4 md:size-5" aria-hidden />
            <span className="font-heading text-caption uppercase tracking-[0.25em]">
              Chapter 01 · How to use
            </span>
          </div>
          <p className="font-base text-foreground/80 text-sm md:text-base px-4 md:px-6 py-3 md:py-5 leading-relaxed">
            Pick <strong className="font-heading">1–2 tools per section</strong>. Don't try to
            use them all — it becomes noise. Build a single spreadsheet. Filter ruthlessly.
          </p>
        </div>
      </div>
    </section>
  );
}
