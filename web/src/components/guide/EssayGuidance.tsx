import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface GuidanceSection {
  type: string;
  label: string;
  variant: string;
  commonPrompts: string[];
  reviewerExpectations: string[];
  tips: string[];
}

const GUIDANCE_DATA: GuidanceSection[] = [
  {
    type: "government",
    label: "Government Scholarships",
    variant: "typeGovernment",
    commonPrompts: [
      "How will this scholarship help you contribute to your home country's development?",
      "Describe your academic achievements and career goals",
      "Why did you choose this particular country/institution?",
      "How does your background prepare you for this program?",
    ],
    reviewerExpectations: [
      "Clear connection between studies and home-country impact",
      "Specific career plan, not vague aspirations",
      "Awareness of the sponsoring country's values and priorities",
      "Evidence of leadership or community involvement",
    ],
    tips: [
      "Research the funding country's development priorities",
      "Be specific about your post-graduation plans",
      "Show you've already started working toward your goals",
      "Mention any existing connections to the host country",
    ],
  },
  {
    type: "merit",
    label: "Merit-Based Scholarships",
    variant: "typeMerit",
    commonPrompts: [
      "Describe an academic or research achievement you're most proud of",
      "How will you use this scholarship to advance your field?",
      "What makes you stand out among other candidates?",
      "Describe your research interests and methodology",
    ],
    reviewerExpectations: [
      "Outstanding academic record with context (e.g., class rank)",
      "Clear intellectual curiosity beyond grades",
      "Published work, conference presentations, or research experience",
      "Ambitious but realistic research/career goals",
    ],
    tips: [
      "Quantify achievements wherever possible",
      "Show depth of expertise, not just breadth",
      "Connect your research to real-world impact",
      "Have a professor review your SOP for technical accuracy",
    ],
  },
  {
    type: "need_based",
    label: "Need-Based Scholarships",
    variant: "typeNeedBased",
    commonPrompts: [
      "Describe your financial circumstances and why you need support",
      "How will this scholarship change your educational trajectory?",
      "What obstacles have you overcome to pursue education?",
      "How do you plan to give back to your community?",
    ],
    reviewerExpectations: [
      "Honest and specific financial context without oversharing",
      "Resilience and determination despite challenges",
      "Clear educational goals tied to financial independence",
      "Community orientation — helping others in similar situations",
    ],
    tips: [
      "Be honest but not dramatic — reviewers read many applications",
      "Focus on your potential, not just your hardships",
      "Show you've already taken steps to help yourself",
      "Include specific dollar amounts if the form asks for them",
    ],
  },
  {
    type: "university",
    label: "University Scholarships",
    variant: "typeUniversity",
    commonPrompts: [
      "Why did you choose this university specifically?",
      "How will you contribute to the campus community?",
      "Describe your fit with the department/program",
      "What extracurricular activities will you participate in?",
    ],
    reviewerExpectations: [
      "Genuine knowledge of the university (not generic statements)",
      "Fit with department culture and research areas",
      "Plans to contribute beyond academics",
      "Awareness of specific resources, labs, or faculty",
    ],
    tips: [
      "Name specific professors, labs, or programs you want to join",
      "Visit the department's recent publications page",
      "Explain why THIS university, not just any university",
      "Show you've already connected with current students or faculty",
    ],
  },
  {
    type: "research",
    label: "Research Scholarships",
    variant: "typeResearch",
    commonPrompts: [
      "Describe your proposed research project and its significance",
      "What methodology will you use and why?",
      "How does this research build on existing work in the field?",
      "What is the expected impact of your research?",
    ],
    reviewerExpectations: [
      "Well-defined research question with clear methodology",
      "Awareness of the current state of the field (literature review)",
      "Feasible timeline for the proposed work",
      "Evidence of prior research experience",
    ],
    tips: [
      "Keep the proposal focused — depth over breadth",
      "Include a realistic timeline with milestones",
      "Cite recent publications from the target institution",
      "Explain why this institution is the best place for this research",
    ],
  },
];

export function EssayGuidancePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 pt-24 pb-12">
      <h1 className="font-heading text-heading mb-2">Essay & SOP Guidance</h1>
      <p className="text-body opacity-70 mb-8">
        Guidance for writing scholarship essays and statements of purpose by
        scholarship type. No AI-generated essays — just actionable advice from
        what reviewers actually look for.
      </p>

      <div className="flex flex-col gap-8">
        {GUIDANCE_DATA.map((section) => (
          <Card key={section.type} id={section.type}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Badge variant={section.variant as any}>{section.label}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div>
                <h3 className="font-heading text-sm mb-2">Common Prompts</h3>
                <ul className="list-disc list-inside space-y-1">
                  {section.commonPrompts.map((p) => (
                    <li key={p} className="text-caption">{p}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-heading text-sm mb-2">What Reviewers Look For</h3>
                <ul className="list-disc list-inside space-y-1">
                  {section.reviewerExpectations.map((e) => (
                    <li key={e} className="text-caption">{e}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-heading text-sm mb-2">Tips</h3>
                <ul className="list-disc list-inside space-y-1">
                  {section.tips.map((t) => (
                    <li key={t} className="text-caption">{t}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
