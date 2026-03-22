---
phase: quick
plan: 260322-lih
type: execute
wave: 1
depends_on: []
files_modified:
  - web/src/lib/country-data.ts
  - web/src/routes/scholarships/country/$country.tsx
  - web/src/components/country/CostOfStudyingSection.tsx
  - web/src/components/country/AdmissionVisaSection.tsx
  - web/src/components/country/IntakePeriodsSection.tsx
  - web/src/components/country/PostStudyWorkSection.tsx
  - web/src/components/country/CountryScholarships.tsx
  - web/src/components/directory/ScholarshipCard.tsx
  - web/src/components/directory/ScholarshipListItem.tsx
autonomous: true
requirements: []
must_haves:
  truths:
    - "Country page shows cost of studying with tuition ranges and living cost estimates"
    - "Country page shows admission and visa requirements"
    - "Country page shows intake periods"
    - "Country page shows post-study work opportunities"
    - "Country page lists scholarships filtered to that country"
    - "Scholarship cards show funding amounts more prominently with a currency icon"
  artifacts:
    - path: "web/src/lib/country-data.ts"
      provides: "Static country data for 15 popular destinations"
    - path: "web/src/components/country/CostOfStudyingSection.tsx"
      provides: "Tuition and living cost display"
    - path: "web/src/components/country/AdmissionVisaSection.tsx"
      provides: "Admission and visa requirements display"
    - path: "web/src/components/country/IntakePeriodsSection.tsx"
      provides: "Intake periods display"
    - path: "web/src/components/country/PostStudyWorkSection.tsx"
      provides: "Post-study work visa info display"
    - path: "web/src/routes/scholarships/country/$country.tsx"
      provides: "Full country landing page composing all sections"
  key_links:
    - from: "web/src/routes/scholarships/country/$country.tsx"
      to: "web/src/lib/country-data.ts"
      via: "getCountryData(isoCode) import"
      pattern: "getCountryData"
---

<objective>
Build out the country detail page at `/scholarships/country/$country` from its current stub into a full informational page with four data sections (cost of studying, admission/visa requirements, intake periods, post-study work opportunities) plus a scholarship listing filtered by country. Also improve funding amount visibility on scholarship cards.

Purpose: Give prospective students a comprehensive landing page per destination country with practical info they need alongside relevant scholarships.
Output: Fully populated country pages for 15 popular destinations, improved card funding display.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@web/src/routes/scholarships/country/$country.tsx (current stub)
@web/src/lib/countries.ts (getCountryFlag, getCountryName, POPULAR_DESTINATIONS)
@web/src/components/ui/card.tsx (Card, CardContent, CardHeader, CardTitle)
@web/src/components/ui/badge.tsx (Badge with variants)
@web/src/components/detail/FundingSection.tsx (pattern for section components using Card)
@web/src/components/directory/ScholarshipCard.tsx (funding display at lines 119-126)
@web/src/components/directory/ScholarshipListItem.tsx (funding display at lines 191-197)
@web/src/lib/shared.ts (formatFundingAmount, formatFundingType)

<interfaces>
<!-- From web/src/lib/countries.ts -->
export function getCountryFlag(code: string): string;
export function getCountryName(code: string): string;
export const POPULAR_DESTINATIONS: string[]; // ["US", "GB", "DE", "CA", "AU", "FR", "NL", "JP", "SE", "CH", "KR", "SG", "NZ", "IE", "DK"]

<!-- From web/src/lib/shared.ts -->
export function formatFundingAmount(scholarship: { award_amount_min?: number; award_amount_max?: number; award_currency?: string }): string | null;
export function formatFundingType(type: string): string;

<!-- From web/src/components/ui/card.tsx -->
export { Card, CardContent, CardHeader, CardTitle, CardFooter };

<!-- From web/src/components/ui/badge.tsx -->
export { Badge }; // variants: default, neutral, gold, silver, bronze, urgency*, new, limitedInfo

