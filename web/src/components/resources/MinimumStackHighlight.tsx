import { ArrowUpRight } from "lucide-react";
import { type CategoryAccent, MINIMUM_STACK } from "@/data/resources";
import { ChapterHeader } from "./ChapterHeader";
import { Favicon } from "./Favicon";

const ACCENT_TILE: Record<CategoryAccent, string> = {
  main: "bg-main text-main-foreground",
  pink: "bg-accent-pink text-accent-foreground",
  lime: "bg-accent-lime text-accent-foreground",
  sky: "bg-accent-sky text-accent-foreground",
  amber: "bg-accent text-accent-foreground",
};

export function MinimumStackHighlight() {
  return (
    <section
      id="minimum-stack"
      aria-labelledby="minimum-stack-heading"
      className="py-16 md:py-24 border-t-4 border-border"
    >
      <div className="max-w-[1280px] mx-auto px-4">
        <ChapterHeader
          number="03"
          kicker="Pick six. Move on."
          title="If you only opened six tabs, open these."
        >
          The whole list is 200+ tools. You don't need them all. This is the minimum stack —
          one site for each layer of the funnel.
        </ChapterHeader>

        <ol className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MINIMUM_STACK.map((pick) => (
            <li
              key={pick.rank}
              className="group relative border-2 border-border bg-secondary-background shadow-shadow flex flex-col motion-safe:transition-[transform,box-shadow] motion-safe:duration-150 ease-out-expo hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0_0_var(--border)]"
            >
              {/* Big watermark number */}
              <span
                aria-hidden
                className="absolute top-2 right-3 text-[120px] leading-none font-heading text-foreground/[0.05] select-none pointer-events-none"
              >
                {pick.rank}
              </span>

              {/* Role tile */}
              <div
                className={`${ACCENT_TILE[pick.accent]} border-b-2 border-border px-5 py-3 flex items-center justify-between relative z-10`}
              >
                <span className="font-heading text-caption uppercase tracking-[0.18em]">
                  {pick.role}
                </span>
                <span className="font-heading text-base">0{pick.rank}</span>
              </div>

              <div className="px-5 pt-5 pb-6 flex-1 flex flex-col relative z-10">
                <div className="flex items-start gap-3">
                  <Favicon url={pick.primary.url} className="size-12 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <a
                      href={pick.primary.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-heading text-lg leading-tight inline-flex items-center gap-1 hover:underline underline-offset-4 decoration-2"
                    >
                      {pick.primary.name}
                      <ArrowUpRight className="size-4 opacity-60 group-hover:opacity-100" />
                    </a>
                    {pick.or ? (
                      <p className="text-caption text-foreground/55 mt-0.5">
                        or{" "}
                        <a
                          href={pick.or.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-foreground hover:underline decoration-2 underline-offset-4"
                        >
                          {pick.or.name}
                        </a>
                      </p>
                    ) : null}
                  </div>
                </div>
                <p className="font-base text-sm text-foreground/70 mt-4 leading-relaxed">
                  {pick.blurb}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
