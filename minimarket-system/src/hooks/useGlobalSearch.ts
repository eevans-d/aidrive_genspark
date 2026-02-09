import { useQuery } from '@tanstack/react-query'
import { searchApi, type GlobalSearchResponse } from '../lib/apiClient'

export function useGlobalSearch(query: string, enabled = true) {
  return useQuery<GlobalSearchResponse>({
    queryKey: ['global-search', query],
    queryFn: () => searchApi.global(query),
    enabled: enabled && query.length >= 2,
    staleTime: 30_000,
    gcTime: 60_000,
    placeholderData: (prev) => prev,
  })
}
