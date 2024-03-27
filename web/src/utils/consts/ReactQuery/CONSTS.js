export const SELECTS_QUERY_OPTIONS = {
  refetchOnMount: false,
  cacheTime: Infinity,
  staleTime: Infinity,
}

export const GRAPHS_QUERY_OPTIONS = {
  refetchOnMount: false,
  staleTime: 1000 /* ms */ * 60 /* secs */ * 5 /* mins */,
}
