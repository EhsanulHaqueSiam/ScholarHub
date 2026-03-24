import { Calendar } from "lucide-react";

const PHASES = [
  {
    period: "12-9 months",
    label: "Research & Prepare",
    color: "bg-accent-pink",
    text: "text-accent-foreground",
    badgeText: "text-accent-foreground/70",
    badgeBorder: "border-accent-foreground/20",
    items: [
      "Shortlist countries, universities, and courses",
      "Check eligibility and required documents",
      "Take an English proficiency test, such as IELTS, if required",
      "Prepare your academic transcripts",
    ],
  },
  {
    period: "9-6 months",
    label: "Apply",
    color: "bg-accent",
    text: "text-accent-foreground",
    badgeText: "text-accent-foreground/70",
    badgeBorder: "border-accent-foreground/20",
    items: [
      "Apply for university-funded scholarships",
      "Apply for private or external scholarships",
      "Write and refine personal statements and essays",
      "Request reference letters",
      "Track deadlines for rolling or late-cycle programs",
    ],
  },
  {
    period: "6-4 months",
    label: "Complete & Confirm",
    color: "bg-accent-lime",
    text: "text-accent-foreground",
    badgeText: "text-accent-foreground/70",
    badgeBorder: "border-accent-foreground/20",
    items: [
      "Complete remaining scholarship applications",
      "Attend interviews or assessments",
      "Receive outcomes from university scholarships",
      "Confirm your university place and scholarship offers",
    ],
  },
  {
    period: "4-2 months",
    label: "Visa & Logistics",
    color: "bg-accent-sky",
    text: "text-accent-foreground",
    badgeText: "text-accent-foreground/70",
    badgeBorder: "border-accent-foreground/20",
    items: [
      "Begin your visa application",
      "Arrange accommodation, insurance, and travel",
      "Attend pre-departure sessions",
      "Organise financial documents to meet visa requirements",
    ],
  },
  {
    period: "2-0 months",
    label: "Depart",
    color: "bg-main",
    text: "text-main-foreground",
    badgeText: "text-main-foreground/70",
    badgeBorder: "border-main-foreground/20",
    items: [
      "Finalise travel plans",
      "Prepare to arrive in your destination country",
      "Complete enrolment",
    ],
  },
];

export function ScholarshipTimeline() {
  return (
    <section aria-labelledby="timeline-heading" className="py-16 md:py-24">
      <div className="max-w-[1280px] mx-auto px-4">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-accent-lime border-2 border-border p-2 shadow-[3px_3px_0_0_var(--border)]">
              <Calendar className="size-5 text-accent-foreground" />
            </div>
            <h2
              id="timeline-heading"
              className="font-heading text-[28px] md:text-[40px] leading-[1.1] text-foreground"
            >
              Scholarship <span className="text-accent-lime">Timeline</span>
            </h2>
          </div>
          <p className="font-base text-foreground/60 text-base md:text-lg max-w-2xl">
            Most scholarships follow a similar yearly cycle. Use this timeline
            to plan your applications and stay ahead of key deadlines.
          </p>
        </div>

        {/* Vertical timeline */}
        <div className="relative ml-4 md:ml-8">
          {/* Vertical line */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-border" />

          <div className="space-y-8">
            {PHASES.map((phase) => (
              <div key={phase.period} className="relative pl-8 md:pl-12">
                {/* Square timeline marker (centered on the line) */}
                <div
                  className={`absolute left-[-8px] top-3 size-5 ${phase.color} border-2 border-border shadow-[2px_2px_0_0_var(--border)]`}
                />

                {/* Phase card */}
                <div className="border-2 border-border bg-secondary-background rounded-base shadow-shadow overflow-hidden">
                  {/* Colored phase header */}
                  <div
                    className={`${phase.color} border-b-2 border-border px-4 py-2.5 md:px-5 md:py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1`}
                  >
                    <span className={`font-heading text-base ${phase.text}`}>
                      {phase.label}
                    </span>
                    <span
                      className={`text-xs font-heading ${phase.badgeText} border-2 ${phase.badgeBorder} px-2 py-0.5 bg-white/20 w-fit`}
                    >
                      {phase.period} before intake
                    </span>
                  </div>

                  {/* Checklist */}
                  <div className="p-4 md:p-5">
                    <ul className="space-y-2.5">
                      {phase.items.map((item) => (
                        <li key={item} className="flex items-start gap-3">
                          <div className="size-4 border-2 border-foreground/25 shrink-0 mt-0.5" />
                          <span className="text-sm text-foreground/75 leading-relaxed">
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
