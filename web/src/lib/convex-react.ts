import {
  usePaginatedQuery as useConvexPaginatedQuery,
  useQuery as useConvexQuery,
} from "convex/react";
import { useRef } from "react";
import { usePageActivity } from "@/hooks/usePageActivity";

// Re-export everything else (useMutation, ConvexProvider, etc.)
export * from "convex/react";

export const useQuery: typeof useConvexQuery = ((query: any, ...args: any[]) => {
  const isActive = usePageActivity();
  const requestedSkip = args[0] === "skip";
  const shouldSubscribe = isActive && !requestedSkip;

  const liveData = useConvexQuery(query, ...(shouldSubscribe ? args : ["skip"]));
  const cachedDataRef = useRef(liveData);

  if (shouldSubscribe && liveData !== undefined) {
    cachedDataRef.current = liveData;
  }

  if (!shouldSubscribe && !requestedSkip) {
    return cachedDataRef.current;
  }

  return liveData;
}) as typeof useConvexQuery;

export const usePaginatedQuery: typeof useConvexPaginatedQuery = ((
  query: any,
  args: any,
  options: any,
) => {
  const isActive = usePageActivity();
  const requestedSkip = args === "skip";
  const shouldSubscribe = isActive && !requestedSkip;

  const liveResult = useConvexPaginatedQuery(query, shouldSubscribe ? args : "skip", options);
  const cachedResultRef = useRef(liveResult);

  if (shouldSubscribe) {
    cachedResultRef.current = liveResult;
  }

  if (!shouldSubscribe && !requestedSkip) {
    return cachedResultRef.current;
  }

  return liveResult;
}) as typeof useConvexPaginatedQuery;
