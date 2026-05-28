import { QueryClient } from '@tanstack/react-query';
import { errorMessage } from '@/lib/utils';

/**
 * The shared React Query client.
 *
 * Defaults are tuned for a dashboard app talking to a REST backend:
 *  - data is considered fresh for 30s (avoids refetch storms on
 *    quick navigation), and kept in cache 5 min after going unused
 *  - one retry on failure, but never on 4xx (those won't fix
 *    themselves — e.g. validation, auth, forbidden)
 *  - no refetch on window focus by default; screens that want live
 *    data can opt in per-query
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        const status = error?.response?.status;
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 1;
      },
    },
    mutations: {
      retry: false,
    },
  },
});

/** Re-export for callers that want a friendly message from an error. */
export { errorMessage };
