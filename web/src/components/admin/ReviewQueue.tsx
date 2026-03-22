import * as Tabs from "@radix-ui/react-tabs";
import { useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { DesktopPagination } from "@/components/directory/Pagination";
import { useAdminSelection } from "@/hooks/useAdminSelection";
import { cn } from "@/lib/utils";
import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { BulkActionBar } from "./BulkActionBar";
import { QueueRow } from "./QueueRow";

const ITEMS_PER_PAGE = 20;

/** Trust rank for client-side sorting (highest = most trusted). */
const TRUST_RANK: Record<string, number> = {
  government: 4,
  official_program: 3,
  foundation: 2,
  aggregator: 1,
  university: 1,
};

type ScholarshipStatus = "pending_review" | "published" | "rejected" | "archived";

const STATUS_TABS: Array<{ value: string; label: string; statusFilter?: ScholarshipStatus }> = [
  { value: "pending_review", label: "Pending Review", statusFilter: "pending_review" },
  { value: "published", label: "Published", statusFilter: "published" },
  { value: "rejected", label: "Rejected", statusFilter: "rejected" },
  { value: "archived", label: "Archived", statusFilter: "archived" },
  { value: "all", label: "All" },
];

const EMPTY_STATE_COPY: Record<string, { heading: string; body: string }> = {
  pending_review: {
    heading: "No scholarships pending review",
    body: "All scholarships have been reviewed. New submissions from the scraping pipeline will appear here.",
  },
  published: {
    heading: "No published scholarships",
    body: "Published scholarships will appear here.",
  },
  rejected: {
    heading: "No rejected scholarships",
    body: "Rejected scholarships will appear here for reference.",
  },
  archived: {
    heading: "No archived scholarships",
    body: "Archived scholarships will appear here.",
  },
  all: {
    heading: "No scholarships found",
    body: "Scholarships will appear here after the scraping pipeline runs.",
  },
};

export function ReviewQueue() {
  const [activeTab, setActiveTab] = useState<string>("pending_review");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedId, setExpandedId] = useState<Id<"scholarships"> | null>(null);
  const selection = useAdminSelection();

  // Determine status filter for the query
  const statusFilter = STATUS_TABS.find((t) => t.value === activeTab)?.statusFilter;

  const rawItems = useQuery(api.admin.getReviewQueue, {
    status: statusFilter,
    limit: 200,
  });
  const stats = useQuery(api.admin.getAdminStats);

  // Client-side sorting: highest trust rank desc, then newest first
  const sortedItems = useMemo(() => {
    if (!rawItems) return [];
    return [...rawItems].sort((a, b) => {
      const aMaxTrust = Math.max(
        ...a.resolved_sources.map((s) => TRUST_RANK[s.category] ?? 0),
        0,
      );
      const bMaxTrust = Math.max(
        ...b.resolved_sources.map((s) => TRUST_RANK[s.category] ?? 0),
        0,
      );
      if (bMaxTrust !== aMaxTrust) return bMaxTrust - aMaxTrust;
      return b._creationTime - a._creationTime;
    });
  }, [rawItems]);

  // Client-side pagination
  const totalPages = Math.max(1, Math.ceil(sortedItems.length / ITEMS_PER_PAGE));
  const pageItems = sortedItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );
  const pageIds = pageItems.map((item) => item._id);

  // Tab change resets everything
  function handleTabChange(value: string) {
    setActiveTab(value);
    setCurrentPage(1);
    setExpandedId(null);
    selection.deselectAll();
  }

  // Select-all logic
  const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selection.isSelected(id));
  const someOnPageSelected = pageIds.some((id) => selection.isSelected(id));

  function handleSelectAllToggle() {
    if (allOnPageSelected) {
      selection.deselectAll();
    } else {
      selection.selectAll(pageIds);
    }
  }

  // Tab count label
  function getTabLabel(tab: (typeof STATUS_TABS)[number]) {
    if (!stats) return tab.label;
    if (tab.value === "pending_review") return `${tab.label} (${stats.pending})`;
    if (tab.value === "published") return `${tab.label} (${stats.published})`;
    if (tab.value === "rejected") return `${tab.label} (${stats.rejected})`;
    if (tab.value === "all") return `${tab.label} (${stats.total})`;
    return tab.label;
  }

  const emptyState = EMPTY_STATE_COPY[activeTab] ?? EMPTY_STATE_COPY.all;

  return (
    <section>
      <Tabs.Root value={activeTab} onValueChange={handleTabChange}>
        <Tabs.List className="flex gap-4 border-b-2 border-border mb-4" aria-label="Queue status filter">
          {STATUS_TABS.map((tab) => (
            <Tabs.Trigger
              key={tab.value}
              value={tab.value}
              className={cn(
                "font-heading text-sm pb-2 px-1 transition-colors -mb-[2px]",
                activeTab === tab.value
                  ? "border-b-2 border-main text-foreground"
                  : "text-foreground/60 hover:text-foreground",
              )}
            >
              {getTabLabel(tab)}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {/* Content for all tabs rendered via a single panel */}
        {STATUS_TABS.map((tab) => (
          <Tabs.Content key={tab.value} value={tab.value} className="outline-none">
            {/* Select all toolbar */}
            <div className="flex items-center gap-3 py-2 px-2 mb-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground/80">
                <input
                  type="checkbox"
                  checked={allOnPageSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someOnPageSelected && !allOnPageSelected;
                  }}
                  onChange={handleSelectAllToggle}
                  aria-label="Select all visible scholarships"
                  className="size-4 accent-main"
                />
                <span className="font-base">Select all visible</span>
              </label>
            </div>

            {/* Queue rows */}
            {!rawItems ? (
              <div className="text-foreground/60 text-sm py-8 text-center">Loading queue...</div>
            ) : pageItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="font-heading text-lg text-foreground/80 mb-2">{emptyState.heading}</p>
                <p className="text-sm text-foreground/60">{emptyState.body}</p>
              </div>
            ) : (
              <div role="table" aria-label="Review queue">
                {pageItems.map((item) => (
                  <QueueRow
                    key={item._id}
                    scholarship={item}
                    isExpanded={expandedId === item._id}
                    isSelected={selection.isSelected(item._id)}
                    onToggleExpand={() =>
                      setExpandedId(expandedId === item._id ? null : item._id)
                    }
                    onToggleSelect={() => selection.toggle(item._id)}
                    onEdit={() => {
                      // EditPanel wired in Plan 04
                    }}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            <DesktopPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </Tabs.Content>
        ))}
      </Tabs.Root>

      {/* Bulk action bar */}
      {selection.selectedCount > 0 && (
        <BulkActionBar
          selectedCount={selection.selectedCount}
          selectedIds={selection.selectedIds}
          onClear={selection.deselectAll}
        />
      )}
    </section>
  );
}
