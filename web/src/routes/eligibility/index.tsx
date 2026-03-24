import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useStudentProfile } from "@/hooks/useStudentProfile";
import { WizardShell } from "@/components/eligibility/WizardShell";
import { WelcomeBack } from "@/components/eligibility/WelcomeBack";
import { Navbar } from "@/components/layout/Navbar";
import { buildPageMeta } from "@/lib/seo/meta";
import { buildFaqJsonLd } from "@/lib/seo/json-ld";
import { profileToUrlParams } from "@/lib/eligibility/url-params";
import type { StudentProfile } from "@/lib/eligibility/types";

const eligibilityFaqItems = [
  {
    question: "How does ScholarHub's eligibility checker work?",
    answer:
      "Our eligibility wizard asks about your nationality, degree level, field of study, and preferences. We then match you with scholarships from our database of 2,400+ international opportunities, grouped by how well they match your profile.",
  },
  {
    question: "Is my data stored or shared?",
    answer:
      "No. Your profile data stays entirely in your browser using localStorage. Nothing is sent to our servers or shared with third parties.",
  },
  {
    question: "What do the match tiers mean?",
    answer:
      "Strong Match means 80%+ of the scholarship's criteria match your profile. Good Match is 50-79%, Partial Match is 20-49%, and Possible Match means the scholarship might be relevant but we couldn't verify all eligibility criteria.",
  },
  {
    question: "Can I share my results?",
    answer:
      "Yes! The results page URL contains your profile in compact form. Copy the URL to share your matches with others.",
  },
];

export const Route = createFileRoute("/eligibility/")({
  head: () => {
    const pageMeta = buildPageMeta({
      title: "Check Your Scholarship Eligibility | ScholarHub",
      description:
        "Answer a few questions and we'll find scholarships you're eligible for. Filter by nationality, degree, field of study, and more.",
      canonicalPath: "/eligibility",
    });

    const faqJsonLd = buildFaqJsonLd(eligibilityFaqItems);

    return {
      ...pageMeta,
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(faqJsonLd) },
      ],
    };
  },
  component: EligibilityWizardPage,
});

function EligibilityWizardPage() {
  const { profile, updateProfile, clearProfile, hasExistingProfile, hydrated } =
    useStudentProfile();
  const navigate = useNavigate();
  const [showWizard, setShowWizard] = useState(false);

  // Prevent SSR hydration mismatch (Pitfall 2 from RESEARCH.md)
  if (!hydrated) return null;

  // D-30: Show Welcome Back if returning visitor with existing profile
  if (hasExistingProfile && !showWizard) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <WelcomeBack
          profile={profile!}
          onViewResults={() => {
            const params = profileToUrlParams(profile as StudentProfile);
            navigate({ to: "/eligibility/results", search: params });
          }}
          onUpdateProfile={() => setShowWizard(true)}
        />
      </div>
    );
  }

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
