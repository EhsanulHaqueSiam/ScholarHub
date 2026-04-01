/**
 * React hook for loading static scholarship data.
 *
 * Loads the pre-exported JSON on first render and provides
 * the same data shape as the Convex useQuery hooks it replaces.
 *
 * Usage:
 *   const { data, isLoading } = useStaticData();
 *   if (data) {
 *     const detail = getScholarshipBySlug(data, slug);
 *   }
 */

import { useEffect, useState } from "react";
import {
  type StaticData,
  getStaticData,
  loadStaticData,
} from "../lib/static-data";
import { buildSearchIndex } from "../lib/search-engine";

export function useStaticData(): {
  data: StaticData | null;
  isLoading: boolean;
} {
  const [data, setData] = useState<StaticData | null>(getStaticData);
  const [isLoading, setIsLoading] = useState(!data);

  useEffect(() => {
    if (data) return;

    let cancelled = false;
    loadStaticData().then((loaded) => {
      if (cancelled) return;
      if (loaded) {
        // Build search index from summaries
        buildSearchIndex(loaded.summaries);
      }
      setData(loaded);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [data]);

  return { data, isLoading };
}
