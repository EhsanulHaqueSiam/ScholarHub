import { useCallback, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StickyBarProps {
  title: string;
  slug: string;
  applicationUrl?: string;
  visible: boolean;
  isExpired: boolean;
}

export function StickyBar({
  title,
  slug,
  applicationUrl,
  visible,
  isExpired,
}: StickyBarProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = useCallback(() => {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/scholarships/${slug}`
        : `/scholarships/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [slug]);

  return (
    <div
      role="banner"
      aria-label="Quick actions"
      className={`fixed top-14 inset-x-0 z-40 h-12 bg-secondary-background border-b-2 border-border motion-safe:transition-transform duration-200 ${
        !visible ? "" : "-translate-y-full"
      }`}
    >
      <div className="max-w-3xl mx-auto px-4 md:px-6 h-full flex items-center justify-between gap-2">
        {/* Truncated title */}
        <span className="text-sm truncate max-w-[200px] md:max-w-[400px] font-base">
          {title}
        </span>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="neutral"
            size="sm"
            onClick={handleCopyLink}
            aria-label={copied ? "Link copied" : `Copy link to ${title}`}
          >
            {copied ? (
              <>
                <Check className="size-3" />
                Link copied!
              </>
            ) : (
              <>
                <Copy className="size-3" />
                Copy Link
              </>
            )}
          </Button>

          {applicationUrl && !isExpired ? (
            <Button variant="default" size="sm" asChild>
              <a
                href={applicationUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Apply to ${title} (opens in new tab)`}
              >
                Apply Now
              </a>
            </Button>
          ) : (
            <Button variant="default" size="sm" disabled>
              {isExpired ? "Closed" : "No Link"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
