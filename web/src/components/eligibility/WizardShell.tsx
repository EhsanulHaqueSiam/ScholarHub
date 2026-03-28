import { Check, Lock } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { StudentProfile } from "@/lib/eligibility/types";
import { profileToUrlParams } from "@/lib/eligibility/url-params";
import { analytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { LiveMatchCount } from "./LiveMatchCount";
import { StepAboutYou } from "./StepAboutYou";
import { StepAcademics } from "./StepAcademics";
import { StepPreferences } from "./StepPreferences";

const STEPS = [
  { label: "About You", shortLabel: "About" },
  { label: "Academics", shortLabel: "Academics" },
  { label: "Preferences", shortLabel: "Prefs" },
] as const;

const STEP_NAMES = ["about_you", "academics", "preferences"] as const;

type Direction = "forward" | "backward";

interface WizardShellProps {
  profile: Partial<StudentProfile>;
  onProfileChange: (updates: Partial<StudentProfile>) => void;
}

/** Count non-undefined, non-empty profile fields for analytics */
function countFilledFields(profile: Partial<StudentProfile>): number {
  let count = 0;
  if (profile.nationalities && profile.nationalities.length > 0) count++;
  if (profile.age !== undefined) count++;
  if (profile.gender) count++;
  if (profile.degreeLevel) count++;
  if (profile.fieldsOfStudy && profile.fieldsOfStudy.length > 0) count++;
  if (profile.gpa) count++;
  if (profile.languageScores) count++;
  if (profile.destinationCountries && profile.destinationCountries.length > 0) count++;
  if (profile.fundingPreference) count++;
  return count;
}

export function WizardShell({ profile, onProfileChange }: WizardShellProps) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<Direction>("forward");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const stepContentRef = useRef<HTMLDivElement>(null);

  // Track which steps have been visited / completed
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(
    new Set(),
  );

  // Fire wizard_started on mount (D-38)
  const hasTrackedStart = useRef(false);
  useEffect(() => {
    if (!hasTrackedStart.current) {
      analytics.track("wizard_started");
      hasTrackedStart.current = true;
    }
  }, []);

  const handleChange = useCallback(
    (updates: Partial<StudentProfile>) => {
      onProfileChange(updates);
    },
    [onProfileChange],
  );

  // Validate step 1: nationality required
  const isStep1Valid = useMemo(
    () => (profile.nationalities?.length ?? 0) > 0,
    [profile.nationalities],
  );

  // Validate step 2: degree level and field of study required
  const isStep2Valid = useMemo(
    () =>
      !!profile.degreeLevel &&
      (profile.fieldsOfStudy?.length ?? 0) > 0,
    [profile.degreeLevel, profile.fieldsOfStudy],
  );

  const canAdvance = useMemo(() => {
    if (currentStep === 0) return isStep1Valid;
    if (currentStep === 1) return isStep2Valid;
    // Step 3 always allows submission (preferences are optional)
    return true;
  }, [currentStep, isStep1Valid, isStep2Valid]);

  const navigateToStep = useCallback(
    (targetStep: number) => {
      if (targetStep === currentStep || isTransitioning) return;
      const dir: Direction = targetStep > currentStep ? "forward" : "backward";
      setDirection(dir);
      setIsTransitioning(true);

      // Mark current step as completed when advancing forward
      if (dir === "forward") {
        setCompletedSteps((prev) => new Set([...prev, currentStep]));
      }

      // Use requestAnimationFrame to trigger CSS transition
      requestAnimationFrame(() => {
        setCurrentStep(targetStep);
        // Allow transition to complete
        setTimeout(() => {
          setIsTransitioning(false);
          // Focus first input in new step
          if (stepContentRef.current) {
            const firstInput = stepContentRef.current.querySelector<HTMLElement>(
              "input, select, button[role='combobox'], [tabindex='0']",
            );
            firstInput?.focus();
          }
        }, 300);
      });
    },
    [currentStep, isTransitioning],
  );

  const handleNext = useCallback(() => {
    if (currentStep < 2 && canAdvance) {
      // Track step completion (D-38)
      analytics.track("step_completed", {
        step: STEP_NAMES[currentStep],
        fieldsFilledCount: countFilledFields(profile),
      });
      navigateToStep(currentStep + 1);
    } else if (currentStep === 2) {
      // Final step: track completion and navigate to results
      setCompletedSteps((prev) => new Set([...prev, currentStep]));

      // Track wizard completion (D-38)
      analytics.track("wizard_completed", {
        nationalities: profile.nationalities?.length ?? 0,
        degreeLevel: profile.degreeLevel ?? "unknown",
        fieldsOfStudy: profile.fieldsOfStudy?.length ?? 0,
        fieldsFilledCount: countFilledFields(profile),
      });

      // Navigate to results with compact URL params
      const fullProfile: StudentProfile = {
        nationalities: profile.nationalities ?? [],
        degreeLevel: profile.degreeLevel ?? "bachelor",
        fieldsOfStudy: profile.fieldsOfStudy ?? [],
        createdAt: profile.createdAt ?? Date.now(),
        updatedAt: Date.now(),
        ...profile,
      } as StudentProfile;

      const params = profileToUrlParams(fullProfile);
      navigate({ to: "/eligibility/results", search: params });
    }
  }, [currentStep, canAdvance, navigateToStep, profile, navigate]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      navigateToStep(currentStep - 1);
    }
  }, [currentStep, navigateToStep]);

  const handleStepBarClick = useCallback(
    (stepIndex: number) => {
      // Only allow clicking completed steps
      if (completedSteps.has(stepIndex)) {
        navigateToStep(stepIndex);
      }
    },
    [completedSteps, navigateToStep],
  );

  const nextButtonText = useMemo(() => {
    if (currentStep === 0) return "Next: Academics";
    if (currentStep === 1) return "Next: Preferences";
    return "Find My Scholarships";
  }, [currentStep]);

  // Determine slide classes for transition
  const getSlideClass = () => {
    if (!isTransitioning) return "translate-x-0";
    if (direction === "forward") return "motion-safe:animate-slide-left";
    return "motion-safe:animate-slide-right";
  };

  return (
    <div className="pt-20 pb-24 md:pb-8 px-4">
      {/* Page Title */}
      <h1 className="text-heading font-heading leading-[1.15] text-center mb-2">
        Check Your Scholarship Eligibility
      </h1>

      {/* Privacy Note (D-15) */}
      <p className="text-foreground/50 text-caption text-center mb-8 flex items-center justify-center gap-1">
        <Lock className="size-3" /> Your data stays in your browser. Nothing is
        sent to our servers.
      </p>

      {/* Step Bar (D-05) */}
      <div className="max-w-2xl mx-auto mb-6">
        <div role="list" className="flex items-center gap-0">
          {STEPS.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = completedSteps.has(index);
            const isFuture = !isActive && !isCompleted;

            return (
              <div key={step.label} role="listitem" className="flex items-center flex-1">
                <button
                  type="button"
                  className={cn(
                    "flex items-center justify-center gap-1.5 w-full py-3 px-2 border-2 text-caption font-base transition-[transform,color,background-color] duration-150 ease-out-expo min-h-[44px] active:scale-[0.97]",
                    index === 0 && "border-r-0",
                    index === 1 && "border-r-0",
                    isActive &&
                      "bg-main text-main-foreground border-border",
                    isCompleted &&
                      "bg-accent text-accent-foreground border-border cursor-pointer hover:brightness-110",
                    isFuture &&
                      "bg-transparent text-foreground/50 border-border cursor-default",
                  )}
                  aria-current={isActive ? "step" : undefined}
                  onClick={() => handleStepBarClick(index)}
                  disabled={isFuture}
                >
                  {isCompleted && <Check className="size-3.5" />}
                  <span className="hidden sm:inline">{step.label}</span>
                  <span className="sm:hidden">{step.shortLabel}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Match Count (D-07) */}
      <div className="max-w-2xl mx-auto">
        <LiveMatchCount profile={profile} />
      </div>

      {/* Card container (desktop) / full-width (mobile) */}
      <Card className="max-w-2xl mx-auto md:shadow-shadow" prestige="unranked">
        <CardContent>
          {/* Step content with slide transitions */}
          <div
            ref={containerRef}
            className="overflow-hidden relative"
            role="form"
            aria-label={`Eligibility wizard - Step ${currentStep + 1} of 3`}
          >
            <div
              ref={stepContentRef}
              className={cn(
                "motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out",
                isTransitioning && direction === "forward" && "-translate-x-full",
                isTransitioning && direction === "backward" && "translate-x-full",
                !isTransitioning && "translate-x-0",
              )}
            >
              {currentStep === 0 && (
                <StepAboutYou
                  data={{
                    nationalities: profile.nationalities,
                    age: profile.age,
                    gender: profile.gender,
                  }}
                  onChange={handleChange}
                />
              )}
              {currentStep === 1 && (
                <StepAcademics
                  data={{
                    degreeLevel: profile.degreeLevel,
                    fieldsOfStudy: profile.fieldsOfStudy,
                    gpa: profile.gpa,
                    languageScores: profile.languageScores,
                  }}
                  onChange={handleChange}
                />
              )}
              {currentStep === 2 && (
                <StepPreferences
                  data={{
                    destinationCountries: profile.destinationCountries,
                    fundingPreference: profile.fundingPreference,
                  }}
                  onChange={handleChange}
                />
              )}
            </div>
          </div>
        </CardContent>

        {/* Desktop navigation buttons */}
        <CardFooter className="hidden md:flex justify-between">
          {currentStep > 0 ? (
            <Button
              variant="neutral"
              size="lg"
              onClick={handleBack}
            >
              Back
            </Button>
          ) : (
            <div />
          )}
          <Button
            variant="default"
            size="lg"
            onClick={handleNext}
            disabled={!canAdvance}
          >
            {nextButtonText}
          </Button>
        </CardFooter>
      </Card>

      {/* Mobile sticky bottom nav bar (D-36) */}
      <div className="fixed bottom-0 inset-x-0 bg-secondary-background border-t-2 border-border px-4 py-3 z-40 md:hidden">
        <div className="flex gap-3 max-w-2xl mx-auto">
          {currentStep > 0 && (
            <Button
              variant="neutral"
              size="lg"
              onClick={handleBack}
              className="flex-1"
            >
              Back
            </Button>
          )}
          <Button
            variant="default"
            size="lg"
            onClick={handleNext}
            disabled={!canAdvance}
            className={cn(currentStep === 0 ? "w-full" : "flex-1")}
          >
            {nextButtonText}
          </Button>
        </div>
      </div>
    </div>
  );
}
