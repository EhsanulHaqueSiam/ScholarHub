/**
 * Static country data for popular study destinations.
 * Provides tuition ranges, living costs, admission/visa requirements,
 * intake periods, and post-study work opportunities.
 */

export interface TuitionRange {
  min: number;
  max: number;
  currency: string;
  note?: string;
}

export interface CountryData {
  code: string;
  // Cost of studying
  tuitionRanges: {
    undergraduate: TuitionRange;
    postgraduate: TuitionRange;
    phd?: TuitionRange;
  };
  livingCost: {
    monthlyMin: number;
    monthlyMax: number;
    currency: string;
    breakdown?: { item: string; range: string }[];
  };
  // Admission & visa
  admissionRequirements: string[];
  languageRequirements: { test: string; minScore: string }[];
  visaDocuments: string[];
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

export const COUNTRY_DATA: Record<string, CountryData> = {
  US: {
    code: "US",
    tuitionRanges: {
      undergraduate: { min: 10000, max: 55000, currency: "USD", note: "Public in-state lower; private universities higher" },
      postgraduate: { min: 15000, max: 60000, currency: "USD" },
      phd: { min: 0, max: 40000, currency: "USD", note: "Many PhD programs offer full funding" },
    },
    livingCost: {
      monthlyMin: 1200,
      monthlyMax: 2500,
      currency: "USD",
      breakdown: [
        { item: "Accommodation", range: "$600 - $1,500" },
        { item: "Food", range: "$300 - $500" },
        { item: "Transport", range: "$50 - $200" },
        { item: "Personal", range: "$200 - $400" },
      ],
    },
    admissionRequirements: [
      "Completed secondary/undergraduate education with strong academic record",
      "Standardized test scores (SAT/ACT for UG; GRE/GMAT for PG)",
      "Statement of purpose and letters of recommendation",
      "Demonstrated extracurricular involvement",
    ],
    languageRequirements: [
      { test: "TOEFL iBT", minScore: "80-100" },
      { test: "IELTS Academic", minScore: "6.5-7.0" },
      { test: "Duolingo English Test", minScore: "110-120" },
    ],
    visaDocuments: [
      "Valid passport",
      "Form I-20 from SEVP-certified school",
      "SEVIS fee receipt (I-901)",
      "DS-160 online application",
      "Proof of financial support",
      "Passport-sized photographs",
    ],
    visaNote: "F-1 student visa required. Schedule interview at U.S. embassy/consulate.",
    intakes: [
      { name: "Fall", months: "August - September", isMain: true },
      { name: "Spring", months: "January", isMain: false },
      { name: "Summer", months: "May - June", isMain: false },
    ],
    applicationTimeline: "Apply 9-12 months before intended start. Fall deadlines typically December-March.",
    postStudyWork: {
      visaName: "OPT (Optional Practical Training)",
      duration: "1-3 years",
      description: "12 months of work authorization for all graduates, with a 24-month STEM extension available for STEM degree holders, totaling up to 36 months.",
      conditions: [
        "Must apply before program end date",
        "Employment must be related to field of study",
        "STEM extension requires E-Verify employer",
      ],
    },
  },
  GB: {
    code: "GB",
    tuitionRanges: {
      undergraduate: { min: 10000, max: 38000, currency: "GBP", note: "Higher for medicine and clinical degrees" },
      postgraduate: { min: 11000, max: 40000, currency: "GBP" },
      phd: { min: 4000, max: 25000, currency: "GBP", note: "Many funded PhD positions available" },
    },
    livingCost: {
      monthlyMin: 1000,
      monthlyMax: 1800,
      currency: "GBP",
      breakdown: [
        { item: "Accommodation", range: "\u00a3500 - \u00a31,000" },
        { item: "Food", range: "\u00a3200 - \u00a3350" },
        { item: "Transport", range: "\u00a350 - \u00a3150" },
        { item: "Personal", range: "\u00a3150 - \u00a3300" },
      ],
    },
    admissionRequirements: [
      "UK-equivalent qualifications (A-levels, IB, or recognized international diplomas)",
      "Personal statement demonstrating motivation and suitability",
      "Academic references from teachers or professors",
      "Portfolio or interview for creative/competitive courses",
    ],
    languageRequirements: [
      { test: "IELTS Academic", minScore: "6.0-7.0" },
      { test: "TOEFL iBT", minScore: "80-100" },
      { test: "PTE Academic", minScore: "59-65" },
    ],
    visaDocuments: [
      "Valid passport",
      "CAS (Confirmation of Acceptance for Studies) from university",
      "Proof of funds (tuition + living costs for 9 months)",
      "TB test results (if from listed countries)",
      "English language proof",
    ],
    visaNote: "Student visa (formerly Tier 4) required. Apply up to 6 months before course start.",
    intakes: [
      { name: "Autumn", months: "September - October", isMain: true },
      { name: "Spring", months: "January - February", isMain: false },
    ],
    applicationTimeline: "UCAS deadline in January for undergraduate. Postgraduate varies by university.",
    postStudyWork: {
      visaName: "Graduate Route",
      duration: "2 years (3 years for PhD)",
      description: "Unsponsored work visa allowing graduates to stay and work at any skill level. No job offer needed to apply.",
      conditions: [
        "Must have completed a UK degree",
        "Must apply before current student visa expires",
        "Can switch to Skilled Worker visa if found eligible employment",
      ],
    },
  },
  DE: {
    code: "DE",
    tuitionRanges: {
      undergraduate: { min: 0, max: 500, currency: "EUR", note: "Public universities charge only semester fees; private universities \u20ac10k-\u20ac30k/year" },
      postgraduate: { min: 0, max: 500, currency: "EUR", note: "Same as undergraduate at public universities" },
      phd: { min: 0, max: 300, currency: "EUR", note: "PhD positions often salaried research roles" },
    },
    livingCost: {
      monthlyMin: 800,
      monthlyMax: 1400,
      currency: "EUR",
      breakdown: [
        { item: "Accommodation", range: "\u20ac350 - \u20ac700" },
        { item: "Food", range: "\u20ac200 - \u20ac300" },
        { item: "Transport", range: "\u20ac30 - \u20ac100" },
        { item: "Health Insurance", range: "\u20ac110 - \u20ac120" },
      ],
    },
    admissionRequirements: [
      "Recognized secondary school leaving certificate (Abitur-equivalent)",
      "Uni-assist evaluation for international credentials",
      "Subject-specific prerequisites depending on program",
      "Proof of German or English proficiency depending on program language",
    ],
    languageRequirements: [
      { test: "TestDaF", minScore: "TDN 4 in all sections" },
      { test: "DSH", minScore: "DSH-2 or DSH-3" },
      { test: "IELTS Academic", minScore: "6.0-6.5 (English programs)" },
      { test: "TOEFL iBT", minScore: "80-90 (English programs)" },
    ],
    visaDocuments: [
      "Valid passport",
      "University admission letter",
      "Proof of financial resources (\u20ac11,208/year in blocked account)",
      "Health insurance coverage",
      "Proof of language proficiency",
      "Motivation letter",
    ],
    visaNote: "National visa required before entry. Convert to residence permit after arrival.",
    intakes: [
      { name: "Winter Semester", months: "October", isMain: true },
      { name: "Summer Semester", months: "April", isMain: false },
    ],
    applicationTimeline: "Winter semester: apply by July 15. Summer semester: apply by January 15.",
    postStudyWork: {
      visaName: "Job Seeker Visa (Section 20 AufenthG)",
      duration: "18 months",
      description: "Graduates can stay up to 18 months to seek employment related to their qualification. Can work in any job during the search period.",
      conditions: [
        "Must have completed a German degree",
        "Proof of financial self-sufficiency",
        "Must find qualified employment within 18 months",
      ],
    },
  },
  CA: {
    code: "CA",
    tuitionRanges: {
      undergraduate: { min: 15000, max: 45000, currency: "CAD" },
      postgraduate: { min: 15000, max: 50000, currency: "CAD" },
      phd: { min: 7000, max: 20000, currency: "CAD", note: "Most funded PhD programs cover tuition" },
    },
    livingCost: {
      monthlyMin: 1000,
      monthlyMax: 2200,
      currency: "CAD",
      breakdown: [
        { item: "Accommodation", range: "C$600 - C$1,200" },
        { item: "Food", range: "C$250 - C$400" },
        { item: "Transport", range: "C$80 - C$150" },
        { item: "Personal", range: "C$150 - C$300" },
      ],
    },
    admissionRequirements: [
      "Completed secondary or post-secondary education with competitive grades",
      "Statement of intent or personal essay",
      "Letters of recommendation (especially for graduate programs)",
      "Standardized tests (GRE/GMAT) for some graduate programs",
    ],
    languageRequirements: [
      { test: "IELTS Academic", minScore: "6.5 overall, 6.0 per band" },
      { test: "TOEFL iBT", minScore: "86-100" },
      { test: "PTE Academic", minScore: "60-65" },
    ],
    visaDocuments: [
      "Valid passport",
      "Letter of acceptance from DLI (Designated Learning Institution)",
      "Proof of funds (tuition + C$10,000/year living or C$11,000 in Quebec)",
      "Letter of explanation",
      "Medical exam (if required)",
      "Police clearance certificate",
    ],
    visaNote: "Study permit required. Apply online through IRCC portal.",
    intakes: [
      { name: "Fall", months: "September", isMain: true },
      { name: "Winter", months: "January", isMain: false },
      { name: "Summer", months: "May", isMain: false },
    ],
    applicationTimeline: "Fall: apply October-March of prior year. Early applications recommended.",
    postStudyWork: {
      visaName: "Post-Graduation Work Permit (PGWP)",
      duration: "Up to 3 years",
      description: "Open work permit matching the length of your study program. No job offer required. Provides a pathway to permanent residency through Express Entry.",
      conditions: [
        "Must have studied at an eligible DLI",
        "Program must have been at least 8 months",
        "Must apply within 180 days of receiving final marks",
      ],
    },
  },
  AU: {
    code: "AU",
    tuitionRanges: {
      undergraduate: { min: 20000, max: 50000, currency: "AUD" },
      postgraduate: { min: 22000, max: 55000, currency: "AUD" },
      phd: { min: 20000, max: 45000, currency: "AUD", note: "Research Training Program covers fees for many students" },
    },
    livingCost: {
      monthlyMin: 1500,
      monthlyMax: 2700,
      currency: "AUD",
      breakdown: [
        { item: "Accommodation", range: "A$800 - A$1,500" },
        { item: "Food", range: "A$300 - A$500" },
        { item: "Transport", range: "A$50 - A$200" },
        { item: "Personal", range: "A$200 - A$400" },
      ],
    },
    admissionRequirements: [
      "Completed equivalent secondary or tertiary education",
      "Minimum GPA requirements (varies by university and program)",
      "Statement of purpose (for postgraduate programs)",
      "Portfolio or work experience (for specific programs)",
    ],
    languageRequirements: [
      { test: "IELTS Academic", minScore: "6.5 overall, 6.0 per band" },
      { test: "TOEFL iBT", minScore: "79-93" },
      { test: "PTE Academic", minScore: "58-64" },
    ],
    visaDocuments: [
      "Valid passport",
      "Confirmation of Enrolment (CoE)",
      "Genuine Temporary Entrant (GTE) statement",
      "Proof of financial capacity (A$21,041/year living costs)",
      "Overseas Student Health Cover (OSHC)",
      "English proficiency evidence",
    ],
    visaNote: "Student visa (subclass 500) required. Apply online through ImmiAccount.",
    intakes: [
      { name: "Semester 1", months: "February - March", isMain: true },
      { name: "Semester 2", months: "July - August", isMain: false },
    ],
    applicationTimeline: "Semester 1: apply by October-November. Semester 2: apply by April-May.",
    postStudyWork: {
      visaName: "Temporary Graduate Visa (subclass 485)",
      duration: "2-4 years",
      description: "Post-Study Work stream allows graduates to live and work in Australia. Duration depends on qualification level and study location (regional areas get extra years).",
      conditions: [
        "Must have completed at least 2 years of study in Australia",
        "Must apply within 6 months of completing studies",
        "Must meet English language requirements",
        "Regional study bonus: additional 1-2 years",
      ],
    },
  },
  FR: {
    code: "FR",
    tuitionRanges: {
      undergraduate: { min: 170, max: 3770, currency: "EUR", note: "Public universities: \u20ac170 (licence); Grandes \u00c9coles and private: \u20ac10k-\u20ac30k" },
      postgraduate: { min: 243, max: 3770, currency: "EUR", note: "Public universities: \u20ac243 (master); private institutions significantly higher" },
      phd: { min: 380, max: 380, currency: "EUR", note: "Doctoral registration fee at public universities" },
    },
    livingCost: {
      monthlyMin: 800,
      monthlyMax: 1500,
      currency: "EUR",
      breakdown: [
        { item: "Accommodation", range: "\u20ac400 - \u20ac800 (CAF housing aid available)" },
        { item: "Food", range: "\u20ac200 - \u20ac300" },
        { item: "Transport", range: "\u20ac30 - \u20ac75" },
        { item: "Health Insurance", range: "Free under French social security" },
      ],
    },
    admissionRequirements: [
      "Baccalaureate-equivalent secondary diploma",
      "Academic transcripts and diploma translations (certified)",
      "Campus France registration and interview (for many countries)",
      "Motivation letter and CV",
    ],
    languageRequirements: [
      { test: "TCF/TEF", minScore: "B2 level (French-taught programs)" },
      { test: "DELF/DALF", minScore: "B2-C1 (French-taught programs)" },
      { test: "IELTS Academic", minScore: "6.0-6.5 (English-taught programs)" },
      { test: "TOEFL iBT", minScore: "80-90 (English-taught programs)" },
    ],
    visaDocuments: [
      "Valid passport",
      "University acceptance letter",
      "Proof of accommodation in France",
      "Proof of financial means (\u20ac615/month minimum)",
      "Campus France attestation",
      "Travel insurance",
    ],
    visaNote: "VLS-TS (long-stay student visa) required. Apply through Campus France and French consulate.",
    intakes: [
      { name: "Autumn", months: "September - October", isMain: true },
      { name: "Spring", months: "January - February", isMain: false },
    ],
    applicationTimeline: "Campus France DAP procedure: November-March for public universities.",
    postStudyWork: {
      visaName: "APS (Autorisation Provisoire de S\u00e9jour)",
      duration: "2 years (non-renewable, job search period)",
      description: "Allows graduates to stay in France to find employment related to their degree. Can convert to a work permit once employment is secured.",
      conditions: [
        "Must have completed a master's degree or higher",
        "Must apply before current visa expires",
        "Employment must match qualification level",
      ],
    },
  },
  NL: {
    code: "NL",
    tuitionRanges: {
      undergraduate: { min: 8000, max: 20000, currency: "EUR" },
      postgraduate: { min: 10000, max: 25000, currency: "EUR" },
    },
    livingCost: {
      monthlyMin: 900,
      monthlyMax: 1500,
      currency: "EUR",
      breakdown: [
        { item: "Accommodation", range: "\u20ac400 - \u20ac800" },
        { item: "Food", range: "\u20ac200 - \u20ac300" },
        { item: "Transport", range: "\u20ac30 - \u20ac100 (OV-chipkaart)" },
        { item: "Health Insurance", range: "\u20ac50 - \u20ac120" },
      ],
    },
    admissionRequirements: [
      "VWO-equivalent diploma for research universities, HAVO-equivalent for universities of applied sciences",
      "Numerus fixus programs may require additional selection (lottery or ranking)",
      "Academic transcripts and motivation letter",
      "Specific subject prerequisites depending on program",
    ],
    languageRequirements: [
      { test: "IELTS Academic", minScore: "6.0-6.5" },
      { test: "TOEFL iBT", minScore: "80-90" },
      { test: "Cambridge C1 Advanced", minScore: "Grade B or higher" },
    ],
    visaDocuments: [
      "Valid passport",
      "University admission letter",
      "Proof of sufficient funds (\u20ac11,000-\u20ac13,000/year)",
      "Health insurance (Dutch basic health insurance or equivalent)",
      "Proof of accommodation",
    ],
    visaNote: "University sponsors your MVV entry visa and residence permit. Non-EU students must register with IND.",
    intakes: [
      { name: "Autumn", months: "September", isMain: true },
      { name: "Spring", months: "February", isMain: false },
    ],
    applicationTimeline: "Apply by April 1 for numerus fixus, May 1 for other programs (September start).",
    postStudyWork: {
      visaName: "Orientation Year (Zoekjaar)",
      duration: "1 year",
      description: "Allows graduates to stay in the Netherlands to find employment, start a business, or explore career options. Can switch to a highly skilled migrant permit.",
      conditions: [
        "Must apply within 3 years of graduation",
        "Must have completed a Dutch degree",
        "Proof of sufficient funds during the search period",
      ],
    },
  },
  JP: {
    code: "JP",
    tuitionRanges: {
      undergraduate: { min: 535000, max: 1700000, currency: "JPY", note: "National universities ~\u00a5535k; private universities up to \u00a51.7M" },
      postgraduate: { min: 535000, max: 1500000, currency: "JPY" },
    },
    livingCost: {
      monthlyMin: 80000,
      monthlyMax: 150000,
      currency: "JPY",
      breakdown: [
        { item: "Accommodation", range: "\u00a530,000 - \u00a570,000" },
        { item: "Food", range: "\u00a525,000 - \u00a540,000" },
        { item: "Transport", range: "\u00a55,000 - \u00a510,000" },
        { item: "Personal & Utilities", range: "\u00a515,000 - \u00a530,000" },
      ],
    },
    admissionRequirements: [
      "12+ years of formal education (equivalent to Japanese high school)",
      "EJU (Examination for Japanese University Admission) for Japanese-taught programs",
      "Direct university entrance exams or application screening",
      "Research plan required for graduate programs",
    ],
    languageRequirements: [
      { test: "JLPT", minScore: "N2-N1 (Japanese-taught programs)" },
      { test: "IELTS Academic", minScore: "6.0-6.5 (English-taught programs)" },
      { test: "TOEFL iBT", minScore: "80-90 (English-taught programs)" },
    ],
    visaDocuments: [
      "Valid passport",
      "Certificate of Eligibility (CoE) from university/immigration",
      "University admission documents",
      "Proof of financial support",
      "Passport-sized photographs",
    ],
    visaNote: "Student visa (ryugaku) required. University applies for CoE; student applies for visa at Japanese embassy.",
    intakes: [
      { name: "Spring", months: "April", isMain: true },
      { name: "Autumn", months: "October", isMain: false },
    ],
    applicationTimeline: "April intake: apply August-November. October intake: apply February-May.",
    postStudyWork: {
      visaName: "Designated Activities Visa (Job Seeking)",
      duration: "6-12 months",
      description: "Graduates can extend their stay to seek employment in Japan. Can be extended once for a total of up to 12 months.",
      conditions: [
        "Must have recommendation from university",
        "Proof of sufficient living expenses",
        "Must actively seek employment",
      ],
    },
  },
  SE: {
    code: "SE",
    tuitionRanges: {
      undergraduate: { min: 80000, max: 295000, currency: "SEK" },
      postgraduate: { min: 80000, max: 295000, currency: "SEK" },
      phd: { min: 0, max: 0, currency: "SEK", note: "PhD students are employed and receive a salary" },
    },
    livingCost: {
      monthlyMin: 8500,
      monthlyMax: 13000,
      currency: "SEK",
      breakdown: [
        { item: "Accommodation", range: "4,000 - 7,000 SEK" },
        { item: "Food", range: "2,000 - 3,000 SEK" },
        { item: "Transport", range: "500 - 900 SEK" },
        { item: "Personal", range: "1,000 - 2,000 SEK" },
      ],
    },
    admissionRequirements: [
      "Upper secondary school diploma equivalent to Swedish gymnasieexamen",
      "Subject-specific prerequisites vary by program",
      "Documented academic qualifications and transcripts",
      "CV and motivation letter (for some master's programs)",
    ],
    languageRequirements: [
      { test: "IELTS Academic", minScore: "6.5 overall" },
      { test: "TOEFL iBT", minScore: "90" },
      { test: "Swedish (TISUS)", minScore: "Pass (Swedish-taught programs)" },
    ],
    visaDocuments: [
      "Valid passport",
      "University admission confirmation",
      "Proof of comprehensive health insurance",
      "Proof of funds (SEK 8,568/month for 10 months)",
      "Passport-sized photographs",
    ],
    visaNote: "Residence permit required. Apply online through Swedish Migration Agency (Migrationsverket).",
    intakes: [
      { name: "Autumn", months: "August - September", isMain: true },
      { name: "Spring", months: "January", isMain: false },
    ],
    applicationTimeline: "Apply through universityadmissions.se by January 15 (autumn) or August 15 (spring).",
    postStudyWork: {
      visaName: "Residence Permit Extension for Job Seeking",
      duration: "6 months (recently extended to 9 months)",
      description: "Graduates can extend their residence permit to look for work or start a business in Sweden.",
      conditions: [
        "Must apply before current permit expires",
        "Must have completed studies in Sweden",
        "Can switch to work permit once employed",
      ],
    },
  },
  CH: {
    code: "CH",
    tuitionRanges: {
      undergraduate: { min: 500, max: 2000, currency: "CHF", note: "Public universities (ETH Zurich, EPFL); private institutions CHF 10k-30k" },
      postgraduate: { min: 500, max: 2000, currency: "CHF", note: "Same range at public universities" },
      phd: { min: 0, max: 1500, currency: "CHF", note: "PhD students typically receive a salary" },
    },
    livingCost: {
      monthlyMin: 1500,
      monthlyMax: 2500,
      currency: "CHF",
      breakdown: [
        { item: "Accommodation", range: "CHF 600 - CHF 1,200" },
        { item: "Food", range: "CHF 400 - CHF 600" },
        { item: "Transport", range: "CHF 70 - CHF 150" },
        { item: "Health Insurance", range: "CHF 80 - CHF 200" },
      ],
    },
    admissionRequirements: [
      "Recognized secondary school diploma (Maturit\u00e4t-equivalent)",
      "Entrance exam may be required for some universities",
      "Strong academic record with subject prerequisites",
      "Research proposal for PhD applications",
    ],
    languageRequirements: [
      { test: "IELTS Academic", minScore: "6.5-7.0 (English programs)" },
      { test: "TOEFL iBT", minScore: "90-100 (English programs)" },
      { test: "TestDaF/Goethe", minScore: "C1 (German programs)" },
      { test: "DELF/DALF", minScore: "B2-C1 (French programs)" },
    ],
    visaDocuments: [
      "Valid passport",
      "University admission confirmation",
      "Proof of financial means (CHF 21,000/year minimum)",
      "Health insurance proof",
      "Academic certificates and transcripts",
      "Motivation letter",
    ],
    visaNote: "Student visa and residence permit (Aufenthaltsbewilligung) required. Apply at Swiss embassy.",
    intakes: [
      { name: "Autumn", months: "September", isMain: true },
      { name: "Spring", months: "February", isMain: false },
    ],
    applicationTimeline: "Deadlines vary; typically February for autumn, September for spring semester.",
    postStudyWork: {
      visaName: "Job Seeker Permit",
      duration: "6 months",
      description: "Graduates can remain in Switzerland for 6 months to seek employment. Switzerland has high demand for skilled professionals especially in STEM fields.",
      conditions: [
        "Must have completed a Swiss degree",
        "Employment must match qualification level",
        "Employer must demonstrate preference for local/EU candidates",
      ],
    },
  },
  KR: {
    code: "KR",
    tuitionRanges: {
      undergraduate: { min: 4000000, max: 12000000, currency: "KRW" },
      postgraduate: { min: 5000000, max: 15000000, currency: "KRW" },
    },
    livingCost: {
      monthlyMin: 700000,
      monthlyMax: 1200000,
      currency: "KRW",
      breakdown: [
        { item: "Accommodation", range: "\u20a9300,000 - \u20a9600,000" },
        { item: "Food", range: "\u20a9200,000 - \u20a9350,000" },
        { item: "Transport", range: "\u20a950,000 - \u20a9100,000" },
        { item: "Personal", range: "\u20a9100,000 - \u20a9200,000" },
      ],
    },
    admissionRequirements: [
      "Completed 12 years of education (high school equivalent)",
      "University-specific GPA and test requirements",
      "Personal statement and study plan",
      "Portfolio or interview for specific programs",
    ],
    languageRequirements: [
      { test: "TOPIK", minScore: "Level 3-4 (Korean-taught programs)" },
      { test: "IELTS Academic", minScore: "5.5-6.5 (English-taught programs)" },
      { test: "TOEFL iBT", minScore: "70-90 (English-taught programs)" },
    ],
    visaDocuments: [
      "Valid passport",
      "Certificate of admission",
      "Proof of financial ability (\u20a920M+ in bank account)",
      "Study plan",
      "Health certificate",
    ],
    visaNote: "D-2 student visa required. Apply at Korean embassy/consulate.",
    intakes: [
      { name: "Spring", months: "March", isMain: true },
      { name: "Autumn", months: "September", isMain: false },
    ],
    applicationTimeline: "Spring intake: apply September-November. Autumn intake: apply May-June.",
    postStudyWork: {
      visaName: "D-10 Job Seeking Visa",
      duration: "6 months - 2 years",
      description: "Allows graduates to seek employment in South Korea. Can be extended and converted to an employment visa (E-7) upon finding a job.",
      conditions: [
        "Must have completed a Korean degree",
        "GPA requirements may apply",
        "Must demonstrate active job-seeking efforts",
      ],
    },
  },
  SG: {
    code: "SG",
    tuitionRanges: {
      undergraduate: { min: 10000, max: 50000, currency: "SGD", note: "MOE-subsidized tuition for eligible students; unsubsidized rates higher" },
      postgraduate: { min: 15000, max: 60000, currency: "SGD" },
    },
    livingCost: {
      monthlyMin: 1200,
      monthlyMax: 2500,
      currency: "SGD",
      breakdown: [
        { item: "Accommodation", range: "S$500 - S$1,500" },
        { item: "Food", range: "S$300 - S$500" },
        { item: "Transport", range: "S$80 - S$150" },
        { item: "Personal", range: "S$200 - S$400" },
      ],
    },
    admissionRequirements: [
      "Strong academic record equivalent to Singapore A-levels or IB",
      "University entrance tests (SAT/ACT accepted by some institutions)",
      "Personal essay and extracurricular portfolio",
      "Interview for competitive programs",
    ],
    languageRequirements: [
      { test: "IELTS Academic", minScore: "6.5-7.0" },
      { test: "TOEFL iBT", minScore: "85-100" },
      { test: "PTE Academic", minScore: "58-65" },
    ],
    visaDocuments: [
      "Valid passport",
      "Student's Pass (STP) application via SOLAR+",
      "Letter of acceptance from institution",
      "Proof of financial means",
      "Medical examination report",
    ],
    visaNote: "Student's Pass issued by ICA. University initiates the application through SOLAR+ system.",
    intakes: [
      { name: "Autumn", months: "August", isMain: true },
      { name: "Spring", months: "January", isMain: false },
    ],
    applicationTimeline: "NUS/NTU: apply November-March for August intake.",
    postStudyWork: {
      visaName: "Work Pass (various types)",
      duration: "Depends on pass type",
      description: "Graduates can apply for Employment Pass (professional roles), S Pass (mid-level), or Work Permit. Strong job market for graduates from local universities.",
      conditions: [
        "Must secure a job offer from a Singapore employer",
        "Salary thresholds apply per pass type",
        "Employer must apply on behalf of the candidate",
      ],
    },
  },
  NZ: {
    code: "NZ",
    tuitionRanges: {
      undergraduate: { min: 22000, max: 50000, currency: "NZD" },
      postgraduate: { min: 25000, max: 55000, currency: "NZD" },
      phd: { min: 6500, max: 9000, currency: "NZD", note: "PhD students pay domestic tuition rates" },
    },
    livingCost: {
      monthlyMin: 1200,
      monthlyMax: 2200,
      currency: "NZD",
      breakdown: [
        { item: "Accommodation", range: "NZ$600 - NZ$1,200" },
        { item: "Food", range: "NZ$250 - NZ$400" },
        { item: "Transport", range: "NZ$50 - NZ$150" },
        { item: "Personal", range: "NZ$200 - NZ$400" },
      ],
    },
    admissionRequirements: [
      "NCEA Level 3 equivalent qualification",
      "Minimum GPA or grade requirements per program",
      "Personal statement for postgraduate programs",
      "Portfolio or interview for creative arts programs",
    ],
    languageRequirements: [
      { test: "IELTS Academic", minScore: "6.0-6.5" },
      { test: "TOEFL iBT", minScore: "80-90" },
      { test: "PTE Academic", minScore: "50-58" },
    ],
    visaDocuments: [
      "Valid passport",
      "Offer of place from New Zealand institution",
      "Proof of funds (NZ$20,000/year living costs)",
      "Return travel arrangements",
      "Medical and chest X-ray certificates",
      "Police clearance",
    ],
    visaNote: "Fee Paying Student Visa required. Apply online through Immigration New Zealand.",
    intakes: [
      { name: "Semester 1", months: "February", isMain: true },
      { name: "Semester 2", months: "July", isMain: false },
    ],
    applicationTimeline: "Semester 1: apply by October-November. Semester 2: apply by April-May.",
    postStudyWork: {
      visaName: "Post-Study Work Visa",
      duration: "1-3 years",
      description: "Open work visa for graduates. Duration depends on qualification level and study location. Degrees from outside Auckland may receive additional time.",
      conditions: [
        "Must have completed a New Zealand qualification",
        "Program must have been at least 30 weeks duration",
        "Must apply within 3 months of study completion",
      ],
    },
  },
  IE: {
    code: "IE",
    tuitionRanges: {
      undergraduate: { min: 10000, max: 35000, currency: "EUR" },
      postgraduate: { min: 10000, max: 40000, currency: "EUR" },
      phd: { min: 5000, max: 20000, currency: "EUR", note: "Many funded PhD positions through IRC and SFI" },
    },
    livingCost: {
      monthlyMin: 1000,
      monthlyMax: 1800,
      currency: "EUR",
      breakdown: [
        { item: "Accommodation", range: "\u20ac500 - \u20ac1,000" },
        { item: "Food", range: "\u20ac200 - \u20ac350" },
        { item: "Transport", range: "\u20ac50 - \u20ac120" },
        { item: "Personal", range: "\u20ac150 - \u20ac300" },
      ],
    },
    admissionRequirements: [
      "Leaving Certificate equivalent qualification",
      "Subject-specific entry requirements",
      "Personal statement and academic references",
      "Portfolio for creative/design programs",
    ],
    languageRequirements: [
      { test: "IELTS Academic", minScore: "6.0-6.5" },
      { test: "TOEFL iBT", minScore: "80-90" },
      { test: "PTE Academic", minScore: "59-63" },
    ],
    visaDocuments: [
      "Valid passport",
      "Letter of acceptance from Irish institution",
      "Proof of fees paid or scholarship letter",
      "Proof of funds (\u20ac10,000 immediately available)",
      "Private medical insurance",
      "Evidence of academic qualifications",
    ],
    visaNote: "Stamp 2 student immigration permission. Non-EU students must register with local immigration office.",
    intakes: [
      { name: "Autumn", months: "September", isMain: true },
      { name: "Spring", months: "January - February", isMain: false },
    ],
    applicationTimeline: "CAO applications for undergraduate: February 1 deadline. Postgraduate: varies by institution.",
    postStudyWork: {
      visaName: "Third Level Graduate Programme (Stay Back)",
      duration: "1-2 years",
      description: "Honours degree holders get 1 year; master's and PhD graduates get 2 years to find employment in Ireland. Leads to Critical Skills or General Employment permits.",
      conditions: [
        "Must have completed an Irish qualification at Level 8+",
        "Must apply within 6 months of exam results",
        "Can work full-time during stay-back period",
      ],
    },
  },
  DK: {
    code: "DK",
    tuitionRanges: {
      undergraduate: { min: 45000, max: 120000, currency: "DKK", note: "EU/EEA students study free; fees apply to non-EU students" },
      postgraduate: { min: 45000, max: 120000, currency: "DKK", note: "Same fee structure as undergraduate" },
      phd: { min: 0, max: 0, currency: "DKK", note: "PhD students are salaried employees of the university" },
    },
    livingCost: {
      monthlyMin: 6500,
      monthlyMax: 11000,
      currency: "DKK",
      breakdown: [
        { item: "Accommodation", range: "3,000 - 6,000 DKK" },
        { item: "Food", range: "1,500 - 2,500 DKK" },
        { item: "Transport", range: "300 - 600 DKK" },
        { item: "Personal", range: "1,000 - 2,000 DKK" },
      ],
    },
    admissionRequirements: [
      "Danish upper secondary equivalent qualification",
      "Specific subject and grade requirements per program",
      "Motivation letter and CV (for most master's programs)",
      "Relevant work experience may strengthen applications",
    ],
    languageRequirements: [
      { test: "IELTS Academic", minScore: "6.5" },
      { test: "TOEFL iBT", minScore: "83-90" },
      { test: "Cambridge C1 Advanced", minScore: "Grade B or C" },
    ],
    visaDocuments: [
      "Valid passport",
      "University acceptance letter",
      "Proof of funds (DKK 6,242/month)",
      "Passport-sized photographs",
      "Proof of accommodation in Denmark",
      "Health insurance",
    ],
    visaNote: "Residence permit required for non-EU students. Apply through nyidanmark.dk or Danish embassy.",
    intakes: [
      { name: "Autumn", months: "September", isMain: true },
      { name: "Spring", months: "February", isMain: false },
    ],
    applicationTimeline: "Apply through optagelse.dk by March 15 (undergraduate). Master's deadlines vary.",
    postStudyWork: {
      visaName: "Establishment Card",
      duration: "6 months (extended to up to 2 years in recent reforms)",
      description: "Allows graduates to remain in Denmark to seek employment or start a business. Danish government actively encourages international talent retention.",
      conditions: [
        "Must have completed a Danish degree",
        "Must apply before current permit expires",
        "Can switch to Pay Limit or Positive List schemes",
      ],
    },
  },
};

/**
 * Get country data by ISO alpha-2 code.
 * Returns null if the country is not in the dataset.
 */
export function getCountryData(code: string): CountryData | null {
  return COUNTRY_DATA[code.toUpperCase()] ?? null;
}
