import { createBrowserClient } from "@supabase/ssr";

// Module-level singleton cache to guarantee the same instance across re-renders
let cachedClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase URL e Anon Key são obrigatórios. Verifique o arquivo .env.local");
  }

  // Return cached client if available (guaranteed singleton regardless of SSR/hydration)
  if (cachedClient) {
    return cachedClient;
  }

  cachedClient = createBrowserClient(
    supabaseUrl,
    supabaseKey,
    {
      isSingleton: true,
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

  return cachedClient;
}
