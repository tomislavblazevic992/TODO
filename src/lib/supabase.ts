import { createBrowserClient } from "@supabase/ssr";

// Singleton — jedan klijent za cijelu aplikaciju
// Bez ovoga svaki component pravi vlastiti klijent s vlastitim session stateom
// što uzrokuje konflikte pri token refreshu (bijela stranica pri promjeni taba)
let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (client) return client;

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return client;
}
