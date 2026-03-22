import { Briefcase } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CountryData } from "@/lib/country-data";

interface PostStudyWorkSectionProps {
  data: CountryData;
  countryName: string;
}

export function PostStudyWorkSection({ data, countryName }: PostStudyWorkSectionProps) {
  const { postStudyWork } = data;

  return (
    <section aria-labelledby="post-study-heading">
      <h2 id="post-study-heading" className="text-xl font-heading mb-4 flex items-center gap-2">
        <Briefcase className="size-5" />
        Post-Study Work in {countryName}
      </h2>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{postStudyWork.visaName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-2xl font-heading">{postStudyWork.duration}</p>
          <p className="text-sm">{postStudyWork.description}</p>
          {postStudyWork.conditions && postStudyWork.conditions.length > 0 && (
            <div>
              <h3 className="text-sm font-heading mb-2">Conditions</h3>
              <ul className="space-y-1.5">
                {postStudyWork.conditions.map((condition) => (
                  <li key={condition} className="flex gap-2 text-sm">
                    <span className="text-main shrink-0 mt-1">&bull;</span>
                    <span>{condition}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
