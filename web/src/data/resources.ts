/**
 * Curated study-abroad toolbox.
 * Source: study-abroad-resources.md (last reviewed 2026-04-25)
 * Hand-curated for Bangladeshi students. Do not auto-generate.
 */

export type ResourceTag =
  | "bangladesh"
  | "official"
  | "free"
  | "free-tuition"
  | "reddit-pick"
  | "phd"
  | "mba"
  | "cs"
  | "stem"
  | "women"
  | "ai-tool"
  | "scam-warning"
  | "newsletter"
  | "community"
  | "europe"
  | "us"
  | "uk"
  | "germany"
  | "tactic";

export type CategoryAccent = "pink" | "lime" | "sky" | "amber" | "main";

export interface ResourceLink {
  /** Display title */
  name: string;
  /** Destination */
  url: string;
  /** Plain-language one-liner. Empty = no description. */
  desc?: string;
  /** Sub-section within a category (e.g. "Germany", "Global Aggregators") */
  group?: string;
  tags?: ResourceTag[];
  /** Mark a tool the curator emphasised (bold/star in source) */
  star?: boolean;
}

export interface ResourceCategory {
  /** Stable slug used as id + DOM anchor */
  id: string;
  /** Original markdown number for reference */
  number: string;
  title: string;
  subtitle?: string;
  /** Lucide icon name — resolved at component layer */
  icon:
    | "Compass"
    | "Globe2"
    | "Coins"
    | "BrainCircuit"
    | "Users2"
    | "Trophy"
    | "FlaskConical"
    | "Wallet"
    | "GraduationCap"
    | "PenLine"
    | "MapPin"
    | "Building2"
    | "Banknote"
    | "Youtube"
    | "Sparkles"
    | "Plane"
    | "Layers3"
    | "Newspaper"
    | "MessagesSquare"
    | "Home"
    | "ShieldCheck"
    | "Microscope"
    | "Mail"
    | "ClipboardList"
    | "PackageCheck"
    | "Briefcase"
    | "KeyRound";
  accent: CategoryAccent;
  /** When true, surfaced in the dedicated Bangladesh Playbook track */
  isBangladeshPlaybook?: boolean;
  links: ResourceLink[];
}

/* ------------------------------------------------------------------ */
/* Minimum stack of six                                                */
/* ------------------------------------------------------------------ */

export interface StackPick {
  rank: number;
  role: string;
  /** Primary site */
  primary: { name: string; url: string };
  /** Optional sibling pick (e.g. "or X") */
  or?: { name: string; url: string };
  blurb: string;
  accent: CategoryAccent;
}

export const MINIMUM_STACK: StackPick[] = [
  {
    rank: 1,
    role: "Discover programs",
    primary: { name: "Mastersportal", url: "https://www.mastersportal.com/" },
    blurb: "Cast the widest net. Filter by country, level, field, language.",
    accent: "main",
  },
  {
    rank: 2,
    role: "Find the money",
    primary: { name: "Scholars4Dev", url: "https://www.scholars4dev.com/" },
    blurb: "Filter by nationality. Has a real Bangladesh tag.",
    accent: "pink",
  },
  {
    rank: 3,
    role: "Predict your odds",
    primary: { name: "YMGrad UniPredict", url: "https://ymgrad.com/unipredict" },
    or: { name: "GyanDhan", url: "https://www.gyandhan.com/admit-predictor" },
    blurb: "Feed in CGPA + GRE + IELTS. Get Ambitious / Moderate / Safe split.",
    accent: "sky",
  },
  {
    rank: 4,
    role: "See real admits",
    primary: { name: "Yocket", url: "https://yocket.com/" },
    or: { name: "The Grad Cafe", url: "https://www.thegradcafe.com/" },
    blurb: "Don't trust predictors alone. Validate with actual admit data.",
    accent: "amber",
  },
  {
    rank: 5,
    role: "Rank by fit",
    primary: { name: "CSRankings", url: "https://csrankings.org/" },
    or: {
      name: "QS Subject Rankings",
      url: "https://www.topuniversities.com/subject-rankings",
    },
    blurb: "CSRankings if CS — citation-based, not marketing. Otherwise QS by subject.",
    accent: "lime",
  },
  {
    rank: 6,
    role: "Cost reality check",
    primary: { name: "Numbeo", url: "https://www.numbeo.com/cost-of-living/" },
    blurb: "City-level cost of living. Tuition is half the bill. Living is the other half.",
    accent: "main",
  },
];

/* ------------------------------------------------------------------ */
/* Filtering pipeline (8 layers)                                       */
/* ------------------------------------------------------------------ */

export interface PipelineLayer {
  layer: number;
  label: string;
  remaining: string;
  toolHint: string;
  /** Width percentage to visualise the funnel */
  width: number;
  accent: CategoryAccent;
}

export const PIPELINE_START = "1000s of universities";
export const PIPELINE_END = "6–8 final shortlist";
export const PIPELINE_END_DETAIL = "2 Ambitious · 3–4 Moderate · 2 Safe";

export const PIPELINE: PipelineLayer[] = [
  {
    layer: 1,
    label: "Country",
    remaining: "~200 unis",
    toolHint: "Pick 2–3 target countries",
    width: 100,
    accent: "main",
  },
  {
    layer: 2,
    label: "Program search engines",
    remaining: "~80 unis",
    toolHint: "Mastersportal, FindAMasters, GradRight",
    width: 88,
    accent: "sky",
  },
  {
    layer: 3,
    label: "Hard eligibility cutoffs",
    remaining: "~40 unis",
    toolHint: "CGPA, IELTS, GRE, prereqs",
    width: 76,
    accent: "lime",
  },
  {
    layer: 4,
    label: "Money filter",
    remaining: "~25 unis",
    toolHint: "Scholarship · assistantship · affordable",
    width: 64,
    accent: "amber",
  },
  {
    layer: 5,
    label: "Fit filter",
    remaining: "~15 unis",
    toolHint: "Faculty research · curriculum · location",
    width: 52,
    accent: "pink",
  },
  {
    layer: 6,
    label: "Admit predictor + real data",
    remaining: "~10 unis",
    toolHint: "Yocket, Grad Cafe, Admits.fyi",
    width: 42,
    accent: "sky",
  },
  {
    layer: 7,
    label: "Deadline feasibility",
    remaining: "~8 unis",
    toolHint: "Can you actually file in time?",
    width: 32,
    accent: "lime",
  },
  {
    layer: 8,
    label: "Career outcomes & visa",
    remaining: "6–8 final",
    toolHint: "Alumni network · H-1B data · sponsorship",
    width: 24,
    accent: "main",
  },
];

/* ------------------------------------------------------------------ */
/* Tag metadata (label + colour)                                       */
/* ------------------------------------------------------------------ */

export const TAG_META: Record<ResourceTag, { label: string; short: string }> = {
  bangladesh: { label: "Bangladesh-specific", short: "BD" },
  official: { label: "Official / Government", short: "Official" },
  free: { label: "Free to use", short: "Free" },
  "free-tuition": { label: "Free tuition", short: "Free tuition" },
  "reddit-pick": { label: "Reddit-recommended", short: "Reddit" },
  phd: { label: "PhD focus", short: "PhD" },
  mba: { label: "MBA focus", short: "MBA" },
  cs: { label: "CS focus", short: "CS" },
  stem: { label: "STEM focus", short: "STEM" },
  women: { label: "Women / diversity", short: "Women" },
  "ai-tool": { label: "AI-powered", short: "AI" },
  "scam-warning": { label: "Caution", short: "Caution" },
  newsletter: { label: "Newsletter / email feed", short: "Newsletter" },
  community: { label: "Community / forum", short: "Community" },
  europe: { label: "Europe", short: "EU" },
  us: { label: "United States", short: "US" },
  uk: { label: "United Kingdom", short: "UK" },
  germany: { label: "Germany", short: "DE" },
  tactic: { label: "Tactic / playbook", short: "Tactic" },
};

/* ------------------------------------------------------------------ */
/* Bangladesh Playbook (operational hurdles)                           */
/* ------------------------------------------------------------------ */

export interface PlaybookCard {
  id: string;
  title: string;
  /** Pithy 1–2 sentence summary. */
  summary: string;
  /** Headline metric or rule e.g. "$300 / txn limit" */
  metric: string;
  /** Bullets — short imperative / factual. */
  bullets: string[];
  /** Watch-out callout shown in red. */
  warning?: string;
  /** External book/booking link if any. */
  link?: { label: string; url: string };
  icon:
    | "Banknote"
    | "FileSignature"
    | "Stethoscope"
    | "CreditCard"
    | "Stamp"
    | "ShieldAlert"
    | "Plane"
    | "Ticket"
    | "Lightbulb";
  accent: CategoryAccent;
}

