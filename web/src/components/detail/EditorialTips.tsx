import Markdown from "react-markdown";
import { Lightbulb } from "lucide-react";

interface EditorialTipsProps {
  notes: string | null | undefined;
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
    </div>
  );
}
