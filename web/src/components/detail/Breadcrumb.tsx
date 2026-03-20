import { Link } from "@tanstack/react-router";

interface DetailBreadcrumbProps {
  scholarshipTitle: string;
  searchParams?: Record<string, string | undefined>;
}

export function DetailBreadcrumb({
  scholarshipTitle,
  searchParams,
}: DetailBreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-1 text-sm">
        <li>
          <Link
            to="/scholarships"
            search={searchParams}
            className="hover:underline underline-offset-4"
          >
            Scholarships
          </Link>
        </li>
        <li>
          <span className="text-foreground/40" aria-hidden="true">
            &gt;
          </span>
        </li>
        <li>
          <span className="truncate max-w-[160px] md:max-w-[300px] inline-block align-bottom">
            {scholarshipTitle}
          </span>
        </li>
      </ol>
    </nav>
  );
}
