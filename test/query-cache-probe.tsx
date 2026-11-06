import { useQuery, useQueryClient } from "@tanstack/react-query";

/** Shows whether the query cache already held `queryKey` before this render, then adds it. */
export function QueryCacheProbe({ queryKey }: { queryKey: string }) {
  const cached =
    useQueryClient()
      .getQueryCache()
      .find({ queryKey: [queryKey] }) !== undefined;
  useQuery({
    queryKey: [queryKey],
    queryFn: () => queryKey,
    initialData: queryKey,
    staleTime: Infinity, // never refetch, so the test sends no requests
  });
  return <p>{cached ? "cached" : "new"}</p>;
}
