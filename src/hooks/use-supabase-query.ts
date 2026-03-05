"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

interface QueryOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  enabled?: boolean;
}

interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

class QueryTimeoutError extends Error {
  constructor(message = "Query timeout") {
    super(message);
    this.name = "QueryTimeoutError";
  }
}

/**
 * Hook for making Supabase queries with timeout and retry logic
 * Prevents NetworkError by handling timeouts gracefully
 */
export function useSupabaseQuery<T = unknown>(
  queryFn: (supabase: SupabaseClient) => Promise<T>,
  deps: React.DependencyList = [],
  options: QueryOptions = {}
): QueryState<T> & { refetch: () => void } {
  const {
    timeout = 15000,
    retries = 3,
    retryDelay = 1000,
    enabled = true,
  } = options;

  const [state, setState] = useState<QueryState<T>>({
    data: null,
    loading: enabled,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const supabase = createClient();

  const executeQuery = useCallback(
    async (signal: AbortSignal) => {
      const attempt = async (retryCount: number): Promise<T> => {
        try {
          const timeoutPromise = new Promise<never>((_, reject) => {
            const id = setTimeout(() => {
              reject(new QueryTimeoutError(`Query timeout after ${timeout}ms`));
            }, timeout);
            signal.addEventListener("abort", () => clearTimeout(id));
          });

          const queryPromise = queryFn(supabase);

          const result = await Promise.race([queryPromise, timeoutPromise]);

          if (signal.aborted) {
            throw new Error("Query aborted");
          }

          return result;
        } catch (error) {
          if (signal.aborted) {
            throw new Error("Query aborted");
          }

          const err = error instanceof Error ? error : new Error(String(error));

          // Retry on network errors or timeouts
          if (
            (err.name === "QueryTimeoutError" ||
              err.message.includes("fetch") ||
              err.message.includes("network") ||
              err.message.includes("NetworkError")) &&
            retryCount > 0
          ) {
            console.warn(
              `Query failed, retrying... (${retryCount} attempts left)`
            );
            await new Promise((resolve) =>
              setTimeout(resolve, retryDelay * (retries - retryCount + 1))
            );
            return attempt(retryCount - 1);
          }

          throw err;
        }
      };

      return attempt(retries);
    },
    [queryFn, supabase, timeout, retries, retryDelay]
  );

  // Use a ref to track deps changes
  const depsRef = useRef(deps);
  depsRef.current = deps;

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const data = await executeQuery(signal);
      if (!signal.aborted) {
        setState({ data, loading: false, error: null });
      }
    } catch (error) {
      if (!signal.aborted) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error("Query error:", err);
        setState({ data: null, loading: false, error: err });
      }
    }
  }, [enabled, executeQuery]);

  useEffect(() => {
    fetchData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch };
}

/**
 * Helper function for running parallel queries with individual timeouts
 */
export async function runParallelQueries<T extends Record<string, unknown>>(
  queries: {
    [K in keyof T]: () => Promise<T[K]>;
  },
  options: { timeout?: number; retries?: number } = {}
): Promise<T> {
  const { timeout = 15000, retries = 3 } = options;

  const runWithTimeout = async <R,>(
    query: () => Promise<R>,
    key: string
  ): Promise<R> => {
    const attempt = async (retryCount: number): Promise<R> => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const result = await Promise.race([
          query(),
          new Promise<never>((_, reject) => {
            controller.signal.addEventListener("abort", () => {
              reject(new QueryTimeoutError(`${key} timeout after ${timeout}ms`));
            });
          }),
        ]);

        clearTimeout(timeoutId);
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));

        if (
          (err.name === "QueryTimeoutError" ||
            err.message.includes("fetch") ||
            err.message.includes("NetworkError")) &&
          retryCount > 0
        ) {
          console.warn(`${key} failed, retrying... (${retryCount} left)`);
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * (retries - retryCount + 1))
          );
          return attempt(retryCount - 1);
        }

        throw err;
      }
    };

    return attempt(retries);
  };

  const entries = Object.entries(queries) as [
    keyof T,
    () => Promise<T[keyof T]>
  ][];

  const results = await Promise.allSettled(
    entries.map(async ([key, query]) => ({
      key,
      result: await runWithTimeout(query, String(key)),
    }))
  );

  const finalResult = {} as T;
  const errors: string[] = [];

  results.forEach((res) => {
    if (res.status === "fulfilled") {
      finalResult[res.value.key] = res.value.result;
    } else {
      errors.push(String(res.reason));
    }
  });

  if (errors.length > 0) {
    throw new Error(`Failed queries: ${errors.join(", ")}`);
  }

  return finalResult;
}

export { QueryTimeoutError };
