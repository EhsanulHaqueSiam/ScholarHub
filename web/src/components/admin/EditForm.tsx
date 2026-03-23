import { useMutation, useQuery } from "convex/react";
import { Check, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ALL_TAGS, getTagLabel } from "@/lib/tags";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { EditorialEditor } from "./EditorialEditor";

interface EditFormProps {
  scholarshipId: Id<"scholarships">;
  onSaved: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}

const DEGREE_OPTIONS = ["bachelor", "master", "phd", "postdoc"] as const;
const FUNDING_TYPE_OPTIONS = ["fully_funded", "partial", "tuition_waiver", "stipend_only"] as const;
const STATUS_OPTIONS = ["draft", "pending_review", "published", "rejected", "archived"] as const;

interface StudyInfo {
  tuition_undergrad: string;
  tuition_postgrad: string;
  tuition_phd: string;
  tuition_mba: string;
  living_cost_note: string;
  cost_accommodation: string;
  cost_food: string;
  cost_transport: string;
  cost_utilities: string;
  admission_requirements: string;
  lang_ielts: string;
  lang_toefl: string;
  lang_pte: string;
  visa_documents: string;
  intake_main_name: string;
  intake_main_months: string;
  intake_secondary_name: string;
  intake_secondary_months: string;
  post_study_visa: string;
  post_study_duration: string;
  post_study_description: string;
}

const EMPTY_STUDY_INFO: StudyInfo = {
  tuition_undergrad: "",
  tuition_postgrad: "",
  tuition_phd: "",
  tuition_mba: "",
  living_cost_note: "",
  cost_accommodation: "",
  cost_food: "",
  cost_transport: "",
  cost_utilities: "",
  admission_requirements: "",
  lang_ielts: "",
  lang_toefl: "",
  lang_pte: "",
  visa_documents: "",
  intake_main_name: "",
  intake_main_months: "",
  intake_secondary_name: "",
  intake_secondary_months: "",
  post_study_visa: "",
  post_study_duration: "",
  post_study_description: "",
};

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
  study_info: StudyInfo;
}

