import { Link } from "@tanstack/react-router";
import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CollectionCardProps {
  collection: {
    _id: string;
    slug: string;
    name: string;
    emoji: string;
    description?: string | null;
    scholarship_count: number;
  };
  className?: string;
}

/**
 * Grid card for browsing a scholarship collection.
 * Emoji + name + count badge + description with neo-brutalism styling.
 * Entire card is a link to /collections/{slug}.
 */
export const CollectionCard = memo(function CollectionCard({
  collection,
  className,
}: CollectionCardProps) {
  return (
    <Link
      to="/collections/$slug"
      params={{ slug: collection.slug }}
      className={cn(
        "block group rounded-base",
        "focus-visible:ring-2 focus-visible:ring-main focus-visible:ring-offset-2 focus-visible:outline-none",
        className,
      )}
    >
      <Card
        prestige="unranked"
        className={cn(
          "h-full transition-all",
          "motion-safe:hover:translate-x-boxShadowX motion-safe:hover:translate-y-boxShadowY hover:shadow-none",
        )}
      >
        <CardContent className="p-6 flex flex-col items-center text-center gap-4">
          {/* Emoji with accent background circle */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-base bg-main/10 flex items-center justify-center">
              <span className="text-5xl" role="img" aria-hidden="true">
                {collection.emoji}
              </span>
            </div>
          </div>

          {/* Name */}
          <h3 className="text-xl font-heading leading-tight truncate w-full">
            {collection.name}
          </h3>

          {/* Count badge */}
          <Badge variant="neutral">{collection.scholarship_count} scholarships</Badge>

          {/* Description */}
          {collection.description && (
            <p className="text-sm font-base text-foreground/70 line-clamp-2">
              {collection.description}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
});
