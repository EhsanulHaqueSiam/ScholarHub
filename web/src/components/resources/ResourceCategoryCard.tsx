import {
  BrainCircuit,
  Briefcase,
  Building2,
  Banknote,
  ChevronDown,
  ClipboardList,
  Coins,
  Compass,
  FlaskConical,
  Globe2,
  GraduationCap,
  Home,
  KeyRound,
  Layers3,
  type LucideIcon,
  Mail,
  MapPin,
  MessagesSquare,
  Microscope,
  Newspaper,
  PackageCheck,
  PenLine,
  Plane,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users2,
  Wallet,
  Youtube,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  type CategoryAccent,
  type ResourceCategory,
  type ResourceLink,
} from "@/data/resources";
import { cn } from "@/lib/utils";
import { ResourceLinkRow } from "./ResourceLinkRow";

const ICONS: Record<ResourceCategory["icon"], LucideIcon> = {
  Compass,
  Globe2,
  Coins,
  BrainCircuit,
  Users2,
  Trophy,
  FlaskConical,
  Wallet,
  GraduationCap,
  PenLine,
  MapPin,
  Building2,
  Banknote,
  Youtube,
  Sparkles,
  Plane,
  Layers3,
  Newspaper,
  MessagesSquare,
  Home,
  ShieldCheck,
  Microscope,
  Mail,
  ClipboardList,
  PackageCheck,
  Briefcase,
  KeyRound,
};

const ACCENT_HEADER: Record<CategoryAccent, string> = {
  main: "bg-main text-main-foreground",
  pink: "bg-accent-pink text-accent-foreground",
  lime: "bg-accent-lime text-accent-foreground",
  sky: "bg-accent-sky text-accent-foreground",
  amber: "bg-accent text-accent-foreground",
};

interface ResourceCategoryCardProps {
  category: ResourceCategory;
  /** Already-filtered links to render. */
  visibleLinks: ResourceLink[];
  /** When true, expand on initial render. */
  defaultOpen?: boolean;
}

const PREVIEW_COUNT = 4;

export function ResourceCategoryCard({
  category,
  visibleLinks,
  defaultOpen = false,
}: ResourceCategoryCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const Icon = ICONS[category.icon];

  const grouped = useMemo(() => {
    const map = new Map<string, ResourceLink[]>();
    for (const link of visibleLinks) {
      const key = link.group ?? "";
      const arr = map.get(key);
      if (arr) arr.push(link);
      else map.set(key, [link]);
    }
    return Array.from(map.entries());
  }, [visibleLinks]);

  if (visibleLinks.length === 0) return null;

  const previewLinks = visibleLinks.slice(0, PREVIEW_COUNT);
  const showExpand = visibleLinks.length > PREVIEW_COUNT;

  return (
    <article
      id={`cat-${category.id}`}
      className="border-2 border-border bg-background shadow-shadow scroll-mt-32"
    >
      {/* Header */}
      <header
        className={`${ACCENT_HEADER[category.accent]} border-b-2 border-border px-4 md:px-5 py-3 md:py-4 flex items-center gap-3 md:gap-4`}
      >
        <div className="bg-foreground text-background border-2 border-border p-2 shadow-[2px_2px_0_0_var(--border)] shrink-0">
          <Icon className="size-4 md:size-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-heading text-caption uppercase tracking-[0.2em] opacity-80">
            Section {category.number}
          </p>
          <h3 className="font-heading text-base md:text-lg leading-tight">
            {category.title}
          </h3>
        </div>
        <span
          aria-hidden
          className="bg-foreground text-background border-2 border-border font-heading text-caption px-2 py-0.5 shrink-0"
        >
          {visibleLinks.length}
        </span>
      </header>

      {category.subtitle ? (
        <p className="px-4 md:px-5 pt-3 font-base text-sm text-foreground/65 leading-relaxed">
          {category.subtitle}
        </p>
      ) : null}

      {/* Body */}
      <div className="px-4 md:px-5 py-4 space-y-2">
        {(open ? grouped : [["", previewLinks] as [string, ResourceLink[]]]).map(
          ([group, links]) => (
            <div key={group || "default"} className="space-y-2">
              {open && group ? (
                <p className="font-heading text-caption uppercase tracking-[0.2em] text-foreground/55 pt-2">
                  {group}
                </p>
              ) : null}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {links.map((link) => (
                  <ResourceLinkRow key={`${link.url}-${link.name}`} link={link} />
                ))}
              </div>
            </div>
          ),
        )}
      </div>

      {showExpand ? (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="w-full border-t-2 border-border bg-secondary-background hover:bg-background font-heading text-sm py-3 flex items-center justify-center gap-2 motion-safe:transition-colors"
        >
          {open ? "Show less" : `Show all ${visibleLinks.length}`}
          <ChevronDown
            className={cn(
              "size-4 motion-safe:transition-transform duration-200",
              open && "rotate-180",
            )}
          />
        </button>
      ) : null}
    </article>
  );
}
