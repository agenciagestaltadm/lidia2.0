/**
 * Utility for making fetch requests with timeout and retry logic
 * Resolves NetworkError issues by handling timeouts gracefully
 */

interface FetchWithTimeoutOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

export async function fetchWithTimeout(
  url: string,
  options: FetchWithTimeoutOptions = {}
): Promise<Response> {
  const { timeout = 10000, retries = 3, retryDelay = 1000, ...fetchOptions } = options;

  const attempt = async (retryCount: number): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          if (retryCount > 0) {
            console.warn(`Request timeout, retrying... (${retryCount} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            return attempt(retryCount - 1);
          }
          throw new TimeoutError(`Request timeout after ${timeout}ms`);
        }

        // Network errors (no connection, DNS failure, etc.)
        if (error.message.includes('fetch') || error.message.includes('network')) {
          if (retryCount > 0) {
            console.warn(`Network error, retrying... (${retryCount} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, retryDelay * 2)); // Exponential backoff
            return attempt(retryCount - 1);
          }
        }
      }

      throw error;
    }
  };

  return attempt(retries);
}

/**
 * Wrapper for Supabase queries with timeout
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 10000,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new TimeoutError(errorMessage)), timeoutMs);
    }),
  ]);
}

export { TimeoutError };
