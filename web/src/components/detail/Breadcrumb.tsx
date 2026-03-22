import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

interface DetailBreadcrumbProps {
  scholarshipTitle: string;
  searchParams?: Record<string, string | undefined>;
}

export function DetailBreadcrumb({
  scholarshipTitle,
  searchParams,
}: DetailBreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="inline-flex items-center gap-2 rounded-base border-2 border-border bg-secondary-background px-3 py-1.5 shadow-shadow"
    >
      <ol className="flex items-center gap-1 text-sm">
        <li>
          <Link
            to="/scholarships"
            search={searchParams}
            className="font-heading text-foreground/70 transition-colors hover:text-foreground"
          >
            Scholarships
          </Link>
        </li>
        <li>
          <ChevronRight
            className="size-3.5 text-foreground/40"
            aria-hidden="true"
          />
        </li>
        <li>
          <span className="font-heading truncate max-w-[200px] md:max-w-[400px] inline-block align-bottom">
            {scholarshipTitle}
          </span>
        </li>
      </ol>
    </nav>
  );
}
