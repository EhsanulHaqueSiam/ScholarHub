import { ArrowRight, Calendar, ListChecks, Telescope } from "lucide-react";
import { Link } from "@tanstack/react-router";

const STEPS = [
  {
    icon: Telescope,
    label: "Now find scholarships",
    desc: "Filter the in-app catalogue by country, level, and funding.",
    to: "/scholarships" as const,
    accent: "bg-accent-sky",
  },
  {
    icon: ListChecks,
    label: "Check eligibility",
    desc: "Run your CGPA + IELTS through the eligibility wizard.",
    to: "/eligibility" as const,
    accent: "bg-accent-lime",
  },
  {
    icon: Calendar,
    label: "Track deadlines",
    desc: "Drop your shortlist into the application tracker and calendar.",
    to: "/tracker" as const,
    accent: "bg-accent-pink",
  },
];

export function ResourcesCallToAction() {
  return (
    <section
      aria-labelledby="next-step-heading"
      className="py-12 md:py-16 border-t-4 border-border"
    >
      <div className="max-w-[1280px] mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <span className="font-mono text-caption text-foreground/50">END · 06</span>
          <div className="flex-1 border-t-2 border-dashed border-border" />
        </div>
        <h2
          id="next-step-heading"
          className="font-heading text-heading md:text-title leading-tight max-w-2xl"
        >
          You have a stack. Now use ScholarHub to actually do the work.
        </h2>

        <ul className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {STEPS.map((s) => {
            const Icon = s.icon;
            return (
              <li key={s.to}>
                <Link
                  to={s.to}
                  className="group block h-full border-2 border-border bg-secondary-background shadow-shadow p-5 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0_0_var(--border)] motion-safe:transition-[transform,box-shadow] motion-safe:duration-150 ease-out-expo"
                >
                  <div
                    className={`${s.accent} border-2 border-border w-fit p-2 shadow-[2px_2px_0_0_var(--border)] mb-4`}
                  >
                    <Icon className="size-5 text-accent-foreground" aria-hidden />
                  </div>
                  <h3 className="font-heading text-base md:text-lg leading-tight inline-flex items-center gap-1">
                    {s.label}
                    <ArrowRight className="size-4 motion-safe:transition-transform group-hover:translate-x-1" />
                  </h3>
                  <p className="font-base text-sm text-foreground/65 mt-2 leading-relaxed">
                    {s.desc}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