export const PLAYBOOK: PlaybookCard[] = [
  {
    id: "student-file",
    title: "Open a Student File",
    summary:
      "Bangladesh Bank requires a Student File before you can legally remit tuition or living costs abroad. Visa officers often check it.",
    metric: "Mandatory before remittance",
    bullets: [
      "Required: original Offer Letter / I-20, Passport, NID",
      "Required: sponsor's NID, trade licence or tax returns, cost breakdown",
      "Most-recommended banks (Reddit): EBL and City Bank for speed",
      "DBBL & Sonali are cheaper but slower in dollar shortages",
    ],
    warning:
      "Some branches will pressure you to open a giant FDR to get a Student File. That is NOT a central-bank rule — try a different branch.",
    icon: "Banknote",
    accent: "pink",
  },
  {
    id: "wes-3year",
    title: "WES & the 3-year NU degree",
    summary:
      "WES (US/Canada credential evaluation) typically marks a 3-year NU bachelor's as 3 years of UG — not equivalent to a 4-year North American degree.",
    metric: "3-year ≠ 4-year (default)",
    bullets: [
      "Get transcripts attested at NU One-Stop Service Centre, Gazipur",
      "NU must courier in a sealed, stamped envelope — WES rejects self-sent",
      "Fix: complete a 1- or 2-year master's in BD first → WES treats as 3+1 or 3+2",
      "Alt: try ECE or SpanTran — sometimes more flexible than WES",
    ],
    icon: "FileSignature",
    accent: "amber",
  },
  {
    id: "iom-medical",
    title: "IOM medical (UK / Canada)",
    summary:
      "Stays > 6 months in the UK (TB) or Canada (IME) require an IOM-authorised medical. Regular hospitals do not count.",
    metric: "Book 3–4 weeks early",
    bullets: [
      "Authorised: IOM Dhaka (Gulshan) or Sylhet",
      "Canada IME also at Green Crescent Health Services",
      "UK TB ≈ 85 USD · Canada IME ≈ 7,000–8,000 BDT",
      "Slots fill fast — book before your visa submission window",
    ],
    link: { label: "IOM MyMedical", url: "https://mymedical.iom.int/" },
    icon: "Stethoscope",
    accent: "sky",
  },
  {
    id: "dual-currency",
    title: "Dual-currency cards (USD payments)",
    summary:
      "Normal BD debit cards cannot pay USD. You need a dual-currency card endorsed against your travel quota.",
    metric: "$300 / single transaction limit",
    bullets: [
      "EBL Aqua Prepaid: ~575 BDT for 3 years, no bank account required",
      "BRAC Agami Savers: free student account + free dual-currency debit",
      "Take your passport to the bank to physically endorse dollars",
      "Fees over $300? Call helpline to lift the limit temporarily",
    ],
    warning:
      "Without the physical passport endorsement, the card declines all USD transactions. Don't skip this step.",
    icon: "CreditCard",
    accent: "lime",
  },
  {
    id: "moe-mofa",
    title: "MOE → MOFA attestation",
    summary:
      "Most European and Asian universities require certificates legalised by the Bangladesh government in a strict order.",
    metric: "Sequential — order matters",
    bullets: [
      "1. Verify with your Education Board (SSC/HSC) or University Registrar",
      "2. MOE attestation at Shikkha Bhaban, Dhaka",
      "3. MOFA attestation at Segunbagicha, Dhaka",
      "MOFA rejects anything that hasn't cleared MOE first",
    ],
    warning:
      "Do NOT laminate your originals. Ministries stamp directly on the back of the paper.",
    icon: "Stamp",
    accent: "main",
  },
  {
    id: "source-of-funds",
    title: "Source-of-funds visa trap",
    summary:
      "Canada IRCC and US officers don't just check that the money exists — they check it makes economic sense.",
    metric: "Sudden deposits = red flag",
    bullets: [
      "If 40 lakh BDT lands in a sponsor account 2 months before applying → likely refusal",
      "Bank statement must align with sponsor's IT-10B Tax Wealth Statement",
      "UK rule: required funds must sit untouched for 28 consecutive days",
    ],
    warning:
      "If the bank shows 50 lakh but the IT-10B shows 5 lakh annual income with no savings history, the officer assumes the money is borrowed for show.",
    icon: "ShieldAlert",
    accent: "pink",
  },
  {
    id: "airline-clubs",
    title: "Airline student clubs",
    summary:
      "Never buy a standard ticket. Student programmes give you 10–40 kg extra baggage and 10–20% off — the difference between fitting your life and leaving it.",
    metric: "+10 to +40 kg baggage",
    bullets: [
      "Qatar Student Club: 10–20% off, +10 kg or +1 piece, free Super Wi-Fi",
      "Emirates Student Offer: code STUDENT — 10% off, +10 kg / +1 piece",
      "Turkish Miles&Smiles Student: massive +40 kg on EU/UK routes",
    ],
    icon: "Plane",
    accent: "sky",
  },
  {
    id: "iom-flight",
    title: "IOM-issued student airfare",
    summary:
      "IOM Dhaka quietly sells discounted one-way Student Fares on Emirates, Qatar, Singapore Airlines — bookable only by email.",
    metric: "+10 to +20 kg baggage",
    bullets: [
      "Free date change is usually included",
      "Cannot book online — email IOMDhaka@iom.int",
      "Send: Passport, Student Visa, University Offer Letter to get a quote",
    ],
    icon: "Ticket",
    accent: "amber",
  },
  {
    id: "fee-waivers",
    title: "Application fee waivers",
    summary:
      "Application fees ($75–150) hurt in BDT. Most US grad coordinators have discretion to waive them — ask, with context.",
    metric: "Reply rate ~30%",
    bullets: [
      "Email the graduate coordinator directly — not the central admissions office",
      "Use the currency conversion frame: 'this fee is ~50% of the BD minimum monthly wage'",
      "Attend virtual open houses — universities often issue waiver codes to attendees",
    ],
    icon: "Lightbulb",
    accent: "lime",
  },
];

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */

