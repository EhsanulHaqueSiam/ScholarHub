import { BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SubjectDetail {
  subject: string;
  tuition_rate?: string;
  scholarship_amount?: string;
  notes?: string;
}

interface SubjectsSectionProps {
  subjectDetails?: SubjectDetail[] | null;
  fieldsOfStudy?: string[] | null;
}

const TILE_ACCENT_COLORS = [
  "var(--accent-pink)",
  "var(--accent-lime)",
  "var(--accent-sky)",
  "var(--accent)",
] as const;

function getCoverage(amount?: string): "full" | "partial" | "unknown" {
  if (!amount) return "unknown";
  const lower = amount.toLowerCase().trim();
  if (lower === "100%" || lower.includes("full tuition") || lower.startsWith("full")) return "full";
  return "partial";
}

const COVERAGE_CONFIG = {
  full: { label: "Fully Covered", variant: "urgencyOpen" as const },
  partial: { label: "Partial", variant: "urgencyWarning" as const },
  unknown: { label: "Check Details", variant: "neutral" as const },
} as const;

export function SubjectsSection({ subjectDetails, fieldsOfStudy }: SubjectsSectionProps) {
  const hasDetails = subjectDetails && subjectDetails.length > 0;
  const hasFields = fieldsOfStudy && fieldsOfStudy.length > 0;

  if (!hasDetails && !hasFields) {
    return (
      <section aria-labelledby="subjects-heading">
        <Card>
          <CardHeader>
            <CardTitle id="subjects-heading" className="text-xl">
              Subjects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground/50 text-sm">All subjects eligible or not specified</p>
          </CardContent>
        </Card>
      </section>
    );
  }

  // Fallback: simple badge list when no detailed per-subject data
  if (!hasDetails && hasFields) {
    return (
      <section aria-labelledby="subjects-heading">
        <Card>
          <CardHeader>
            <CardTitle id="subjects-heading" className="text-xl">
              Subjects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {fieldsOfStudy!.map((field) => (
                <Badge key={field} variant="neutral">
                  {field}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  // Detailed per-subject tiles
  return (
    <section aria-labelledby="subjects-heading">
      <Card>
        <CardHeader>
          <CardTitle id="subjects-heading" className="text-xl">
            Subjects & Coverage
          </CardTitle>
          <div className="flex items-center gap-2 mt-1">
            <BookOpen className="size-4 text-foreground/50" />
            <span className="text-sm text-foreground/60">
              {subjectDetails!.length} subject{subjectDetails!.length !== 1 ? "s" : ""} covered
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {subjectDetails!.map((detail, i) => {
            const accentColor = TILE_ACCENT_COLORS[i % TILE_ACCENT_COLORS.length];
            const coverage = getCoverage(detail.scholarship_amount);
            const config = COVERAGE_CONFIG[coverage];
            const hasTuition = !!detail.tuition_rate;
            const hasAmount = !!detail.scholarship_amount;

            return (
              <div
                key={detail.subject}
                className="border-2 border-border bg-secondary-background shadow-[3px_3px_0px_0px_var(--border)] transition-[transform,box-shadow] duration-150 ease-out-expo hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_0px_var(--border)]"
              >
                {/* Accent bar */}
                <div className="h-1.5" style={{ backgroundColor: accentColor }} />

                <div className="p-4 space-y-3">
                  {/* Subject name + coverage badge */}
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="font-heading text-base leading-tight">{detail.subject}</h4>
                    <Badge variant={config.variant} className="text-xs shrink-0">
                      {config.label}
                    </Badge>
                  </div>

                  {/* Tuition & scholarship amounts */}
                  {(hasTuition || hasAmount) && (
                    <div className="grid grid-cols-2 gap-3">
                      {hasTuition && (
                        <div>
                          <span className="block text-[0.65rem] font-heading uppercase tracking-widest text-foreground/45 mb-0.5">
                            Tuition
                          </span>
                          <span className="text-sm font-heading">{detail.tuition_rate}</span>
                        </div>
                      )}
                      {hasAmount && (
                        <div>
                          <span className="block text-[0.65rem] font-heading uppercase tracking-widest text-foreground/45 mb-0.5">
                            Scholarship
                          </span>
                          <span className="text-sm font-heading text-urgency-open">
                            {detail.scholarship_amount}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  {detail.notes && (
                    <p className="text-xs text-foreground/55 border-t-2 border-border/20 pt-2">
                      {detail.notes}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </section>
  );
}
