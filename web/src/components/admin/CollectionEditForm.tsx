import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { TAG_CATEGORIES, ALL_TAGS, getTagLabel } from "@/lib/tags";
import { api } from "../../../convex/_generated/api";

const DEGREE_OPTIONS = ["bachelor", "master", "phd", "postdoc"] as const;
const FUNDING_TYPE_OPTIONS = ["fully_funded", "partial", "tuition_waiver", "stipend_only"] as const;
const PRESTIGE_TIER_OPTIONS = ["gold", "silver", "bronze"] as const;
const SORT_OPTIONS = ["deadline", "prestige", "newest"] as const;
const STATUS_OPTIONS = ["draft", "active", "archived"] as const;

const inputClass =
  "h-10 px-3 border-2 border-border rounded-base bg-background text-sm w-full focus:outline-none focus:ring-2 focus:ring-ring";
const labelClass = "text-xs font-heading uppercase tracking-wide block mb-1";
const fieldGroupClass = "mb-4";

interface FormValues {
  name: string;
  slug: string;
  slugManuallyEdited: boolean;
  emoji: string;
  description: string;
  status: string;
  is_featured: boolean;
  default_sort: string;
  sort_order: number;
  host_countries: string;
  degree_levels: string[];
  funding_types: string[];
  prestige_tiers: string[];
  tags: string[];
  tagInput: string;
  deadline_before: string;
  deadline_after: string;
  added_since: string;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

interface CollectionEditFormProps {
  collection?: {
    _id: any;
    name: string;
    slug: string;
    emoji: string;
    description?: string;
    status: string;
    is_featured: boolean;
    sort_order: number;
    default_sort?: string;
    host_countries?: string[];
    degree_levels?: string[];
    funding_types?: string[];
    prestige_tiers?: string[];
    tags?: string[];
    deadline_before?: number;
    deadline_after?: number;
    added_since?: number;
  };
  onSave: () => void;
  onCancel: () => void;
}

/**
 * CollectionEditForm: Create/edit form for collections in the slide-out sheet.
 * Includes all fields + filter criteria + live preview with debounced matching count.
 * D-82, D-83, D-16
 */
export function CollectionEditForm({ collection, onSave, onCancel }: CollectionEditFormProps) {
  const createCollection = useMutation(api.collections.createCollection);
  const updateCollection = useMutation(api.collections.updateCollection);

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormValues>(() => ({
    name: collection?.name ?? "",
    slug: collection?.slug ?? "",
    slugManuallyEdited: !!collection,
    emoji: collection?.emoji ?? "",
    description: collection?.description ?? "",
    status: collection?.status ?? "draft",
    is_featured: collection?.is_featured ?? false,
    default_sort: collection?.default_sort ?? "deadline",
    sort_order: collection?.sort_order ?? 0,
    host_countries: (collection?.host_countries ?? []).join(", "),
    degree_levels: collection?.degree_levels ?? [],
    funding_types: collection?.funding_types ?? [],
    prestige_tiers: collection?.prestige_tiers ?? [],
    tags: collection?.tags ?? [],
    tagInput: "",
    deadline_before: collection?.deadline_before
      ? new Date(collection.deadline_before).toISOString().split("T")[0]
      : "",
    deadline_after: collection?.deadline_after
      ? new Date(collection.deadline_after).toISOString().split("T")[0]
      : "",
    added_since: collection?.added_since
      ? new Date(collection.added_since).toISOString().split("T")[0]
      : "",
  }));

  const [showFilters, setShowFilters] = useState(false);
  const [showTagDropdown, setShowTagDropdown] = useState(false);

  // Debounced filter criteria for preview
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedCriteria, setDebouncedCriteria] = useState<Record<string, unknown>>({});

  const filterCriteria = useMemo(() => {
    const criteria: Record<string, unknown> = {};

    const countries = form.host_countries
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (countries.length > 0) criteria.host_countries = countries;
    if (form.degree_levels.length > 0) criteria.degree_levels = form.degree_levels;
    if (form.funding_types.length > 0) criteria.funding_types = form.funding_types;
    if (form.prestige_tiers.length > 0) criteria.prestige_tiers = form.prestige_tiers;
    if (form.tags.length > 0) criteria.tags = form.tags;
    if (form.deadline_before) criteria.deadline_before = new Date(form.deadline_before).getTime();
    if (form.deadline_after) criteria.deadline_after = new Date(form.deadline_after).getTime();
    if (form.added_since) criteria.added_since = new Date(form.added_since).getTime();

    return criteria;
  }, [form.host_countries, form.degree_levels, form.funding_types, form.prestige_tiers, form.tags, form.deadline_before, form.deadline_after, form.added_since]);

