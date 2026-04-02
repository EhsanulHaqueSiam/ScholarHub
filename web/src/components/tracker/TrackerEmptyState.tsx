import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function TrackerEmptyState() {
  return (
    <div className="text-center py-16 max-w-md mx-auto">
      <h2 className="font-heading text-heading mb-4">
        No applications being tracked
      </h2>
      <p className="text-body mb-8">
        Start tracking scholarships you're interested in. Visit any scholarship
        page and tap 'Track This' to add it here.
      </p>
      <Button asChild variant="default">
        <Link to="/scholarships">Browse Scholarships</Link>
      </Button>
    </div>
  );
}
