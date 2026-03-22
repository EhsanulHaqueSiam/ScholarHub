import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";

interface CollectionBadgesProps {
  collections?: Array<{ name: string; slug: string; emoji: string }>;
}

/**
 * Collection membership badges for the scholarship detail hero section.
 *
 * D-50: Show which curated collections contain this scholarship.
 * Each badge links to the collection's dedicated page at /collections/{slug}.
 */
export function CollectionBadges({ collections }: CollectionBadgesProps) {
  if (!collections || collections.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {collections.map((collection) => (
        <Badge
          key={collection.slug}
          variant="neutral"
          className="cursor-pointer bg-transparent hover:bg-secondary-background transition-colors"
          asChild
        >
          <Link to={`/collections/${collection.slug}`}>
            {collection.emoji} {collection.name}
          </Link>
        </Badge>
      ))}
    </div>
  );
}
