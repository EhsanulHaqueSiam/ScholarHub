import { Check, Lock } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { Gender, GpaScale, StudentProfile } from "@/lib/eligibility/types";
import { cn } from "@/lib/utils";
import { StepAboutYou } from "./StepAboutYou";
import { StepAcademics } from "./StepAcademics";
import { StepPreferences } from "./StepPreferences";

const STEPS = [
  { label: "About You", shortLabel: "About" },
  { label: "Academics", shortLabel: "Academics" },
  { label: "Preferences", shortLabel: "Prefs" },
] as const;

type Direction = "forward" | "backward";

export function WizardShell() {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<Direction>("forward");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [profileData, setProfileData] = useState<Partial<StudentProfile>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const stepContentRef = useRef<HTMLDivElement>(null);

  // Track which steps have been visited / completed
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(
    new Set(),
  );

  const handleChange = useCallback(
    (updates: Partial<StudentProfile>) => {
      setProfileData((prev) => ({ ...prev, ...updates }));
    },
    [],
  );

  // Validate step 1: nationality required
  const isStep1Valid = useMemo(
    () => (profileData.nationalities?.length ?? 0) > 0,
    [profileData.nationalities],
  );

  // Validate step 2: degree level and field of study required
  const isStep2Valid = useMemo(
    () =>
      !!profileData.degreeLevel &&
      (profileData.fieldsOfStudy?.length ?? 0) > 0,
    [profileData.degreeLevel, profileData.fieldsOfStudy],
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
      navigateToStep(currentStep + 1);
    } else if (currentStep === 2) {
      // Final step: navigate to results
      // For now, mark step as completed
      setCompletedSteps((prev) => new Set([...prev, currentStep]));
      // TODO: Navigate to /eligibility/results with profile params (Plan 07)
    }
  }, [currentStep, canAdvance, navigateToStep]);

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
      <h1 className="text-[28px] font-heading leading-[1.15] text-center mb-2">
        Check Your Scholarship Eligibility
      </h1>

      {/* Privacy Note (D-15) */}
      <p className="text-foreground/50 text-[13px] text-center mb-8 flex items-center justify-center gap-1">
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
                    "flex items-center justify-center gap-1.5 w-full py-3 px-2 border-2 text-[13px] font-base transition-colors min-h-[44px]",
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
                    nationalities: profileData.nationalities,
                    age: profileData.age,
                    gender: profileData.gender,
                  }}
                  onChange={handleChange}
                />
              )}
              {currentStep === 1 && (
                <StepAcademics
                  data={{
                    degreeLevel: profileData.degreeLevel,
                    fieldsOfStudy: profileData.fieldsOfStudy,
                    gpa: profileData.gpa,
                    languageScores: profileData.languageScores,
                  }}
                  onChange={handleChange}
                />
              )}
              {currentStep === 2 && (
                <StepPreferences
                  data={{
                    destinationCountries: profileData.destinationCountries,
                    fundingPreference: profileData.fundingPreference,
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
