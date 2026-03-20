import { internalMutation } from "./_generated/server";
import { calculatePrestigeScore, scoreTier, buildSearchText } from "./prestige";

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

interface ScholarshipSeed {
  title: string;
  description: string;
  provider_organization: string;
  host_country: string;
  eligibility_nationalities: string[];
  degree_levels: ("bachelor" | "master" | "phd" | "postdoc")[];
  fields_of_study: string[];
  funding_type: "fully_funded" | "partial" | "tuition_waiver" | "stipend_only";
  application_deadline?: number;
  application_deadline_text?: string;
  application_url: string;
  tags: string[];
}

const SCHOLARSHIPS: ScholarshipSeed[] = [
  {
    title: "Chevening Scholarships",
    description:
      "The UK government's global scholarship programme, funded by the Foreign, Commonwealth and Development Office. Chevening offers full financial support for a one-year master's degree at any UK university. Awards cover tuition fees, a monthly living allowance, return flights, and additional grants for thesis or fieldwork.",
    provider_organization: "Chevening / FCDO",
    host_country: "GB",
    eligibility_nationalities: [],
    degree_levels: ["master"],
    fields_of_study: ["All subjects"],
    funding_type: "fully_funded",
    application_deadline: new Date("2026-11-05").getTime(),
    application_deadline_text: "November 5, 2026",
    application_url: "https://www.chevening.org/scholarships/",
    tags: ["highly_competitive"],
  },
  {
    title: "Rhodes Scholarship",
    description:
      "The world's oldest and most prestigious international scholarship, established in 1903. Fully funds postgraduate study at the University of Oxford. Approximately 100 scholars are selected each year from over 60 countries. Covers tuition, a personal stipend, health insurance, and travel allowances.",
    provider_organization: "Rhodes Trust",
    host_country: "GB",
    eligibility_nationalities: [],
    degree_levels: ["master", "phd"],
    fields_of_study: ["All subjects"],
    funding_type: "fully_funded",
    application_deadline: new Date("2026-10-01").getTime(),
    application_deadline_text: "October 2026 (varies by country)",
    application_url: "https://www.rhodeshouse.ox.ac.uk/scholarships/the-rhodes-scholarship/",
    tags: ["highly_competitive"],
  },
  {
    title: "Fulbright Foreign Student Program",
    description:
      "The Fulbright Program enables graduate students, young professionals, and artists from over 160 countries to study and conduct research in the United States. Approximately 4,000 foreign students receive Fulbright scholarships each year. Funding typically covers tuition, airfare, a living stipend, and health insurance.",
    provider_organization: "Fulbright Commission",
    host_country: "US",
    eligibility_nationalities: [],
    degree_levels: ["master", "phd"],
    fields_of_study: ["All subjects"],
    funding_type: "fully_funded",
    application_deadline: new Date("2026-10-15").getTime(),
    application_deadline_text: "Varies by country, typically February-October",
    application_url: "https://foreign.fulbrightonline.org/about/foreign-student-program",
    tags: ["highly_competitive"],
  },
  {
    title: "DAAD Scholarships",
    description:
      "The German Academic Exchange Service (DAAD) is the world's largest funding organisation for international academic exchange. DAAD supports over 100,000 German and international students annually with scholarships for study, research, and internships in Germany. Awards typically cover tuition, monthly stipend (861-1,200 EUR), health insurance, and travel allowance.",
    provider_organization: "DAAD",
    host_country: "DE",
    eligibility_nationalities: [],
    degree_levels: ["master", "phd", "postdoc"],
    fields_of_study: ["All subjects"],
    funding_type: "fully_funded",
    application_deadline: new Date("2026-10-15").getTime(),
    application_deadline_text: "Varies by programme, typically October-November",
    application_url: "https://www.daad.de/en/studying-in-germany/scholarships/",
    tags: [],
  },
  {
    title: "Erasmus Mundus Joint Master Degrees",
    description:
      "EU-funded scholarships for international master's programmes offered by consortia of universities across Europe. Each EMJMD involves study in at least two European countries. Erasmus Mundus scholarships cover tuition, travel, installation costs, and a monthly living allowance (1,400 EUR/month). Over 100 master programmes are available.",
    provider_organization: "Erasmus Mundus / European Commission",
    host_country: "NL",
    eligibility_nationalities: [],
    degree_levels: ["master"],
    fields_of_study: [
      "Engineering",
      "Computer Science",
      "Environmental Science",
      "Social Sciences",
      "Arts and Humanities",
      "Business",
      "Public Health",
    ],
    funding_type: "fully_funded",
    application_deadline: new Date("2027-01-15").getTime(),
    application_deadline_text: "January 2027 (varies by programme)",
    application_url: "https://www.eacea.ec.europa.eu/scholarships/emjmd-catalogue_en",
    tags: [],
  },
  {
    title: "Gates Cambridge Scholarship",
    description:
      "Full-cost scholarships to outstanding applicants from outside the UK to pursue a postgraduate degree at the University of Cambridge. Approximately 80 awards per year. Covers tuition fees, a maintenance allowance (around £19,000/year), one return flight, and immigration health surcharge. Two-thirds of awards go to PhD students.",
    provider_organization: "Gates Cambridge",
    host_country: "GB",
    eligibility_nationalities: [],
    degree_levels: ["master", "phd"],
    fields_of_study: ["All subjects"],
    funding_type: "fully_funded",
    application_deadline: new Date("2026-12-03").getTime(),
    application_deadline_text: "December 3, 2026 (International round)",
    application_url: "https://www.gatescambridge.org/programme/the-scholarship/",
    tags: ["highly_competitive"],
  },
  {
    title: "MEXT Japanese Government Scholarship",
    description:
      "The Ministry of Education, Culture, Sports, Science and Technology (MEXT) of Japan offers scholarships for international students to study at Japanese universities. Seven scholarship types available including research, undergraduate, and college of technology. Covers tuition, monthly allowance (143,000-145,000 JPY), and round-trip airfare.",
    provider_organization: "Monbukagakusho / MEXT",
    host_country: "JP",
    eligibility_nationalities: [],
    degree_levels: ["bachelor", "master", "phd"],
    fields_of_study: ["All subjects"],
    funding_type: "fully_funded",
    application_deadline: new Date("2026-04-30").getTime(),
    application_deadline_text: "April 2026 (embassy recommendation)",
    application_url: "https://www.studyinjapan.go.jp/en/planning/scholarships/mext-scholarships/",
    tags: [],
  },
  {
    title: "Schwarzman Scholars",
    description:
      "A one-year master's programme at Tsinghua University in Beijing, designed to prepare emerging leaders for a world where China plays an increasingly important role. Covers tuition, room and board, travel, health insurance, and a personal stipend. Approximately 200 scholars per class from around the world.",
    provider_organization: "Schwarzman Scholars",
    host_country: "CN",
    eligibility_nationalities: [],
    degree_levels: ["master"],
    fields_of_study: ["International Relations", "Economics", "Business", "Public Health"],
    funding_type: "fully_funded",
    application_deadline: new Date("2026-09-15").getTime(),
    application_deadline_text: "September 15, 2026",
    application_url: "https://www.schwarzmanscholars.org/",
    tags: ["highly_competitive"],
  },
  {
    title: "Commonwealth Scholarships",
    description:
      "Funded by the UK Department for International Development (DFID) for students from low and middle income Commonwealth countries to study in the UK. Covers tuition, airfare, monthly stipend, thesis grant, warm clothing allowance, and study travel grant. For master's and PhD study at UK universities.",
    provider_organization: "Commonwealth Scholarship Commission",
    host_country: "GB",
    eligibility_nationalities: [],
    degree_levels: ["master", "phd"],
    fields_of_study: ["All subjects"],
    funding_type: "fully_funded",
    application_deadline: new Date("2026-12-18").getTime(),
    application_deadline_text: "December 2026",
    application_url: "https://cscuk.fcdo.gov.uk/scholarships/",
    tags: [],
  },
  {
    title: "Australia Awards Scholarships",
    description:
      "Long-term development awards administered by the Department of Foreign Affairs and Trade. Available to students from developing countries in the Indo-Pacific region. Covers tuition, return air travel, establishment allowance, contribution to living expenses, introductory academic programme, and health insurance.",
    provider_organization: "Australian Government",
    host_country: "AU",
    eligibility_nationalities: [],
    degree_levels: ["bachelor", "master", "phd"],
    fields_of_study: ["All subjects"],
    funding_type: "fully_funded",
    application_deadline: new Date("2026-05-01").getTime(),
    application_deadline_text: "Varies by country, typically April-May",
    application_url: "https://www.dfat.gov.au/people-to-people/australia-awards/",
    tags: [],
  },
  {
    title: "Stipendium Hungaricum Scholarship",
    description:
      "The Hungarian Government's prestigious scholarship programme offering studies at Hungarian universities. Covers tuition, monthly stipend (HUF 43,700 for bachelor/master, HUF 140,000 for doctoral), accommodation contribution, and medical insurance. Over 80 sending partners and 5,000+ scholarship places annually.",
    provider_organization: "Tempus Public Foundation / Hungarian Government",
    host_country: "HU",
    eligibility_nationalities: [],
    degree_levels: ["bachelor", "master", "phd"],
    fields_of_study: [
      "Engineering",
      "Computer Science",
      "Medicine",
      "Business",
      "Agriculture",
      "Arts and Humanities",
    ],
    funding_type: "fully_funded",
    application_deadline: new Date("2027-01-15").getTime(),
    application_deadline_text: "January 15, 2027",
    application_url: "https://stipendiumhungaricum.hu/",
    tags: [],
  },
  {
    title: "Turkiye Burslari (Turkey Scholarships)",
    description:
      "Turkey's government-funded international scholarship programme for undergraduate, master's, and doctoral studies. Provides tuition, monthly stipend (800-3,000 TRY depending on level), accommodation, health insurance, one-year Turkish language course, and round-trip flight ticket. Open to citizens of all countries.",
    provider_organization: "Turkiye Burslari",
    host_country: "TR",
    eligibility_nationalities: [],
    degree_levels: ["bachelor", "master", "phd"],
    fields_of_study: [
      "Engineering",
      "Medicine",
      "Social Sciences",
      "Arts and Humanities",
      "Education",
      "Law",
    ],
    funding_type: "fully_funded",
    application_deadline: new Date("2027-02-20").getTime(),
    application_deadline_text: "February 20, 2027",
    application_url: "https://turkiyeburslari.gov.tr/",
    tags: [],
  },
  {
    title: "Chinese Government Scholarship (CSC)",
    description:
      "The China Scholarship Council offers full scholarships for international students to study at Chinese universities. Covers tuition, accommodation, living allowance (CNY 2,500-3,500/month depending on level), and comprehensive medical insurance. Over 30,000 scholarships awarded annually across all degree levels.",
    provider_organization: "CSC",
    host_country: "CN",
    eligibility_nationalities: [],
    degree_levels: ["bachelor", "master", "phd"],
    fields_of_study: ["All subjects"],
    funding_type: "fully_funded",
    application_deadline: new Date("2027-03-31").getTime(),
    application_deadline_text: "January-March 2027 (varies by programme)",
    application_url: "https://www.campuschina.org/scholarships/index.html",
    tags: [],
  },
  {
    title: "Korean Government Scholarship Program (KGSP)",
    description:
      "South Korea's flagship scholarship for international students, managed by NIIED. Covers round-trip airfare, monthly allowance (900,000 KRW for undergrad, 1,000,000 KRW for graduate), tuition, medical insurance, Korean language training (1 year), and settlement allowance. Open to citizens of countries with diplomatic ties to Korea.",
    provider_organization: "NIIED / Korean Government",
    host_country: "KR",
    eligibility_nationalities: [],
    degree_levels: ["bachelor", "master", "phd"],
    fields_of_study: ["All subjects"],
    funding_type: "fully_funded",
    application_deadline: new Date("2027-03-01").getTime(),
    application_deadline_text: "February-March 2027",
    application_url: "https://www.studyinkorea.go.kr/en/sub/gks/allnew_schedule.do",
    tags: [],
  },
  {
    title: "Swiss Government Excellence Scholarships",
    description:
      "The Swiss Confederation awards excellence scholarships to promote international exchange and research collaboration. Available for PhD, postdoctoral research, and in some cases master's studies at Swiss public universities or ETH. Monthly allowance of CHF 1,920, tuition waiver, health insurance, housing allowance, and flight ticket.",
    provider_organization: "Swiss Federal Government",
    host_country: "CH",
    eligibility_nationalities: [],
    degree_levels: ["master", "phd", "postdoc"],
    fields_of_study: ["All subjects"],
    funding_type: "fully_funded",
    application_deadline: new Date("2026-12-01").getTime(),
    application_deadline_text: "Varies by country, typically August-December",
    application_url: "https://www.sbfi.admin.ch/sbfi/en/home/education/scholarships-and-grants.html",
    tags: [],
  },
  {
    title: "Eiffel Excellence Scholarship Programme",
    description:
      "Scholarship programme by the French Ministry for Europe and Foreign Affairs, managed by Campus France. Designed for international students for master's and PhD programmes at French higher education institutions. Master's stipend: 1,181 EUR/month; PhD: 1,700 EUR/month. Also covers international travel, health insurance, housing allowance, and cultural activities.",
    provider_organization: "Campus France / French Government",
    host_country: "FR",
    eligibility_nationalities: [],
    degree_levels: ["master", "phd"],
    fields_of_study: [
      "Engineering",
      "Computer Science",
      "Economics",
      "Business",
      "Law",
      "International Relations",
    ],
    funding_type: "fully_funded",
    application_deadline: new Date("2027-01-10").getTime(),
    application_deadline_text: "January 10, 2027",
    application_url: "https://www.campusfrance.org/en/eiffel-scholarship-program-of-excellence",
    tags: [],
  },
  {
    title: "Vanier Canada Graduate Scholarships",
    description:
      "Prestigious Canadian doctoral scholarship worth $50,000 CAD per year for three years. Open to both Canadian and international students. Recognizes academic excellence, research potential, and leadership. Tenable at Canadian universities with a Vanier CGS allocation. Administered by CIHR, NSERC, or SSHRC depending on discipline.",
    provider_organization: "Vanier Canada",
    host_country: "CA",
    eligibility_nationalities: [],
    degree_levels: ["phd"],
    fields_of_study: [
      "Engineering",
      "Computer Science",
      "Medicine",
      "Social Sciences",
      "Arts and Humanities",
      "Environmental Science",
    ],
    funding_type: "fully_funded",
    application_deadline: new Date("2026-11-01").getTime(),
    application_deadline_text: "November 1, 2026",
    application_url: "https://vanier.gc.ca/en/home-accueil.html",
    tags: ["highly_competitive"],
  },
  {
    title: "Swedish Institute Scholarships for Global Professionals (SISGP)",
    description:
      "Scholarships for master's programmes at Swedish universities targeting future leaders from eligible countries. Covers full tuition, monthly living allowance of SEK 10,000, travel grant, and insurance. Approximately 350 scholarships per year for professionals with work experience and demonstrated leadership.",
    provider_organization: "Swedish Institute",
    host_country: "SE",
    eligibility_nationalities: [],
    degree_levels: ["master"],
    fields_of_study: ["All subjects"],
    funding_type: "fully_funded",
    application_deadline: new Date("2027-02-10").getTime(),
    application_deadline_text: "February 10, 2027",
    application_url: "https://si.se/en/apply/scholarships/si-scholarships-for-global-professionals/",
    tags: [],
  },
  {
    title: "ETH Zurich Excellence Scholarship",
    description:
      "The Excellence Scholarship & Opportunity Programme (ESOP) supports outstanding master's students at ETH Zurich. Covers tuition, a living grant of CHF 12,000 per semester, and a tuition fee waiver. Awarded based on academic excellence to students admitted to a master's programme at ETH Zurich.",
    provider_organization: "ETH Zurich Excellence",
    host_country: "CH",
    eligibility_nationalities: [],
    degree_levels: ["master"],
    fields_of_study: ["Engineering", "Computer Science", "Mathematics", "Physics", "Architecture"],
    funding_type: "fully_funded",
    application_deadline: new Date("2026-12-15").getTime(),
    application_deadline_text: "December 15, 2026",
    application_url: "https://ethz.ch/students/en/studies/financial/scholarships/excellencescholarship.html",
    tags: ["highly_competitive"],
  },
  {
    title: "Marshall Scholarship",
    description:
      "British Government's flagship scholarship for outstanding young Americans to study in the UK. Finances two years of postgraduate study at any UK institution. Covers tuition, living expenses, annual book grant, thesis grant, research and daily travel grants, fares to and from the US, and arrival allowance. Up to 50 scholars per year.",
    provider_organization: "Marshall Scholarship",
    host_country: "GB",
    eligibility_nationalities: ["US"],
    degree_levels: ["master", "phd"],
    fields_of_study: ["All subjects"],
    funding_type: "fully_funded",
    application_deadline: new Date("2026-09-30").getTime(),
    application_deadline_text: "September 30, 2026",
    application_url: "https://www.marshallscholarship.org/",
    tags: ["highly_competitive"],
  },
  {
    title: "Clarendon Scholarships at University of Oxford",
    description:
      "The Clarendon Fund awards over 140 scholarships each year to academically excellent graduate students from all around the world. Covers tuition and college fees in full, plus a generous living grant. Available for all full-time and part-time master's and DPhil programmes at Oxford. No separate application required.",
    provider_organization: "Clarendon",
    host_country: "GB",
    eligibility_nationalities: [],
    degree_levels: ["master", "phd"],
    fields_of_study: ["All subjects"],
    funding_type: "fully_funded",
    application_deadline: new Date("2027-01-03").getTime(),
    application_deadline_text: "January 2027 (varies by course)",
    application_url: "https://www.clarendon.ox.ac.uk/",
    tags: ["highly_competitive"],
  },
  {
    title: "Knight-Hennessy Scholars at Stanford University",
    description:
      "The Knight-Hennessy Scholars program at Stanford University develops a community of future global leaders. Provides full funding for up to three years of graduate study at Stanford in any department. Covers tuition, stipend, travel, and experiential learning. Approximately 100 scholars per cohort from around the world.",
    provider_organization: "Knight-Hennessy",
    host_country: "US",
    eligibility_nationalities: [],
    degree_levels: ["master", "phd"],
    fields_of_study: ["All subjects"],
    funding_type: "fully_funded",
    application_deadline: new Date("2026-10-09").getTime(),
    application_deadline_text: "October 9, 2026",
    application_url: "https://knight-hennessy.stanford.edu/",
    tags: ["highly_competitive"],
  },
  {
    title: "New Zealand Scholarships (Manaaki)",
    description:
      "Funded by the New Zealand Government for students from selected developing countries in the Pacific, Southeast Asia, and Africa. Covers tuition, living allowance, establishment allowance, medical and travel insurance, and return flights. For undergraduate and postgraduate study at New Zealand universities.",
    provider_organization: "New Zealand Government / MFAT",
    host_country: "NZ",
    eligibility_nationalities: [],
    degree_levels: ["bachelor", "master", "phd"],
    fields_of_study: ["All subjects"],
    funding_type: "fully_funded",
    application_deadline: new Date("2027-03-28").getTime(),
    application_deadline_text: "Varies, typically February-March",
    application_url: "https://www.nzscholarships.govt.nz/",
    tags: [],
  },
  {
    title: "Holland Scholarship",
    description:
      "The Holland Scholarship is funded by the Dutch Ministry of Education, Culture and Science and Dutch research universities and universities of applied sciences. It is a one-time payment of EUR 5,000 for non-EEA students who want to do a bachelor's or master's in the Netherlands. Open to students who have not previously studied in the Netherlands.",
    provider_organization: "NUFFIC",
    host_country: "NL",
    eligibility_nationalities: [],
    degree_levels: ["bachelor", "master"],
    fields_of_study: ["All subjects"],
    funding_type: "partial",
    application_deadline: new Date("2027-02-01").getTime(),
    application_deadline_text: "February 1, 2027 (varies by institution)",
    application_url: "https://www.studyinholland.nl/finances/scholarships/holland-scholarship",
    tags: [],
  },
  {
    title: "VLIR-UOS Scholarships (Belgium)",
    description:
      "VLIR-UOS offers scholarships for students and professionals from developing countries to follow English-taught master's programmes or training programmes at Flemish universities in Belgium. Covers tuition, monthly allowance (approximately EUR 1,090), insurance, housing, and international travel.",
    provider_organization: "VLIR-UOS",
    host_country: "BE",
    eligibility_nationalities: [],
    degree_levels: ["master"],
    fields_of_study: [
      "Engineering",
      "Public Health",
      "Environmental Science",
      "Agriculture",
      "Education",
    ],
    funding_type: "fully_funded",
    application_deadline: new Date("2027-02-01").getTime(),
    application_deadline_text: "February 1, 2027",
    application_url: "https://www.vliruos.be/en/scholarships/",
    tags: [],
  },
  {
    title: "Rotary Peace Fellowships",
    description:
      "The Rotary Foundation funds up to 130 fellows per year to study at one of the Rotary Peace Centers worldwide. Master's degree fellowships cover tuition, fees, room and board, round-trip transportation, and internship expenses. Professional development certificate fellowships cover tuition, fees, and room and board. Available at universities in the US, UK, Japan, Australia, Sweden, and Thailand.",
    provider_organization: "Rotary Foundation",
    host_country: "US",
    eligibility_nationalities: [],
    degree_levels: ["master"],
    fields_of_study: ["International Relations", "Social Sciences", "Public Health", "Education"],
    funding_type: "fully_funded",
    application_deadline: new Date("2026-05-15").getTime(),
    application_deadline_text: "May 15, 2026",
    application_url: "https://www.rotary.org/en/our-programs/peace-fellowships",
    tags: [],
  },
  {
    title: "Aga Khan Foundation International Scholarship Programme",
    description:
      "The Aga Khan Foundation provides a limited number of scholarships each year for postgraduate studies to outstanding students from developing countries who have no other means of financing their studies. Scholarships are awarded on a 50% grant / 50% loan basis. Covers tuition and living expenses at leading universities worldwide.",
    provider_organization: "Aga Khan Foundation",
    host_country: "GB",
    eligibility_nationalities: [],
    degree_levels: ["master", "phd"],
    fields_of_study: ["All subjects"],
    funding_type: "partial",
    application_deadline: new Date("2027-03-31").getTime(),
    application_deadline_text: "March 31, 2027",
    application_url: "https://www.akdn.org/our-agencies/aga-khan-foundation/international-scholarship-programme",
    tags: [],
  },
  {
    title: "Mastercard Foundation Scholars Program",
    description:
      "The Mastercard Foundation Scholars Program enables young people from Africa who have talent and a commitment to giving back to their communities to access quality education. Partners with leading universities worldwide. Covers tuition, accommodation, books, living expenses, travel, and mentoring support.",
    provider_organization: "Mastercard Foundation",
    host_country: "US",
    eligibility_nationalities: [],
    degree_levels: ["bachelor", "master"],
    fields_of_study: ["All subjects"],
    funding_type: "fully_funded",
    application_deadline: new Date("2027-01-15").getTime(),
    application_deadline_text: "Varies by partner university",
    application_url: "https://mastercardfdn.org/all/scholars/",
    tags: [],
  },
  {
    title: "ADB-Japan Scholarship Program",
    description:
      "The Asian Development Bank-Japan Scholarship Program provides full scholarships for citizens of ADB developing member countries to pursue postgraduate studies at participating academic institutions in the Asia-Pacific region. Covers tuition, monthly stipend, housing, books, medical insurance, and travel allowance.",
    provider_organization: "ADB",
    host_country: "JP",
    eligibility_nationalities: [],
    degree_levels: ["master"],
    fields_of_study: [
      "Economics",
      "Business",
      "Engineering",
      "Environmental Science",
      "Public Health",
      "Agriculture",
    ],
    funding_type: "fully_funded",
    application_deadline: new Date("2026-12-01").getTime(),
    application_deadline_text: "Varies by institution",
    application_url: "https://www.adb.org/work-with-us/careers/japan-scholarship-program",
    tags: [],
  },
  {
    title: "Lester B. Pearson International Scholarships (University of Toronto)",
    description:
      "The University of Toronto's most prestigious and competitive international scholarship. Covers tuition, books, incidental fees, and full residence support for four years of undergraduate study. Recognizes exceptional students who demonstrate creativity, leadership, and a commitment to making a positive impact.",
    provider_organization: "University of Toronto Scholars",
    host_country: "CA",
    eligibility_nationalities: [],
    degree_levels: ["bachelor"],
    fields_of_study: ["All subjects"],
    funding_type: "fully_funded",
    application_deadline: new Date("2026-11-30").getTime(),
    application_deadline_text: "November 30, 2026",
    application_url: "https://future.utoronto.ca/pearson/",
    tags: ["highly_competitive"],
  },
  {
    title: "KAIST International Student Scholarship",
    description:
      "KAIST (Korea Advanced Institute of Science and Technology) offers full scholarships to international students pursuing graduate degrees. Covers tuition, monthly living allowance (350,000-390,000 KRW), health insurance, and airfare. One of Asia's top science and technology universities, located in Daejeon, South Korea.",
    provider_organization: "KAIST",
    host_country: "KR",
    eligibility_nationalities: [],
    degree_levels: ["master", "phd"],
    fields_of_study: [
      "Engineering",
      "Computer Science",
      "Physics",
      "Chemistry",
      "Biology",
      "Mathematics",
    ],
    funding_type: "fully_funded",
    application_deadline: new Date("2026-09-15").getTime(),
    application_deadline_text: "September 2026 (Spring admission)",
    application_url: "https://admission.kaist.ac.kr/intl-graduate/",
    tags: [],
  },
  {
    title: "Italian Government Scholarships for Foreign Students",
    description:
      "The Italian Government offers scholarships to international students for study, research, and language courses in Italy. Available for master's, doctoral, and research programmes. Monthly allowance of EUR 900, tuition waiver, and health insurance. Awarded by the Italian Ministry of Foreign Affairs through embassies.",
    provider_organization: "Italian Government / MAECI",
    host_country: "IT",
    eligibility_nationalities: [],
    degree_levels: ["master", "phd", "postdoc"],
    fields_of_study: ["All subjects"],
    funding_type: "fully_funded",
    application_deadline: new Date("2026-06-09").getTime(),
    application_deadline_text: "June 9, 2026",
    application_url: "https://studyinitaly.esteri.it/en/call-for-procedures",
    tags: [],
  },
  {
    title: "OFID Scholarship Award",
    description:
      "The OPEC Fund for International Development (OFID) offers fully funded scholarships to students from developing countries. Covers tuition, monthly living allowance, health insurance, travel expenses, and research support. For master's degree programmes at accredited universities worldwide. Priority given to applicants from OFID partner countries.",
    provider_organization: "OFID",
    host_country: "AT",
    eligibility_nationalities: [],
    degree_levels: ["master"],
    fields_of_study: [
      "Economics",
      "Environmental Science",
      "Engineering",
      "Agriculture",
      "Public Health",
    ],
    funding_type: "fully_funded",
    application_deadline: new Date("2027-05-01").getTime(),
    application_deadline_text: "May 1, 2027",
    application_url: "https://opecfund.org/operations/grants/scholarship",
    tags: [],
  },
  {
    title: "Konrad-Adenauer-Stiftung Scholarships",
    description:
      "The Konrad-Adenauer-Stiftung supports international students pursuing master's or doctoral studies in Germany. Monthly stipend of EUR 850 (master's) or EUR 1,200 (doctoral), plus tuition fees and health insurance. Applicants must demonstrate strong academic performance, social engagement, and interest in politics and democracy.",
    provider_organization: "Konrad-Adenauer-Stiftung",
    host_country: "DE",
    eligibility_nationalities: [],
    degree_levels: ["master", "phd"],
    fields_of_study: [
      "Social Sciences",
      "International Relations",
      "Law",
      "Economics",
      "Arts and Humanities",
    ],
    funding_type: "fully_funded",
    application_deadline: new Date("2026-07-15").getTime(),
    application_deadline_text: "July 15, 2026",
    application_url: "https://www.kas.de/en/scholarships",
    tags: [],
  },
  {
    title: "Friedrich-Ebert-Stiftung Scholarships",
    description:
      "The Friedrich-Ebert-Stiftung offers scholarships to international students from developing and transitioning countries for studies in Germany. Monthly stipend of EUR 850 (master's) or EUR 1,200 (doctoral). Applicants should be committed to social democracy and social justice. Includes seminars and networking with the FES community.",
    provider_organization: "Friedrich-Ebert-Stiftung",
    host_country: "DE",
    eligibility_nationalities: [],
    degree_levels: ["master", "phd"],
    fields_of_study: [
      "Social Sciences",
      "International Relations",
      "Law",
      "Economics",
      "Education",
    ],
    funding_type: "fully_funded",
    application_deadline: new Date("2026-10-31").getTime(),
    application_deadline_text: "October 31, 2026",
    application_url: "https://www.fes.de/studienfoerderung/",
    tags: [],
  },
  {
    title: "Heinrich Boll Foundation Scholarships",
    description:
      "The Heinrich Boll Foundation supports international students pursuing bachelor's, master's, or doctoral degrees in Germany. Monthly stipend of EUR 934 (master's) or EUR 1,350 (doctoral). Applicants should identify with the foundation's values: ecology, democracy, solidarity, and non-violence. Health insurance and family supplement included.",
    provider_organization: "Heinrich-Boll-Stiftung",
    host_country: "DE",
    eligibility_nationalities: [],
    degree_levels: ["bachelor", "master", "phd"],
    fields_of_study: ["All subjects"],
    funding_type: "fully_funded",
    application_deadline: new Date("2026-09-01").getTime(),
    application_deadline_text: "September 1, 2026",
    application_url: "https://www.boell.de/en/scholarships",
    tags: [],
  },
  {
    title: "Mitchell Scholarship",
    description:
      "A prestigious scholarship for young Americans to pursue one year of postgraduate study at an institution of higher learning in Ireland or Northern Ireland. Covers tuition, accommodation, a living expenses stipend of EUR 12,000, and international travel. Up to 12 scholars selected per year based on academic excellence, leadership, and community service.",
    provider_organization: "Mitchell Scholarship",
    host_country: "IE",
    eligibility_nationalities: ["US"],
    degree_levels: ["master"],
    fields_of_study: ["All subjects"],
    funding_type: "fully_funded",
    application_deadline: new Date("2026-09-27").getTime(),
    application_deadline_text: "September 27, 2026",
    application_url: "https://www.us-irelandalliance.org/mitchellscholarship",
    tags: ["highly_competitive"],
  },
  {
    title: "KAUST Fellowship (King Abdullah University of Science and Technology)",
    description:
      "KAUST in Saudi Arabia offers full fellowships for master's and PhD students in science, technology, engineering, and mathematics. Covers tuition, monthly living allowance, free housing, medical and dental coverage, relocation support, and annual travel allowance. Research-focused university with state-of-the-art facilities.",
    provider_organization: "KAUST",
    host_country: "SA",
    eligibility_nationalities: [],
    degree_levels: ["master", "phd"],
    fields_of_study: ["Engineering", "Computer Science", "Physics", "Chemistry", "Biology", "Mathematics", "Environmental Science"],
    funding_type: "fully_funded",
    application_deadline: new Date("2027-01-15").getTime(),
    application_deadline_text: "January 15, 2027",
    application_url: "https://www.kaust.edu.sa/en/study/applying-to-kaust",
    tags: [],
  },
  {
    title: "Yenching Academy Scholarship (Peking University)",
    description:
      "Interdisciplinary master's program in China Studies at Peking University in Beijing. Full scholarship covers tuition, double-room accommodation, comprehensive medical insurance, monthly living stipend, and a one-time round-trip travel allowance. Approximately 125 scholars admitted per year from around the world.",
    provider_organization: "Yenching Academy / Peking University",
    host_country: "CN",
    eligibility_nationalities: [],
    degree_levels: ["master"],
    fields_of_study: ["International Relations", "Economics", "Social Sciences", "Law", "Arts and Humanities"],
    funding_type: "fully_funded",
    application_deadline: new Date("2027-01-04").getTime(),
    application_deadline_text: "January 4, 2027",
    application_url: "https://yenchingacademy.pku.edu.cn/",
    tags: ["highly_competitive"],
  },
  {
    title: "Reach Oxford Scholarships",
    description:
      "Reach Oxford scholarships (formerly Oxford Student Scholarships) are for students from low-income countries who, for political or financial reasons, or because suitable educational facilities do not exist, cannot study for a degree in their own country. Covers tuition and college fees, a grant for living costs, and one return airfare per year.",
    provider_organization: "Reach Oxford",
    host_country: "GB",
    eligibility_nationalities: [],
    degree_levels: ["bachelor"],
    fields_of_study: ["All subjects"],
    funding_type: "fully_funded",
    application_deadline: new Date("2027-02-01").getTime(),
    application_deadline_text: "February 1, 2027",
    application_url: "https://reachoxford.ox.ac.uk/",
    tags: [],
  },
  {
    title: "EPFL Excellence Fellowships (Switzerland)",
    description:
      "EPFL (École Polytechnique Fédérale de Lausanne) offers Excellence Fellowships to the most talented students admitted to a master's programme at EPFL. Awards range from CHF 10,000 to CHF 40,000 per year, with some including a tuition fee waiver. EPFL is consistently ranked among the world's top 20 universities for engineering and technology.",
    provider_organization: "EPFL",
    host_country: "CH",
    eligibility_nationalities: [],
    degree_levels: ["master"],
    fields_of_study: ["Engineering", "Computer Science", "Mathematics", "Physics", "Architecture"],
    funding_type: "partial",
    application_deadline: new Date("2026-12-15").getTime(),
    application_deadline_text: "December 15, 2026",
    application_url: "https://www.epfl.ch/education/master/excellence-fellowships/",
    tags: ["highly_competitive"],
  },
  {
    title: "Weidenfeld-Hoffmann Scholarships and Leadership Programme (Oxford)",
    description:
      "A fully funded scholarship for outstanding students from developing and emerging economies to pursue graduate study at the University of Oxford. Covers tuition, college fees, and a full living allowance. Scholars join a leadership programme with mentoring, networking events, and career support. Around 25 scholars per year.",
    provider_organization: "Weidenfeld-Hoffmann",
    host_country: "GB",
    eligibility_nationalities: [],
    degree_levels: ["master"],
    fields_of_study: ["Social Sciences", "International Relations", "Law", "Public Health", "Economics"],
    funding_type: "fully_funded",
    application_deadline: new Date("2027-01-03").getTime(),
    application_deadline_text: "January 2027 (varies by course)",
    application_url: "https://www.whtrust.org/",
    tags: ["highly_competitive"],
  },
  {
    title: "ISDB Scholarship Programme (Islamic Development Bank)",
    description:
      "The Islamic Development Bank Merit Scholarship Programme for High Technology supports postgraduate studies in science and technology fields at leading world universities. Covers tuition, living allowance, travel, health insurance, and book/thesis allowance. Open to nationals of IsDB member countries.",
    provider_organization: "Islamic Development Bank",
    host_country: "SA",
    eligibility_nationalities: [],
    degree_levels: ["master", "phd"],
    fields_of_study: ["Engineering", "Computer Science", "Medicine", "Agriculture", "Environmental Science"],
    funding_type: "fully_funded",
    application_deadline: new Date("2027-02-28").getTime(),
    application_deadline_text: "February 28, 2027",
    application_url: "https://www.isdb.org/scholarships",
    tags: [],
  },
  {
    title: "Joint Japan/World Bank Graduate Scholarship Program (JJ/WBGSP)",
    description:
      "The JJ/WBGSP provides full scholarships for mid-career professionals from developing countries to pursue master's degrees in development-related fields at selected universities worldwide. Covers tuition, monthly living stipend, round-trip airfare, health insurance, and travel allowance. Applicants must have relevant work experience.",
    provider_organization: "World Bank Scholarship",
    host_country: "US",
    eligibility_nationalities: [],
    degree_levels: ["master"],
    fields_of_study: ["Economics", "Public Health", "Education", "Environmental Science", "Social Sciences"],
    funding_type: "fully_funded",
    application_deadline: new Date("2027-04-11").getTime(),
    application_deadline_text: "April 11, 2027",
    application_url: "https://www.worldbank.org/en/programs/scholarships",
    tags: [],
  },
  {
    title: "OAS Academic Scholarships (Organization of American States)",
    description:
      "The OAS offers scholarships for citizens of member states to pursue undergraduate and graduate studies in other OAS member countries. Covers tuition up to USD 30,000 per year, textbooks, partial living expenses, and medical insurance. Available for study in any of the 35 OAS member states across the Americas.",
    provider_organization: "OAS",
    host_country: "US",
    eligibility_nationalities: [],
    degree_levels: ["bachelor", "master", "phd"],
    fields_of_study: ["All subjects"],
    funding_type: "partial",
    application_deadline: new Date("2026-05-21").getTime(),
    application_deadline_text: "Varies by cycle",
    application_url: "https://www.oas.org/en/scholarships/",
    tags: [],
  },
  {
    title: "Taiwan ICDF International Higher Education Scholarship Program",
    description:
      "The Taiwan International Cooperation and Development Fund (ICDF) offers full scholarships for students from partner countries to pursue bachelor's, master's, or doctoral degrees at partnered Taiwanese universities. Covers tuition, accommodation, textbooks, living allowance (NTD 12,000-15,000/month), insurance, and round-trip airfare.",
    provider_organization: "Taiwan ICDF",
    host_country: "TW",
    eligibility_nationalities: [],
    degree_levels: ["bachelor", "master", "phd"],
    fields_of_study: [
      "Engineering",
      "Agriculture",
      "Medicine",
      "Business",
      "Computer Science",
      "Environmental Science",
    ],
    funding_type: "fully_funded",
    application_deadline: new Date("2027-03-15").getTime(),
    application_deadline_text: "March 15, 2027",
    application_url: "https://www.icdf.org.tw/ct.asp?xItem=12505&ctNode=29779&mp=2",
    tags: [],
  },
  {
    title: "NYU Abu Dhabi Global Scholarship",
    description:
      "NYU Abu Dhabi offers need-based financial aid to all admitted students, meeting 100% of demonstrated financial need. For many students, this results in a full scholarship covering tuition, housing, dining, global travel, and health insurance. NYUAD brings together students from over 115 countries on its Abu Dhabi campus.",
    provider_organization: "NYU Abu Dhabi",
    host_country: "AE",
    eligibility_nationalities: [],
    degree_levels: ["bachelor"],
    fields_of_study: ["All subjects"],
    funding_type: "fully_funded",
    application_deadline: new Date("2027-01-05").getTime(),
    application_deadline_text: "January 5, 2027",
    application_url: "https://nyuad.nyu.edu/en/admissions/financial-aid.html",
    tags: ["highly_competitive"],
  },
];

