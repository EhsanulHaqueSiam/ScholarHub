import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { CollectionCard } from "@/components/collections/CollectionCard";
import { BackToTop } from "@/components/layout/BackToTop";
import { Navbar } from "@/components/layout/Navbar";
import { api } from "../../../convex/_generated/api";

export const Route = createFileRoute("/collections/")({
  head: () => ({
    meta: [
      { title: "Scholarship Collections | ScholarHub" },
      {
        name: "description",
        content: "Browse curated scholarship collections on ScholarHub.",
      },
    ],
  }),
  component: CollectionsBrowsePage,
});

/** Neo-brutalism grid/folder illustration for empty state */
function CollectionsEmptyIllustration() {
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
      {/* Folder body */}
      <rect
        x="15"
        y="40"
        width="90"
        height="55"
        rx="4"
        stroke="currentColor"
        strokeWidth="2"
        fill="var(--main)"
        fillOpacity="0.2"
      />
      {/* Folder tab */}
      <path
        d="M15 44 L15 36 Q15 32 19 32 L45 32 Q49 32 50 36 L52 40"
        stroke="currentColor"
        strokeWidth="2"
        fill="var(--main)"
        fillOpacity="0.2"
      />
      {/* Grid lines inside folder */}
      <line x1="60" y1="52" x2="60" y2="84" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      <line x1="28" y1="68" x2="92" y2="68" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      {/* Floating star */}
      <polygon
        points="95,18 98,28 108,28 100,34 103,44 95,38 87,44 90,34 82,28 92,28"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="var(--main)"
        fillOpacity="0.2"
      />
    </svg>
  );
}

/** Skeleton for collection card */
function CollectionCardSkeleton() {
  return (
    <div className="rounded-base border-2 border-border bg-secondary-background shadow-shadow p-6 flex flex-col items-center gap-4 motion-safe:animate-pulse">
      {/* Emoji circle */}
      <div className="w-16 h-16 rounded-base bg-border/20" />
      {/* Title line */}
      <div className="h-5 bg-border/20 rounded-base w-3/4" />
      {/* Badge */}
      <div className="h-5 bg-border/20 rounded-base w-20" />
      {/* Description lines */}
      <div className="space-y-2 w-full">
        <div className="h-3 bg-border/20 rounded-base w-full" />
        <div className="h-3 bg-border/20 rounded-base w-2/3" />
      </div>
    </div>
  );
}

function CollectionsBrowsePage() {
  const collections = useQuery(api.collections.getAllCollections);
  const isLoading = collections === undefined;
  const isEmpty = collections !== undefined && collections.length === 0;

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Page header */}
      <div className="pt-20 pb-8 md:pt-24 md:pb-12 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-2">
          <h1 className="text-2xl font-heading">Scholarship Collections</h1>
          <p className="text-sm font-base text-foreground/60">
            Curated lists to help you find the right scholarship
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1280px] mx-auto px-4 pb-16">
        {/* Loading skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <CollectionCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {isEmpty && (
          <div className="flex flex-col items-center text-center py-12 px-4">
            <CollectionsEmptyIllustration />
            <h2 className="font-heading text-xl mt-8">Collections coming soon!</h2>
            <p className="text-sm mt-3 max-w-md">Browse all scholarships instead.</p>
            <Link
              to="/scholarships"
              className="mt-6 inline-flex items-center justify-center rounded-base border-2 border-border bg-main px-6 py-3 text-sm font-base text-main-foreground shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none transition-[transform,box-shadow] duration-150 ease-out-expo active:scale-[0.97]"
            >
              Browse Scholarships
            </Link>
          </div>
        )}

        {/* Collection grid */}
        {collections && collections.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {collections.map((collection) => (
              <CollectionCard key={collection._id} collection={collection} />
            ))}
          </div>
        )}
      </div>

      <BackToTop />
    </div>
  );
}
