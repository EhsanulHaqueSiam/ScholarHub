import { createFileRoute } from "@tanstack/react-router";
import { useStudentProfile } from "@/hooks/useStudentProfile";
import { WizardShell } from "@/components/eligibility/WizardShell";
import { Navbar } from "@/components/layout/Navbar";
import { buildPageMeta } from "@/lib/seo/meta";

export const Route = createFileRoute("/eligibility/")({
  head: () =>
    buildPageMeta({
      title: "Check Your Scholarship Eligibility | ScholarHub",
      description:
        "Answer a few questions and we'll find scholarships you're eligible for. Filter by nationality, degree, field of study, and more.",
      canonicalPath: "/eligibility",
    }),
  component: EligibilityWizardPage,
});

function EligibilityWizardPage() {
  const { profile, updateProfile, clearProfile, hasExistingProfile, hydrated } =
    useStudentProfile();

  // Prevent SSR hydration mismatch (Pitfall 2 from RESEARCH.md)
  if (!hydrated) return null;

  return (
    <div className="min-h-screen">
      <Navbar />
      <WizardShell
        profile={profile ?? {}}
        onProfileChange={updateProfile}
      />
    </div>
  );
}
