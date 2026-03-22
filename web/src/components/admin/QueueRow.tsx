import * as AlertDialog from "@radix-ui/react-alert-dialog";
import * as Tooltip from "@radix-ui/react-tooltip";
import { useMutation } from "convex/react";
import { ChevronDown, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { DuplicateBadge } from "./DuplicateBadge";

interface QueueRowProps {
  scholarship: {
    _id: Id<"scholarships">;
    title: string;
    host_country: string;
    degree_levels: string[];
    application_deadline?: number;
    application_deadline_text?: string;
    description?: string;
    fields_of_study?: string[];
    eligibility_nationalities?: string[];
    funding_type: string;
    funding_amount_min?: number;
    funding_amount_max?: number;
    award_currency?: string;
    application_url?: string;
    editorial_notes?: string;
    status: string;
    match_key?: string;
    source_ids: Id<"sources">[];
    resolved_sources: Array<{
      _id: Id<"sources">;
      name: string;
      category: string;
      trust_level: string;
    }>;
    has_possible_duplicate: boolean;
  };
  isExpanded: boolean;
  isSelected: boolean;
  onToggleExpand: () => void;
  onToggleSelect: () => void;
  onEdit: () => void;
}

const STATUS_BADGE_MAP: Record<
  string,
  { variant: "urgencyWarning" | "urgencyOpen" | "urgencyCritical" | "urgencyClosed" | "neutral"; label: string }
> = {
  pending_review: { variant: "urgencyWarning", label: "Pending Review" },
  published: { variant: "urgencyOpen", label: "Published" },
  rejected: { variant: "urgencyCritical", label: "Rejected" },
  archived: { variant: "urgencyClosed", label: "Archived" },
  draft: { variant: "neutral", label: "Draft" },
};

const TRUST_BADGE_MAP: Record<string, "urgencyOpen" | "urgencyWarning" | "urgencyCritical"> = {
  auto_publish: "urgencyOpen",
  needs_review: "urgencyWarning",
  blocked: "urgencyCritical",
};

function formatDeadline(deadline?: number, deadlineText?: string): string {
  if (deadline) {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(deadline));
  }
  return deadlineText ?? "No deadline";
}

function formatFundingType(type: string): string {
  const labels: Record<string, string> = {
    fully_funded: "Fully Funded",
    partial: "Partial",
    tuition_waiver: "Tuition Waiver",
    stipend_only: "Stipend Only",
  };
  return labels[type] ?? type;
}

function formatFundingAmount(min?: number, max?: number, currency?: string): string | null {
  if (!max) return null;
  const cur = currency ?? "USD";
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: cur,
    maximumFractionDigits: 0,
  });
  if (min && min !== max) {
    return `${formatter.format(min)} - ${formatter.format(max)}`;
  }
  return formatter.format(max);
}

