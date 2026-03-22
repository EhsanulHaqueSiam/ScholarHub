import DOMPurify from "dompurify";
import Markdown from "react-markdown";
import { Lightbulb } from "lucide-react";

interface EditorialTipsProps {
  notes: string | null | undefined;
}

/**
 * Detect whether content is HTML (from TipTap admin editor) or markdown (from auto-notes).
 * If content starts with an HTML tag or contains common HTML block/inline elements, treat as HTML.
 */
function isHtml(content: string): boolean {
  return (
    /^<[a-z]/i.test(content.trim()) ||
    /<\/?(?:p|div|ul|ol|li|h[1-6]|strong|em|a|br)\b/i.test(content)
  );
}

export function EditorialTips({ notes }: EditorialTipsProps) {
  if (!notes) {
    return (
      <p className="text-foreground/50 text-sm italic">
        Tips coming soon -- we're working on adding insider advice for this
        scholarship.
      </p>
    );
  }

  return (
    <div className="bg-main/5 border-2 border-main rounded-base p-4">
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb className="size-5 text-main" />
        <h4 className="font-heading text-sm">ScholarHub Tips</h4>
      </div>
      {isHtml(notes) ? (
        <HtmlContent html={notes} />
      ) : (
        <MarkdownContent notes={notes} />
      )}
    </div>
  );
}

/**
 * Render sanitized HTML content from TipTap admin editor.
 * Uses DOMPurify with a strict whitelist as defense-in-depth,
 * even though HTML comes from admin-controlled TipTap input.
 */
function HtmlContent({ html }: { html: string }) {
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p",
      "strong",
      "em",
      "a",
      "ul",
      "ol",
      "li",
      "h2",
      "h3",
      "br",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "class"],
  });

  return (
    <div
      className="prose prose-sm max-w-none"
      // SECURITY: Content is sanitized above via DOMPurify with strict tag/attr whitelist.
      // Source is admin-controlled TipTap input. DOMPurify provides defense-in-depth XSS protection.
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}

/**
 * Render markdown content (existing behavior for auto-generated notes).
 */
function MarkdownContent({ notes }: { notes: string }) {
  return (
    <Markdown
      allowedElements={["p", "strong", "em", "a", "ul", "ol", "li"]}
      components={{
        p: ({ children }) => (
          <p className="text-base leading-relaxed mb-2 last:mb-0">
            {children}
          </p>
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
          <ul className="list-disc list-inside space-y-1 text-base">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside space-y-1 text-base">
            {children}
          </ol>
        ),
        li: ({ children }) => <li className="text-base">{children}</li>,
        strong: ({ children }) => (
          <strong className="font-bold">{children}</strong>
        ),
        em: ({ children }) => <em>{children}</em>,
      }}
    >
      {notes}
    </Markdown>
  );
}