<!-- Design system: neo-brutalism with border-2 border-border, shadow-shadow, font-heading, bg-main, rounded-base -->
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create country data file and section components</name>
  <files>
    web/src/lib/country-data.ts,
    web/src/components/country/CostOfStudyingSection.tsx,
    web/src/components/country/AdmissionVisaSection.tsx,
    web/src/components/country/IntakePeriodsSection.tsx,
    web/src/components/country/PostStudyWorkSection.tsx
  </files>
  <action>
    **1. Create `web/src/lib/country-data.ts`** with a typed static data structure and data for all 15 POPULAR_DESTINATIONS (US, GB, DE, CA, AU, FR, NL, JP, SE, CH, KR, SG, NZ, IE, DK).

    Define the TypeScript interface:
    ```typescript
    export interface CountryData {
      code: string;
      // Cost of studying
      tuitionRanges: {
        undergraduate: { min: number; max: number; currency: string; note?: string };
        postgraduate: { min: number; max: number; currency: string; note?: string };
        phd?: { min: number; max: number; currency: string; note?: string };
      };
      livingCost: {
        monthlyMin: number;
        monthlyMax: number;
        currency: string;
        breakdown?: { item: string; range: string }[];
      };
      // Admission & visa
      admissionRequirements: string[];  // bullet points
      languageRequirements: { test: string; minScore: string }[];
      visaDocuments: string[];  // bullet points
      visaNote?: string;
      // Intake periods
      intakes: { name: string; months: string; isMain: boolean }[];
      applicationTimeline?: string;
      // Post-study work
      postStudyWork: {
        visaName: string;
        duration: string;
        description: string;
        conditions?: string[];
      };
    }
    ```

    Export a `COUNTRY_DATA: Record<string, CountryData>` map keyed by ISO code, and a helper `getCountryData(code: string): CountryData | null`.

    Use accurate, well-researched data for each country. Key data points:
    - US: tuition $10k-$55k UG, $15k-$60k PG; OPT 1-3 years; Fall (Sep) main intake
    - GB: tuition GBP 10k-38k UG, 11k-40k PG; Graduate Route 2yr; Sep/Jan intakes
    - DE: tuition EUR 0-500/semester public, 10k-30k private; 18-month job seeker visa; Oct/Apr intakes
    - CA: tuition CAD 15k-45k UG, 15k-50k PG; PGWP up to 3yr; Sep/Jan/May intakes
    - AU: tuition AUD 20k-50k UG, 22k-55k PG; 2-4yr post-study work; Feb/Jul intakes
    - FR: tuition EUR 170-3.7k public, 10k-30k private; APS 2yr; Sep/Jan intakes
    - NL: tuition EUR 8k-20k UG, 10k-25k PG; Orientation Year 1yr; Sep/Feb intakes
    - JP: tuition JPY 535k-1.7M; Designated Activities visa 6-12mo; Apr/Oct intakes
    - SE: tuition SEK 80k-295k; 6-month extension for job search; Aug/Jan intakes
    - CH: tuition CHF 500-2k public, 10k-30k private; 6-month job seeker; Sep/Feb intakes
    - KR: tuition KRW 4M-12M; D-10 visa 6mo-2yr; Mar/Sep intakes
    - SG: tuition SGD 10k-50k; depends on pass type; Aug/Jan intakes
    - NZ: tuition NZD 22k-50k; Post-Study Work 1-3yr; Feb/Jul intakes
    - IE: tuition EUR 10k-35k UG, 10k-40k PG; Stay Back 1-2yr; Sep/Jan intakes
    - DK: tuition DKK 45k-120k (EU free); 6-month extension; Sep/Feb intakes

    For each country include 3-4 living cost breakdown items (accommodation, food, transport, personal) and 2-4 language requirements (IELTS/TOEFL/country-specific).

    **2. Create four section components** in `web/src/components/country/`, each following the existing detail section pattern (Card with CardHeader/CardContent, section with aria-labelledby). Use neo-brutalism styles (border-2, border-border, shadow-shadow, font-heading, rounded-base).

    **CostOfStudyingSection.tsx**: Takes `data: CountryData`, `countryName: string`. Shows tuition ranges as a grid/table per degree level (formatted with Intl.NumberFormat), plus a living cost card with monthly range and optional breakdown items. Use lucide-react icons: `GraduationCap` for tuition, `Home` for living costs.

    **AdmissionVisaSection.tsx**: Takes `data: CountryData`, `countryName: string`. Two sub-cards: (1) Admission requirements with bullet list + language score table, (2) Visa documents checklist. Use lucide-react icons: `FileText` for admission, `Stamp` for visa.

    **IntakePeriodsSection.tsx**: Takes `data: CountryData`. Shows intake periods as visual cards/badges, highlighting the main intake with a Badge variant="default". Include application timeline note if available. Use lucide-react `Calendar` icon.

    **PostStudyWorkSection.tsx**: Takes `data: CountryData`, `countryName: string`. Shows visa name, duration as a prominent heading, description paragraph, and conditions as bullet list. Use lucide-react `Briefcase` icon.

    All section components should handle the case where the country has no data gracefully (this won't happen for the 15 destinations but is good practice). Use consistent heading sizes: section title as `text-xl font-heading`, sub-headings as `text-lg font-heading`.
  </action>
  <verify>
    <automated>cd /home/siam/Personal/ScholarHub && npx tsc --noEmit --project web/tsconfig.json 2>&1 | head -30</automated>
  </verify>
  <done>
    - country-data.ts exports CountryData type, COUNTRY_DATA map with 15 countries, and getCountryData helper
    - Four section components render correctly with typed props
    - All files pass TypeScript checking
  </done>
</task>

<task type="auto">
  <name>Task 2: Build country page and improve card funding display</name>
  <files>
    web/src/routes/scholarships/country/$country.tsx,
    web/src/components/country/CountryScholarships.tsx,
    web/src/components/directory/ScholarshipCard.tsx,
    web/src/components/directory/ScholarshipListItem.tsx
  </files>
  <action>
    **1. Create `web/src/components/country/CountryScholarships.tsx`** -- a component that lists scholarships for a given country. It should:
    - Accept `countryCode: string` prop
    - Use `useQuery(api.directory.listScholarships, { hostCountry: [countryCode], limit: 12 })` (check the actual query name/params by reading the Convex directory query file first)
    - If no Convex query supports filtering by host_country directly, use the existing search/listing query with the hostCountry filter parameter that the directory page already uses
    - Render results using `ScholarshipCard` in a grid (same `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6` as the main directory)
    - Show a "View all scholarships in {country}" link at the bottom pointing to `/scholarships?country={code}` or the appropriate filter URL
    - Handle loading state with a simple skeleton and empty state with "No scholarships found" message

    **2. Rewrite `web/src/routes/scholarships/country/$country.tsx`** from stub to full page:
    - Keep existing `head` meta with title/description
    - Layout: Navbar at top, then a hero section with flag + country name + brief intro
    - Below hero, show a disclaimer banner: "Data is approximate and may change. Always verify with official sources." using a Card with `bg-secondary-background` and an `Info` icon from lucide-react
    - Then four sections in order: CostOfStudyingSection, AdmissionVisaSection, IntakePeriodsSection, PostStudyWorkSection
    - Below sections: CountryScholarships component
    - If `getCountryData(country)` returns null (unsupported country), show a fallback message: "Detailed country information for {name} is coming soon." with just the CountryScholarships component below
    - Use `max-w-5xl mx-auto` container (wider than current max-w-3xl to accommodate the data-rich sections)
    - Add spacing between sections: `space-y-8` or `space-y-10`

    **3. Improve funding display on ScholarshipCard.tsx** (lines 119-126):
    - Change the funding amount from `text-xs` to `text-sm font-heading` to make it more prominent
    - Add a `Banknote` icon (from lucide-react, `size-3.5`) before the amount text when an amount is present
    - Keep the funding type label (`formatFundingType`) as `font-heading text-xs` (unchanged)
    - When amount exists, display it on its own line below the funding type instead of inline, so it stands out more:
      ```
      Fully Funded
      [Banknote icon] $5,000 - $10,000
      ```
    - When no amount exists, keep the current single-line display with just the funding type

    **4. Improve funding display on ScholarshipListItem.tsx** (lines 191-197):
    - Same pattern: make amount `text-sm font-heading` instead of `text-xs text-foreground/70`
    - Add `Banknote` icon before the amount
    - Keep the funding type as-is
  </action>
  <verify>
    <automated>cd /home/siam/Personal/ScholarHub && npx tsc --noEmit --project web/tsconfig.json 2>&1 | head -30</automated>
  </verify>
  <done>
    - Country page at /scholarships/country/US (and other codes) shows all four info sections with real data
    - Country page shows scholarships filtered to that country
    - Unsupported countries show graceful fallback
    - ScholarshipCard shows funding amount on a separate line with Banknote icon, using font-heading text-sm
    - ScholarshipListItem shows funding amount with Banknote icon, using font-heading text-sm
    - All files pass TypeScript checking
  </done>
</task>

</tasks>

<verification>
1. `cd /home/siam/Personal/ScholarHub && npx tsc --noEmit --project web/tsconfig.json` -- no type errors
2. `cd /home/siam/Personal/ScholarHub/web && npm run build` -- build succeeds
3. Manual spot check: visit `/scholarships/country/US`, `/scholarships/country/DE`, `/scholarships/country/JP` to verify sections render with accurate data
4. Manual spot check: visit `/scholarships` and confirm cards show funding amounts more prominently with icon
</verification>

<success_criteria>
- 15 country data entries with tuition, living cost, admission/visa, intake, and post-study work info
- Country page renders 4 informational sections from static data
- Country page lists scholarships filtered to that country
- Scholarship cards show funding amounts with Banknote icon on a separate line in font-heading text-sm
- TypeScript compiles cleanly, build succeeds
</success_criteria>

<output>
After completion, create `.planning/quick/260322-lih-add-country-detail-sections-cost-of-stud/260322-lih-SUMMARY.md`
</output>
