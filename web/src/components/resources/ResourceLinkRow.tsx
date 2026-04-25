import { ArrowUpRight, Star } from "lucide-react";
import type { ResourceLink } from "@/data/resources";
import { hostnameOf } from "@/data/resources";
import { Favicon } from "./Favicon";
import { TagChip } from "./TagChip";

interface ResourceLinkRowProps {
  link: ResourceLink;
}

export function ResourceLinkRow({ link }: ResourceLinkRowProps) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group grid grid-cols-[auto_1fr_auto] items-start gap-3 md:gap-4 border-2 border-border bg-secondary-background px-3 md:px-4 py-3 motion-safe:transition-[transform,box-shadow,background-color] motion-safe:duration-150 ease-out-expo hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[5px_5px_0_0_var(--border)] hover:bg-background"
    >
      <Favicon url={link.url} className="size-9 md:size-10 shrink-0 mt-0.5" />

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-heading text-sm md:text-base leading-tight">
            {link.name}
          </span>
          {link.star ? (
            <span
              aria-label="Curator pick"
              title="Curator pick"
              className="inline-flex items-center justify-center size-4 bg-accent border-[1.5px] border-border"
            >
              <Star className="size-2.5 text-accent-foreground fill-accent-foreground" />
            </span>
          ) : null}
        </div>
        {link.desc ? (
          <p className="font-base text-caption text-foreground/65 leading-snug mt-0.5">
            {link.desc}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1.5">
          <span className="font-mono text-[10px] text-foreground/45 truncate max-w-[220px]">
            {hostnameOf(link.url)}
          </span>
          {link.tags?.map((t) => (
            <TagChip key={t} tag={t} size="sm" />
          ))}
        </div>
      </div>

      <ArrowUpRight
        className="size-4 text-foreground/40 mt-1 shrink-0 motion-safe:transition-transform group-hover:rotate-12 group-hover:text-foreground"
        aria-hidden
      />
    </a>
  );
}
