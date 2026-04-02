export const DOCUMENT_TYPES = [
  "transcripts",
  "recommendation_letters",
  "statement_of_purpose",
  "cv_resume",
  "language_test_scores",
  "financial_documents",
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  transcripts: "Transcripts",
  recommendation_letters: "Recommendation Letters",
  statement_of_purpose: "Statement of Purpose",
  cv_resume: "CV / Resume",
  language_test_scores: "Language Test Scores",
  financial_documents: "Financial Documents",
};
