import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: (url: RequestInfo | URL, options?: RequestInit) => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

          return fetch(url, {
            ...options,
            signal: controller.signal,
          }).finally(() => clearTimeout(timeoutId));
        },
      },
    }
  );
}
