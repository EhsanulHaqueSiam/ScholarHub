import {
  BookOpen,
  FlaskConical,
  GraduationCap,
  Plane,
  ShieldCheck,
  Wallet,
} from "lucide-react";

const COVERAGE_TYPES = [
  {
    icon: GraduationCap,
    title: "Tuition Fees",
    description:
      "Many scholarships cover full or partial tuition. Government programs and top university awards often offer the highest support.",
    frequency: "Most scholarships",
    color: "bg-accent-pink",
  },
  {
    icon: Wallet,
    title: "Living Expenses",
    description:
      "Some scholarships provide a monthly allowance to help with accommodation, food, and daily expenses. Common in postgraduate and government-funded programs.",
    frequency: "Sometimes",
    color: "bg-accent",
  },
  {
    icon: Plane,
    title: "Travel Costs",
    description:
      "A few scholarships include a return airfare or a relocation grant for international students.",
    frequency: "Selected programs",
    color: "bg-accent-sky",
  },
  {
    icon: ShieldCheck,
    title: "Health Insurance",
    description:
      "Some university and government scholarships include student health insurance for the duration of your course.",
    frequency: "Selected programs",
    color: "bg-accent-lime",
  },
  {
    icon: BookOpen,
    title: "Books & Materials",
    description:
      "Certain programs offer a small allowance for textbooks or essential study tools.",
    frequency: "Occasionally",
    color: "bg-accent",
  },
  {
    icon: FlaskConical,
    title: "Research Support",
    description:
      "Postgraduate and PhD scholarships may include funding for fieldwork, conferences, or research projects.",
    frequency: "Common for postgrad",
    color: "bg-accent-pink",
  },
];

export function CoverageBreakdown() {
  return (
    <section aria-labelledby="coverage-heading" className="py-16 md:py-20">
      <div className="max-w-[1280px] mx-auto px-4">
        <div className="mb-10">
          <h2
            id="coverage-heading"
            className="font-heading text-[28px] md:text-[40px] leading-[1.1] text-foreground mb-3"
          >
            What Scholarships <span className="text-accent">Cover</span>
          </h2>
          <p className="font-base text-foreground/60 text-base md:text-lg max-w-2xl">
            Coverage varies from full to partial. Always check the official
            details before you apply.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {COVERAGE_TYPES.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="group border-2 border-border bg-secondary-background rounded-base shadow-shadow overflow-hidden transition-all motion-safe:hover:translate-x-boxShadowX motion-safe:hover:translate-y-boxShadowY motion-safe:hover:shadow-none"
              >
                {/* Colored top stripe */}
                <div className={`h-2 ${item.color}`} />

                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`${item.color} border-2 border-border p-2 shadow-[3px_3px_0_0_var(--border)]`}
                    >
                      <Icon className="size-5 text-accent-foreground" />
                    </div>
                    <h3 className="font-heading text-lg">{item.title}</h3>
                  </div>

                  <p className="text-sm text-foreground/70 leading-relaxed">
                    {item.description}
                  </p>

                  <span className="inline-flex items-center text-xs font-heading border-2 border-border rounded-base px-2.5 py-0.5 bg-background">
                    {item.frequency}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
