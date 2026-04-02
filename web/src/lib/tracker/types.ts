import type { VersionedData } from "@/lib/storage/types";

export type TrackerStage =
  | "researching"
  | "preparing"
  | "submitted"
  | "interview"
  | "result";

export type ResultOutcome = "awarded" | "rejected" | "waitlisted";

export interface TrackerEntry {
  scholarshipSlug: string;
  scholarshipTitle: string;
  stage: TrackerStage;
  resultOutcome?: ResultOutcome;
  addedAt: number;
  updatedAt: number;
  notes?: string;
  documentChecks: Record<string, boolean>;
}

export interface ApplicationTracker extends VersionedData {
  entries: TrackerEntry[];
}

export const STAGE_CONFIG: Record<
  TrackerStage,
  { label: string; colorToken: string; icon: string }
> = {
  researching: { label: "Researching", colorToken: "accent-sky", icon: "Search" },
  preparing: { label: "Preparing", colorToken: "accent", icon: "FileEdit" },
  submitted: { label: "Submitted", colorToken: "main", icon: "Send" },
  interview: { label: "Interview", colorToken: "warning", icon: "Users" },
  result: { label: "Result", colorToken: "success", icon: "Trophy" },
};
