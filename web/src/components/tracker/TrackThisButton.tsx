import { Check, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useTrackerStore } from "@/lib/tracker/tracker-store";

interface TrackThisButtonProps {
  slug: string;
  title: string;
  variant?: "full" | "icon";
  size?: "default" | "sm" | "lg";
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export function TrackThisButton({
  slug,
  title,
  variant = "full",
  size = "default",
  className,
  onClick,
}: TrackThisButtonProps) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    useTrackerStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  const tracked = useTrackerStore((s) => s.isTracked(slug));
  const addEntry = useTrackerStore((s) => s.addEntry);
  const removeEntry = useTrackerStore((s) => s.removeEntry);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick?.(e);
    if (tracked) {
      removeEntry(slug);
      toast.success("Removed from tracker");
    } else {
      addEntry(slug, title);
      toast.success("Added to tracker");
    }
  };

  if (!hydrated) {
    if (variant === "icon") {
      return (
        <Button
          variant="neutral"
          size="icon"
          className={className}
          disabled
          aria-label="Track this scholarship"
        >
          <Plus className="size-4" />
        </Button>
      );
    }
    return (
      <Button variant="default" size={size} className={className} disabled>
        <Plus className="size-4" />
        Track This
      </Button>
    );
  }

  if (variant === "icon") {
    const label = tracked ? "Manage tracked scholarship" : "Track this scholarship";
    return (
      <Button
        variant="neutral"
        size="icon"
        className={`motion-safe:transition-all duration-150 ${className ?? ""}`}
        onClick={handleClick}
        aria-label={label}
        title={label}
      >
        {tracked ? <Check className="size-4" /> : <Plus className="size-4" />}
      </Button>
    );
  }

  return (
    <Button
      variant={tracked ? "neutral" : "default"}
      size={size}
      className={`motion-safe:transition-all duration-150 ${className ?? ""}`}
      onClick={handleClick}
    >
      {tracked ? (
        <>
          <Check className="size-4" />
          Tracking
        </>
      ) : (
        <>
          <Plus className="size-4" />
          Track This
        </>
      )}
    </Button>
  );
}