export function QueueRow({
  scholarship,
  isExpanded,
  isSelected,
  onToggleExpand,
  onToggleSelect,
  onEdit,
}: QueueRowProps) {
  const approveScholarship = useMutation(api.admin.approveScholarship);
  const rejectScholarship = useMutation(api.admin.rejectScholarship);
  const [approveError, setApproveError] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const statusBadge = STATUS_BADGE_MAP[scholarship.status] ?? STATUS_BADGE_MAP.draft;

  async function handleApprove() {
    setApproveError(null);
    setIsApproving(true);
    try {
      await approveScholarship({ scholarshipId: scholarship._id });
    } catch (err) {
      setApproveError(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setIsApproving(false);
    }
  }

  async function handleReject() {
    setIsRejecting(true);
    try {
      await rejectScholarship({ scholarshipId: scholarship._id });
    } finally {
      setIsRejecting(false);
    }
  }

  return (
    <div className="border-b border-border">
      {/* Compact row */}
      <div
        role="row"
        aria-expanded={isExpanded}
        className={cn(
          "flex items-center min-h-14 bg-secondary-background cursor-pointer transition-all",
          "hover:-translate-y-px hover:shadow-sm",
          isSelected && "bg-main/5",
        )}
      >
        {/* Checkbox */}
        <div className="w-10 flex items-center justify-center shrink-0">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onToggleSelect();
            }}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Select ${scholarship.title}`}
            className="size-5 accent-main cursor-pointer"
          />
        </div>

        {/* Title (click to expand) */}
        <div
          className="flex-1 min-w-0 flex items-center gap-2 px-2"
          onClick={onToggleExpand}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onToggleExpand();
            }
          }}
          tabIndex={0}
          role="button"
          aria-label={`${isExpanded ? "Collapse" : "Expand"} ${scholarship.title}`}
        >
          <span className="text-sm font-base truncate">{scholarship.title}</span>
          {scholarship.has_possible_duplicate && <DuplicateBadge />}
        </div>

        {/* Country */}
        <div
          className="w-20 shrink-0 text-sm text-foreground/70 truncate px-1 hidden lg:block"
          onClick={onToggleExpand}
        >
          {scholarship.host_country}
        </div>

        {/* Source */}
        <div
          className="w-30 shrink-0 text-sm text-foreground/70 truncate px-1 hidden lg:block"
          onClick={onToggleExpand}
        >
          {scholarship.resolved_sources[0]?.name ?? "Unknown"}
        </div>

        {/* Degrees */}
        <div
          className="w-25 shrink-0 text-xs text-foreground/70 truncate px-1 hidden xl:block"
          onClick={onToggleExpand}
        >
          {scholarship.degree_levels.join(", ")}
        </div>

        {/* Deadline */}
        <div
          className="w-25 shrink-0 text-sm px-1 hidden xl:block"
          onClick={onToggleExpand}
        >
          {formatDeadline(scholarship.application_deadline, scholarship.application_deadline_text)}
        </div>

        {/* Status badge */}
        <div
          className="w-25 shrink-0 px-1 hidden lg:block"
          onClick={onToggleExpand}
        >
          <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
        </div>

        {/* Expand chevron */}
        <Tooltip.Provider delayDuration={200}>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button
                type="button"
                onClick={onToggleExpand}
                aria-label={isExpanded ? "Collapse row" : "Expand row"}
                className="w-8 h-8 flex items-center justify-center shrink-0"
              >
                <ChevronDown
                  className={cn(
                    "size-4 transition-transform duration-200",
                    isExpanded && "rotate-180",
                  )}
                />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                className="rounded-base border-2 border-border bg-secondary-background px-3 py-1.5 text-xs shadow-shadow"
                sideOffset={8}
              >
                {isExpanded ? "Collapse row" : "Expand row"}
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="bg-secondary-background border-t border-border overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
            {/* Left column */}
            <div className="space-y-3">
              <div>
                <h3 className="font-heading text-sm text-foreground/60 uppercase tracking-wide mb-1">
                  Title
                </h3>
                <p className="text-sm">{scholarship.title}</p>
              </div>

              {scholarship.description && (
                <div>
                  <h3 className="font-heading text-sm text-foreground/60 uppercase tracking-wide mb-1">
                    Description
                  </h3>
                  <p className="text-sm line-clamp-3">{scholarship.description}</p>
                </div>
              )}

              <div>
                <h3 className="font-heading text-sm text-foreground/60 uppercase tracking-wide mb-1">
                  Host Country
                </h3>
                <p className="text-sm">{scholarship.host_country}</p>
              </div>

              <div>
                <h3 className="font-heading text-sm text-foreground/60 uppercase tracking-wide mb-1">
                  Degree Levels
                </h3>
                <p className="text-sm">
                  {scholarship.degree_levels
                    .map((d) => d.charAt(0).toUpperCase() + d.slice(1))
                    .join(", ")}
                </p>
              </div>

              {scholarship.fields_of_study && scholarship.fields_of_study.length > 0 && (
                <div>
                  <h3 className="font-heading text-sm text-foreground/60 uppercase tracking-wide mb-1">
                    Fields of Study
                  </h3>
                  <p className="text-sm">{scholarship.fields_of_study.join(", ")}</p>
                </div>
              )}

              {scholarship.eligibility_nationalities &&
                scholarship.eligibility_nationalities.length > 0 && (
                  <div>
                    <h3 className="font-heading text-sm text-foreground/60 uppercase tracking-wide mb-1">
                      Eligibility
                    </h3>
                    <p className="text-sm">
                      {scholarship.eligibility_nationalities.length > 5
                        ? `${scholarship.eligibility_nationalities.slice(0, 5).join(", ")} and ${scholarship.eligibility_nationalities.length - 5} more`
                        : scholarship.eligibility_nationalities.join(", ")}
                    </p>
                  </div>
                )}
            </div>

            {/* Right column */}
            <div className="space-y-3">
              <div>
                <h3 className="font-heading text-sm text-foreground/60 uppercase tracking-wide mb-1">
                  Funding
                </h3>
                <p className="text-sm">
                  {formatFundingType(scholarship.funding_type)}
                  {formatFundingAmount(
                    scholarship.funding_amount_min,
                    scholarship.funding_amount_max,
                    scholarship.award_currency,
                  ) &&
                    ` - ${formatFundingAmount(scholarship.funding_amount_min, scholarship.funding_amount_max, scholarship.award_currency)}`}
                </p>
              </div>

              {scholarship.application_url && (
                <div>
                  <h3 className="font-heading text-sm text-foreground/60 uppercase tracking-wide mb-1">
                    Application URL
                  </h3>
                  <a
                    href={scholarship.application_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-main underline inline-flex items-center gap-1"
                  >
                    {scholarship.application_url.slice(0, 50)}
                    {scholarship.application_url.length > 50 && "..."}
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              )}

              <div>
                <h3 className="font-heading text-sm text-foreground/60 uppercase tracking-wide mb-1">
                  Application Deadline
                </h3>
                <p className="text-sm">
                  {formatDeadline(
                    scholarship.application_deadline,
                    scholarship.application_deadline_text,
                  )}
                  {scholarship.application_deadline && scholarship.application_deadline_text && (
                    <span className="text-foreground/60 ml-2">
                      ({scholarship.application_deadline_text})
                    </span>
                  )}
                </p>
              </div>

              {scholarship.editorial_notes && (
                <div>
                  <h3 className="font-heading text-sm text-foreground/60 uppercase tracking-wide mb-1">
                    Editorial Notes
                  </h3>
                  <p className="text-sm line-clamp-2 text-foreground/80">
                    {scholarship.editorial_notes}
                  </p>
                </div>
              )}

              {/* Source provenance */}
              <div>
                <h3 className="font-heading text-sm text-foreground/60 uppercase tracking-wide mb-1">
                  Source Provenance
                </h3>
                <div className="flex flex-wrap gap-2">
                  {scholarship.resolved_sources.map((source) => (
                    <div key={source._id} className="flex items-center gap-1.5">
                      <span className="text-sm">{source.name}</span>
                      <Badge
                        variant={TRUST_BADGE_MAP[source.trust_level] ?? "neutral"}
                        className="text-[10px] px-1.5 py-0"
                      >
                        {source.trust_level}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 px-4 pb-4">
            <Button
              variant="default"
              size="sm"
              onClick={handleApprove}
              disabled={isApproving}
            >
              {isApproving ? "Approving..." : "Approve Scholarship"}
            </Button>

            <AlertDialog.Root>
              <AlertDialog.Trigger asChild>
                <Button variant="destructive" size="sm" disabled={isRejecting}>
                  Reject Scholarship
                </Button>
              </AlertDialog.Trigger>
              <AlertDialog.Portal>
                <AlertDialog.Overlay className="fixed inset-0 bg-overlay z-50" />
                <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-secondary-background border-2 border-border rounded-base shadow-shadow p-6 w-full max-w-md">
                  <AlertDialog.Title className="font-heading text-lg mb-2">
                    Reject {scholarship.title}?
                  </AlertDialog.Title>
                  <AlertDialog.Description className="text-sm text-foreground/70 mb-4">
                    This scholarship will not be visible to students.
                  </AlertDialog.Description>
                  <div className="flex justify-end gap-2">
                    <AlertDialog.Cancel asChild>
                      <Button variant="neutral" size="sm">
                        Keep Scholarship
                      </Button>
                    </AlertDialog.Cancel>
                    <AlertDialog.Action asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleReject}
                      >
                        Reject Scholarship
                      </Button>
                    </AlertDialog.Action>
                  </div>
                </AlertDialog.Content>
              </AlertDialog.Portal>
            </AlertDialog.Root>

            <Button variant="neutral" size="sm" onClick={onEdit}>
              Edit
            </Button>
          </div>

          {/* Inline error for dedup violations */}
          {approveError && (
            <div className="px-4 pb-4">
              <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-base px-3 py-2">
                {approveError}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
