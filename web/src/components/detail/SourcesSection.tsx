import { ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatLastVerified } from "@/lib/deadline";

interface SourcesSectionProps {
  resolvedSources: Array<{ name: string; url: string }>;
  lastVerified: number | undefined;
  sourceCount: number;
}

export function SourcesSection({
  resolvedSources,
  lastVerified,
  sourceCount,
}: SourcesSectionProps) {
  const verified = formatLastVerified(lastVerified);

  return (
    <section aria-labelledby="sources-heading">
      <Card>
        <CardHeader>
          <CardTitle id="sources-heading" className="text-xl">
            Sources
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Source count trust signal */}
          <p className="text-sm text-foreground/70">
            Compiled from {sourceCount}{" "}
            {sourceCount === 1 ? "source" : "sources"}
          </p>

          {/* Source links */}
          {resolvedSources.length > 0 && (
            <ul className="space-y-1">
              {resolvedSources.map((source) => (
                <li key={source.url}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-main underline underline-offset-4 hover:opacity-80"
                  >
                    {source.name}
                    <ExternalLink className="inline size-3 ml-1" />
                  </a>
                </li>
              ))}
            </ul>
          )}

          {/* Last verified */}
          {verified && (
            <p className="text-sm text-foreground/50">
              Verified {verified.relative} ({verified.absolute})
            </p>
          )}

          {/* Stale data warning */}
          {verified?.isStale && (
            <div className="bg-urgency-warning/10 border border-urgency-warning rounded-base p-3">
              <p className="text-sm">
                This information may be outdated. Last verified over 30 days ago.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
