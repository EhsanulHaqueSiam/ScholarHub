import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface CompareItem {
  slug: string;
  title: string;
}

interface CompareContextValue {
  selected: CompareItem[];
  addToCompare: (slug: string, title: string) => void;
  removeFromCompare: (slug: string) => void;
  clearCompare: () => void;
  isSelected: (slug: string) => boolean;
  isFull: boolean;
}

const CompareContext = createContext<CompareContextValue | null>(null);

const MAX_COMPARE = 3;

export function CompareProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<CompareItem[]>([]);

  const addToCompare = useCallback((slug: string, title: string) => {
    setSelected((prev) => {
      if (prev.length >= MAX_COMPARE) return prev;
      if (prev.some((item) => item.slug === slug)) return prev;
      return [...prev, { slug, title }];
    });
  }, []);

  const removeFromCompare = useCallback((slug: string) => {
    setSelected((prev) => prev.filter((item) => item.slug !== slug));
  }, []);

  const clearCompare = useCallback(() => {
    setSelected([]);
  }, []);

  const isSelected = useCallback(
    (slug: string) => selected.some((item) => item.slug === slug),
    [selected],
  );

  const isFull = selected.length >= MAX_COMPARE;

  const value = useMemo(
    () => ({
      selected,
      addToCompare,
      removeFromCompare,
      clearCompare,
      isSelected,
      isFull,
    }),
    [selected, addToCompare, removeFromCompare, clearCompare, isSelected, isFull],
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare(): CompareContextValue {
  const ctx = useContext(CompareContext);
  if (!ctx) {
    throw new Error("useCompare must be used within a CompareProvider");
  }
  return ctx;
}
