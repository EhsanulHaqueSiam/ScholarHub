import * as Tabs from "@radix-ui/react-tabs";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Plus,
  Search,
  Shield,
  Star,
  Target,
  Trophy,
  X,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { BackToTop } from "@/components/layout/BackToTop";
import { Navbar } from "@/components/layout/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { getAllCountries, getCountryFlag, getCountryName } from "@/lib/countries";
import { buildPageMeta } from "@/lib/seo/meta";
import { cn } from "@/lib/utils";
import { api } from "../../convex/_generated/api";

// ---- Route ----

export const Route = createFileRoute("/shortlist")({
  head: () => {
    const { meta, links } = buildPageMeta({
      title: "My Shortlist | ScholarHub",
      description:
        "Build your university shortlist. Rank universities by ambition and scholarship chances with our tier list.",
      canonicalPath: "/shortlist",
    });
    return { meta, links };
  },
  component: ShortlistPage,
});

// ---- Types ----

type Tier = "dream" | "target" | "safety";
type ActiveTab = "universities" | "countries" | "courses";

interface ShortlistUniversity {
  id: string;
  name: string;
  tier: Tier;
  countries: string[];
  scholarshipCount: number;
  isCustom: boolean;
}

interface ShortlistCountry {
  code: string;
  name: string;
}

interface ShortlistData {
  universities: ShortlistUniversity[];
  countries: ShortlistCountry[];
}

// ---- Tier config ----

const TIER_META: Record<
  Tier,
  {
    label: string;
    sublabel: string;
    Icon: typeof Trophy;
    cssColor: string;
    bgClass: string;
  }
> = {
  dream: {
    label: "DREAM",
    sublabel: "Top-ranked \u00b7 Scholarships are competitive",
    Icon: Trophy,
    cssColor: "var(--accent-pink)",
    bgClass: "bg-tier-dream-bg",
  },
  target: {
    label: "TARGET",
    sublabel: "Well-ranked \u00b7 Good scholarship chances",
    Icon: Target,
    cssColor: "var(--accent)",
    bgClass: "bg-tier-target-bg",
  },
  safety: {
    label: "SAFETY",
    sublabel: "Scholarship sureshot \u00b7 Reliable choice",
    Icon: Shield,
    cssColor: "var(--accent-lime)",
    bgClass: "bg-tier-safety-bg",
  },
};

const TIERS: Tier[] = ["dream", "target", "safety"];

const DEFAULT_DATA: ShortlistData = { universities: [], countries: [] };

// ---- Helpers ----

function makeId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ---- Page ----

function ShortlistPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("universities");
  const [data, setData] = useLocalStorage<ShortlistData>("scholarhub-shortlist", DEFAULT_DATA);

  const safeData: ShortlistData = {
    universities: Array.isArray(data?.universities) ? data.universities : [],
    countries: Array.isArray(data?.countries) ? data.countries : [],
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-20 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-start justify-between gap-6 mb-2">
            <div>
              <p className="font-heading text-xs uppercase tracking-[0.25em] text-foreground/60 mb-1">
                Plan your future
              </p>
              <h1 className="font-heading text-3xl md:text-4xl leading-none">MY SHORTLIST</h1>
              <p className="text-sm mt-2 max-w-lg text-foreground/70">
                Rank your dream universities by ambition and scholarship probability. Drag between
                tiers to organize your strategy.
              </p>
            </div>
            <ShortlistIllustration />
          </div>

          {/* Tabs */}
          <Tabs.Root
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as ActiveTab)}
            className="mt-8"
          >
            <Tabs.List className="flex gap-2 mb-8 flex-wrap">
              <TabTrigger value="universities" icon={<Star className="size-3.5" />}>
                Universities
                {safeData.universities.length > 0 && (
                  <span className="ml-1 text-[11px] opacity-60">
                    ({safeData.universities.length})
                  </span>
                )}
              </TabTrigger>
              <TabTrigger value="countries" icon={<Target className="size-3.5" />}>
                Countries
                {safeData.countries.length > 0 && (
                  <span className="ml-1 text-[11px] opacity-60">
                    ({safeData.countries.length})
                  </span>
                )}
              </TabTrigger>
              <TabTrigger value="courses" icon={<BookOpen className="size-3.5" />}>
                Courses
              </TabTrigger>
            </Tabs.List>

            <Tabs.Content value="universities" className="outline-none">
              <UniversityPanel data={safeData} setData={setData} />
            </Tabs.Content>
            <Tabs.Content value="countries" className="outline-none">
              <CountryPanel data={safeData} setData={setData} />
            </Tabs.Content>
            <Tabs.Content value="courses" className="outline-none">
              <CoursePanel />
            </Tabs.Content>
          </Tabs.Root>
        </div>
      </div>
      <BackToTop />
    </div>
  );
}