export const CATEGORIES: ResourceCategory[] = [
  {
    id: "program-search",
    number: "01",
    title: "Program search engines",
    subtitle:
      "Cast the widest net. Filter by country, degree level, field, language of instruction.",
    icon: "Compass",
    accent: "main",
    links: [
      {
        name: "Mastersportal",
        url: "https://www.mastersportal.com/",
        desc: "Global, strongest overall filter.",
        star: true,
      },
      { name: "Bachelorsportal", url: "https://www.bachelorsportal.com/", desc: "Undergrad version." },
      { name: "PhDportal", url: "https://www.phdportal.com/", desc: "Doctoral.", tags: ["phd"] },
      { name: "Shortcoursesportal", url: "https://www.shortcoursesportal.com/", desc: "Short programs." },
      { name: "StudyPortals", url: "https://www.studyportals.com/", desc: "Parent aggregator." },
      { name: "FindAMasters", url: "https://www.findamasters.com/", desc: "UK + Europe focus.", tags: ["uk", "europe"] },
      { name: "FindAPhD", url: "https://www.findaphd.com/", desc: "UK + Europe doctoral.", tags: ["phd", "uk", "europe"] },
      { name: "QS Course Finder", url: "https://www.topuniversities.com/courses", desc: "Filter by QS ranking + field." },
      { name: "Times Higher Education Student", url: "https://www.timeshighereducation.com/student", desc: "Subject-ranking-based." },
      { name: "Keystone Academic Courses", url: "https://www.keystoneacademic.com/", desc: "Large database." },
      { name: "Hotcourses Abroad", url: "https://www.hotcoursesabroad.com/", desc: "IDP-owned, Bangladesh-friendly.", tags: ["bangladesh"] },
      { name: "EducationUSA", url: "https://educationusa.state.gov/", desc: "Official US program finder.", tags: ["official", "us"] },
      { name: "Peterson's", url: "https://www.petersons.com/", desc: "US grad school database.", tags: ["us"] },
      { name: "Niche", url: "https://www.niche.com/colleges/", desc: "US with student reviews.", tags: ["us"] },
      { name: "College Board BigFuture", url: "https://bigfuture.collegeboard.org/", desc: "US undergrad focus.", tags: ["us"] },
      { name: "GradRight", url: "https://gradright.com/", desc: "AI matching on profile, GRE, budget; strong on fundability/loans.", tags: ["ai-tool"] },
      { name: "Global Admissions", url: "https://www.globaladmissions.com/", desc: "60,000+ programs, designed for international applicants." },
    ],
  },
  {
    id: "country-portals",
    number: "02",
    title: "Country-specific official portals",
    subtitle: "Authoritative data on visa, tuition, and accredited institutions.",
    icon: "Globe2",
    accent: "sky",
    links: [
      { group: "Germany", name: "DAAD Course Finder", url: "https://www2.daad.de/deutschland/studienangebote/international-programmes/en/", desc: "English-taught programs in Germany.", tags: ["official", "germany"] },
      { group: "Germany", name: "Study-in-Germany.de", url: "https://www.study-in-germany.de/", desc: "Official government portal.", tags: ["official", "germany"] },
      { group: "Germany", name: "MyGermanUniversity", url: "https://www.mygermanuniversity.com/", tags: ["germany"] },
      { group: "Germany", name: "Hochschulkompass", url: "https://www.hochschulkompass.de/en.html", desc: "Every accredited German university.", tags: ["official", "germany"] },

      { group: "United Kingdom", name: "UCAS", url: "https://www.ucas.com/", desc: "All UK undergrad applications.", tags: ["official", "uk"] },
      { group: "United Kingdom", name: "Prospects", url: "https://www.prospects.ac.uk/", desc: "UK postgrad programs.", tags: ["uk"] },
      { group: "United Kingdom", name: "UKCISA", url: "https://www.ukcisa.org.uk/", desc: "International student guidance.", tags: ["official", "uk"] },
      { group: "United Kingdom", name: "Study UK – British Council", url: "https://study-uk.britishcouncil.org/", tags: ["official", "uk"] },

      { group: "United States", name: "EducationUSA", url: "https://educationusa.state.gov/", desc: "US Dept of State official.", tags: ["official", "us"] },
      { group: "United States", name: "US News Grad Rankings", url: "https://www.usnews.com/best-graduate-schools", tags: ["us"] },
      { group: "United States", name: "College Board", url: "https://www.collegeboard.org/", tags: ["us"] },
      { group: "United States", name: "Peterson's", url: "https://www.petersons.com/", tags: ["us"] },

      { group: "Canada", name: "EduCanada", url: "https://www.educanada.ca/", desc: "Government portal.", tags: ["official"] },
      { group: "Canada", name: "ApplyBoard", url: "https://www.applyboard.com/" },
      { group: "Canada", name: "CanadaVisa Schools", url: "https://www.canadavisa.com/canadian-schools.html" },

      { group: "Australia", name: "Study Australia", url: "https://www.studyaustralia.gov.au/", desc: "Government portal.", tags: ["official"] },
      { group: "Australia", name: "CourseSeeker", url: "https://www.courseseeker.edu.au/", desc: "Every accredited course.", tags: ["official"] },

      { group: "France", name: "Campus France", url: "https://www.campusfrance.org/en", tags: ["official", "europe"] },
      { group: "Netherlands", name: "Study in NL", url: "https://www.studyinnl.org/", tags: ["official", "europe"] },

      { group: "Sweden", name: "University Admissions", url: "https://www.universityadmissions.se/", desc: "Central application portal.", tags: ["official", "europe"] },
      { group: "Sweden", name: "Study in Sweden", url: "https://studyinsweden.se/", tags: ["official", "europe"] },

      { group: "Norway", name: "Study in Norway", url: "https://studyinnorway.no/", tags: ["official", "europe"] },
      { group: "Finland", name: "Study in Finland", url: "https://www.studyinfinland.fi/", tags: ["official", "europe"] },
      { group: "Denmark", name: "Study in Denmark", url: "https://studyindenmark.dk/", tags: ["official", "europe"] },
      { group: "Ireland", name: "Education in Ireland", url: "https://www.educationinireland.com/", tags: ["official", "europe"] },
      { group: "Switzerland", name: "Swiss Universities", url: "https://www.swissuniversities.ch/en/", tags: ["official", "europe"] },
      { group: "Italy", name: "Study in Italy", url: "https://www.studyinitaly.esteri.it/", tags: ["official", "europe"] },
      { group: "Spain", name: "Study in Spain", url: "https://www.universidades.gob.es/", tags: ["official", "europe"] },

      { group: "Japan", name: "JASSO", url: "https://www.jasso.go.jp/en/", desc: "Official scholarship + study guide.", tags: ["official"] },
      { group: "Japan", name: "Study in Japan", url: "https://www.studyinjapan.go.jp/en/", tags: ["official"] },
      { group: "South Korea", name: "Study in Korea", url: "https://www.studyinkorea.go.kr/", tags: ["official"] },
      { group: "China", name: "CUCAS", url: "https://www.cucas.cn/" },
      { group: "China", name: "Campus China", url: "https://www.campuschina.org/" },
      { group: "Singapore", name: "Contact Singapore / SingaporeEdu", url: "https://www.moe.gov.sg/", tags: ["official"] },
      { group: "Turkey", name: "Türkiye Bursları", url: "https://www.turkiyeburslari.gov.tr/", tags: ["official"] },
      { group: "Hungary", name: "Stipendium Hungaricum", url: "https://stipendiumhungaricum.hu/", tags: ["official", "europe"] },
      { group: "UAE", name: "MOHESR UAE", url: "https://www.mohesr.gov.ae/", tags: ["official"] },
    ],
  },
  {
    id: "scholarships",
    number: "03",
    title: "Scholarship databases",
    subtitle: "Where the money lives. Aggregators, government programmes, and private foundations.",
    icon: "Coins",
    accent: "amber",
    links: [
      { group: "Global aggregators", name: "Scholars4Dev", url: "https://www.scholars4dev.com/", desc: "Filter by nationality, has Bangladesh tag.", tags: ["bangladesh"], star: true },
      { group: "Global aggregators", name: "GlobalScholarships.com", url: "https://globalscholarships.com/", desc: "Massive database, fully-funded only." },
      { group: "Global aggregators", name: "ScholarshipPortal", url: "https://www.scholarshipportal.com/", desc: "StudyPortals' scholarship arm." },
      { group: "Global aggregators", name: "ScholarshipTab", url: "https://www.scholarshiptab.com/", desc: "Bangladesh-specific lists.", tags: ["bangladesh"] },
      { group: "Global aggregators", name: "Opportunities Circle", url: "https://www.opportunitiescircle.com/" },
      { group: "Global aggregators", name: "Opportunity Desk", url: "https://opportunitydesk.org/", desc: "Weekly roundups." },
      { group: "Global aggregators", name: "ProFellow", url: "https://www.profellow.com/", desc: "Fellowships + fully-funded PhDs.", tags: ["phd"] },
      { group: "Global aggregators", name: "FellowshipBard", url: "https://fellowshipbard.com/" },
      { group: "Global aggregators", name: "WeMakeScholars", url: "https://www.wemakescholars.com/", desc: "Bangladesh filter available.", tags: ["bangladesh"] },
      { group: "Global aggregators", name: "ScholarshipsAds", url: "https://www.scholarshipsads.com/" },
      { group: "Global aggregators", name: "Scholarship Bob", url: "https://www.scholarshipbob.com/" },
      { group: "Global aggregators", name: "IEFA — International Education Financial Aid", url: "https://www.iefa.org/" },
      { group: "Global aggregators", name: "InternationalScholarships.com", url: "https://www.internationalscholarships.com/" },
      { group: "Global aggregators", name: "eduPASS", url: "https://www.edupass.org/" },
      { group: "Global aggregators", name: "Bold.org", url: "https://bold.org/scholarships/", tags: ["scam-warning"] },
      { group: "Global aggregators", name: "Fastweb", url: "https://www.fastweb.com/", desc: "Mostly US.", tags: ["us", "reddit-pick"] },
      { group: "Global aggregators", name: "Scholarships360", url: "https://scholarships360.org/" },
      { group: "Global aggregators", name: "Go Overseas Scholarships", url: "https://www.gooverseas.com/blog/study-abroad-scholarships-grants" },
      { group: "Global aggregators", name: "Going Merry", url: "https://www.goingmerry.com/", desc: "Legit, auto-fills multiple applications.", tags: ["reddit-pick"] },
      { group: "Global aggregators", name: "Appily (formerly Cappex)", url: "https://www.appily.com/", desc: "Listings + college insights.", tags: ["reddit-pick"] },
      { group: "Global aggregators", name: "Chegg Scholarships", url: "https://www.chegg.com/scholarships" },
      { group: "Global aggregators", name: "Access Scholarships", url: "https://accessscholarships.com/", desc: "Low-competition / niche scholarships." },
      { group: "Global aggregators", name: "ScholarshipOwl", url: "https://scholarshipowl.com/", desc: "Use auto-apply cautiously.", tags: ["scam-warning"] },

      { group: "Government / major programmes", name: "Chevening (UK)", url: "https://www.chevening.org/", tags: ["official", "uk"] },
      { group: "Government / major programmes", name: "Commonwealth Scholarships (UK)", url: "https://cscuk.fcdo.gov.uk/", tags: ["official", "uk"] },
      { group: "Government / major programmes", name: "GREAT Scholarships – Bangladesh", url: "https://study-uk.britishcouncil.org/scholarships-funding/great-scholarships/bangladesh", tags: ["bangladesh", "official", "uk"], star: true },
      { group: "Government / major programmes", name: "Fulbright Bangladesh", url: "https://bd.usembassy.gov/education-culture/fulbright-program/", tags: ["bangladesh", "official", "us"], star: true },
      { group: "Government / major programmes", name: "DAAD Scholarship Database", url: "https://www2.daad.de/deutschland/stipendium/datenbank/en/21148-scholarship-database/", tags: ["official", "germany"] },
      { group: "Government / major programmes", name: "Erasmus+ Programme Guide", url: "https://erasmus-plus.ec.europa.eu/", tags: ["official", "europe"] },
      { group: "Government / major programmes", name: "Erasmus Mundus Catalogue", url: "https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en", tags: ["official", "europe"] },
      { group: "Government / major programmes", name: "Australia Awards", url: "https://www.dfat.gov.au/people-to-people/australia-awards", tags: ["official"] },
      { group: "Government / major programmes", name: "Vanier Canada Graduate Scholarships", url: "https://vanier.gc.ca/", tags: ["official"] },
      { group: "Government / major programmes", name: "MEXT (Japan)", url: "https://www.studyinjapan.go.jp/en/planning/scholarship/", tags: ["official"] },
      { group: "Government / major programmes", name: "Swedish Institute Scholarships", url: "https://si.se/en/apply/scholarships/", tags: ["official", "europe"] },
      { group: "Government / major programmes", name: "Holland Scholarship", url: "https://www.studyinholland.nl/finances/holland-scholarship", tags: ["official", "europe"] },
      { group: "Government / major programmes", name: "Eiffel Excellence (France)", url: "https://www.campusfrance.org/en/eiffel-scholarship-program-of-excellence", tags: ["official", "europe"] },
      { group: "Government / major programmes", name: "Korean Government Scholarship (GKS)", url: "https://www.studyinkorea.go.kr/en/sub/gks/allnew_invite.do", tags: ["official"] },
      { group: "Government / major programmes", name: "Chinese Government Scholarship (CSC)", url: "https://www.campuschina.org/", tags: ["official"] },
      { group: "Government / major programmes", name: "Türkiye Bursları", url: "https://www.turkiyeburslari.gov.tr/", tags: ["official"] },
      { group: "Government / major programmes", name: "Stipendium Hungaricum", url: "https://stipendiumhungaricum.hu/", tags: ["official", "europe"] },
      { group: "Government / major programmes", name: "Ministry of Foreign Affairs Bangladesh — Scholarships", url: "https://mofa.gov.bd/site/page/4d3e5b27-0827-435f-b31f-47917510962b/Scholarships", tags: ["bangladesh", "official"] },

      { group: "Private & foundation", name: "Rhodes Scholarship", url: "https://www.rhodeshouse.ox.ac.uk/" },
      { group: "Private & foundation", name: "Gates Cambridge", url: "https://www.gatescambridge.org/" },
      { group: "Private & foundation", name: "Schwarzman Scholars", url: "https://www.schwarzmanscholars.org/" },
      { group: "Private & foundation", name: "Knight-Hennessy (Stanford)", url: "https://knight-hennessy.stanford.edu/" },
      { group: "Private & foundation", name: "Joint Japan / World Bank Graduate Scholarship", url: "https://www.worldbank.org/en/programs/scholarships" },
      { group: "Private & foundation", name: "Aga Khan Foundation ISP", url: "https://www.akdn.org/our-agencies/aga-khan-foundation/international-scholarship-programme" },
      { group: "Private & foundation", name: "OFID Scholarship", url: "https://opecfund.org/what-we-do/grants/scholarship-award" },
      { group: "Private & foundation", name: "Inlaks Shivdasani", url: "https://www.inlaksfoundation.org/", desc: "South Asia." },
    ],
  },
  {
    id: "predictors",
    number: "04",
    title: "Profile evaluation & AI admit predictors",
    subtitle: "Feed in CGPA + GRE + IELTS → get an Ambitious / Moderate / Safe split.",
    icon: "BrainCircuit",
    accent: "lime",
    links: [
      { group: "Traditional predictors", name: "GyanDhan Admit Predictor", url: "https://www.gyandhan.com/admit-predictor", star: true },
      { group: "Traditional predictors", name: "YMGrad UniPredict", url: "https://ymgrad.com/unipredict", star: true },
      { group: "Traditional predictors", name: "GradRight SelectRight", url: "https://gradright.com/selectright/" },
      { group: "Traditional predictors", name: "ApplyBuddy", url: "https://theapplybuddy.com/" },
      { group: "Traditional predictors", name: "Yocket", url: "https://yocket.com/", desc: "Predictor + community + real admits.", tags: ["community", "reddit-pick"], star: true },
      { group: "Traditional predictors", name: "CollegeDunia Abroad", url: "https://collegedunia.com/abroad" },
      { group: "Traditional predictors", name: "Leverage Edu AI Course Finder", url: "https://leverageedu.com/", tags: ["ai-tool"] },
      { group: "Traditional predictors", name: "Profile Evaluator", url: "https://www.profileevaluator.com/", desc: "US MS focused.", tags: ["us"] },
      { group: "Traditional predictors", name: "Stoodnt", url: "https://www.stoodnt.com/" },
      { group: "Traditional predictors", name: "CrunchPrep GRE University Finder", url: "https://crunchprep.com/gre/universities-based-on-gre-scores" },
      { group: "Traditional predictors", name: "AdmitEDGE", url: "https://www.admitedge.com/", desc: "University Shortlister, heavily used in South Asia." },
      { group: "Traditional predictors", name: "Admits.fyi", url: "https://admits.fyi/", desc: "Data-driven admit profiles. Reddit-favoured for CS/STEM.", tags: ["reddit-pick", "cs", "stem"] },

      { group: "AI-powered (2025/2026)", name: "Studyportals AI Student Advisor (Sophia)", url: "https://www.mastersportal.com/articles/3115/meet-sophia-your-ai-powered-student-advisor.html", desc: "Trained AI matching budget/profile.", tags: ["ai-tool"] },
      { group: "AI-powered (2025/2026)", name: "ApplyBoard", url: "https://www.applyboard.com/", desc: "AI matching with highest visa/acceptance likelihood.", tags: ["ai-tool"] },
      { group: "AI-powered (2025/2026)", name: "Perplexity AI", url: "https://www.perplexity.ai/", desc: "Prompt-based comparison (e.g., ROI MS CS at TUM vs Delft).", tags: ["ai-tool"] },
      { group: "AI-powered (2025/2026)", name: "AdmitYogi", url: "https://admityogi.com/", desc: "Compares your profile to past successful applicants.", tags: ["ai-tool"] },
    ],
  },
  {
    id: "real-admits",
    number: "05",
    title: "Real admit data & community",
    subtitle: "Don't trust predictors alone — validate with actual admits.",
    icon: "Users2",
    accent: "pink",
    links: [
      { name: "The Grad Cafe", url: "https://www.thegradcafe.com/", desc: "Historical admit/reject data, searchable.", star: true, tags: ["reddit-pick"] },
      { name: "Yocket Community Feed", url: "https://yocket.com/feed", desc: "BD students post profiles + results.", tags: ["bangladesh", "community"] },
      { name: "Reddit — r/gradadmissions", url: "https://www.reddit.com/r/gradadmissions/", tags: ["community", "reddit-pick"] },
      { name: "Reddit — r/GradSchool", url: "https://www.reddit.com/r/GradSchool/", tags: ["community"] },
      { name: "Reddit — r/csMajors", url: "https://www.reddit.com/r/csMajors/", tags: ["community", "cs"] },
      { name: "Reddit — r/EngineeringStudents", url: "https://www.reddit.com/r/EngineeringStudents/", tags: ["community"] },
      { name: "Reddit — r/MBA", url: "https://www.reddit.com/r/MBA/", tags: ["community", "mba"] },
      { name: "Reddit — r/Scholar", url: "https://www.reddit.com/r/Scholar/", tags: ["community"] },
      { name: "Reddit — r/bangladesh", url: "https://www.reddit.com/r/bangladesh/", tags: ["community", "bangladesh"] },

      { group: "Discord & Telegram", name: "Study Together (Discord)", url: "https://discord.gg/study", desc: "700k+ members, largest study server.", tags: ["community"] },
      { group: "Discord & Telegram", name: "Study Abroad Discord", url: "https://discord.me/studyabroad", tags: ["community"] },
      { group: "Discord & Telegram", name: "International Study Buddies (Discord)", url: "https://discord.com/invite/international-study-buddies-843095104272072714", tags: ["community"] },
      { group: "Discord & Telegram", name: "DISBOARD — study-abroad tag", url: "https://disboard.org/servers/tag/study-abroad", tags: ["community"] },
      { group: "Discord & Telegram", name: "DISBOARD — scholarships tag", url: "https://disboard.org/servers/tag/scholarships", tags: ["community"] },
      { group: "Discord & Telegram", name: "Career Width Telegram guide", url: "https://www.careerwidth.com/blog/best-telegram-groups-for-study-abroad-students/", desc: "Scholarship alerts.", tags: ["community"] },
    ],
  },
  {
    id: "rankings",
    number: "06",
    title: "Rankings — for fit, not worship",
    subtitle: "Use these to compare programmes by subject and research output, not vibes.",
    icon: "Trophy",
    accent: "amber",
    links: [
      { name: "QS World University Rankings by Subject", url: "https://www.topuniversities.com/subject-rankings", desc: "Most credible for subject-level.", star: true },
      { name: "Times Higher Education World Rankings", url: "https://www.timeshighereducation.com/world-university-rankings" },
      { name: "Times Higher Education by Subject", url: "https://www.timeshighereducation.com/world-university-rankings/by-subject", desc: "Cross-reference with QS." },
      { name: "ARWU / Shanghai Ranking", url: "https://www.shanghairanking.com/", desc: "Research-heavy." },
      { name: "CSRankings", url: "https://csrankings.org/", desc: "Best for CS — citation-based, not marketing.", star: true, tags: ["cs", "reddit-pick"] },
      { name: "US News Best Global Universities", url: "https://www.usnews.com/education/best-global-universities" },
      { name: "Nature Index", url: "https://www.nature.com/nature-index/", desc: "Research output, sciences.", tags: ["stem"] },
      { name: "Google Scholar Metrics", url: "https://scholar.google.com/citations?view_op=top_venues", desc: "Venue + lab reputation." },
    ],
  },
  {
    id: "phd-research",
    number: "07",
    title: "PhD & research position boards",
    subtitle: "Fully-funded research roles — apply like a job, no separate scholarship needed.",
    icon: "FlaskConical",
    accent: "sky",
    links: [
      { name: "EURAXESS", url: "https://euraxess.ec.europa.eu/jobs", desc: "1,500+ EU-funded PhD positions — main EU job board.", star: true, tags: ["phd", "europe", "reddit-pick"] },
      { name: "Academic Positions", url: "https://academicpositions.com/", desc: "Global academic jobs + PhDs.", tags: ["phd"] },
      { name: "Nature Careers", url: "https://www.nature.com/naturecareers/jobs", desc: "Research positions.", tags: ["phd", "stem"] },
      { name: "FindAPhD", url: "https://www.findaphd.com/", tags: ["phd"] },
      { name: "ScholarshipDb", url: "https://scholarshipdb.net/", desc: "Pulls from official uni sites.", tags: ["phd", "reddit-pick"] },
      { name: "PhD Finland", url: "https://www.aka.fi/en/", tags: ["phd", "europe"] },
      { name: "Marie Skłodowska-Curie Actions (MSCA)", url: "https://marie-sklodowska-curie-actions.ec.europa.eu/", desc: "Doctoral networks, fully funded.", tags: ["phd", "europe"] },
      { name: "jobs.ac.uk", url: "https://www.jobs.ac.uk/", desc: "UK & global academic jobs.", tags: ["uk"] },
      { name: "ScienceCareers", url: "https://jobs.sciencecareers.org/", tags: ["stem"] },
      { name: "Times Higher Education Jobs", url: "https://www.timeshighereducation.com/unijobs/" },
    ],
  },
  {
    id: "cost-living-basic",
    number: "08",
    title: "Cost of living & practical living",
    subtitle: "Tuition is half the bill. Living is the other half.",
    icon: "Wallet",
    accent: "lime",
    links: [
      { name: "Numbeo", url: "https://www.numbeo.com/cost-of-living/", desc: "Cost per city.", star: true },
      { name: "Expatistan", url: "https://www.expatistan.com/cost-of-living", desc: "City comparisons." },
      { name: "Nomad List", url: "https://nomadlist.com/" },
      { name: "StudentCrowd", url: "https://www.studentcrowd.com/", desc: "UK student reviews.", tags: ["uk"] },
      { name: "Rate My Professors", url: "https://www.ratemyprofessors.com/", desc: "US/UK/Canada profs.", tags: ["us", "uk"] },
      { name: "Study.eu", url: "https://www.study.eu/", desc: "Europe-specific cost + program data.", tags: ["europe"] },
    ],
  },
  {
    id: "test-prep",
    number: "09",
    title: "Test prep — IELTS / TOEFL / GRE / GMAT / SAT / Duolingo",
    icon: "GraduationCap",
    accent: "main",
    links: [
      { name: "ETS — GRE, TOEFL official", url: "https://www.ets.org/", tags: ["official"] },
      { name: "IELTS Official (British Council / IDP)", url: "https://www.ielts.org/", tags: ["official"] },
      { name: "Duolingo English Test", url: "https://englishtest.duolingo.com/" },
      { name: "GMAT Official", url: "https://www.mba.com/", tags: ["official", "mba"] },
      { name: "College Board — SAT", url: "https://satsuite.collegeboard.org/", tags: ["official"] },
      { name: "Magoosh", url: "https://magoosh.com/", desc: "GRE / GMAT prep." },
      { name: "Manhattan Prep", url: "https://www.manhattanprep.com/" },
      { name: "Khan Academy", url: "https://www.khanacademy.org/", desc: "Free SAT prep.", tags: ["free"] },
    ],
  },
  {
    id: "sop-cv",
    number: "10",
    title: "SOP / LOR / CV help",
    icon: "PenLine",
    accent: "pink",
    links: [
      { name: "Yocket SOP Samples", url: "https://yocket.com/sop-samples" },
      { name: "DAAD CV template (Europass)", url: "https://europa.eu/europass/en", desc: "Required for many EU apps.", tags: ["europe", "official"] },
      { name: "GradeSaver SOP", url: "https://www.gradesaver.com/" },
      { name: "Writefull", url: "https://www.writefull.com/", desc: "Academic writing checker." },
      { name: "Grammarly", url: "https://www.grammarly.com/" },
      { name: "Overleaf", url: "https://www.overleaf.com/", desc: "LaTeX CV templates." },
      { name: "Purdue OWL", url: "https://owl.purdue.edu/", desc: "Academic writing rules." },
    ],
  },
  {
    id: "bd-counseling",
    number: "11",
    title: "Bangladesh-specific counseling & tools",
    subtitle: "Mostly free. Skip predatory paid agencies.",
    icon: "MapPin",
    accent: "pink",
    links: [
      { group: "Online tools & apps", name: "Calciora", url: "https://calciora.com/", desc: "Curated directory for BD students by funding type and deadlines.", tags: ["bangladesh"] },
      { group: "Online tools & apps", name: "IDP Live App", url: "https://www.idp.com/bangladesh/idp-live-app/", desc: "Mobile app with FastLane tracking, 5,000+ scholarships.", tags: ["bangladesh"] },

      { group: "Counseling agencies (mostly free)", name: "EducationUSA Bangladesh", url: "https://bd.usembassy.gov/education-culture/educationusa/", desc: "Free, official US guidance.", tags: ["bangladesh", "official", "free", "us"], star: true },
      { group: "Counseling agencies (mostly free)", name: "British Council Bangladesh", url: "https://www.britishcouncil.org.bd/", tags: ["bangladesh", "official", "uk"] },
      { group: "Counseling agencies (mostly free)", name: "IDP Bangladesh", url: "https://www.idp.com/bangladesh/", desc: "Best for AUS, UK, CAD.", tags: ["bangladesh"] },
      { group: "Counseling agencies (mostly free)", name: "EZY Study Abroad", url: "https://ezystudyabroad.com/", desc: "High visa success rates for AU and NZ.", tags: ["bangladesh"] },
      { group: "Counseling agencies (mostly free)", name: "EuroStaffs", url: "https://eurostaffs.org/", desc: "Specialises in Europe (DE, PL, HU).", tags: ["bangladesh", "europe"] },
      { group: "Counseling agencies (mostly free)", name: "MACES Bangladesh", url: "https://macesbd.com/", desc: "Premium UK and US placements.", tags: ["bangladesh"] },
      { group: "Counseling agencies (mostly free)", name: "PFEC Global", url: "https://pfecglobal.com.bd/", desc: "Specialises in Australia and Canada.", tags: ["bangladesh"] },
      { group: "Counseling agencies (mostly free)", name: "AECC Global Bangladesh", url: "https://aeccglobal.com.bd/", tags: ["bangladesh"] },
      { group: "Counseling agencies (mostly free)", name: "Sangen Edu", url: "https://www.sangenbd.com/", tags: ["bangladesh"] },
      { group: "Counseling agencies (mostly free)", name: "IECC Bangladesh", url: "https://iecc.co.uk/", tags: ["bangladesh"] },
      { group: "Counseling agencies (mostly free)", name: "Boost Education Service", url: "https://www.boosteducationservice.co.uk/", tags: ["bangladesh"] },
      { group: "Counseling agencies (mostly free)", name: "DAAD Information Centre Dhaka", url: "https://www.daad.de/en/", desc: "German services.", tags: ["bangladesh", "germany", "official"] },
      { group: "Counseling agencies (mostly free)", name: "Campus France Bangladesh", url: "https://www.bangladesh.campusfrance.org/", tags: ["bangladesh", "official"] },
      { group: "Counseling agencies (mostly free)", name: "Alliance Française de Dhaka", url: "https://afdhaka.org/", desc: "French language + France counselling.", tags: ["bangladesh"] },
    ],
  },
  {
    id: "loans",
    number: "13",
    title: "Education loan & funding",
    subtitle: "When scholarships don't fully cover.",
    icon: "Banknote",
    accent: "amber",
    links: [
      { name: "MPOWER Financing", url: "https://www.mpowerfinancing.com/en-bd/", desc: "Loan for international students, no cosigner.", tags: ["bangladesh"] },
      { name: "Prodigy Finance", url: "https://prodigyfinance.com/", desc: "No-cosigner loans for grad school." },
      { name: "GyanDhan", url: "https://www.gyandhan.com/", desc: "South-Asia loan marketplace, works for BD.", tags: ["bangladesh"] },
      { name: "HSBC International Student Loan", url: "https://www.hsbc.com/" },
      { name: "Bangladesh banks (EBL, City, BRAC)", url: "https://www.bb.org.bd/", desc: "Check current student loan offerings.", tags: ["bangladesh"] },
    ],
  },
  {
    id: "youtube",
    number: "13b",
    title: "YouTube — Bangladeshi creators",
    subtitle: "Search-driven. The right channel rotates by intake cycle.",
    icon: "Youtube",
    accent: "pink",
    links: [
      { name: "YouTube · Higher Study Abroad Bangladesh", url: "https://www.youtube.com/results?search_query=Higher+Study+Abroad+Bangladesh", desc: "Search query.", tags: ["bangladesh"] },
      { name: "YouTube · Scholarship Bangladeshi student", url: "https://www.youtube.com/results?search_query=Scholarship+Bangladeshi+student", desc: "Search query.", tags: ["bangladesh"] },
      { name: "YouTube · BUET / DU / AIUB alumni admit vlogs", url: "https://www.youtube.com/results?search_query=BUET+admit+vlog+abroad", desc: "Search by university name.", tags: ["bangladesh"] },
    ],
  },
  {
    id: "women-stem",
    number: "14",
    title: "Women in STEM & diversity scholarships",
    icon: "Sparkles",
    accent: "pink",
    links: [
      { name: "British Council Women in STEM Scholarships", url: "https://www.britishcouncil.org/study-work-abroad/in-uk/scholarship-women-stem", desc: "Fully-funded UK masters, ~£40k+, open to BD.", tags: ["bangladesh", "women", "stem", "uk", "official"], star: true },
      { name: "Schlumberger Faculty for the Future", url: "https://www.facultyforthefuture.net/", desc: "PhD/postdoc, women from developing countries.", tags: ["women", "phd"] },
      { name: "AAUW International Fellowships", url: "https://www.aauw.org/resources/programs/fellowships-grants/", desc: "Women studying in USA.", tags: ["women", "us"] },
      { name: "Microsoft Research PhD Fellowship", url: "https://www.microsoft.com/en-us/research/academic-program/phd-fellowship/", desc: "Women in CS / EE / Math.", tags: ["women", "cs", "phd"] },
      { name: "WAAW Foundation", url: "https://waawfoundation.org/", desc: "African + global women in STEM.", tags: ["women", "stem"] },
      { name: "Google Women Techmakers Scholarship", url: "https://www.womentechmakers.com/scholars", desc: "CS / tech women.", tags: ["women", "cs"] },
      { name: "L'Oréal-UNESCO For Women in Science", url: "https://www.forwomeninscience.com/", tags: ["women", "stem"] },
      { name: "OWSD Fellowships", url: "https://owsd.net/", desc: "Org for Women in Science for the Developing World.", tags: ["women", "stem"] },
      { name: "ScholarshipTab — Women from developing countries", url: "https://www.scholarshiptab.com/developing-countries/women", tags: ["women"] },
      { name: "Bold.org — Women in STEM", url: "https://bold.org/scholarships/by-demographics/women/women-stem-scholarships/", tags: ["women", "stem"] },
    ],
  },
  {
    id: "tuition-free",
    number: "15",
    title: "Tuition-free / low-cost countries",
    subtitle: "Where you can study cheaply even without a scholarship.",
    icon: "PackageCheck",
    accent: "lime",
    links: [
      { name: "Mastersportal — Tuition-free Europe guide", url: "https://www.mastersportal.com/articles/3200/free-universities-in-europe.html", tags: ["europe", "free-tuition"] },
      { name: "Germany — public unis ~free (BW ~€1,500/sem non-EU)", url: "https://www.study-in-germany.de/", tags: ["germany", "free-tuition", "official"] },
      { name: "Norway — free for EU/EEA, some non-EU programmes still free", url: "https://studyinnorway.no/", tags: ["europe", "free-tuition"] },
      { name: "Iceland — free at 4 public universities", url: "https://www.studyiniceland.is/", tags: ["europe", "free-tuition"] },
      { name: "Finland — free for EU/EEA, scholarships for non-EU", url: "https://www.studyinfinland.fi/", tags: ["europe", "free-tuition"] },
      { name: "Austria — ~€726/semester for non-EU", url: "https://studyinaustria.at/", tags: ["europe", "free-tuition"] },
      { name: "Czech Republic — free if studying in Czech, cheap in English", url: "https://www.studyin.cz/", tags: ["europe", "free-tuition"] },
      { name: "France — public unis ~€3k/yr non-EU", url: "https://www.campusfrance.org/en", tags: ["europe", "free-tuition"] },
      { name: "Poland — low tuition, many English-taught", url: "https://www.go-poland.pl/", tags: ["europe", "free-tuition"] },
      { name: "Slovenia — free / low for many programmes", url: "https://www.gov.si/en/topics/study-in-slovenia/", tags: ["europe", "free-tuition"] },
      { name: "Argentina / Brazil / Mexico — free public unis (Spanish/Portuguese)", url: "https://www.educacion.gob.ar/", tags: ["free-tuition"] },
      { name: "Scholars4Dev — free tuition countries list", url: "https://www.scholars4dev.com/4031/list-of-european-countries-with-tuition-freelow-tuition-universities-colleges/", tags: ["europe", "free-tuition"] },
      { name: "Beyond The States", url: "https://beyondthestates.com/", desc: "DB of English-taught European programs.", tags: ["europe"] },
      { name: "Global Admissions — 50+ free universities", url: "https://www.globaladmissions.com/blog/study-abroad-for-free-universities-with-no-tuition-fee-for-international-students", tags: ["free-tuition"] },
    ],
  },
  {
    id: "exchange",
    number: "16",
    title: "Exchange & short-term programmes",
    subtitle: "Test the waters before full-degree commitment.",
    icon: "Plane",
    accent: "sky",
    links: [
      { name: "ISEP Study Abroad", url: "https://www.isepstudyabroad.org/", desc: "Exchange network across 50+ countries." },
      { name: "CEA CAPA Education Abroad", url: "https://www.ceastudyabroad.com/" },
      { name: "DAAD RISE Germany", url: "https://www.daad.de/rise/en/", desc: "Summer research in Germany.", tags: ["germany", "stem"] },
      { name: "IAESTE", url: "https://iaeste.org/", desc: "International technical internships.", tags: ["stem"] },
      { name: "AIESEC", url: "https://aiesec.org/", desc: "Student exchange, global network." },
      { name: "Fulbright Foreign Language Teaching Assistant", url: "https://fulbrightteacherexchanges.org/", tags: ["us", "official"] },
      { name: "DAAD Summer Schools", url: "https://www2.daad.de/deutschland/stipendium/en/", tags: ["germany"] },
      { name: "Erasmus+ Traineeships", url: "https://erasmus-plus.ec.europa.eu/", desc: "Work placements in EU.", tags: ["europe", "official"] },
      { name: "Study Abroad Foundation (SAF)", url: "https://www.studyabroadfoundation.org/" },
      { name: "Semester at Sea", url: "https://www.semesteratsea.org/" },
    ],
  },
  {
    id: "niche",
    number: "17",
    title: "Niche & specialised (often overlooked)",
    icon: "Layers3",
    accent: "main",
    links: [
      { name: "Niche — Top colleges for international students", url: "https://www.niche.com/colleges/search/top-colleges-for-international-students/", desc: "US focus.", tags: ["us"] },
      { name: "Beyond The States", url: "https://beyondthestates.com/", desc: "English-taught Europe (non-UK).", tags: ["europe"] },
      { name: "Study.eu", url: "https://www.study.eu/", desc: "Europe-wide program + scholarship search.", tags: ["europe"] },
      { name: "GoAbroad.com", url: "https://www.goabroad.com/", desc: "All types of international programs." },
      { name: "IIE Passport", url: "https://www.iiepassport.org/", desc: "Study abroad program database." },
      { name: "EduRank", url: "https://edurank.org/", desc: "Alt ranking with subject granularity." },
      { name: "Shiksha Study Abroad", url: "https://www.shiksha.com/studyabroad", desc: "India-based, useful for South Asia." },
      { name: "ApplyKite", url: "https://www.applykite.com/", desc: "Fully-funded PhD guides.", tags: ["phd"] },
      { name: "OpportunityDesk Academy", url: "https://opportunitydesk.org/", desc: "Weekly opportunity newsletter.", tags: ["newsletter"] },
      { name: "The PIE News", url: "https://thepienews.com/", desc: "International education industry news." },
    ],
  },
  {
    id: "comparison-tools",
    number: "18",
    title: "University comparison & decision tools",
    icon: "ClipboardList",
    accent: "sky",
    links: [
      { name: "Unibuddy", url: "https://unibuddy.com/", desc: "Chat with current students at unis worldwide." },
      { name: "Crimson Education", url: "https://www.crimsoneducation.org/", desc: "Paid, but free comparison tools." },
      { name: "UniCompare", url: "https://www.unicompare.com/", desc: "UK focus.", tags: ["uk"] },
      { name: "Studee", url: "https://studee.com/", desc: "AI-powered matcher.", tags: ["ai-tool"] },
      { name: "Edvoy", url: "https://edvoy.com/", desc: "Shortlist + application management." },
    ],
  },
  {
    id: "opportunity-hubs",
    number: "19",
    title: "Opportunity hubs & daily aggregators",
    subtitle: "Daily-posted scholarships, fellowships, internships.",
    icon: "Newspaper",
    accent: "amber",
    links: [
      { name: "Opportunities Corners", url: "https://opportunitiescorners.com/", desc: "Daily global scholarships + fellowships + exchanges." },
      { name: "Opportunities Corner Telegram", url: "https://t.me/s/opcorners", desc: "Live feed.", tags: ["community"] },
      { name: "Opportunity Desk", url: "https://opportunitydesk.org/", desc: "Weekly roundups." },
      { name: "Opportunities for Youth", url: "https://opportunitiesforyouth.org/" },
      { name: "Scholarships Corner", url: "https://scholarshipscorner.website/", desc: "Fully-funded focus." },
      { name: "Opportunity Corner (alt)", url: "https://opportunitycornors.com/" },
      { name: "Youth Opportunities Hub", url: "https://www.youthop.com/" },
      { name: "YouthLead", url: "https://www.youthlead.org/" },
      { name: "Mladiinfo", url: "https://www.mladiinfo.eu/", desc: "Europe-focused.", tags: ["europe"] },
      { name: "After School Africa", url: "https://www.afterschoolafrica.com/", desc: "Scholarships for developing countries." },
      { name: "For9a", url: "https://www.for9a.com/", desc: "MENA + global." },
      { name: "UN Careers", url: "https://careers.un.org/", tags: ["official"] },
      { name: "World Bank Opportunities", url: "https://www.worldbank.org/en/about/careers", tags: ["official"] },
      { name: "IMF Internship", url: "https://www.imf.org/en/About/Careers", tags: ["official"] },
    ],
  },
  {
    id: "newsletters",
    number: "20",
    title: "Scholarship newsletters",
    subtitle: "Subscribe to 2–3 — not all. Higher hit-rate than browsing.",
    icon: "Mail",
    accent: "lime",
    links: [
      { name: "Opportunity Desk Newsletter", url: "https://opportunitydesk.org/", tags: ["newsletter"] },
      { name: "Scholars4Dev Subscription", url: "https://www.scholars4dev.com/", tags: ["newsletter"] },
      { name: "Scholarship Region", url: "https://www.scholarshipregion.com/", tags: ["newsletter"] },
      { name: "Scholarships.com Newsletter", url: "https://www.scholarships.com/", tags: ["newsletter"] },
      { name: "ScholarshipMentor", url: "http://scholarshipmentor.com/content/free-monthly-scholarship-newsletter", tags: ["newsletter"] },
      { name: "The Scholarship Collective", url: "https://www.thescholarshipcollective.com/", tags: ["newsletter"] },
      { name: "ProFellow Newsletter", url: "https://www.profellow.com/", tags: ["newsletter", "phd"] },
      { name: "Goodwall Blog", url: "https://www.goodwall.io/blog/best-newsletters-for-students/", desc: "Aggregates newsletter lists." },
      { name: "Fastweb", url: "https://www.fastweb.com/", desc: "Matches your profile to new awards.", tags: ["newsletter"] },
    ],
  },
  {
    id: "reddit",
    number: "21",
    title: "Reddit — every subreddit that matters",
    subtitle:
      "Use `site:reddit.com \"your program\" admit` on Google — pulls hidden gems faster than Reddit search.",
    icon: "MessagesSquare",
    accent: "pink",
    links: [
      { group: "Admissions & profile review", name: "r/gradadmissions", url: "https://www.reddit.com/r/gradadmissions/", desc: "333k members, most active.", tags: ["community", "reddit-pick"], star: true },
      { group: "Admissions & profile review", name: "r/GradSchool", url: "https://www.reddit.com/r/GradSchool/", tags: ["community"] },
      { group: "Admissions & profile review", name: "r/PhD", url: "https://www.reddit.com/r/PhD/", tags: ["community", "phd"] },
      { group: "Admissions & profile review", name: "r/ApplyingToCollege", url: "https://www.reddit.com/r/ApplyingToCollege/", desc: "Undergrad focus.", tags: ["community"] },
      { group: "Admissions & profile review", name: "r/chanceme", url: "https://www.reddit.com/r/chanceme/", desc: "Profile evaluation.", tags: ["community"] },
      { group: "Admissions & profile review", name: "r/IntltoUSA", url: "https://www.reddit.com/r/IntltoUSA/", desc: "International → USA.", tags: ["community", "us"] },
      { group: "Admissions & profile review", name: "r/MBA", url: "https://www.reddit.com/r/MBA/", tags: ["community", "mba"] },

      { group: "Scholarships & funding", name: "r/scholarships", url: "https://www.reddit.com/r/scholarships/", desc: "20k+ members.", tags: ["community"] },
      { group: "Scholarships & funding", name: "r/Scholar", url: "https://www.reddit.com/r/Scholar/", tags: ["community"] },
      { group: "Scholarships & funding", name: "r/FindAPhD", url: "https://www.reddit.com/r/FindAPhD/", tags: ["community", "phd"] },

      { group: "By field", name: "r/csMajors", url: "https://www.reddit.com/r/csMajors/", tags: ["community", "cs"] },
      { group: "By field", name: "r/cscareerquestions", url: "https://www.reddit.com/r/cscareerquestions/", tags: ["community", "cs"] },
      { group: "By field", name: "r/EngineeringStudents", url: "https://www.reddit.com/r/EngineeringStudents/", tags: ["community", "stem"] },
      { group: "By field", name: "r/MachineLearning", url: "https://www.reddit.com/r/MachineLearning/", tags: ["community", "cs", "ai-tool"] },
      { group: "By field", name: "r/datascience", url: "https://www.reddit.com/r/datascience/", tags: ["community", "cs"] },
      { group: "By field", name: "r/AskAcademia", url: "https://www.reddit.com/r/AskAcademia/", tags: ["community"] },

      { group: "By destination", name: "r/studyAbroad", url: "https://www.reddit.com/r/studyAbroad/", tags: ["community"] },
      { group: "By destination", name: "r/IWantOut", url: "https://www.reddit.com/r/IWantOut/", desc: "Immigration + study abroad.", tags: ["community"] },
      { group: "By destination", name: "r/germany", url: "https://www.reddit.com/r/germany/", tags: ["community", "germany"] },
      { group: "By destination", name: "r/uniuk", url: "https://www.reddit.com/r/uniuk/", tags: ["community", "uk"] },
      { group: "By destination", name: "r/AskUK", url: "https://www.reddit.com/r/AskUK/", tags: ["community", "uk"] },
      { group: "By destination", name: "r/AskAnAmerican", url: "https://www.reddit.com/r/AskAnAmerican/", tags: ["community", "us"] },
      { group: "By destination", name: "r/canada", url: "https://www.reddit.com/r/canada/", tags: ["community"] },
      { group: "By destination", name: "r/CanadaUniversities", url: "https://www.reddit.com/r/CanadaUniversities/", tags: ["community"] },
      { group: "By destination", name: "r/australia", url: "https://www.reddit.com/r/australia/", tags: ["community"] },

      { group: "Bangladesh", name: "r/bangladesh", url: "https://www.reddit.com/r/bangladesh/", tags: ["community", "bangladesh"] },
      { group: "Bangladesh", name: "r/dhaka", url: "https://www.reddit.com/r/dhaka/", tags: ["community", "bangladesh"] },
    ],
  },
  {
    id: "cost-living-expanded",
    number: "22",
    title: "Cost of living (expanded)",
    icon: "Wallet",
    accent: "amber",
    links: [
      { name: "Numbeo", url: "https://www.numbeo.com/cost-of-living/", desc: "The standard, city-level.", star: true },
      { name: "Numbeo City Comparison", url: "https://www.numbeo.com/cost-of-living/comparison.jsp", desc: "Side-by-side." },
      { name: "Numbeo Country Comparison", url: "https://www.numbeo.com/cost-of-living/compare_countries.jsp" },
      { name: "LivingCost.org", url: "https://livingcost.org/cost", desc: "9,294 cities, 197 countries." },
      { name: "Expatistan", url: "https://www.expatistan.com/cost-of-living" },
      { name: "Mappr", url: "https://www.mappr.co/cost-of-living/" },
      { name: "NerdWallet Cost Calculator", url: "https://www.nerdwallet.com/cost-of-living-calculator", desc: "US focus.", tags: ["us"] },
      { name: "Best Places", url: "https://www.bestplaces.net/cost-of-living/", desc: "US cities.", tags: ["us"] },
      { name: "ERI Relocation Assessor", url: "https://www.erieri.com/cost-of-living-comparison" },
      { name: "Best Student Halls Calculator", url: "https://www.beststudenthalls.com/cost-of-living-calculator/", desc: "Student-specific." },
      { name: "Scholaro Student City Index", url: "https://www.scholaro.com/", desc: "Cheapest student cities." },
      { name: "Nomad List", url: "https://nomadlist.com/", desc: "Wifi, safety, nightlife." },
      { name: "Teleport Cities", url: "https://teleport.org/", desc: "City quality-of-life scores." },
    ],
  },
  {
    id: "accommodation",
    number: "23",
    title: "Student accommodation & roommates",
    icon: "Home",
    accent: "sky",
    links: [
      { name: "Student.com", url: "https://www.student.com/", desc: "Largest global marketplace, price match guarantee.", star: true },
      { name: "Amber (AmberStudent)", url: "https://amberstudent.com/", desc: "Verified listings, popular UK/USA/AUS/IRE." },
      { name: "uhomes", url: "https://www.uhomes.com/", desc: "Global aggregator, virtual tours + verified reviews." },
      { name: "UniAcco", url: "https://uniacco.com/", desc: "Quality housing at lower price points." },
      { name: "Nestpick", url: "https://www.nestpick.com/", desc: "Aggregator for furnished rentals." },
      { name: "Unilodgers", url: "https://www.unilodgers.com/" },
      { name: "Casita", url: "https://casita.com/" },
      { name: "HousingAnywhere", url: "https://housinganywhere.com/", desc: "Europe.", tags: ["europe"] },
      { name: "SpareRoom", url: "https://www.spareroom.com/", desc: "UK shared housing.", tags: ["uk"] },
      { name: "Uniplaces", url: "https://www.uniplaces.com/", desc: "Europe.", tags: ["europe"] },
      { name: "Erasmusu", url: "https://erasmusu.com/", desc: "Europe; rooms + roommates.", tags: ["europe"] },
      { name: "Roomi", url: "https://roomiapp.com/", desc: "Roommate match by lifestyle + budget." },
    ],
  },
  {
    id: "visa",
    number: "24",
    title: "Visa, immigration & proof of funds",
    icon: "ShieldCheck",
    accent: "main",
    links: [
      { name: "VisaGuide.World", url: "https://visaguide.world/", desc: "Visa rules per country." },
      { name: "VFS Global Bangladesh", url: "https://visa.vfsglobal.com/", desc: "Many countries route via VFS.", tags: ["bangladesh"] },
      { name: "IATA Travel Centre", url: "https://www.iatatravelcentre.com/", desc: "Transit + visa rules." },
      { name: "Immihelp", url: "https://www.immihelp.com/", desc: "Student visa guides." },
      { name: "GOV.UK Student Visa", url: "https://www.gov.uk/student-visa", tags: ["uk", "official"] },
      { name: "US Student Visa (F-1 / J-1)", url: "https://travel.state.gov/content/travel/en/us-visas/study.html", tags: ["us", "official"] },
      { name: "Canada Study Permit (IRCC)", url: "https://www.canada.ca/en/immigration-refugees-citizenship.html", tags: ["official"] },
      { name: "German Student Visa", url: "https://www.germany-visa.org/student-visa/", tags: ["germany"] },
      { name: "Australia Student Visa (500)", url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500", tags: ["official"] },
      { name: "Schengen Info", url: "https://www.schengenvisainfo.com/", tags: ["europe"] },
    ],
  },
  {
    id: "field-databases",
    number: "25",
    title: "Field & subject-specific databases",
    icon: "Microscope",
    accent: "lime",
    links: [
      { group: "CS / AI / ML", name: "CSRankings", url: "https://csrankings.org/", tags: ["cs"] },
      { group: "CS / AI / ML", name: "AI Deadlines", url: "https://aideadlin.es/", desc: "Conference deadlines.", tags: ["cs", "ai-tool"] },
      { group: "CS / AI / ML", name: "Papers with Code", url: "https://paperswithcode.com/", desc: "Find labs doing work you like.", tags: ["cs"] },
      { group: "CS / AI / ML", name: "ML Reproducibility Challenge", url: "https://paperswithcode.com/rc2022", desc: "Research networking.", tags: ["cs"] },

      { group: "Business / MBA", name: "GMAC / MBA.com", url: "https://www.mba.com/", tags: ["mba"] },
      { group: "Business / MBA", name: "MBA Crystal Ball", url: "https://www.mbacrystalball.com/", tags: ["mba"] },
      { group: "Business / MBA", name: "Poets & Quants", url: "https://poetsandquants.com/", desc: "MBA news + rankings.", tags: ["mba"] },
      { group: "Business / MBA", name: "ClearAdmit", url: "https://www.clearadmit.com/", tags: ["mba"] },
      { group: "Business / MBA", name: "Businessbecause", url: "https://www.businessbecause.com/", tags: ["mba"] },

      { group: "Law", name: "LLM Guide", url: "https://llm-guide.com/" },
      { group: "Law", name: "LSAC", url: "https://www.lsac.org/", desc: "US law admissions.", tags: ["us"] },

      { group: "Medicine / Public Health", name: "AAMC", url: "https://www.aamc.org/", desc: "US med schools.", tags: ["us"] },
      { group: "Medicine / Public Health", name: "ASPPH", url: "https://www.aspph.org/", desc: "Public health programmes." },

      { group: "Art / Design", name: "Coroflot", url: "https://www.coroflot.com/" },
      { group: "Art / Design", name: "Portfolio Republic", url: "https://www.portfoliorepublic.com/" },
      { group: "Art / Design", name: "ArchDaily Schools", url: "https://www.archdaily.com/" },

      { group: "Humanities / Social Sciences", name: "H-Net Jobs", url: "https://www.h-net.org/jobs/" },
      { group: "Humanities / Social Sciences", name: "PhilJobs", url: "https://philjobs.org/" },

      { group: "Sciences / Engineering", name: "Nature Careers", url: "https://www.nature.com/naturecareers/", tags: ["stem"] },
      { group: "Sciences / Engineering", name: "New Scientist Jobs", url: "https://jobs.newscientist.com/", tags: ["stem"] },
      { group: "Sciences / Engineering", name: "IEEE Job Site", url: "https://jobs.ieee.org/", tags: ["stem"] },
    ],
  },
  {
    id: "research-fit",
    number: "26",
    title: "Research fit — finding the right professors / labs",
    subtitle: "Critical for PhD + funded master's. Find recent papers → check author affiliations → those are your target labs.",
    icon: "Microscope",
    accent: "sky",
    links: [
      { name: "Google Scholar", url: "https://scholar.google.com/", desc: "Search by topic, find top authors.", tags: ["phd"], star: true },
      { name: "Semantic Scholar", url: "https://www.semanticscholar.org/", desc: "AI-powered paper discovery.", tags: ["phd", "ai-tool"] },
      { name: "ResearchGate", url: "https://www.researchgate.net/", tags: ["phd"] },
      { name: "ORCID", url: "https://orcid.org/", tags: ["phd"] },
      { name: "Connected Papers", url: "https://www.connectedpapers.com/", desc: "Visualise paper networks.", tags: ["phd"] },
      { name: "OpenAlex", url: "https://openalex.org/", desc: "Open bibliographic database.", tags: ["phd"] },
      { name: "Scilit", url: "https://www.scilit.com/", tags: ["phd"] },
    ],
  },
  {
    id: "cold-email",
    number: "26b",
    title: "Cold-emailing professors",
    subtitle:
      "Many PhD positions in DE/EU are never publicly advertised. A good cold email is often the single most important step toward a funded offer.",
    icon: "Mail",
    accent: "pink",
    links: [
      { group: "Guides & templates", name: "Kshitij Tiwari — The Cold Email Template", url: "https://kshitijtiwari.com/cold-email/", tags: ["phd"], star: true },
      { group: "Guides & templates", name: "Jake Chanenson — How to Write a Cold Email", url: "https://jakec007.github.io/2021-04-01-cold-email-advice/", tags: ["phd"] },
      { group: "Guides & templates", name: "Sowasser — Reframing Cold Emails", url: "https://sowasser.com/cold-emails/", tags: ["phd"] },
      { group: "Guides & templates", name: "Scholastic Babe — Emailing PhD Advisors", url: "https://www.scholasticbabe.com/blog/emailing-potential-phd-advisors-and-grad-students-emails-templates-free", tags: ["phd"] },
      { group: "Guides & templates", name: "Science Latte — Grad School Email Templates", url: "https://science-latte.com/2021/12/29/email-templates/", tags: ["phd"] },
      { group: "Guides & templates", name: "Polygence — Cold Emailing Professors", url: "https://www.polygence.org/blog/how-to-cold-email-professors", tags: ["phd"] },
      { group: "Guides & templates", name: "Academiatoindustry — Cold Email for PhD", url: "https://academiatoindustry.com/blog/cold-email-professor-phd.html", tags: ["phd"] },
      { group: "Guides & templates", name: "MIT UROP Email Templates", url: "https://urop.mit.edu/students/resources/approaching-faculty/email-templates/", tags: ["phd"] },
      { group: "Guides & templates", name: "Academic Hive — Cold Email a Professor", url: "https://www.academichive.com/email-a-professor/", tags: ["phd"] },
      { group: "Guides & templates", name: "ApplyIndex — Email Professor for PhD", url: "https://applyindex.com/supervisor-outreach/email-professor-for-phd/", tags: ["phd"] },
      { group: "Guides & templates", name: "EduAvenues — Cold Email Templates 2025", url: "https://www.eduavenues.com/blog/how-to-cold-email-professors-for-research", tags: ["phd"] },

      { group: "Finding emails", name: "Hunter.io", url: "https://hunter.io/", desc: "Find email by domain + name.", tags: ["tactic"] },
    ],
  },
  {
    id: "app-mgmt",
    number: "27",
    title: "Application management & organisation",
    icon: "ClipboardList",
    accent: "amber",
    links: [
      { name: "Notion", url: "https://www.notion.so/", desc: "Free tracker templates — search 'grad school application'." },
      { name: "Airtable", url: "https://www.airtable.com/", desc: "Spreadsheet + database hybrid." },
      { name: "Trello", url: "https://trello.com/", desc: "Kanban for deadlines." },
      { name: "Google Sheets", url: "https://sheets.google.com/", desc: "Simplest." },
      { name: "Grad Café Results", url: "https://www.thegradcafe.com/survey/", desc: "Log your applications." },
      { name: "Calendly", url: "https://calendly.com/", desc: "For LOR writer meetings." },
      { name: "Slate (via uni portals)", url: "https://technolutions.com/", desc: "Many US unis use this.", tags: ["us"] },
    ],
  },
  {
    id: "reddit-picks",
    number: "27b",
    title: "Reddit's actual top picks",
    subtitle:
      "What Redditors keep recommending in comments — separated from official lists.",
    icon: "MessagesSquare",
    accent: "lime",
    links: [
      { group: "Most upvoted for scholarships", name: "Fastweb", url: "https://www.fastweb.com/", desc: "Matches your profile, 1.5M awards.", tags: ["reddit-pick", "us"], star: true },
      { group: "Most upvoted for scholarships", name: "Going Merry", url: "https://www.goingmerry.com/", desc: "Auto-fills multiple applications.", tags: ["reddit-pick"] },
      { group: "Most upvoted for scholarships", name: "Appily (formerly Cappex)", url: "https://www.appily.com/", desc: "Listings + college insights.", tags: ["reddit-pick"] },
      { group: "Most upvoted for scholarships", name: "Bold.org", url: "https://bold.org/", desc: "Mixed quality, still popular.", tags: ["reddit-pick", "scam-warning"] },
      { group: "Most upvoted for scholarships", name: "Scholarships.com", url: "https://www.scholarships.com/", desc: "Huge DB, free.", tags: ["reddit-pick"] },
      { group: "Most upvoted for scholarships", name: "Niche Scholarships", url: "https://www.niche.com/colleges/scholarships/", desc: "Reviews + money.", tags: ["reddit-pick"] },
      { group: "Most upvoted for scholarships", name: "Chegg Scholarships", url: "https://www.chegg.com/scholarships", tags: ["reddit-pick"] },
      { group: "Most upvoted for scholarships", name: "GoGrad", url: "https://www.gograd.org/", desc: "Diversity + niche lists.", tags: ["reddit-pick"] },
      { group: "Most upvoted for scholarships", name: "HuntScholarship", url: "https://www.huntscholarship.com/", desc: "PhD-specific, less noise.", tags: ["reddit-pick", "phd"] },
      { group: "Most upvoted for scholarships", name: "StudentLoanPlanner scholarship list", url: "https://www.studentloanplanner.com/graduate-school-scholarships/", tags: ["reddit-pick"] },

      { group: "Shortlisting tools Redditors use", name: "Grad Café Results Survey", url: "https://www.thegradcafe.com/survey/", desc: "The admit/reject database.", tags: ["reddit-pick"], star: true },
      { group: "Shortlisting tools Redditors use", name: "Grad Café Forums", url: "https://forum.thegradcafe.com/", tags: ["reddit-pick", "community"] },
      { group: "Shortlisting tools Redditors use", name: "Yocket community", url: "https://yocket.com/feed", desc: "Especially for South Asian admits.", tags: ["reddit-pick", "bangladesh"] },
      { group: "Shortlisting tools Redditors use", name: "Admits.fyi", url: "https://admits.fyi/", desc: "Huge DB of who got in where.", tags: ["reddit-pick"] },
      { group: "Shortlisting tools Redditors use", name: "GradRight", url: "https://gradright.com/", desc: "Find unis that will actually loan to you.", tags: ["reddit-pick"] },
      { group: "Shortlisting tools Redditors use", name: "CSRankings", url: "https://csrankings.org/", desc: "r/csMajors gospel.", tags: ["reddit-pick", "cs"] },
      { group: "Shortlisting tools Redditors use", name: "QS Subject Rankings", url: "https://www.topuniversities.com/subject-rankings", tags: ["reddit-pick"] },
      { group: "Shortlisting tools Redditors use", name: "ProspectiveDoctor / SDN", url: "https://forums.studentdoctor.net/", desc: "For med/dental.", tags: ["reddit-pick", "community"] },

      { group: "European / PhD Reddit picks", name: "EURAXESS", url: "https://euraxess.ec.europa.eu/", desc: "If you want a funded PhD in EU, start here.", tags: ["reddit-pick", "phd", "europe"], star: true },
      { group: "European / PhD Reddit picks", name: "UniversityPositions.eu", url: "https://www.universitypositions.eu/", tags: ["reddit-pick", "europe"] },
      { group: "European / PhD Reddit picks", name: "ScholarshipDb", url: "https://scholarshipdb.net/", desc: "Pulls from official uni sites.", tags: ["reddit-pick", "phd"] },
      { group: "European / PhD Reddit picks", name: "FindAPhD", url: "https://www.findaphd.com/", tags: ["reddit-pick", "phd"] },
      { group: "European / PhD Reddit picks", name: "PhDs.org", url: "https://www.phds.org/", desc: "Program + funding details.", tags: ["reddit-pick", "phd"] },
      { group: "European / PhD Reddit picks", name: "Academic Transfer (NL)", url: "https://www.academictransfer.com/en/", tags: ["reddit-pick", "europe", "phd"] },
      { group: "European / PhD Reddit picks", name: "Jobbnorge (NO)", url: "https://www.jobbnorge.no/", tags: ["reddit-pick", "europe", "phd"] },
      { group: "European / PhD Reddit picks", name: "DTU Vacancies (DK)", url: "https://www.dtu.dk/english/about/job-and-career", tags: ["reddit-pick", "europe", "phd"] },
      { group: "European / PhD Reddit picks", name: "Austrian Agency for Research", url: "https://oead.at/en/", tags: ["reddit-pick", "europe", "phd"] },
    ],
  },
  {
    id: "pre-departure",
    number: "28",
    title: "Pre-departure & student life",
    icon: "Briefcase",
    accent: "sky",
    links: [
      { name: "International Student Insurance", url: "https://www.internationalstudentinsurance.com/" },
      { name: "ISIC Card", url: "https://www.isic.org/", desc: "Global student discounts." },
      { name: "Wise (money transfer)", url: "https://wise.com/" },
      { name: "Revolut", url: "https://www.revolut.com/", desc: "Multi-currency card." },
      { name: "Airalo", url: "https://www.airalo.com/", desc: "eSIM for any country." },
      { name: "Hostelworld", url: "https://www.hostelworld.com/", desc: "Cheap first-week accommodation." },
      { name: "Rome2Rio", url: "https://www.rome2rio.com/", desc: "Plan travel between cities." },
      { name: "Google Translate", url: "https://translate.google.com/" },
      { name: "Skyscanner", url: "https://www.skyscanner.com/", desc: "Cheap flights." },
      { name: "Kiwi.com", url: "https://www.kiwi.com/", desc: "Cheap flights." },
    ],
  },
  {
    id: "post-study",
    number: "29",
    title: "Post-study work, alumni & career outcomes",
    subtitle:
      "Don't just look at getting in. Look at what happens after. Visa sponsorship + alumni strength = ROI.",
    icon: "KeyRound",
    accent: "main",
    links: [
      { group: "Career outcomes & ROI", name: "LinkedIn Alumni Tool", url: "https://www.linkedin.com/school/", desc: "Search target uni → Alumni → filter by 'Where they live' + 'What they do'.", tags: ["tactic"], star: true },
      { group: "Career outcomes & ROI", name: "University 'First Destination' Reports", url: "https://www.google.com/search?q=%22First+Destination+Report%22+university", desc: "US unis must publish where their grads work + salaries." },
      { group: "Career outcomes & ROI", name: "Steppingblocks", url: "https://steppingblocks.com/", desc: "Big data on grad outcomes, salaries, employers." },
      { group: "Career outcomes & ROI", name: "WiseAdmit", url: "https://wiseadmit.io/", desc: "ROI calc — tuition vs post-grad earnings." },

      { group: "Work visas & sponsorship", name: "Interstride", url: "https://www.interstride.com/", desc: "H-1B sponsorship history, intl-friendly job boards. Many unis give free premium.", star: true },
      { group: "Work visas & sponsorship", name: "MyVisaJobs", url: "https://www.myvisajobs.com/", desc: "H-1B + Green Card sponsorship trends.", tags: ["us"] },
      { group: "Work visas & sponsorship", name: "GoinGlobal", url: "https://www.goinglobal.com/", desc: "H-1B records + country guides for 40+ countries." },
      { group: "Work visas & sponsorship", name: "Handshake", url: "https://joinhandshake.com/", desc: "Filter jobs by 'Will sponsor' / 'no US visa needed'.", tags: ["us"] },

      { group: "Shortage occupation lists (PR strategy)", name: "DHS STEM Designated Degree List", url: "https://www.ice.gov/sites/default/files/documents/stem-list.pdf", desc: "STEM CIP code → 3yr STEM OPT vs 1yr regular OPT.", tags: ["us", "stem", "official"] },
      { group: "Shortage occupation lists (PR strategy)", name: "Australia Skills Occupation List", url: "https://immi.homeaffairs.gov.au/visas/working-in-australia/skill-occupation-list", desc: "What Australia needs to grant PR.", tags: ["official"] },
      { group: "Shortage occupation lists (PR strategy)", name: "UK Immigration Salary List", url: "https://www.gov.uk/government/publications/skilled-worker-visa-immigration-salary-list/skilled-worker-visa-immigration-salary-list", desc: "Lower salary thresholds for Skilled Worker Visa.", tags: ["uk", "official"] },
      { group: "Shortage occupation lists (PR strategy)", name: "Canada Express Entry Categories", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/submit-profile/rounds-invitations/category-based-selection.html", desc: "Categories IRCC currently prioritises.", tags: ["official"] },
      { group: "Shortage occupation lists (PR strategy)", name: "NZ Green List Roles", url: "https://www.immigration.govt.nz/new-zealand-visas/preparing-a-visa-application/working-in-nz/qualifications-for-work/green-list-occupations", desc: "Fast-track to NZ residence.", tags: ["official"] },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Reddit warnings — surfaced as a discrete band                       */
/* ------------------------------------------------------------------ */

export const REDDIT_WARNINGS: { title: string; body: string }[] = [
  { title: "Bold.org", body: "Sometimes features low-quality 'essay contests' with low payouts." },
  { title: "ScholarshipOwl", body: "Auto-apply convenience — but many user complaints. Use cautiously." },
  { title: "Any site asking for upfront payment", body: "Scam. Legitimate scholarships do not charge to apply." },
  { title: "Unverified Facebook / Telegram 'agents'", body: "Scam. Anyone promising guaranteed admission is lying." },
  { title: "Don't over-index on Grad Café", body: "Survivor bias, anonymous, no context. Useful, but not gospel." },
];

/* ------------------------------------------------------------------ */
/* All available tags, in display order                                */
/* ------------------------------------------------------------------ */

export const ALL_TAGS: ResourceTag[] = [
  "bangladesh",
  "free",
  "free-tuition",
  "official",
  "reddit-pick",
  "ai-tool",
  "phd",
  "mba",
  "cs",
  "stem",
  "women",
  "europe",
  "germany",
  "uk",
  "us",
  "newsletter",
  "community",
  "scam-warning",
];

/* ------------------------------------------------------------------ */
/* Derived helpers                                                     */
/* ------------------------------------------------------------------ */

export function totalLinkCount(): number {
  return CATEGORIES.reduce((sum, c) => sum + c.links.length, 0);
}

export function favicon(url: string, size = 64): string {
  try {
    const u = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=${size}`;
  } catch {
    return "";
  }
}

export function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
