import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { EditorialEditor } from "./EditorialEditor";

interface EditFormProps {
  scholarshipId: Id<"scholarships">;
  onSaved: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}

const DEGREE_OPTIONS = ["bachelor", "master", "phd", "postdoc"] as const;
const FUNDING_TYPE_OPTIONS = [
  "fully_funded",
  "partial",
  "tuition_waiver",
  "stipend_only",
] as const;
const STATUS_OPTIONS = [
  "draft",
  "pending_review",
  "published",
  "rejected",
  "archived",
] as const;

interface FormValues {
  title: string;
  description: string;
  status: string;
  provider_organization: string;
  host_country: string;
  degree_levels: string[];
  fields_of_study: string;
  eligibility_nationalities: string;
  funding_type: string;
  funding_tuition: boolean;
  funding_living: boolean;
  funding_travel: boolean;
  funding_insurance: boolean;
  award_amount_min: string;
  award_amount_max: string;
  award_currency: string;
  application_deadline: string;
  application_deadline_text: string;
  application_url: string;
  editorial_notes: string;
}

function scholarshipToForm(scholarship: Record<string, unknown>): FormValues {
  return {
    title: (scholarship.title as string) || "",
    description: (scholarship.description as string) || "",
    status: (scholarship.status as string) || "pending_review",
    provider_organization:
      (scholarship.provider_organization as string) || "",
    host_country: (scholarship.host_country as string) || "",
    degree_levels: (scholarship.degree_levels as string[]) || [],
    fields_of_study: (
      (scholarship.fields_of_study as string[]) || []
    ).join(", "),
    eligibility_nationalities: (
      (scholarship.eligibility_nationalities as string[]) || []
    ).join(", "),
    funding_type: (scholarship.funding_type as string) || "partial",
    funding_tuition: (scholarship.funding_tuition as boolean) || false,
    funding_living: (scholarship.funding_living as boolean) || false,
    funding_travel: (scholarship.funding_travel as boolean) || false,
    funding_insurance: (scholarship.funding_insurance as boolean) || false,
    award_amount_min: scholarship.award_amount_min
      ? String(scholarship.award_amount_min)
      : "",
    award_amount_max: scholarship.award_amount_max
      ? String(scholarship.award_amount_max)
      : "",
    award_currency: (scholarship.award_currency as string) || "",
    application_deadline: scholarship.application_deadline
      ? new Date(scholarship.application_deadline as number)
          .toISOString()
          .split("T")[0]
      : "",
    application_deadline_text:
      (scholarship.application_deadline_text as string) || "",
    application_url: (scholarship.application_url as string) || "",
    editorial_notes: (scholarship.editorial_notes as string) || "",
  };
}

const inputClass =
  "h-10 px-3 border-2 border-border rounded-base bg-background text-sm w-full focus:outline-none focus:ring-2 focus:ring-ring";
const labelClass = "text-xs font-heading uppercase tracking-wide block mb-1";
const fieldGroupClass = "mb-4";

/**
 * EditForm: All-fields edit form for a scholarship inside the EditPanel.
 * Tracks dirty state and only sends changed fields on save.
 */
