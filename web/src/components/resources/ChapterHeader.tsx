interface ChapterHeaderProps {
  number: string;
  kicker: string;
  title: string;
  children?: React.ReactNode;
}

/**
 * The "chapter" marker that opens each major section.
 * Big numeric block on the left, kicker + title + optional lede on the right.
 */
export function ChapterHeader({ number, kicker, title, children }: ChapterHeaderProps) {
  return (
    <header className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 md:gap-10 items-start">
      <div
        aria-hidden
        className="bg-foreground text-background font-heading text-display-sm md:text-display leading-none px-4 py-3 border-2 border-border w-fit shadow-shadow"
      >
        {number}
      </div>
      <div>
        <p className="font-heading text-caption uppercase tracking-[0.25em] text-foreground/55">
          {kicker}
        </p>
        <h2 className="font-heading text-heading md:text-title leading-[1.1] mt-2 max-w-2xl">
          {title}
        </h2>
        {children ? (
          <p className="font-base text-foreground/65 text-base md:text-lg mt-3 max-w-2xl">
            {children}
          </p>
        ) : null}
      </div>
    </header>
  );
}
