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
            // Server Component içinden çağrıldığında yok sayılır; middleware yeniler.
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