function scholarshipToForm(scholarship: Record<string, unknown>): FormValues {
  return {
    title: (scholarship.title as string) || "",
    description: (scholarship.description as string) || "",
    status: (scholarship.status as string) || "pending_review",
    provider_organization: (scholarship.provider_organization as string) || "",
    host_country: (scholarship.host_country as string) || "",
    degree_levels: (scholarship.degree_levels as string[]) || [],
    fields_of_study: ((scholarship.fields_of_study as string[]) || []).join(", "),
    eligibility_nationalities: ((scholarship.eligibility_nationalities as string[]) || []).join(
      ", ",
    ),
    funding_type: (scholarship.funding_type as string) || "partial",
    funding_tuition: (scholarship.funding_tuition as boolean) || false,
    funding_living: (scholarship.funding_living as boolean) || false,
    funding_travel: (scholarship.funding_travel as boolean) || false,
    funding_insurance: (scholarship.funding_insurance as boolean) || false,
    award_amount_min: scholarship.award_amount_min ? String(scholarship.award_amount_min) : "",
    award_amount_max: scholarship.award_amount_max ? String(scholarship.award_amount_max) : "",
    award_currency: (scholarship.award_currency as string) || "",
    application_deadline: scholarship.application_deadline
      ? new Date(scholarship.application_deadline as number).toISOString().split("T")[0]
      : "",
    application_deadline_text: (scholarship.application_deadline_text as string) || "",
    application_url: (scholarship.application_url as string) || "",
    editorial_notes: (scholarship.editorial_notes as string) || "",
    study_info: {
      ...EMPTY_STUDY_INFO,
      ...((scholarship.study_info as Partial<StudyInfo>) || {}),
    },
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
export function EditForm({ scholarshipId, onSaved, onDirtyChange }: EditFormProps) {
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
      const values = scholarshipToForm(scholarship as unknown as Record<string, unknown>);
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

  const updateField = useCallback(<K extends keyof FormValues>(field: K, value: FormValues[K]) => {
    setFormValues((prev) => (prev ? { ...prev, [field]: value } : prev));
  }, []);

  const toggleDegree = useCallback((degree: string) => {
    setFormValues((prev) => {
      if (!prev) return prev;
      const levels = prev.degree_levels.includes(degree)
        ? prev.degree_levels.filter((d) => d !== degree)
        : [...prev.degree_levels, degree];
      return { ...prev, degree_levels: levels };
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!formValues || !initialValues || !isDirty) return;

    setSaving(true);
    try {
      // Build updates object with only changed fields
      const updates: Record<string, unknown> = {};

      if (formValues.title !== initialValues.title) updates.title = formValues.title;
      if (formValues.description !== initialValues.description)
        updates.description = formValues.description;
      if (formValues.status !== initialValues.status) updates.status = formValues.status;
      if (formValues.provider_organization !== initialValues.provider_organization)
        updates.provider_organization = formValues.provider_organization;
      if (formValues.host_country !== initialValues.host_country)
        updates.host_country = formValues.host_country;
      if (JSON.stringify(formValues.degree_levels) !== JSON.stringify(initialValues.degree_levels))
        updates.degree_levels = formValues.degree_levels;
      if (formValues.fields_of_study !== initialValues.fields_of_study)
        updates.fields_of_study = formValues.fields_of_study
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      if (formValues.eligibility_nationalities !== initialValues.eligibility_nationalities)
        updates.eligibility_nationalities = formValues.eligibility_nationalities
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
      if (formValues.application_deadline !== initialValues.application_deadline)
        updates.application_deadline = formValues.application_deadline
          ? new Date(formValues.application_deadline).getTime()
          : undefined;
      if (formValues.application_deadline_text !== initialValues.application_deadline_text)
        updates.application_deadline_text = formValues.application_deadline_text;
      if (formValues.application_url !== initialValues.application_url)
        updates.application_url = formValues.application_url;
      if (formValues.editorial_notes !== initialValues.editorial_notes)
        updates.editorial_notes = formValues.editorial_notes;
      if (JSON.stringify(formValues.study_info) !== JSON.stringify(initialValues.study_info)) {
        // Only send non-empty fields
        const info: Record<string, string> = {};
        for (const [k, val] of Object.entries(formValues.study_info)) {
          if (val) info[k] = val;
        }
        updates.study_info = Object.keys(info).length > 0 ? info : undefined;
      }

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
  }, [formValues, initialValues, isDirty, scholarshipId, updateScholarship, onSaved]);

  const handleClose = useCallback(() => {
    if (isDirty) {
      const discard = window.confirm("You have unsaved changes. Discard and close?");
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
            onChange={(e) => updateField("provider_organization", e.target.value)}
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
              <label key={degree} className="flex items-center gap-2 text-sm cursor-pointer">
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
            onChange={(e) => updateField("fields_of_study", e.target.value)}
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
            onChange={(e) => updateField("eligibility_nationalities", e.target.value)}
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
              <label key={field} className="flex items-center gap-2 text-sm cursor-pointer">
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
                onChange={(e) => updateField("award_amount_min", e.target.value)}
              />
            </div>
            <div className="flex-1">
              <input
                type="number"
                className={inputClass}
                placeholder="Max"
                value={formValues.award_amount_max}
                onChange={(e) => updateField("award_amount_max", e.target.value)}
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
            onChange={(e) => updateField("award_currency", e.target.value)}
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
            onChange={(e) => updateField("application_deadline", e.target.value)}
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
            onChange={(e) => updateField("application_deadline_text", e.target.value)}
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
            onChange={(e) => updateField("application_url", e.target.value)}
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

        {/* ---- Study Info (per-scholarship) ---- */}
        <details className="border-2 border-border rounded-base p-4 mt-2">
          <summary className="font-heading text-sm cursor-pointer select-none">
            Study Info (per-scholarship)
          </summary>
          <div className="mt-4 space-y-0">
            {/* Tuition Fees */}
            <p className="text-xs font-heading uppercase tracking-wide mb-2 mt-2">Tuition Fees</p>
            {(
              [
                ["tuition_undergrad", "Undergraduate", "e.g. €10,000 – €25,000/year"],
                ["tuition_postgrad", "Postgraduate", "e.g. €10,000 – €35,000/year"],
                ["tuition_phd", "PhD", "e.g. €5,000 – €15,000/year"],
                ["tuition_mba", "MBA", "e.g. €15,000 – €40,000/year"],
              ] as const
            ).map(([key, label, placeholder]) => (
              <div key={key} className={fieldGroupClass}>
                <label className={labelClass}>{label}</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder={placeholder}
                  value={formValues.study_info[key]}
                  onChange={(e) =>
                    updateField("study_info", { ...formValues.study_info, [key]: e.target.value })
                  }
                />
              </div>
            ))}

            {/* Living Costs */}
            <p className="text-xs font-heading uppercase tracking-wide mb-2 mt-4">Living Costs</p>
            <div className={fieldGroupClass}>
              <label className={labelClass}>Description</label>
              <textarea
                className="min-h-[60px] resize-y border-2 border-border rounded-base bg-background text-sm p-3 w-full focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="e.g. Dublin is more expensive, but cities like Cork provide affordable alternatives."
                value={formValues.study_info.living_cost_note}
                onChange={(e) =>
                  updateField("study_info", {
                    ...formValues.study_info,
                    living_cost_note: e.target.value,
                  })
                }
              />
            </div>
            {(
              [
                ["cost_accommodation", "Accommodation", "e.g. €400 – €900/month"],
                ["cost_food", "Food & Groceries", "e.g. €200 – €350/month"],
                ["cost_transport", "Transport", "e.g. €50 – €120/month"],
                ["cost_utilities", "Utilities & Internet", "e.g. €100 – €150/month"],
              ] as const
            ).map(([key, label, placeholder]) => (
              <div key={key} className={fieldGroupClass}>
                <label className={labelClass}>{label}</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder={placeholder}
                  value={formValues.study_info[key]}
                  onChange={(e) =>
                    updateField("study_info", { ...formValues.study_info, [key]: e.target.value })
                  }
                />
              </div>
            ))}

            {/* Admission & Visa */}
            <p className="text-xs font-heading uppercase tracking-wide mb-2 mt-4">
              Admission & Visa
            </p>
            <div className={fieldGroupClass}>
              <label className={labelClass}>Admission Requirements</label>
              <textarea
                className="min-h-[80px] resize-y border-2 border-border rounded-base bg-background text-sm p-3 w-full focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="One per line, e.g.&#10;Strong academic results&#10;English proficiency (IELTS/TOEFL)&#10;Statement of purpose"
                value={formValues.study_info.admission_requirements}
                onChange={(e) =>
                  updateField("study_info", {
                    ...formValues.study_info,
                    admission_requirements: e.target.value,
                  })
                }
              />
            </div>
            {(
              [
                ["lang_ielts", "IELTS", "e.g. 6.0 – 6.5 overall"],
                ["lang_toefl", "TOEFL", "e.g. 80 – 90 iBT"],
                ["lang_pte", "PTE", "e.g. 56 – 63"],
              ] as const
            ).map(([key, label, placeholder]) => (
              <div key={key} className={fieldGroupClass}>
                <label className={labelClass}>{label}</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder={placeholder}
                  value={formValues.study_info[key]}
                  onChange={(e) =>
                    updateField("study_info", { ...formValues.study_info, [key]: e.target.value })
                  }
                />
              </div>
            ))}
            <div className={fieldGroupClass}>
              <label className={labelClass}>Visa Documents</label>
              <textarea
                className="min-h-[80px] resize-y border-2 border-border rounded-base bg-background text-sm p-3 w-full focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="One per line, e.g.&#10;Letter of acceptance&#10;Proof of tuition payment&#10;Evidence of funds (€10,000+)&#10;Valid passport"
                value={formValues.study_info.visa_documents}
                onChange={(e) =>
                  updateField("study_info", {
                    ...formValues.study_info,
                    visa_documents: e.target.value,
                  })
                }
              />
            </div>

            {/* Intake Periods */}
            <p className="text-xs font-heading uppercase tracking-wide mb-2 mt-4">Intake Periods</p>
            <div className="grid grid-cols-2 gap-3">
              <div className={fieldGroupClass}>
                <label className={labelClass}>Main Intake Name</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="e.g. Autumn"
                  value={formValues.study_info.intake_main_name}
                  onChange={(e) =>
                    updateField("study_info", {
                      ...formValues.study_info,
                      intake_main_name: e.target.value,
                    })
                  }
                />
              </div>
              <div className={fieldGroupClass}>
                <label className={labelClass}>Main Intake Months</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="e.g. September – October"
                  value={formValues.study_info.intake_main_months}
                  onChange={(e) =>
                    updateField("study_info", {
                      ...formValues.study_info,
                      intake_main_months: e.target.value,
                    })
                  }
                />
              </div>
              <div className={fieldGroupClass}>
                <label className={labelClass}>Secondary Intake Name</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="e.g. Spring"
                  value={formValues.study_info.intake_secondary_name}
                  onChange={(e) =>
                    updateField("study_info", {
                      ...formValues.study_info,
                      intake_secondary_name: e.target.value,
                    })
                  }
                />
              </div>
              <div className={fieldGroupClass}>
                <label className={labelClass}>Secondary Intake Months</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="e.g. January – February"
                  value={formValues.study_info.intake_secondary_months}
                  onChange={(e) =>
                    updateField("study_info", {
                      ...formValues.study_info,
                      intake_secondary_months: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            {/* Post-Study Work */}
            <p className="text-xs font-heading uppercase tracking-wide mb-2 mt-4">
              Post-Study Work
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className={fieldGroupClass}>
                <label className={labelClass}>Visa Name</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="e.g. Graduate Route"
                  value={formValues.study_info.post_study_visa}
                  onChange={(e) =>
                    updateField("study_info", {
                      ...formValues.study_info,
                      post_study_visa: e.target.value,
                    })
                  }
                />
              </div>
              <div className={fieldGroupClass}>
                <label className={labelClass}>Duration</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="e.g. 2 years"
                  value={formValues.study_info.post_study_duration}
                  onChange={(e) =>
                    updateField("study_info", {
                      ...formValues.study_info,
                      post_study_duration: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className={fieldGroupClass}>
              <label className={labelClass}>Description</label>
              <textarea
                className="min-h-[60px] resize-y border-2 border-border rounded-base bg-background text-sm p-3 w-full focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="e.g. Graduates can work in any field for 2 years after completing their degree."
                value={formValues.study_info.post_study_description}
                onChange={(e) =>
                  updateField("study_info", {
                    ...formValues.study_info,
                    post_study_description: e.target.value,
                  })
                }
              />
            </div>
          </div>
        </details>

        {/* Tags (D-34) -- immediate mutations, not part of form dirty state */}
        <TagsSection scholarshipId={scholarshipId} />
      </div>

      {/* Sticky footer — flush to bottom with no gap */}
      <div className="sticky bottom-0 z-10 bg-secondary-background border-t-2 border-border py-4 px-6 -mx-6 mt-6 flex justify-end gap-3">
        <Button variant="neutral" onClick={handleClose} disabled={saving}>
          Close Panel
        </Button>
        <Button variant="default" onClick={handleSave} disabled={saving || !isDirty}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

/**
 * TagsSection: Per-scholarship tag management with autocomplete and suggested tag review.
 * Operates via immediate mutations -- not part of the form's dirty state. D-34
 */
function TagsSection({ scholarshipId }: { scholarshipId: Id<"scholarships"> }) {
  const tagData = useQuery(api.tags.getScholarshipTags, { scholarshipId });
  const addTagMut = useMutation(api.tags.addTagToScholarship);
  const removeTagMut = useMutation(api.tags.removeTag);
  const acceptTagMut = useMutation(api.tags.acceptSuggestedTag);
  const rejectTagMut = useMutation(api.tags.rejectSuggestedTag);

  const [tagInput, setTagInput] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const currentTags = tagData?.tags ?? [];
  const suggestedTags = tagData?.suggested_tags ?? [];

  const filteredTags = useMemo(() => {
    if (!tagInput) return ALL_TAGS.filter((t) => !currentTags.includes(t.id));
    const q = tagInput.toLowerCase();
    return ALL_TAGS.filter(
      (t) => !currentTags.includes(t.id) && (t.label.toLowerCase().includes(q) || t.id.includes(q)),
    );
  }, [tagInput, currentTags]);

  async function handleAddTag(tagId: string) {
    await addTagMut({ scholarshipId, tag: tagId });
    setTagInput("");
    setShowDropdown(false);
  }

  async function handleAddFreeformTag() {
    if (!tagInput.trim()) return;
    const tagId = tagInput
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
    if (tagId) {
      await addTagMut({ scholarshipId, tag: tagId });
      setTagInput("");
      setShowDropdown(false);
    }
  }

  return (
    <div className="mt-4 border-t-2 border-border pt-4">
      <span className="text-sm font-heading block mb-2">Tags</span>

      {/* Current tags */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {currentTags.map((tag) => (
          <Badge key={tag} variant="tag" className="gap-1">
            {getTagLabel(tag)}
            <button
              type="button"
              onClick={() => removeTagMut({ scholarshipId, tag })}
              className="text-foreground/50 hover:text-foreground ml-0.5"
              aria-label={`Remove tag ${getTagLabel(tag)}`}
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
        {currentTags.length === 0 && (
          <span className="text-xs text-foreground/40">No tags assigned</span>
        )}
      </div>

      {/* Suggested tags */}
      {suggestedTags.length > 0 && (
        <div className="mb-3">
          <span className="text-xs text-foreground/60 block mb-1">Suggested</span>
          <div className="flex flex-wrap gap-1.5">
            {suggestedTags.map((suggested) => (
              <span key={suggested.tag} className="inline-flex items-center gap-0.5">
                <Badge variant="tagSuggested" className="text-[11px]">
                  {getTagLabel(suggested.tag)}
                </Badge>
                <button
                  type="button"
                  onClick={() => acceptTagMut({ scholarshipId, tag: suggested.tag })}
                  className="p-0.5 rounded-sm hover:bg-urgency-open/20 text-urgency-open transition-colors"
                  aria-label={`Accept tag ${getTagLabel(suggested.tag)}`}
                >
                  <Check className="size-3" />
                </button>
                <button
                  type="button"
                  onClick={() => rejectTagMut({ scholarshipId, tag: suggested.tag })}
                  className="p-0.5 rounded-sm hover:bg-destructive/20 text-destructive transition-colors"
                  aria-label={`Reject tag ${getTagLabel(suggested.tag)}`}
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tag input with autocomplete */}
      <div className="relative">
        <input
          type="text"
          className="h-8 px-2 border-2 border-border rounded-base bg-background text-xs w-full focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Add tag (type to search, Enter for custom)"
          value={tagInput}
          onChange={(e) => {
            setTagInput(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => {
            // Delay to allow click on dropdown
            setTimeout(() => setShowDropdown(false), 200);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (filteredTags.length > 0) {
                handleAddTag(filteredTags[0].id);
              } else {
                handleAddFreeformTag();
              }
            }
            if (e.key === "Escape") {
              setShowDropdown(false);
            }
          }}
        />
        {showDropdown && tagInput && filteredTags.length > 0 && (
          <div className="absolute z-10 top-full left-0 right-0 mt-1 max-h-36 overflow-y-auto border-2 border-border rounded-base bg-background shadow-shadow">
            {filteredTags.slice(0, 10).map((tag) => (
              <button
                key={tag.id}
                type="button"
                className="w-full text-left px-2 py-1.5 text-xs hover:bg-secondary-background transition-colors"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleAddTag(tag.id)}
              >
                {tag.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
