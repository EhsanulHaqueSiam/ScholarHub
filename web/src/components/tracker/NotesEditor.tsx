import { useState, useEffect } from "react";
import { useTrackerStore } from "@/hooks/useTrackerStore";

interface NotesEditorProps {
  slug: string;
  initialNotes?: string;
}

export function NotesEditor({ slug, initialNotes }: NotesEditorProps) {
  const [localNotes, setLocalNotes] = useState(initialNotes ?? "");
  const updateNotes = useTrackerStore((s) => s.updateNotes);

  useEffect(() => {
    const timer = setTimeout(() => {
      updateNotes(slug, localNotes);
    }, 500);
    return () => clearTimeout(timer);
  }, [localNotes, slug, updateNotes]);

  const count = localNotes.length;

  return (
    <div>
      <textarea
        value={localNotes}
        onChange={(e) => setLocalNotes(e.target.value)}
        placeholder="Add notes about this application..."
        maxLength={500}
        className="text-caption bg-secondary-background border-2 border-border p-3 w-full min-h-[80px] resize-y focus:outline-none focus:ring-2 focus:ring-main"
      />
      <p
        className={`text-caption mt-1 ${
          count > 450 ? "text-destructive" : "text-foreground/60"
        }`}
      >
        {count}/500
      </p>
    </div>
  );
}
