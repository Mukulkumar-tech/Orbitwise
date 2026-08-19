import { useCallback, useEffect, useRef, useState } from 'react';

export const QUERY_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
};

/**
 * Server-data fetching hook — the read half of the client-state architecture.
 *
 * Global state here is limited to what is genuinely global (auth, UI chrome).
 * Course lists, recommendations and dashboards are server *cache*, not app
 * state, so they live next to the component that renders them and are refetched
 * rather than synchronized.
 *
 *   const { data, isLoading, error, refetch } = useQuery(
 *     () => courseService.list(filters),
 *     [filters]
 *   )
 *
 * @param fetcher  Async function returning the payload. Receives an AbortSignal.
 * @param deps     Re-runs when these change (same contract as useEffect).
 * @param options  enabled · initialData · keepPreviousData · onSuccess · onError
 */
export function useQuery(fetcher, deps = [], options = {}) {
  const { enabled = true, initialData = null, keepPreviousData = false, onSuccess, onError } = options;

  const [state, setState] = useState({
    data: initialData,
    status: enabled ? QUERY_STATUS.LOADING : QUERY_STATUS.IDLE,
    error: null,
  });

  // Held in refs so a caller passing inline arrow functions — which is the
  // normal, readable way to use this — does not retrigger the effect forever.
  const fetcherRef = useRef(fetcher);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  fetcherRef.current = fetcher;
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  const mountedRef = useRef(true);

  /**
   * Monotonic id of the newest request. A response whose id is stale is
   * discarded, so fast filter changes cannot let an earlier, slower response
   * overwrite a later one — the classic out-of-order race that shows the wrong
   * results for the right filters.
   */
  const requestIdRef = useRef(0);

  /**
   * Declared before the fetching effect so that on React's StrictMode
   * remount it runs first and restores the flag before a fetch begins.
   *
   * Setting `true` in the body is essential, not decorative: StrictMode mounts,
   * tears down, then mounts again. A cleanup-only version would flip the flag to
   * false on that simulated unmount and never restore it, so every response
   * would be treated as belonging to a dead component and silently dropped —
   * leaving every page in development stuck on its loading state forever.
   */
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const execute = useCallback(
    async ({ silent = false } = {}) => {
      const requestId = ++requestIdRef.current;
      const controller = new AbortController();

      if (!silent) {
        setState((prev) => ({
          data: keepPreviousData ? prev.data : initialData,
          status: QUERY_STATUS.LOADING,
          error: null,
        }));
      }

      try {
        const data = await fetcherRef.current(controller.signal);
        if (!mountedRef.current || requestId !== requestIdRef.current) return undefined;

        setState({ data, status: QUERY_STATUS.SUCCESS, error: null });
        onSuccessRef.current?.(data);
        return data;
      } catch (error) {
        if (!mountedRef.current || requestId !== requestIdRef.current) return undefined;

        setState((prev) => ({
          data: keepPreviousData ? prev.data : initialData,
          status: QUERY_STATUS.ERROR,
          error,
        }));
        onErrorRef.current?.(error);
        return undefined;
      }
    },
    // initialData is intentionally excluded: callers commonly pass a fresh []
    // or {} literal, which would otherwise change identity on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [keepPreviousData]
  );

  useEffect(() => {
    if (!enabled) {
      setState((prev) => ({ ...prev, status: QUERY_STATUS.IDLE }));
      return;
    }
    execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, execute, ...deps]);

  /** Refetch showing the loading state — for an explicit "try again". */
  const refetch = useCallback(() => execute(), [execute]);

  /** Refetch keeping the current data on screen — for background updates. */
  const revalidate = useCallback(() => execute({ silent: true }), [execute]);

  /** Locally patch the cached value, e.g. after an optimistic mutation. */
  const setData = useCallback((updater) => {
    setState((prev) => ({
      ...prev,
      data: typeof updater === 'function' ? updater(prev.data) : updater,
    }));
  }, []);

  return {
    data: state.data,
    error: state.error,
    status: state.status,
    isIdle: state.status === QUERY_STATUS.IDLE,
    isLoading: state.status === QUERY_STATUS.LOADING,
    isSuccess: state.status === QUERY_STATUS.SUCCESS,
    isError: state.status === QUERY_STATUS.ERROR,
    /** True when a successful fetch returned nothing to show. */
    isEmpty:
      state.status === QUERY_STATUS.SUCCESS &&
      (state.data == null || (Array.isArray(state.data) && state.data.length === 0)),
    refetch,
    revalidate,
    setData,
  };
}

export default useQuery;