export function EditForm({
  scholarshipId,
  onSaved,
  onDirtyChange,
}: EditFormProps) {
  const scholarship = useQuery(api.admin.getScholarshipForEdit, {
    scholarshipId,
  });
  const updateScholarship = useMutation(api.admin.updateScholarship);

  const [formValues, setFormValues] = useState<FormValues | null>(null);
  const [initialValues, setInitialValues] = useState<FormValues | null>(null);
  const [saving, setSaving] = useState(false);

  // Initialize form when scholarship loads
  useEffect(() => {
    if (scholarship && !formValues) {
      const values = scholarshipToForm(
        scholarship as unknown as Record<string, unknown>
      );
      setFormValues(values);
      setInitialValues(values);
    }
  }, [scholarship, formValues]);

  // Compute dirty state
  const isDirty = useMemo(() => {
    if (!formValues || !initialValues) return false;
    return JSON.stringify(formValues) !== JSON.stringify(initialValues);
  }, [formValues, initialValues]);

  // Report dirty state to parent
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const updateField = useCallback(
    <K extends keyof FormValues>(field: K, value: FormValues[K]) => {
      setFormValues((prev) => (prev ? { ...prev, [field]: value } : prev));
    },
    []
  );

  const toggleDegree = useCallback(
    (degree: string) => {
      setFormValues((prev) => {
        if (!prev) return prev;
        const levels = prev.degree_levels.includes(degree)
          ? prev.degree_levels.filter((d) => d !== degree)
          : [...prev.degree_levels, degree];
        return { ...prev, degree_levels: levels };
      });
    },
    []
  );

  const handleSave = useCallback(async () => {
    if (!formValues || !initialValues || !isDirty) return;

    setSaving(true);
    try {
      // Build updates object with only changed fields
      const updates: Record<string, unknown> = {};

      if (formValues.title !== initialValues.title)
        updates.title = formValues.title;
      if (formValues.description !== initialValues.description)
        updates.description = formValues.description;
      if (formValues.status !== initialValues.status)
        updates.status = formValues.status;
      if (
        formValues.provider_organization !==
        initialValues.provider_organization
      )
        updates.provider_organization = formValues.provider_organization;
      if (formValues.host_country !== initialValues.host_country)
        updates.host_country = formValues.host_country;
      if (
        JSON.stringify(formValues.degree_levels) !==
        JSON.stringify(initialValues.degree_levels)
      )
        updates.degree_levels = formValues.degree_levels;
      if (
        formValues.fields_of_study !== initialValues.fields_of_study
      )
        updates.fields_of_study = formValues.fields_of_study
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      if (
        formValues.eligibility_nationalities !==
        initialValues.eligibility_nationalities
      )
        updates.eligibility_nationalities =
          formValues.eligibility_nationalities
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
      if (formValues.funding_type !== initialValues.funding_type)
        updates.funding_type = formValues.funding_type;
      if (formValues.funding_tuition !== initialValues.funding_tuition)
        updates.funding_tuition = formValues.funding_tuition;
      if (formValues.funding_living !== initialValues.funding_living)
        updates.funding_living = formValues.funding_living;
      if (formValues.funding_travel !== initialValues.funding_travel)
        updates.funding_travel = formValues.funding_travel;
      if (formValues.funding_insurance !== initialValues.funding_insurance)
        updates.funding_insurance = formValues.funding_insurance;
      if (formValues.award_amount_min !== initialValues.award_amount_min)
        updates.award_amount_min = formValues.award_amount_min
          ? Number(formValues.award_amount_min)
          : undefined;
      if (formValues.award_amount_max !== initialValues.award_amount_max)
        updates.award_amount_max = formValues.award_amount_max
          ? Number(formValues.award_amount_max)
          : undefined;
      if (formValues.award_currency !== initialValues.award_currency)
        updates.award_currency = formValues.award_currency;
      if (
        formValues.application_deadline !==
        initialValues.application_deadline
      )
        updates.application_deadline = formValues.application_deadline
          ? new Date(formValues.application_deadline).getTime()
          : undefined;
      if (
        formValues.application_deadline_text !==
        initialValues.application_deadline_text
      )
        updates.application_deadline_text =
          formValues.application_deadline_text;
      if (formValues.application_url !== initialValues.application_url)
        updates.application_url = formValues.application_url;
      if (formValues.editorial_notes !== initialValues.editorial_notes)
        updates.editorial_notes = formValues.editorial_notes;

      if (Object.keys(updates).length > 0) {
        await updateScholarship({
          scholarshipId,
          updates: updates as any,
        });
      }

      onSaved();
    } catch (error) {
      console.error("Failed to save scholarship:", error);
    } finally {
      setSaving(false);
    }
  }, [
    formValues,
    initialValues,
    isDirty,
    scholarshipId,
    updateScholarship,
    onSaved,
  ]);

  const handleClose = useCallback(() => {
    if (isDirty) {
      const discard = window.confirm(
        "You have unsaved changes. Discard and close?"
      );
      if (!discard) return;
    }
    onSaved();
  }, [isDirty, onSaved]);

  if (!scholarship || !formValues) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-foreground/60">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-0">
        {/* Title */}
        <div className={fieldGroupClass}>
          <label className={labelClass} htmlFor="edit-title">
            Title
          </label>
          <input
            id="edit-title"
            type="text"
            className={inputClass}
            value={formValues.title}
            onChange={(e) => updateField("title", e.target.value)}
          />
        </div>

        {/* Description */}
        <div className={fieldGroupClass}>
          <label className={labelClass} htmlFor="edit-description">
            Description
          </label>
          <textarea
            id="edit-description"
            className="min-h-[120px] resize-y border-2 border-border rounded-base bg-background text-sm p-3 w-full focus:outline-none focus:ring-2 focus:ring-ring"
            value={formValues.description}
            onChange={(e) => updateField("description", e.target.value)}
          />
        </div>

        {/* Status */}
        <div className={fieldGroupClass}>
          <label className={labelClass} htmlFor="edit-status">
            Status
          </label>
          <select
            id="edit-status"
            className={inputClass}
            value={formValues.status}
            onChange={(e) => updateField("status", e.target.value)}
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>

        {/* Provider Organization */}
        <div className={fieldGroupClass}>
          <label className={labelClass} htmlFor="edit-provider">
            Provider Organization
          </label>
          <input
            id="edit-provider"
            type="text"
            className={inputClass}
            value={formValues.provider_organization}
            onChange={(e) =>
              updateField("provider_organization", e.target.value)
            }
          />
        </div>

        {/* Host Country */}
        <div className={fieldGroupClass}>
          <label className={labelClass} htmlFor="edit-country">
            Host Country
          </label>
          <input
            id="edit-country"
            type="text"
            className={inputClass}
            value={formValues.host_country}
            onChange={(e) => updateField("host_country", e.target.value)}
          />
        </div>

        {/* Degree Levels */}
        <div className={fieldGroupClass}>
          <span className={labelClass}>Degree Levels</span>
          <div className="flex flex-wrap gap-3 mt-1">
            {DEGREE_OPTIONS.map((degree) => (
              <label
                key={degree}
                className="flex items-center gap-2 text-sm cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={formValues.degree_levels.includes(degree)}
                  onChange={() => toggleDegree(degree)}
                  className="size-4 accent-main"
                />
                {degree}
              </label>
            ))}
          </div>
        </div>

        {/* Fields of Study */}
        <div className={fieldGroupClass}>
          <label className={labelClass} htmlFor="edit-fields">
            Fields of Study
          </label>
          <textarea
            id="edit-fields"
            className="min-h-[60px] resize-y border-2 border-border rounded-base bg-background text-sm p-3 w-full focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Comma-separated, e.g. Engineering, Medicine, Law"
            value={formValues.fields_of_study}
            onChange={(e) =>
              updateField("fields_of_study", e.target.value)
            }
          />
        </div>

        {/* Eligibility Nationalities */}
        <div className={fieldGroupClass}>
          <label className={labelClass} htmlFor="edit-eligibility">
            Eligibility Nationalities
          </label>
          <textarea
            id="edit-eligibility"
            className="min-h-[60px] resize-y border-2 border-border rounded-base bg-background text-sm p-3 w-full focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Comma-separated, e.g. All nationalities, EU only"
            value={formValues.eligibility_nationalities}
            onChange={(e) =>
              updateField("eligibility_nationalities", e.target.value)
            }
          />
        </div>

        {/* Funding Type */}
        <div className={fieldGroupClass}>
          <label className={labelClass} htmlFor="edit-funding-type">
            Funding Type
          </label>
          <select
            id="edit-funding-type"
            className={inputClass}
            value={formValues.funding_type}
            onChange={(e) => updateField("funding_type", e.target.value)}
          >
            {FUNDING_TYPE_OPTIONS.map((type) => (
              <option key={type} value={type}>
                {type.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>

        {/* Funding Coverage */}
        <div className={fieldGroupClass}>
          <span className={labelClass}>Funding Coverage</span>
          <div className="flex flex-wrap gap-3 mt-1">
            {(
              [
                ["funding_tuition", "Tuition"],
                ["funding_living", "Living Allowance"],
                ["funding_travel", "Travel"],
                ["funding_insurance", "Insurance"],
              ] as const
            ).map(([field, label]) => (
              <label
                key={field}
                className="flex items-center gap-2 text-sm cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={formValues[field]}
                  onChange={(e) => updateField(field, e.target.checked)}
                  className="size-4 accent-main"
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        {/* Award Amount Min/Max */}
        <div className={fieldGroupClass}>
          <span className={labelClass}>Award Amount</span>
          <div className="flex gap-3 mt-1">
            <div className="flex-1">
              <input
                type="number"
                className={inputClass}
                placeholder="Min"
                value={formValues.award_amount_min}
                onChange={(e) =>
                  updateField("award_amount_min", e.target.value)
                }
              />
            </div>
            <div className="flex-1">
              <input
                type="number"
                className={inputClass}
                placeholder="Max"
                value={formValues.award_amount_max}
                onChange={(e) =>
                  updateField("award_amount_max", e.target.value)
                }
              />
            </div>
          </div>
        </div>

        {/* Award Currency */}
        <div className={fieldGroupClass}>
          <label className={labelClass} htmlFor="edit-currency">
            Award Currency
          </label>
          <input
            id="edit-currency"
            type="text"
            className={inputClass}
            placeholder="e.g. USD, EUR, GBP"
            value={formValues.award_currency}
            onChange={(e) =>
              updateField("award_currency", e.target.value)
            }
          />
        </div>

        {/* Application Deadline */}
        <div className={fieldGroupClass}>
          <label className={labelClass} htmlFor="edit-deadline">
            Application Deadline
          </label>
          <input
            id="edit-deadline"
            type="date"
            className={inputClass}
            value={formValues.application_deadline}
            onChange={(e) =>
              updateField("application_deadline", e.target.value)
            }
          />
        </div>

        {/* Application Deadline Text */}
        <div className={fieldGroupClass}>
          <label className={labelClass} htmlFor="edit-deadline-text">
            Deadline Text
          </label>
          <input
            id="edit-deadline-text"
            type="text"
            className={inputClass}
            placeholder="e.g. Rolling admissions, March 31 2026"
            value={formValues.application_deadline_text}
            onChange={(e) =>
              updateField("application_deadline_text", e.target.value)
            }
          />
        </div>

        {/* Application URL */}
        <div className={fieldGroupClass}>
          <label className={labelClass} htmlFor="edit-url">
            Application URL
          </label>
          <input
            id="edit-url"
            type="url"
            className={inputClass}
            placeholder="https://..."
            value={formValues.application_url}
            onChange={(e) =>
              updateField("application_url", e.target.value)
            }
          />
        </div>

        {/* Editorial Notes (TipTap) */}
        <div className={fieldGroupClass}>
          <span className={labelClass}>Editorial Notes</span>
          <EditorialEditor
            content={formValues.editorial_notes}
            onChange={(html) => updateField("editorial_notes", html)}
          />
        </div>
      </div>

      {/* Sticky footer */}
      <div className="sticky bottom-0 bg-secondary-background border-t-2 border-border py-4 px-6 -mx-6 mt-6 flex justify-end gap-2">
        <Button
          variant="neutral"
          onClick={handleClose}
          disabled={saving}
        >
          Close Panel
        </Button>
        <Button
          variant="default"
          onClick={handleSave}
          disabled={saving || !isDirty}
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
