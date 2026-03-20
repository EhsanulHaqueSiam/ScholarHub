import type { Doc } from "../../../convex/_generated/dataModel";
import { ScholarshipCard } from "./ScholarshipCard";

interface EmptyStateProps {
  mostRestrictiveFilter?: string;
  fallbackScholarships?: Doc<"scholarships">[];
}

/** Neo-brutalism geometric magnifying glass illustration */
function EmptyIllustration() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="mx-auto"
    >
      {/* Magnifying glass body - tilted 15 degrees */}
      <g transform="rotate(-15 60 55)">
        {/* Glass circle */}
        <circle
          cx="52"
          cy="48"
          r="28"
          stroke="currentColor"
          strokeWidth="2"
          fill="var(--main)"
          fillOpacity="0.2"
        />
        {/* Handle */}
        <line
          x1="72"
          y1="68"
          x2="95"
          y2="91"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </g>

      {/* Floating geometric shapes */}
      {/* Circle - top right */}
      <circle
        cx="98"
        cy="22"
        r="8"
        stroke="currentColor"
        strokeWidth="2"
        fill="var(--main)"
        fillOpacity="0.2"
      />
      {/* Triangle - top left */}
      <polygon
        points="20,28 10,44 30,44"
        stroke="currentColor"
        strokeWidth="2"
        fill="var(--main)"
        fillOpacity="0.2"
        strokeLinejoin="round"
      />
      {/* Square - bottom left */}
      <rect
        x="8"
        y="72"
        width="16"
        height="16"
        stroke="currentColor"
        strokeWidth="2"
        fill="var(--main)"
        fillOpacity="0.2"
      />
    </svg>
  );
}

export function EmptyState({ mostRestrictiveFilter, fallbackScholarships }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center text-center py-12 px-4">
      <EmptyIllustration />

      <h2 className="font-heading text-xl mt-8">No scholarships match your filters</h2>

      <p className="text-sm mt-3 max-w-md">
        {mostRestrictiveFilter
          ? `Try removing "${mostRestrictiveFilter}" or broadening your search. Here are some popular scholarships you might like:`
          : "Try broadening your search or removing some filters. Here are some popular scholarships you might like:"}
      </p>

      {/* Fallback scholarships */}
      {fallbackScholarships && fallbackScholarships.length > 0 && (
        <div className="mt-8 w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {fallbackScholarships.slice(0, 4).map((scholarship) => (
            <ScholarshipCard key={scholarship._id} scholarship={scholarship} />
          ))}
        </div>
      )}
    </div>
  );
}
