import { ArrowDown, CheckCheck } from "lucide-react";
import {
  PIPELINE,
  PIPELINE_END,
  PIPELINE_END_DETAIL,
  PIPELINE_START,
  type CategoryAccent,
} from "@/data/resources";
import { ChapterHeader } from "./ChapterHeader";

const ACCENT_BG: Record<CategoryAccent, string> = {
  main: "bg-main text-main-foreground",
  pink: "bg-accent-pink text-accent-foreground",
  lime: "bg-accent-lime text-accent-foreground",
  sky: "bg-accent-sky text-accent-foreground",
  amber: "bg-accent text-accent-foreground",
};

export function FilteringPipelineDiagram() {
  return (
    <section
      id="pipeline"
      aria-labelledby="pipeline-heading"
      className="py-16 md:py-24 border-t-4 border-border bg-secondary-background"
    >
      <div className="max-w-[1280px] mx-auto px-4">
        <ChapterHeader number="02" kicker="The flow" title="Eight filters take you from 1000s to 6–8.">
          Don't browse universities. Filter them. Each layer cuts the list down — every layer
          uses different tools.
        </ChapterHeader>

        {/* Mouth of the funnel */}
        <div className="mt-12 max-w-3xl mx-auto">
          <div className="flex items-center justify-center">
            <div className="relative w-full bg-background border-2 border-border shadow-shadow px-6 py-5 text-center">
              <span className="absolute -top-3 left-4 bg-foreground text-background font-heading text-caption px-2 py-0.5 uppercase tracking-wider">
                Start
              </span>
              <p className="font-heading text-heading md:text-title leading-tight">
                {PIPELINE_START}
              </p>
            </div>
          </div>

          {/* Each layer narrows */}
          <ol className="mt-2 space-y-2">
            {PIPELINE.map((layer) => (
              <li key={layer.layer} className="flex flex-col items-center">
                <ArrowDown className="size-5 text-foreground/40 my-1" aria-hidden />
                <div
                  className="w-full max-w-full transition-[width] duration-500 ease-out-expo"
                  style={{ width: `${layer.width}%` }}
                >
                  <div className="border-2 border-border bg-background shadow-shadow overflow-hidden">
                    <div className="grid grid-cols-[auto_1fr_auto] items-stretch">
                      {/* Number badge */}
                      <div
                        className={`${ACCENT_BG[layer.accent]} flex items-center justify-center px-4 md:px-5 border-r-2 border-border`}
                      >
                        <span className="font-heading text-2xl md:text-3xl">{layer.layer}</span>
                      </div>
                      {/* Body */}
                      <div className="px-4 py-3 md:py-4">
                        <p className="font-heading text-base md:text-lg leading-tight">
                          {layer.label}
                        </p>
                        <p className="font-base text-caption md:text-sm text-foreground/65 mt-0.5">
                          {layer.toolHint}
                        </p>
                      </div>
                      {/* Remaining count */}
                      <div className="hidden sm:flex items-center justify-center px-4 md:px-6 border-l-2 border-border bg-secondary-background">
                        <span className="font-mono text-xs md:text-sm text-foreground/70 whitespace-nowrap">
                          {layer.remaining}
                        </span>
                      </div>
                    </div>
                    {/* Mobile-only count strip */}
                    <div className="sm:hidden border-t-2 border-border bg-secondary-background px-4 py-1.5 font-mono text-caption text-foreground/70">
                      {layer.remaining}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ol>

          {/* Final pinch */}
          <div className="mt-2 flex flex-col items-center">
            <ArrowDown className="size-5 text-foreground/40 my-1" aria-hidden />
            <div className="relative w-fit mx-auto bg-accent-lime text-accent-foreground border-2 border-border shadow-shadow px-6 py-4 text-center">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-foreground text-background font-heading text-caption px-2 py-0.5 uppercase tracking-wider whitespace-nowrap">
                Finish
              </span>
              <div className="flex items-center gap-2 justify-center">
                <CheckCheck className="size-5" aria-hidden />
                <p className="font-heading text-heading leading-none">{PIPELINE_END}</p>
              </div>
              <p className="font-base text-caption mt-1.5 text-accent-foreground/80">
                {PIPELINE_END_DETAIL}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

