import { TriangleAlert } from "lucide-react";
import { REDDIT_WARNINGS } from "@/data/resources";

export function RedditWarnings() {
  return (
    <section
      id="warnings"
      aria-labelledby="warnings-heading"
      className="py-12 md:py-16 border-t-4 border-border bg-[var(--urgency-critical)]/8"
    >
      <div className="max-w-[1280px] mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-[var(--urgency-critical)] text-main-foreground border-2 border-border p-2 shadow-shadow">
            <TriangleAlert className="size-4 md:size-5" aria-hidden />
          </div>
          <h2
            id="warnings-heading"
            className="font-heading text-heading md:text-title leading-tight"
          >
            What Reddit warns against.
          </h2>
        </div>

        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {REDDIT_WARNINGS.map((w) => (
            <li
              key={w.title}
              className="border-2 border-[var(--urgency-critical)] bg-secondary-background shadow-shadow p-4"
            >
              <div className="flex items-start gap-2.5">
                <span
                  aria-hidden
                  className="font-heading text-caption bg-[var(--urgency-critical)] text-main-foreground border-2 border-border px-2 py-0.5 shrink-0"
                >
                  Avoid
                </span>
                <h3 className="font-heading text-base leading-tight">{w.title}</h3>
              </div>
              <p className="font-base text-sm text-foreground/75 mt-2.5 leading-relaxed">
                {w.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
