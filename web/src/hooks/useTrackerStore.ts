import { useEffect, useState } from "react";
import { useTrackerStore as useStore } from "@/lib/tracker/tracker-store";

export function useTrackerHydration() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    useStore.persist.rehydrate();
    setHydrated(true);
  }, []);
  return hydrated;
}

export { useStore as useTrackerStore };
