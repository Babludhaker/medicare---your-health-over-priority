import {
  useQuery,
  useMutation as useRQMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { errorMessage } from '@/lib/utils';

/**
 * Data hooks — thin, idiomatic adapters over TanStack Query.
 *
 * These keep a small, consistent surface across the ~30 dashboard
 * screens while exposing React Query's real behaviour: caching by
 * query key, background refetch, request dedup, and precise
 * invalidation after mutations.
 */

/**
 * useResource — a cached read.
 *
 *   const { data, loading, error, refetch } = useResource(
 *     qk.clinics.list(params),
 *     () => clinicApi.list(params),
 *     { enabled: true }
 *   );
 *
 * @param {Array}    key      React Query key (see lib/queryKeys.js)
 * @param {Function} fetcher  async function returning the payload
 * @param {Object}   options  { enabled, staleTime, refetchOnWindowFocus }
 *
 * Returns the familiar { data, meta, loading, error, refetch } shape.
 * `meta` is lifted from the API client's non-enumerable `_meta`.
 */
export function useResource(key, fetcher, options = {}) {
  const query = useQuery({
    queryKey: key,
    queryFn: fetcher,
    ...options,
  });

  return {
    data: query.data ?? null,
    meta: query.data?._meta || null,
    loading: query.isLoading,
    fetching: query.isFetching,
    error: query.isError ? errorMessage(query.error) : '',
    refetch: query.refetch,
    // Escape hatch for the rare screen that needs the raw query.
    query,
  };
}

/**
 * useMutation — a write, with automatic cache invalidation.
 *
 *   const { mutate, mutateAsync, loading } = useMutation(
 *     (body) => clinicApi.create(body),
 *     {
 *       invalidate: [qk.clinics.all],
 *       onSuccess: () => notify.success('Created'),
 *     }
 *   );
 *
 * `invalidate` is a list of query keys (or key prefixes) to mark stale
 * after the mutation succeeds — React Query then refetches any that
 * are currently mounted. `mutateAsync` returns a promise so callers
 * can `await` it inside a try/catch (used by the form screens).
 *
 * @param {Function} mutationFn  async function performing the write
 * @param {Object}   options     { invalidate, onSuccess, onError }
 */
export function useMutation(mutationFn, options = {}) {
  const { invalidate = [], onSuccess, onError } = options;
  const queryClient = useQueryClient();

  const mutation = useRQMutation({
    mutationFn,
    onSuccess: (data, variables, context) => {
      // Invalidate every requested key/prefix so dependent lists and
      // detail views refetch their data.
      invalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      onSuccess?.(data, variables, context);
    },
    onError: (error) => {
      onError?.(error);
    },
  });

  return {
    // `mutate` is fire-and-forget; `mutateAsync` is awaitable.
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    loading: mutation.isPending,
    error: mutation.isError ? errorMessage(mutation.error) : '',
    reset: mutation.reset,
  };
}
