import { useState } from "react";
import { favicon, hostnameOf } from "@/data/resources";
import { cn } from "@/lib/utils";

interface FaviconProps {
  url: string;
  size?: number;
  className?: string;
}

/** Renders a site favicon via Google's S2 service. Falls back to first-letter tile. */
export function Favicon({ url, size = 64, className }: FaviconProps) {
  const [errored, setErrored] = useState(false);
  const host = hostnameOf(url);
  const letter = host[0]?.toUpperCase() ?? "?";

  if (errored) {
    return (
      <div
        aria-hidden
        className={cn(
          "flex items-center justify-center bg-accent-pink text-accent-foreground border-2 border-border font-heading",
          className,
        )}
      >
        {letter}
      </div>
    );
  }

  return (
    <img
      src={favicon(url, size)}
      alt=""
      loading="lazy"
      width={size / 2}
      height={size / 2}
      onError={() => setErrored(true)}
      className={cn(
        "bg-secondary-background border-2 border-border object-contain p-1",
        className,
      )}
    />
  );
}