  // Debounce filter criteria updates for live preview
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedCriteria(filterCriteria);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [filterCriteria]);

  const preview = useQuery(api.collections.getCollectionPreview, debouncedCriteria as any);

  const updateField = useCallback(<K extends keyof FormValues>(field: K, value: FormValues[K]) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-generate slug from name if not manually edited
      if (field === "name" && !prev.slugManuallyEdited) {
        next.slug = generateSlug(value as string);
      }
      return next;
    });
  }, []);

  function toggleArrayField(field: "degree_levels" | "funding_types" | "prestige_tiers", value: string) {
    setForm((prev) => {
      const arr = prev[field];
      const next = arr.includes(value)
        ? arr.filter((v) => v !== value)
        : [...arr, value];
      return { ...prev, [field]: next };
    });
  }

  function addTag(tagId: string) {
    if (!form.tags.includes(tagId)) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, tagId], tagInput: "" }));
    }
    setShowTagDropdown(false);
  }

  function removeTag(tagId: string) {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tagId),
    }));
  }

  const filteredTags = useMemo(() => {
    if (!form.tagInput) return ALL_TAGS.filter((t) => !form.tags.includes(t.id));
    const query = form.tagInput.toLowerCase();
    return ALL_TAGS.filter(
      (t) =>
        !form.tags.includes(t.id) &&
        (t.label.toLowerCase().includes(query) || t.id.includes(query)),
    );
  }, [form.tagInput, form.tags]);

  async function handleSave() {
    if (!form.name || !form.emoji) return;

    setSaving(true);
    try {
      const countries = form.host_countries
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      if (collection) {
        await updateCollection({
          collectionId: collection._id,
          updates: {
            name: form.name,
            emoji: form.emoji,
            description: form.description || undefined,
            status: form.status as "draft" | "active" | "archived",
            is_featured: form.is_featured,
            sort_order: form.sort_order,
            default_sort: form.default_sort,
            ...(countries.length > 0 ? { host_countries: countries } : {}),
            ...(form.degree_levels.length > 0 ? { degree_levels: form.degree_levels as any } : {}),
            ...(form.funding_types.length > 0 ? { funding_types: form.funding_types as any } : {}),
            ...(form.prestige_tiers.length > 0 ? { prestige_tiers: form.prestige_tiers as any } : {}),
            ...(form.tags.length > 0 ? { tags: form.tags } : {}),
            ...(form.deadline_before ? { deadline_before: new Date(form.deadline_before).getTime() } : {}),
            ...(form.deadline_after ? { deadline_after: new Date(form.deadline_after).getTime() } : {}),
            ...(form.added_since ? { added_since: new Date(form.added_since).getTime() } : {}),
          },
        });
      } else {
        await createCollection({
          name: form.name,
          emoji: form.emoji,
          description: form.description || undefined,
          status: form.status as "draft" | "active" | "archived",
          is_featured: form.is_featured,
          sort_order: form.sort_order,
          default_sort: form.default_sort,
          ...(countries.length > 0 ? { host_countries: countries } : {}),
          ...(form.degree_levels.length > 0 ? { degree_levels: form.degree_levels as any } : {}),
          ...(form.funding_types.length > 0 ? { funding_types: form.funding_types as any } : {}),
          ...(form.prestige_tiers.length > 0 ? { prestige_tiers: form.prestige_tiers as any } : {}),
          ...(form.tags.length > 0 ? { tags: form.tags } : {}),
          ...(form.deadline_before ? { deadline_before: new Date(form.deadline_before).getTime() } : {}),
          ...(form.deadline_after ? { deadline_after: new Date(form.deadline_after).getTime() } : {}),
          ...(form.added_since ? { added_since: new Date(form.added_since).getTime() } : {}),
        });
      }
      onSave();
    } catch (error) {
      console.error("Failed to save collection:", error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="space-y-0">
        {/* Name */}
        <div className={fieldGroupClass}>
          <label className={labelClass} htmlFor="coll-name">Name</label>
          <input
            id="coll-name"
            type="text"
            className={inputClass}
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="e.g. Top Fully Funded Scholarships"
          />
        </div>

        {/* Slug */}
        <div className={fieldGroupClass}>
          <label className={labelClass} htmlFor="coll-slug">Slug</label>
          <input
            id="coll-slug"
            type="text"
            className={inputClass}
            value={form.slug}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, slug: e.target.value, slugManuallyEdited: true }));
            }}
            placeholder="auto-generated-from-name"
          />
          {!form.slugManuallyEdited && form.slug && (
            <p className="text-xs text-foreground/50 mt-1">/collections/{form.slug}</p>
          )}
        </div>

        {/* Emoji */}
        <div className={fieldGroupClass}>
          <label className={labelClass} htmlFor="coll-emoji">Emoji</label>
          <div className="flex items-center gap-3">
            <input
              id="coll-emoji"
              type="text"
              className="w-16 h-10 px-3 border-2 border-border rounded-base bg-background text-xl text-center focus:outline-none focus:ring-2 focus:ring-ring"
              value={form.emoji}
              onChange={(e) => updateField("emoji", e.target.value)}
              maxLength={2}
            />
            {form.emoji && (
              <span className="text-3xl" aria-hidden="true">{form.emoji}</span>
            )}
          </div>
        </div>

        {/* Description */}
        <div className={fieldGroupClass}>
          <label className={labelClass} htmlFor="coll-description">Description (Markdown)</label>
          <textarea
            id="coll-description"
            className="min-h-[80px] resize-y border-2 border-border rounded-base bg-background text-sm p-3 w-full focus:outline-none focus:ring-2 focus:ring-ring"
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder="Describe this collection for students..."
          />
        </div>

        {/* Status */}
        <div className={fieldGroupClass}>
          <label className={labelClass} htmlFor="coll-status">Status</label>
          <select
            id="coll-status"
            className={inputClass}
            value={form.status}
            onChange={(e) => updateField("status", e.target.value)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Featured */}
        <div className={fieldGroupClass}>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => updateField("is_featured", e.target.checked)}
              className="size-4"
            />
            <span className={labelClass + " !mb-0 !block"}>Featured on Directory</span>
          </label>
        </div>

        {/* Default Sort */}
        <div className={fieldGroupClass}>
          <label className={labelClass} htmlFor="coll-sort">Default Sort</label>
          <select
            id="coll-sort"
            className={inputClass}
            value={form.default_sort}
            onChange={(e) => updateField("default_sort", e.target.value)}
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Sort Order */}
        <div className={fieldGroupClass}>
          <label className={labelClass} htmlFor="coll-order">Sort Order</label>
          <input
            id="coll-order"
            type="number"
            min={0}
            max={999}
            className="w-24 h-10 px-3 border-2 border-border rounded-base bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={form.sort_order}
            onChange={(e) => updateField("sort_order", Number.parseInt(e.target.value, 10) || 0)}
          />
        </div>

        {/* Filter Criteria (collapsible) */}
        <details
          className="border-2 border-border rounded-base p-4 mt-2"
          open={showFilters}
          onToggle={(e) => setShowFilters((e.target as HTMLDetailsElement).open)}
        >
          <summary className="font-heading text-sm cursor-pointer select-none">
            Filter Criteria
          </summary>
          <div className="mt-4 space-y-0">
            {/* Host Countries */}
            <div className={fieldGroupClass}>
              <label className={labelClass} htmlFor="coll-countries">Host Countries</label>
              <input
                id="coll-countries"
                type="text"
                className={inputClass}
                value={form.host_countries}
                onChange={(e) => updateField("host_countries", e.target.value)}
                placeholder="Comma-separated country codes, e.g. US, UK, DE"
              />
            </div>

            {/* Degree Levels */}
            <div className={fieldGroupClass}>
              <span className={labelClass}>Degree Levels</span>
              <div className="flex flex-wrap gap-3 mt-1">
                {DEGREE_OPTIONS.map((d) => (
                  <label key={d} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.degree_levels.includes(d)}
                      onChange={() => toggleArrayField("degree_levels", d)}
                      className="size-4"
                    />
                    {d}
                  </label>
                ))}
              </div>
            </div>

            {/* Funding Types */}
            <div className={fieldGroupClass}>
              <span className={labelClass}>Funding Types</span>
              <div className="flex flex-wrap gap-3 mt-1">
                {FUNDING_TYPE_OPTIONS.map((f) => (
                  <label key={f} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.funding_types.includes(f)}
                      onChange={() => toggleArrayField("funding_types", f)}
                      className="size-4"
                    />
                    {f.replace("_", " ")}
                  </label>
                ))}
              </div>
            </div>

            {/* Prestige Tiers */}
            <div className={fieldGroupClass}>
              <span className={labelClass}>Prestige Tiers</span>
              <div className="flex flex-wrap gap-3 mt-1">
                {PRESTIGE_TIER_OPTIONS.map((p) => (
                  <label key={p} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.prestige_tiers.includes(p)}
                      onChange={() => toggleArrayField("prestige_tiers", p)}
                      className="size-4"
                    />
                    {p}
                  </label>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className={fieldGroupClass}>
              <span className={labelClass}>Tags</span>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {form.tags.map((tagId) => (
                  <span
                    key={tagId}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-xs border-2 border-border rounded-base bg-secondary-background"
                  >
                    {getTagLabel(tagId)}
                    <button
                      type="button"
                      onClick={() => removeTag(tagId)}
                      className="text-foreground/50 hover:text-foreground"
                      aria-label={`Remove tag ${getTagLabel(tagId)}`}
                    >
                      x
                    </button>
                  </span>
                ))}
              </div>
              <div className="relative">
                <input
                  type="text"
                  className={inputClass}
                  value={form.tagInput}
                  onChange={(e) => {
                    updateField("tagInput", e.target.value);
                    setShowTagDropdown(true);
                  }}
                  onFocus={() => setShowTagDropdown(true)}
                  placeholder="Search tags..."
                />
                {showTagDropdown && filteredTags.length > 0 && (
                  <div className="absolute z-10 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto border-2 border-border rounded-base bg-background shadow-shadow">
                    {filteredTags.slice(0, 20).map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-secondary-background transition-colors"
                        onClick={() => addTag(tag.id)}
                      >
                        <span className="font-heading">{tag.label}</span>
                        <span className="text-foreground/50 ml-2 text-xs">{tag.description}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Deadline Before / After */}
            <div className="grid grid-cols-2 gap-3">
              <div className={fieldGroupClass}>
                <label className={labelClass} htmlFor="coll-deadline-before">Deadline Before</label>
                <input
                  id="coll-deadline-before"
                  type="date"
                  className={inputClass}
                  value={form.deadline_before}
                  onChange={(e) => updateField("deadline_before", e.target.value)}
                />
              </div>
              <div className={fieldGroupClass}>
                <label className={labelClass} htmlFor="coll-deadline-after">Deadline After</label>
                <input
                  id="coll-deadline-after"
                  type="date"
                  className={inputClass}
                  value={form.deadline_after}
                  onChange={(e) => updateField("deadline_after", e.target.value)}
                />
              </div>
            </div>

            {/* Added Since */}
            <div className={fieldGroupClass}>
              <label className={labelClass} htmlFor="coll-added-since">Added Since</label>
              <input
                id="coll-added-since"
                type="date"
                className={inputClass}
                value={form.added_since}
                onChange={(e) => updateField("added_since", e.target.value)}
              />
            </div>
          </div>
        </details>

        {/* Live Preview */}
        <div className="mt-4 border-2 border-border rounded-base p-4 bg-secondary-background/50">
          <p className="text-sm font-heading mb-2">
            Matching: {preview?.count ?? "..."} scholarships
          </p>
          {preview && preview.preview.length > 0 ? (
            <ul className="space-y-1">
              {preview.preview.map((s) => (
                <li key={s._id} className="text-xs text-foreground/70 truncate">
                  {s.title} ({s.host_country})
                </li>
              ))}
              {preview.count > 5 && (
                <li className="text-xs text-foreground/50">
                  and {preview.count - 5} more...
                </li>
              )}
            </ul>
          ) : preview && preview.count === 0 ? (
            <p className="text-xs text-foreground/50">No scholarships match these criteria.</p>
          ) : null}
        </div>
      </div>

      {/* Sticky footer */}
      <div className="sticky bottom-0 bg-secondary-background border-t-2 border-border py-4 px-6 -mx-6 mt-6 flex justify-end gap-2">
        <Button variant="neutral" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button variant="default" onClick={handleSave} disabled={saving || !form.name || !form.emoji}>
          {saving ? "Saving..." : collection ? "Save Changes" : "Create Collection"}
        </Button>
      </div>
    </div>
  );
}
