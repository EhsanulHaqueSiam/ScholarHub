import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface CompareItem {
  slug: string;
  title: string;
}

interface CompareState {
  selected: CompareItem[];
  addToCompare: (slug: string, title: string) => void;
  removeFromCompare: (slug: string) => void;
  clearCompare: () => void;
  isSelected: (slug: string) => boolean;
  isFull: boolean;
  announcement: string;
}

const MAX_COMPARE = 3;

const CompareContext = createContext<CompareState | null>(null);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<CompareItem[]>([]);
  const [announcement, setAnnouncement] = useState("");
  const announcementTimer = useRef<ReturnType<typeof setTimeout>>();

  const announce = useCallback((message: string) => {
    if (announcementTimer.current) {
      clearTimeout(announcementTimer.current);
    }
    setAnnouncement(message);
    announcementTimer.current = setTimeout(() => setAnnouncement(""), 3000);
  }, []);

  const addToCompare = useCallback(
    (slug: string, title: string) => {
      setSelected((prev) => {
        if (prev.length >= MAX_COMPARE) return prev;
        if (prev.some((item) => item.slug === slug)) return prev;
        const next = [...prev, { slug, title }];
        announce(
          `${title} added to comparison. ${next.length} of ${MAX_COMPARE} selected.`,
        );
        return next;
      });
    },
    [announce],
  );

  const removeFromCompare = useCallback(
    (slug: string) => {
      setSelected((prev) => {
        const item = prev.find((i) => i.slug === slug);
        const next = prev.filter((i) => i.slug !== slug);
        if (item) {
          announce(`${item.title} removed from comparison.`);
        }
        return next;
      });
    },
    [announce],
  );

  const clearCompare = useCallback(() => {
    setSelected([]);
    announce("Comparison cleared.");
  }, [announce]);

  const isSelected = useCallback(
    (slug: string) => selected.some((item) => item.slug === slug),
    [selected],
  );

  return (
    <CompareContext.Provider
      value={{
        selected,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isSelected,
        isFull: selected.length >= MAX_COMPARE,
        announcement,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare(): CompareState {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
}
