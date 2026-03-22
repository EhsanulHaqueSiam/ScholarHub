import { FileText, Stamp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CountryData } from "@/lib/country-data";

interface AdmissionVisaSectionProps {
  data: CountryData;
  countryName: string;
}

export function AdmissionVisaSection({ data, countryName }: AdmissionVisaSectionProps) {
  const { admissionRequirements, languageRequirements, visaDocuments, visaNote } = data;

  return (
    <section aria-labelledby="admission-visa-heading">
      <h2 id="admission-visa-heading" className="text-xl font-heading mb-4 flex items-center gap-2">
        Admission & Visa Requirements for {countryName}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Admission requirements */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="size-5" />
              Admission Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {admissionRequirements.map((req) => (
                <li key={req} className="flex gap-2 text-sm">
                  <span className="text-main shrink-0 mt-1">&bull;</span>
                  <span>{req}</span>
                </li>
              ))}
            </ul>

            {/* Language requirements table */}
            {languageRequirements.length > 0 && (
              <div>
                <h3 className="text-sm font-heading mb-2">Language Requirements</h3>
                <div className="border-2 border-border rounded-base overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-main/10">
                        <th className="text-start px-3 py-1.5 font-heading">Test</th>
                        <th className="text-start px-3 py-1.5 font-heading">Minimum Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {languageRequirements.map((lang) => (
                        <tr key={lang.test} className="border-t border-border/50">
                          <td className="px-3 py-1.5">{lang.test}</td>
                          <td className="px-3 py-1.5">{lang.minScore}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Visa documents */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Stamp className="size-5" />
              Visa Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {visaDocuments.map((doc) => (
                <li key={doc} className="flex gap-2 text-sm">
                  <span className="text-main shrink-0 mt-1">&bull;</span>
                  <span>{doc}</span>
                </li>
              ))}
            </ul>
            {visaNote && (
              <p className="text-xs text-foreground/60 border-t border-border/50 pt-3 mt-3">
                {visaNote}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
