import { useCallback, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { POPULAR_DESTINATIONS, getCountryFlag, getCountryName } from "@/lib/countries";
import { serializeCommaSeparated } from "@/lib/filters";

const STEPS = [
  { label: "Scholarship Level", shortLabel: "Level" },
  { label: "Destination", shortLabel: "Destination" },
  { label: "Preferences", shortLabel: "Prefs" },
] as const;

const TIER_OPTIONS = [
  { value: "gold", label: "Top Tier", desc: "Highly prestigious, well-funded programs" },
  { value: "silver", label: "Mid Tier", desc: "Reputable scholarships with solid funding" },
  { value: "bronze", label: "Entry Tier", desc: "Accessible opportunities, great starting point" },
] as const;

const FUNDING_OPTIONS = [
  { value: "fully_funded", label: "Fully Funded" },
  { value: "partial", label: "Partial Funding" },
  { value: "tuition_waiver", label: "Tuition Waiver" },
  { value: "stipend_only", label: "Stipend Only" },
] as const;

const DEGREE_OPTIONS = [
  { value: "bachelor", label: "Bachelor's" },
  { value: "master", label: "Master's" },
  { value: "phd", label: "PhD" },
  { value: "postdoc", label: "Postdoc" },
] as const;

interface WizardState {
  tiers: string[];
  countries: string[];
  funding: string[];
  degree: string[];
}

function parseSearchState(search: Record<string, string | undefined>): WizardState {
  const split = (v: string | undefined) => v ? v.split(",").filter(Boolean) : [];
  return {
    tiers: split(search.tier),
    countries: split(search.to),
    funding: split(search.funding),
    degree: split(search.degree),
  };
}

export function DiscoverWizard() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/discover" });
  const [step, setStep] = useState(search.step ? Math.min(Number(search.step), 2) : 0);
  const [state, setState] = useState<WizardState>(() => parseSearchState(search as Record<string, string | undefined>));

  const updateUrl = useCallback(
    (updates: Partial<WizardState>, newStep?: number) => {
      const merged = { ...state, ...updates };
      navigate({
        to: "/discover",
        search: {
          step: String(newStep ?? step),
          tier: merged.tiers.length ? serializeCommaSeparated(merged.tiers) : undefined,
          to: merged.countries.length ? serializeCommaSeparated(merged.countries) : undefined,
          funding: merged.funding.length ? serializeCommaSeparated(merged.funding) : undefined,
          degree: merged.degree.length ? serializeCommaSeparated(merged.degree) : undefined,
        },
        replace: true,
      });
    },
    [navigate, state, step],
  );

  function toggleValue(key: keyof WizardState, value: string) {
    const current = state[key];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    const newState = { ...state, [key]: updated };
    setState(newState);
    updateUrl({ [key]: updated });
  }

  function goNext() {
    if (step < 2) {
      const next = step + 1;
      setStep(next);
      updateUrl({}, next);
    }
  }

  function goBack() {
    if (step > 0) {
      const prev = step - 1;
      setStep(prev);
      updateUrl({}, prev);
    }
  }

  function goToResults() {
    navigate({
      to: "/scholarships",
      search: {
        tier: state.tiers.length ? serializeCommaSeparated(state.tiers) : undefined,
        to: state.countries.length ? serializeCommaSeparated(state.countries) : undefined,
        funding: state.funding.length ? serializeCommaSeparated(state.funding) : undefined,
        degree: state.degree.length ? serializeCommaSeparated(state.degree) : undefined,
        sort: "prestige",
      },
    });
  }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 pt-24 pb-12">
      <h1 className="font-heading text-heading mb-2">Discover Scholarships</h1>
      <p className="text-body opacity-70 mb-8">
        Answer a few questions and we'll find the right scholarships for you.
      </p>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s.label} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setStep(i);
                updateUrl({}, i);
              }}
              className={cn(
                "flex items-center gap-2 rounded-base border-2 px-3 py-1.5 text-sm font-heading transition-all duration-150",
                i === step
                  ? "bg-main text-main-foreground border-border shadow-shadow"
                  : i < step
                    ? "bg-secondary-background text-foreground border-border"
                    : "bg-secondary-background text-foreground/50 border-border/50",
              )}
            >
              <span className="hidden md:inline">{s.label}</span>
              <span className="md:hidden">{s.shortLabel}</span>
            </button>
            {i < STEPS.length - 1 && (
              <ChevronRight className="size-4 text-foreground/30" />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <Card className="mb-6">
        <CardContent>
          {step === 0 && (
            <div>
              <h2 className="font-heading text-subhead mb-4">
                What level of scholarship are you looking for?
              </h2>
              <div className="grid gap-3">
                {TIER_OPTIONS.map((tier) => {
                  const active = state.tiers.includes(tier.value);
                  return (
                    <button
                      key={tier.value}
                      type="button"
                      onClick={() => toggleValue("tiers", tier.value)}
                      className={cn(
                        "flex flex-col items-start rounded-base border-2 border-border p-4 text-left transition-all duration-150 min-h-[60px]",
                        active
                          ? "bg-main text-main-foreground shadow-shadow"
                          : "bg-secondary-background hover:shadow-shadow hover:-translate-y-0.5",
                      )}
                    >
                      <span className="font-heading text-sm">{tier.label}</span>
                      <span className={cn("text-caption", active ? "opacity-80" : "opacity-60")}>
                        {tier.desc}
                      </span>
                    </button>
                  );
                })}
              </div>

              <h3 className="font-heading text-sm mt-6 mb-3 opacity-70">Degree Level</h3>
              <div className="flex flex-wrap gap-2">
                {DEGREE_OPTIONS.map((d) => {
                  const active = state.degree.includes(d.value);
                  return (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => toggleValue("degree", d.value)}
                      className={cn(
                        "rounded-base border-2 border-border px-3 py-2 text-sm font-base transition-all duration-150 min-h-[44px] shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none active:scale-[0.97]",
                        active
                          ? "bg-main text-main-foreground"
                          : "bg-secondary-background text-foreground",
                      )}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="font-heading text-subhead mb-4">
                Where would you like to study?
              </h2>
              <p className="text-caption opacity-60 mb-4">
                Select one or more countries. Skip to see all destinations.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {POPULAR_DESTINATIONS.map((code) => {
                  const active = state.countries.includes(code);
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => toggleValue("countries", code)}
                      className={cn(
                        "flex items-center gap-2 rounded-base border-2 border-border px-3 py-2.5 text-sm font-base transition-all duration-150 min-h-[44px]",
                        active
                          ? "bg-main text-main-foreground shadow-shadow"
                          : "bg-secondary-background hover:shadow-shadow hover:-translate-y-0.5",
                      )}
                    >
                      <span>{getCountryFlag(code)}</span>
                      <span>{getCountryName(code)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="font-heading text-subhead mb-4">
                What funding do you need?
              </h2>
              <p className="text-caption opacity-60 mb-4">
                Select your preferred funding types. Skip to see all options.
              </p>
              <div className="grid gap-3">
                {FUNDING_OPTIONS.map((f) => {
                  const active = state.funding.includes(f.value);
                  return (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => toggleValue("funding", f.value)}
                      className={cn(
                        "flex items-center rounded-base border-2 border-border p-4 text-left transition-all duration-150 min-h-[52px]",
                        active
                          ? "bg-main text-main-foreground shadow-shadow"
                          : "bg-secondary-background hover:shadow-shadow hover:-translate-y-0.5",
                      )}
                    >
                      <span className="font-heading text-sm">{f.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="neutral"
          onClick={goBack}
          disabled={step === 0}
          className={step === 0 ? "invisible" : ""}
        >
          <ChevronLeft className="size-4 mr-1" /> Back
        </Button>

        {step < 2 ? (
          <Button onClick={goNext}>
            Next <ChevronRight className="size-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={goToResults}>
            <Search className="size-4 mr-1" /> Find Scholarships
          </Button>
        )}
      </div>

      {/* Summary bar */}
      {(state.tiers.length > 0 || state.countries.length > 0 || state.funding.length > 0 || state.degree.length > 0) && (
        <div className="mt-6 p-3 border-2 border-border rounded-base bg-secondary-background">
          <div className="flex items-center gap-2 text-caption opacity-70">
            <Sparkles className="size-4" />
            <span>
              {[
                state.tiers.length > 0 && `${state.tiers.join(", ")} tier`,
                state.degree.length > 0 && state.degree.join(", "),
                state.countries.length > 0 &&
                  `in ${state.countries.map((c) => getCountryName(c)).join(", ")}`,
                state.funding.length > 0 && state.funding.join(", "),
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
