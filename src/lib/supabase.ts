import { createServerClient, type CookieOptions } from "@supabase/ssr";

type Cookie = { name: string; value: string; options: CookieOptions };
import { cookies } from "next/headers";
import { cache } from "react";

export const db = cache(async () => {
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
});

// cache() = one lookup per request, shared by layout and page.
export const currentUser = cache(async () => {
  const supabase = await db();
  const { data } = await supabase.auth.getUser();
  return data.user;
});

export type Me = {
  username: string; display_name: string | null; bio: string;
  show_nsfw: boolean; default_sort: string; is_admin: boolean;
};

// Signed-in user plus their profile (null when logged out).
export const currentProfile = cache(async () => {
  const user = await currentUser();
  if (!user) return null;
  const supabase = await db();
  const { data: p } = await supabase
    .from("profiles")
    .select("username,display_name,bio,show_nsfw,default_sort,is_admin")
    .eq("id", user.id)
    .single();
  return p ? { user, profile: p as Me } : null;
});