/**
 * Seed the scholarships table with real, detailed scholarship data.
 * Creates a "ScholarHub Seed" source and inserts all scholarships.
 * Computes prestige scores and search text inline (triggers are not wired).
 *
 * Run with: npx convex run seed:seedAll
 */
export const seedAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existingCount = await ctx.db
      .query("scholarships")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .take(1);

    if (existingCount.length > 0) {
      return { status: "skipped", message: "Scholarships already exist. Clear table first." };
    }

    // Create the seed source
    const sourceId = await ctx.db.insert("sources", {
      name: "ScholarHub Editorial",
      url: "https://scholarhub.app",
      category: "aggregator",
      scrape_method: "api",
      trust_level: "auto_publish",
      scrape_frequency_hours: 720,
      consecutive_failures: 0,
      is_active: true,
      wave: 0,
      notes: "Manually curated seed data",
    });

    let inserted = 0;
    const usedSlugs = new Set<string>();

    for (const s of SCHOLARSHIPS) {
      let slug = toSlug(s.title);
      // Ensure unique slugs
      if (usedSlugs.has(slug)) {
        slug = `${slug}-${inserted}`;
      }
      usedSlugs.add(slug);

      const score = calculatePrestigeScore({
        funding_type: s.funding_type,
        provider_organization: s.provider_organization,
        host_country: s.host_country,
        tags: s.tags,
      });
      const tier = scoreTier(score);
      const searchText = buildSearchText({
        title: s.title,
        description: s.description,
        eligibility_nationalities: s.eligibility_nationalities,
      });

      await ctx.db.insert("scholarships", {
        title: s.title,
        slug,
        description: s.description,
        provider_organization: s.provider_organization,
        host_country: s.host_country,
        eligibility_nationalities:
          s.eligibility_nationalities.length > 0 ? s.eligibility_nationalities : undefined,
        degree_levels: s.degree_levels,
        fields_of_study: s.fields_of_study,
        funding_type: s.funding_type,
        application_deadline: s.application_deadline,
        application_deadline_text: s.application_deadline_text,
        application_url: s.application_url,
        status: "published",
        source_ids: [sourceId],
        tags: s.tags.length > 0 ? s.tags : undefined,
        prestige_score: score,
        prestige_tier: tier,
        search_text: searchText,
        last_verified: Date.now(),
      });
      inserted++;
    }

    return { status: "seeded", inserted };
  },
});
