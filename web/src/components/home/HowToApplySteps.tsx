import type { LucideIcon } from "lucide-react";
import {
  Check,
  ClipboardList,
  FileText,
  Lightbulb,
  Search,
  Send,
} from "lucide-react";

interface Step {
  number: number;
  title: string;
  icon: LucideIcon;
  color: string;
  description?: string;
  items?: string[];
}

const STEPS: Step[] = [
  {
    number: 1,
    title: "Research Early",
    icon: Search,
    color: "bg-accent-sky",
    description:
      "Look for scholarships that match your study level, destination, and field of interest. Check the eligibility rules for each one, including academic, nationality, and English test criteria.",
  },
  {
    number: 2,
    title: "Prepare Your Documents",
    icon: FileText,
    color: "bg-accent-pink",
    description: "Most scholarship applications will ask for:",
    items: [
      "Academic transcripts",
      "A personal statement or essay",
      "Reference letters",
      "Proof of income for need-based scholarships",
      "English test scores such as IELTS",
    ],
  },
  {
    number: 3,
    title: "Apply Before the Deadline",
    icon: Send,
    color: "bg-accent",
    description:
      "Submit your application through the official website or university portal. Review every section carefully — incomplete forms or missing documents are common reasons applicants get rejected.",
  },
  {
    number: 4,
    title: "Track Your Applications",
    icon: ClipboardList,
    color: "bg-accent-lime",
    description:
      "Keep a simple record of the scholarships you applied for, their deadlines, and expected response dates. Some programs include interviews, written tasks, or portfolio reviews — stay ready.",
  },
];

const TIPS = [
  "Tailor your personal statement to each scholarship's goals",
  "Highlight achievements that show leadership, impact, or community involvement",
  "Ask your referees early to avoid last-minute delays",
  "Apply for multiple scholarships to widen your chances",
];

export function HowToApplySteps() {
  return (
    <section aria-labelledby="how-to-apply-heading" className="py-16 md:py-20">
      <div className="max-w-[1280px] mx-auto px-4">
        <div className="mb-10">
          <h2
            id="how-to-apply-heading"
            className="font-heading text-heading md:text-display-sm leading-[1.1] text-foreground mb-3"
          >
            How to <span className="text-accent-pink">Apply</span>
          </h2>
          <p className="font-base text-foreground/60 text-base md:text-lg max-w-2xl">
            Most scholarship programs open 8-12 months before the intake, so
            plan ahead.
          </p>
        </div>

        {/* Steps with connecting stepper line */}
        <div className="relative mb-10">
          {/* Horizontal dashed connector — desktop only */}
          <div className="hidden lg:block absolute top-6 left-[12%] right-[12%] border-t-[3px] border-dashed border-border" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className="flex flex-col items-center">
                  {/* Number badge — sits on the connecting line */}
                  <div
                    className={`relative z-10 ${step.color} border-2 border-border size-12 flex items-center justify-center shadow-[3px_3px_0_0_var(--border)] font-heading text-xl text-accent-foreground -mb-5`}
                  >
                    {step.number}
                  </div>

                  {/* Step card */}
                  <div className="relative w-full border-2 border-border bg-secondary-background rounded-base shadow-shadow overflow-hidden pt-8 pb-5 px-5">
                    {/* Watermark number */}
                    <span className="absolute -top-3 -right-1 text-[100px] leading-none font-heading text-foreground/[0.04] select-none pointer-events-none">
                      {step.number}
                    </span>

                    <div className="relative space-y-3">
                      <div className="flex items-center gap-2">
                        <Icon className="size-4 text-foreground/50" />
                        <h3 className="font-heading text-base">
                          {step.title}
                        </h3>
                      </div>

                      {step.description && (
                        <p className="text-sm text-foreground/70 leading-relaxed">
                          {step.description}
                        </p>
                      )}

                      {step.items && (
                        <ul className="space-y-1.5">
                          {step.items.map((item) => (
                            <li
                              key={item}
                              className="flex items-start gap-2 text-sm text-foreground/70"
                            >
                              <Check className="size-3.5 text-urgency-open shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tips callout */}
        <div className="border-2 border-border bg-accent/15 rounded-base shadow-shadow p-6">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="bg-accent border-2 border-border p-1.5 shadow-[2px_2px_0_0_var(--border)]">
              <Lightbulb className="size-4 text-accent-foreground" />
            </div>
            <h3 className="font-heading text-lg">
              Tips for Stronger Applications
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {TIPS.map((tip) => (
              <div key={tip} className="flex items-start gap-2.5">
                <div className="size-1.5 bg-foreground/50 shrink-0 mt-[7px]" />
                <p className="text-sm text-foreground/70 leading-relaxed">
                  {tip}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
