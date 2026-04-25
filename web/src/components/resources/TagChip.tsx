import type { LucideIcon } from "lucide-react";
import { type ResourceTag, TAG_META } from "@/data/resources";
import { cn } from "@/lib/utils";

const TAG_VARIANTS: Record<ResourceTag, string> = {
  bangladesh: "bg-accent-pink text-accent-foreground border-border",
  official: "bg-secondary-background text-foreground border-border",
  free: "bg-accent-lime text-accent-foreground border-border",
  "free-tuition": "bg-accent-lime text-accent-foreground border-border",
  "reddit-pick": "bg-accent text-accent-foreground border-border",
  phd: "bg-accent-sky text-accent-foreground border-border",
  mba: "bg-secondary-background text-foreground border-border",
  cs: "bg-accent-sky text-accent-foreground border-border",
  stem: "bg-accent-sky text-accent-foreground border-border",
  women: "bg-accent-pink text-accent-foreground border-border",
  "ai-tool": "bg-foreground text-background border-border",
  "scam-warning": "bg-[var(--urgency-critical)] text-main-foreground border-border",
  newsletter: "bg-secondary-background text-foreground border-border",
  community: "bg-secondary-background text-foreground border-border",
  europe: "bg-secondary-background text-foreground border-border",
  us: "bg-secondary-background text-foreground border-border",
  uk: "bg-secondary-background text-foreground border-border",
  germany: "bg-secondary-background text-foreground border-border",
  tactic: "bg-foreground text-background border-border",
};

interface TagChipProps {
  tag: ResourceTag;
  active?: boolean;
  onToggle?: (tag: ResourceTag) => void;
  size?: "sm" | "md";
  count?: number;
  icon?: LucideIcon;
}

export function TagChip({
  tag,
  active = false,
  onToggle,
  size = "sm",
  count,
  icon: Icon,
}: TagChipProps) {
  const meta = TAG_META[tag];
  const interactive = Boolean(onToggle);
  const Comp = interactive ? "button" : "span";

  return (
    <Comp
      type={interactive ? "button" : undefined}
      onClick={interactive ? () => onToggle?.(tag) : undefined}
      aria-pressed={interactive ? active : undefined}
      title={meta.label}
      className={cn(
        "inline-flex items-center gap-1.5 border-2 font-heading whitespace-nowrap motion-safe:transition-[transform,box-shadow] motion-safe:duration-150 ease-out-expo",
        size === "sm" ? "text-[11px] px-2 py-0.5" : "text-caption px-2.5 py-1",
        active ? `${TAG_VARIANTS[tag]} shadow-[3px_3px_0_0_var(--border)]` : "bg-transparent text-foreground border-border/60 hover:border-border",
        interactive && "cursor-pointer hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[3px_3px_0_0_var(--border)] active:scale-[0.97]",
      )}
    >
      {Icon ? <Icon className="size-3" aria-hidden /> : null}
      <span>{meta.short}</span>
      {typeof count === "number" ? (
        <span className="ml-0.5 font-mono text-[10px] opacity-70">{count}</span>
      ) : null}
    </Comp>
  );
}
