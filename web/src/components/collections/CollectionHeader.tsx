import { Check, Copy } from "lucide-react";
import { useCallback, useState } from "react";
import Markdown from "react-markdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CollectionHeaderProps {
  collection: {
    name: string;
    emoji: string;
    description?: string | null;
    scholarship_count: number;
    slug: string;
    default_sort?: string | null;
  };
}

const SORT_LABELS: Record<string, string> = {
  deadline: "Deadline",
  prestige: "Prestige",
  newest: "Newest",
  amount: "Amount",
};

/**
 * Collection detail page header.
 * Emoji + name + markdown description + count badge + copy link + sort label.
 */
export function CollectionHeader({ collection }: CollectionHeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = useCallback(() => {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/collections/${collection.slug}`
        : `/collections/${collection.slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [collection.slug]);

  const sortLabel = collection.default_sort
    ? SORT_LABELS[collection.default_sort] ?? collection.default_sort
    : "Deadline";

  return (
    <header className="flex flex-col items-center text-center gap-4">
      {/* Emoji with accent circle */}
      <div className="w-20 h-20 rounded-full bg-main/10 flex items-center justify-center">
        <span className="text-[64px] leading-none" role="img" aria-hidden="true">
          {collection.emoji}
        </span>
      </div>

      {/* Name */}
      <h1 className="text-2xl font-heading">{collection.name}</h1>

      {/* Description rendered as markdown */}
      {collection.description && (
        <div className="max-w-2xl text-sm text-foreground/70">
          <Markdown
            allowedElements={["p", "strong", "em", "a", "ul", "ol", "li"]}
            components={{
              p: ({ children }) => (
                <p className="text-sm leading-relaxed mb-2 last:mb-0">{children}</p>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-main underline underline-offset-4"
                >
                  {children}
                </a>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-inside space-y-1 text-sm">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside space-y-1 text-sm">{children}</ol>
              ),
              li: ({ children }) => <li className="text-sm">{children}</li>,
              strong: ({ children }) => <strong className="font-bold">{children}</strong>,
              em: ({ children }) => <em>{children}</em>,
            }}
          >
            {collection.description}
          </Markdown>
        </div>
      )}

      {/* Count badge + copy link */}
      <div className="flex items-center gap-3">
        <Badge variant="neutral">{collection.scholarship_count} scholarships</Badge>
        <Button
          variant="neutral"
          size="sm"
          onClick={handleCopyLink}
          aria-label="Copy collection link"
          className="text-xs"
        >
          {copied ? (
            <>
              <Check className="size-3" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="size-3" />
              Copy Link
            </>
          )}
        </Button>
      </div>

      {/* Sort label */}
      <p className="text-xs text-foreground/50">Sorted by: {sortLabel}</p>
    </header>
  );
}