// ---- Tab trigger ----

function TabTrigger({
  value,
  icon,
  children,
}: {
  value: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Tabs.Trigger
      value={value}
      className={cn(
        "font-heading text-sm border-2 border-border rounded-base px-4 py-2 transition-all",
        "flex items-center gap-1.5",
        "hover:shadow-shadow hover:-translate-x-0.5 hover:-translate-y-0.5",
        "data-[state=active]:bg-main data-[state=active]:text-main-foreground data-[state=active]:shadow-shadow",
        "data-[state=inactive]:bg-secondary-background",
      )}
    >
      {icon}
      {children}
    </Tabs.Trigger>
  );
}

// ---- SVG illustration ----

function ShortlistIllustration() {
  return (
    <svg
      width="100"
      height="100"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="hidden md:block shrink-0"
    >
      <rect
        x="10"
        y="8"
        width="80"
        height="22"
        stroke="currentColor"
        strokeWidth="2"
        fill="var(--accent-pink)"
        fillOpacity="0.25"
      />
      <rect
        x="10"
        y="38"
        width="80"
        height="22"
        stroke="currentColor"
        strokeWidth="2"
        fill="var(--accent)"
        fillOpacity="0.25"
      />
      <rect
        x="10"
        y="68"
        width="80"
        height="22"
        stroke="currentColor"
        strokeWidth="2"
        fill="var(--accent-lime)"
        fillOpacity="0.25"
      />
      <text x="18" y="23" fontSize="11" fill="currentColor" fontWeight="bold">
        {"★★★"}
      </text>
      <text x="18" y="53" fontSize="11" fill="currentColor" fontWeight="bold">
        {"★★"}
      </text>
      <text x="18" y="83" fontSize="11" fill="currentColor" fontWeight="bold">
        {"★"}
      </text>
      <line x1="56" y1="16" x2="82" y2="16" stroke="currentColor" strokeWidth="2" />
      <line x1="56" y1="22" x2="74" y2="22" stroke="currentColor" strokeWidth="2" />
      <line x1="56" y1="46" x2="82" y2="46" stroke="currentColor" strokeWidth="2" />
      <line x1="56" y1="52" x2="70" y2="52" stroke="currentColor" strokeWidth="2" />
      <line x1="56" y1="76" x2="82" y2="76" stroke="currentColor" strokeWidth="2" />
      <line x1="56" y1="82" x2="68" y2="82" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

// ================================================================
//  UNIVERSITIES
// ================================================================

function UniversityPanel({
  data,
  setData,
}: {
  data: ShortlistData;
  setData: (v: ShortlistData | ((prev: ShortlistData) => ShortlistData)) => void;
}) {
  const dragItemRef = useRef<{ id: string; sourceTier: Tier } | null>(null);
  const [dragOverTier, setDragOverTier] = useState<Tier | null>(null);

  const addUniversity = useCallback(
    (
      name: string,
      tier: Tier,
      countries: string[],
      scholarshipCount: number,
      isCustom: boolean,
    ) => {
      const id = makeId(name);
      setData((prev) => {
        if (prev.universities.some((u) => u.id === id)) return prev;
        return {
          ...prev,
          universities: [
            ...prev.universities,
            { id, name, tier, countries, scholarshipCount, isCustom },
          ],
        };
      });
    },
    [setData],
  );

  const removeUniversity = useCallback(
    (id: string) => {
      setData((prev) => ({
        ...prev,
        universities: prev.universities.filter((u) => u.id !== id),
      }));
    },
    [setData],
  );

  const moveTier = useCallback(
    (id: string, newTier: Tier) => {
      setData((prev) => ({
        ...prev,
        universities: prev.universities.map((u) => (u.id === id ? { ...u, tier: newTier } : u)),
      }));
    },
    [setData],
  );

  // DnD handlers
  const handleDragStart = (id: string, tier: Tier) => (e: React.DragEvent) => {
    dragItemRef.current = { id, sourceTier: tier };
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5";
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }
    setDragOverTier(null);
    dragItemRef.current = null;
  };

  const handleDragOver = (tier: Tier) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverTier !== tier) setDragOverTier(tier);
  };

  const handleDragLeave = () => setDragOverTier(null);

  const handleDrop = (targetTier: Tier) => (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverTier(null);
    const item = dragItemRef.current;
    if (!item || item.sourceTier === targetTier) return;
    moveTier(item.id, targetTier);
    dragItemRef.current = null;
  };

  const existingIds = new Set(data.universities.map((u) => u.id));

  return (
    <div className="space-y-6">
      <UniSearchInput
        onAdd={(name, countries, count, isCustom) =>
          addUniversity(name, "target", countries, count, isCustom)
        }
        existingIds={existingIds}
      />

      {TIERS.map((tier) => {
        const unis = data.universities.filter((u) => u.tier === tier);
        const meta = TIER_META[tier];
        const isOver = dragOverTier === tier;

        return (
          <div
            key={tier}
            onDragOver={handleDragOver(tier)}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop(tier)}
            className={cn(
              "border-3 border-border rounded-base p-4 transition-all min-h-[100px]",
              meta.bgClass,
              isOver && "border-dashed ring-2 ring-offset-2",
            )}
            style={{
              borderLeftWidth: "8px",
              borderLeftColor: meta.cssColor,
              ...(isOver ? { ringColor: meta.cssColor } : {}),
            }}
          >
            {/* Tier header */}
            <div className="flex items-center gap-2 mb-3">
              <span
                className="font-heading text-xs uppercase tracking-wider px-2.5 py-1 border-2 border-border inline-flex items-center gap-1.5"
                style={{ backgroundColor: meta.cssColor, color: "#000" }}
              >
                <meta.Icon className="size-3" />
                {meta.label}
              </span>
              <span className="text-[11px] text-foreground/50">{meta.sublabel}</span>
              {unis.length > 0 && (
                <Badge variant="neutral" className="ml-auto text-[11px]">
                  {unis.length}
                </Badge>
              )}
            </div>

            {/* University cards */}
            {unis.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {unis.map((uni) => (
                  <UniCard
                    key={uni.id}
                    uni={uni}
                    onRemove={() => removeUniversity(uni.id)}
                    onMoveTier={(t) => moveTier(uni.id, t)}
                    onDragStart={handleDragStart(uni.id, tier)}
                    onDragEnd={handleDragEnd}
                  />
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-border/30 rounded-base p-6 text-center text-sm text-foreground/40">
                {isOver ? "Drop here!" : "Search above to add universities"}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---- University card ----

function UniCard({
  uni,
  onRemove,
  onMoveTier,
  onDragStart,
  onDragEnd,
}: {
  uni: ShortlistUniversity;
  onRemove: () => void;
  onMoveTier: (tier: Tier) => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "bg-secondary-background border-2 border-border shadow-shadow rounded-base",
        "px-3 py-2 flex items-center gap-2",
        "cursor-grab active:cursor-grabbing",
        "hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none",
        "transition-all select-none",
      )}
    >
      <GripVertical className="size-3.5 opacity-30 shrink-0 hidden sm:block" />

      {/* Country flags */}
      {uni.countries.length > 0 && (
        <span className="text-sm shrink-0" title={uni.countries.map(getCountryName).join(", ")}>
          {uni.countries.slice(0, 2).map((c) => (
            <span key={c}>{getCountryFlag(c)}</span>
          ))}
          {uni.countries.length > 2 && (
            <span className="text-[10px] text-foreground/50">+{uni.countries.length - 2}</span>
          )}
        </span>
      )}

      <span className="font-heading text-xs sm:text-sm truncate max-w-[140px] sm:max-w-[200px]">
        {uni.name}
      </span>

      {/* Badges */}
      {uni.isCustom ? (
        <Badge variant="accent" className="text-[10px] px-1.5 py-0 shrink-0">
          Custom
        </Badge>
      ) : (
        <Badge variant="neutral" className="text-[10px] px-1.5 py-0 shrink-0">
          {uni.scholarshipCount}
        </Badge>
      )}

      {/* Tier move dots */}
      <div className="flex gap-1 ml-1 shrink-0">
        {TIERS.filter((t) => t !== uni.tier).map((t) => (
          <button
            key={t}
            onClick={(e) => {
              e.stopPropagation();
              onMoveTier(t);
            }}
            className="size-5 border-2 border-border rounded-sm flex items-center justify-center text-[9px] font-heading hover:shadow-[2px_2px_0_0_var(--border)] hover:-translate-x-px hover:-translate-y-px transition-all"
            style={{ backgroundColor: TIER_META[t].cssColor }}
            title={`Move to ${TIER_META[t].label}`}
          >
            {TIER_META[t].label[0]}
          </button>
        ))}
      </div>

      {/* Remove */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="shrink-0 opacity-40 hover:opacity-100 transition-opacity"
        title="Remove"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

// ---- Search input with autocomplete ----

function UniSearchInput({
  onAdd,
  existingIds,
}: {
  onAdd: (name: string, countries: string[], scholarshipCount: number, isCustom: boolean) => void;
  existingIds: Set<string>;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const suggestions = useQuery(
    api.shortlist.suggestUniversities,
    search.trim().length >= 2 ? { search: search.trim() } : "skip",
  );

  // Filter out already-added universities
  const filtered = (suggestions ?? []).filter((s) => !existingIds.has(makeId(s.name)));

  const handleAdd = (name: string, countries: string[], count: number, isCustom: boolean) => {
    onAdd(name, countries, count, isCustom);
    setSearch("");
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && search.trim().length >= 2) {
      e.preventDefault();
      if (filtered.length > 0) {
        const s = filtered[0];
        handleAdd(s.name, s.countries, s.count, false);
      } else {
        handleAdd(search.trim(), [], 0, true);
      }
    }
    if (e.key === "Escape") {
      setOpen(false);
    }
  };

  // Close dropdown on outside click
  const handleBlur = (e: React.FocusEvent) => {
    if (wrapperRef.current && !wrapperRef.current.contains(e.relatedTarget)) {
      setTimeout(() => setOpen(false), 150);
    }
  };

  const showCustomOption =
    search.trim().length >= 2 &&
    !filtered.some((s) => s.name.toLowerCase() === search.trim().toLowerCase()) &&
    !existingIds.has(makeId(search.trim()));

  return (
    <div ref={wrapperRef} className="relative" onBlur={handleBlur}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 opacity-40" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => search.trim().length >= 2 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search for a university..."
          className={cn(
            "w-full pl-10 pr-4 py-3 border-3 border-border rounded-base shadow-shadow",
            "bg-secondary-background text-foreground font-base text-sm",
            "placeholder:text-foreground/40",
            "focus:outline-none focus:ring-2 focus:ring-main focus:ring-offset-2",
            "transition-all",
          )}
        />
      </div>

      {/* Dropdown */}
      {open && search.trim().length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 border-3 border-border bg-secondary-background shadow-shadow rounded-base z-30 max-h-72 overflow-y-auto">
          {suggestions === undefined && (
            <div className="px-4 py-3 text-sm text-foreground/50">Searching...</div>
          )}

          {filtered.map((s) => (
            <button
              key={s.name}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleAdd(s.name, s.countries, s.count, false)}
              className="w-full text-left px-4 py-2.5 hover:bg-main/10 flex items-center gap-2 border-b border-border/20 last:border-0 transition-colors"
            >
              {s.countries.length > 0 && (
                <span className="text-sm shrink-0">
                  {s.countries.slice(0, 3).map((c) => (
                    <span key={c}>{getCountryFlag(c)}</span>
                  ))}
                </span>
              )}
              <span className="font-heading text-sm truncate">{s.name}</span>
              <Badge variant="neutral" className="ml-auto text-[10px] shrink-0">
                {s.count} scholarship{s.count !== 1 ? "s" : ""}
              </Badge>
            </button>
          ))}

          {showCustomOption && (
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleAdd(search.trim(), [], 0, true)}
              className="w-full text-left px-4 py-2.5 hover:bg-main/10 flex items-center gap-2 border-t-2 border-dashed border-border/30 transition-colors"
            >
              <Plus className="size-4 shrink-0" />
              <span className="text-sm">
                Add &ldquo;<strong className="font-heading">{search.trim()}</strong>&rdquo; as
                custom
              </span>
            </button>
          )}

          {suggestions !== undefined && filtered.length === 0 && !showCustomOption && (
            <div className="px-4 py-3 text-sm text-foreground/50">No new results found</div>
          )}
        </div>
      )}
    </div>
  );
}

// ================================================================
//  COUNTRIES
// ================================================================

function CountryPanel({
  data,
  setData,
}: {
  data: ShortlistData;
  setData: (v: ShortlistData | ((prev: ShortlistData) => ShortlistData)) => void;
}) {
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const countryCounts = useQuery(api.shortlist.countryScholarshipCounts);
  const allCountries = getAllCountries();

  const existingCodes = new Set(data.countries.map((c) => c.code));

  const filtered =
    search.trim().length >= 1
      ? allCountries
          .filter(
            (c) =>
              !existingCodes.has(c.code) &&
              (c.name.toLowerCase().includes(search.toLowerCase()) ||
                c.code.toLowerCase().includes(search.toLowerCase())),
          )
          .slice(0, 12)
      : [];

  const addCountry = (code: string, name: string) => {
    setData((prev) => {
      if (prev.countries.some((c) => c.code === code)) return prev;
      return { ...prev, countries: [...prev.countries, { code, name }] };
    });
    setSearch("");
    setDropdownOpen(false);
  };

  const removeCountry = (code: string) => {
    setData((prev) => ({
      ...prev,
      countries: prev.countries.filter((c) => c.code !== code),
    }));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setData((prev) => {
      const arr = [...prev.countries];
      [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
      return { ...prev, countries: arr };
    });
  };

  const moveDown = (index: number) => {
    setData((prev) => {
      if (index >= prev.countries.length - 1) return prev;
      const arr = [...prev.countries];
      [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
      return { ...prev, countries: arr };
    });
  };

  const handleBlur = (e: React.FocusEvent) => {
    if (wrapperRef.current && !wrapperRef.current.contains(e.relatedTarget)) {
      setTimeout(() => setDropdownOpen(false), 150);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div ref={wrapperRef} className="relative" onBlur={handleBlur}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 opacity-40" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setDropdownOpen(true);
            }}
            onFocus={() => search.trim().length >= 1 && setDropdownOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && filtered.length > 0) {
                e.preventDefault();
                addCountry(filtered[0].code, filtered[0].name);
              }
              if (e.key === "Escape") setDropdownOpen(false);
            }}
            placeholder="Search for a country..."
            className={cn(
              "w-full pl-10 pr-4 py-3 border-3 border-border rounded-base shadow-shadow",
              "bg-secondary-background text-foreground font-base text-sm",
              "placeholder:text-foreground/40",
              "focus:outline-none focus:ring-2 focus:ring-main focus:ring-offset-2",
              "transition-all",
            )}
          />
        </div>

        {dropdownOpen && filtered.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 border-3 border-border bg-secondary-background shadow-shadow rounded-base z-30 max-h-64 overflow-y-auto">
            {filtered.map((c) => (
              <button
                key={c.code}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => addCountry(c.code, c.name)}
                className="w-full text-left px-4 py-2.5 hover:bg-main/10 flex items-center gap-3 border-b border-border/20 last:border-0 transition-colors"
              >
                <span className="text-lg">{c.flag}</span>
                <span className="font-heading text-sm">{c.name}</span>
                {countryCounts && countryCounts[c.code] && (
                  <Badge variant="neutral" className="ml-auto text-[10px]">
                    {countryCounts[c.code]} scholarships
                  </Badge>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Ranked list */}
      {data.countries.length > 0 ? (
        <div className="space-y-2">
          {data.countries.map((country, i) => (
            <div
              key={country.code}
              className="bg-secondary-background border-2 border-border shadow-shadow rounded-base px-4 py-3 flex items-center gap-3 transition-all hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none"
            >
              <span className="font-heading text-lg w-8 text-center text-foreground/60">
                {i + 1}
              </span>
              <span className="text-xl">{getCountryFlag(country.code)}</span>
              <span className="font-heading text-sm flex-1">{country.name}</span>

              {countryCounts && countryCounts[country.code] && (
                <Badge variant="neutral" className="text-[10px] shrink-0">
                  {countryCounts[country.code]}
                </Badge>
              )}

              {/* Move buttons */}
              <div className="flex flex-col shrink-0">
                <button
                  onClick={() => moveUp(i)}
                  disabled={i === 0}
                  className="p-0.5 disabled:opacity-20 hover:text-main transition-colors"
                  title="Move up"
                >
                  <ChevronUp className="size-3.5" />
                </button>
                <button
                  onClick={() => moveDown(i)}
                  disabled={i === data.countries.length - 1}
                  className="p-0.5 disabled:opacity-20 hover:text-main transition-colors"
                  title="Move down"
                >
                  <ChevronDown className="size-3.5" />
                </button>
              </div>

              <button
                onClick={() => removeCountry(country.code)}
                className="opacity-40 hover:opacity-100 transition-opacity shrink-0"
                title="Remove"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="border-3 border-dashed border-border/30 rounded-base p-10 text-center">
          <p className="text-sm text-foreground/40">
            Search above to add countries to your preference list
          </p>
        </div>
      )}
    </div>
  );
}

// ================================================================
//  COURSES (coming soon)
// ================================================================

function CoursePanel() {
  return (
    <div className="border-4 border-dashed border-border/25 rounded-base p-12 text-center">
      <BookOpen className="size-12 mx-auto mb-4 opacity-20" />
      <h3 className="font-heading text-lg">Course Rankings Coming Soon</h3>
      <p className="text-sm mt-2 max-w-md mx-auto text-foreground/60">
        Rank your preferred courses, then filter universities by course availability and scholarship
        options. This feature is under active development.
      </p>
      <Button variant="neutral" className="mt-6 pointer-events-none opacity-50">
        Stay Tuned
      </Button>
    </div>
  );
}
