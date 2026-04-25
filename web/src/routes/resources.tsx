import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BackToTop } from "@/components/layout/BackToTop";
import { Navbar } from "@/components/layout/Navbar";
import { BangladeshPlaybook } from "@/components/resources/BangladeshPlaybook";
import { ChapterHeader } from "@/components/resources/ChapterHeader";
import { FilteringPipelineDiagram } from "@/components/resources/FilteringPipelineDiagram";
import { JourneyRail } from "@/components/resources/JourneyRail";
import { MinimumStackHighlight } from "@/components/resources/MinimumStackHighlight";
import { RedditWarnings } from "@/components/resources/RedditWarnings";
import { ResourceCategoryCard } from "@/components/resources/ResourceCategoryCard";
import { ResourceFilterBar } from "@/components/resources/ResourceFilterBar";
import { ResourcesCallToAction } from "@/components/resources/ResourcesCallToAction";
import { ResourcesHero } from "@/components/resources/ResourcesHero";
import {
  ALL_TAGS,
  CATEGORIES,
  type ResourceLink,
  type ResourceTag,
} from "@/data/resources";
import { buildPageMeta } from "@/lib/seo/meta";

export const Route = createFileRoute("/resources")({
  head: () => {
    const { meta, links } = buildPageMeta({
      title: "Study-Abroad Resource Toolbox | ScholarHub",
      description:
        "A curated toolbox of 200+ study-abroad tools — search engines, scholarship databases, predictors, communities, and Bangladesh-specific operational guides — organised by the funnel layer they belong to.",
      canonicalPath: "/resources",
    });
    return { meta, links };
  },
  component: ResourcesPage,
});

const JOURNEY = [
  { id: "manifesto", number: "01", label: "How to use" },
  { id: "pipeline", number: "02", label: "The flow" },
  { id: "minimum-stack", number: "03", label: "Starting six" },
  { id: "bangladesh-playbook", number: "04", label: "BD playbook" },
  { id: "toolbox", number: "05", label: "Full toolbox" },
  { id: "warnings", number: "06", label: "What to avoid" },
];

function matchesQuery(link: ResourceLink, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  return (
    link.name.toLowerCase().includes(needle) ||
    (link.desc?.toLowerCase().includes(needle) ?? false) ||
    (link.group?.toLowerCase().includes(needle) ?? false) ||
    link.url.toLowerCase().includes(needle)
  );
}

function matchesTags(link: ResourceLink, tags: Set<ResourceTag>): boolean {
  if (tags.size === 0) return true;
  if (!link.tags) return false;
  for (const t of tags) {
    if (!link.tags.includes(t)) return false;
  }
  return true;
}

function ResourcesPage() {
  const [query, setQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<Set<ResourceTag>>(new Set());

  const filtered = useMemo(() => {
    return CATEGORIES.map((cat) => ({
      cat,
      links: cat.links.filter(
        (l) => matchesQuery(l, query) && matchesTags(l, selectedTags),
      ),
    }));
  }, [query, selectedTags]);

  const totalShown = filtered.reduce((sum, c) => sum + c.links.length, 0);
  const totalCategoriesShown = filtered.filter((c) => c.links.length > 0).length;

  // Tag counts based on the *current* query (not selected tags) so users can see
  // how many tools exist per tag for the term they typed.
  const tagCounts = useMemo(() => {
    const counts = Object.fromEntries(ALL_TAGS.map((t) => [t, 0])) as Record<
      ResourceTag,
      number
    >;
    for (const cat of CATEGORIES) {
      for (const link of cat.links) {
        if (!matchesQuery(link, query)) continue;
        for (const t of link.tags ?? []) {
          if (t in counts) counts[t] += 1;
        }
      }
    }
    return counts;
  }, [query]);

  function toggleTag(tag: ResourceTag) {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  function clearFilters() {
    setQuery("");
    setSelectedTags(new Set());
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <JourneyRail stops={JOURNEY} />

      <main>
        <ResourcesHero />

        <FilteringPipelineDiagram />

        <MinimumStackHighlight />

        <BangladeshPlaybook />

        {/* Chapter 05 — full toolbox */}
        <section
          id="toolbox"
          aria-labelledby="toolbox-heading"
          className="border-t-4 border-border"
        >
          <div className="max-w-[1280px] mx-auto px-4 pt-16 md:pt-24 pb-6">
            <ChapterHeader
              number="05"
              kicker="Browse everything"
              title="The full toolbox — 200+ tools across 30 categories."
            >
              Search by name, filter by tag, and only the tools that match stay on screen.
              Click <strong>Show all</strong> on any category card to expand it inline.
            </ChapterHeader>
          </div>

          <ResourceFilterBar
            query={query}
            onQuery={setQuery}
            selectedTags={selectedTags}
            onToggleTag={toggleTag}
            onClear={clearFilters}
            totalShown={totalShown}
            totalCategories={totalCategoriesShown}
            tagCounts={tagCounts}
          />

          <div className="max-w-[1280px] mx-auto px-4 py-8 md:py-12">
            {totalShown === 0 ? (
              <div className="border-2 border-dashed border-border bg-secondary-background p-10 text-center">
                <p className="font-heading text-base">No tools match these filters.</p>
                <p className="font-base text-sm text-foreground/65 mt-2">
                  Try removing a tag or clearing your search.
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 inline-flex items-center bg-foreground text-background border-2 border-border font-heading text-sm px-4 py-2 shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none motion-safe:transition-[transform,box-shadow] active:scale-[0.97]"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 items-start">
                {filtered.map(({ cat, links }) => (
                  <ResourceCategoryCard
                    key={cat.id}
                    category={cat}
                    visibleLinks={links}
                    /** Auto-expand when a filter is active so users see all matches */
                    defaultOpen={query.length > 0 || selectedTags.size > 0}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <RedditWarnings />

        <ResourcesCallToAction />
      </main>

      <BackToTop />
    </div>
  );
}
