import { createServerClient, type CookieOptions } from "@supabase/ssr";

type Cookie = { name: string; value: string; options: CookieOptions };
import { cookies } from "next/headers";

export async function db() {
  const store = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (list: Cookie[]) => {
          try {
            list.forEach(({ name, value, options }) => store.set(name, value, options));
          } catch {
            // Ignored when called from a Server Component; middleware refreshes the session.
          }
        },
      },
    }
  );
}

export async function currentUser() {
  const supabase = await db();
  const { data } = await supabase.auth.getUser();
  return data.user;
}
