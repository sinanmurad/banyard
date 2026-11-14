import "./globals.css";
import Link from "next/link";
import type { Metadata } from "next";
import { currentProfile, db } from "@/lib/supabase";
import { signOut } from "./actions";

export const metadata: Metadata = {
  title: "Banyard",
  description: "Open-source forum where anything legal can be discussed.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const me = await currentProfile();
  let unread = 0;
  if (me) {
    const supabase = await db();
    const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("read", false);
    unread = count ?? 0;
  }
  return (
    <html lang="en">
      <body>
        <header>
          <Link href="/" className="brand">Banyard</Link>
          <Link href="/c/new">New community</Link>
          <form action="/search" method="get"><input name="q" placeholder="Search" style={{ width: 120 }} /></form>
          <span className="spacer" />
          {me ? (
            <>
              <Link href="/submit"><button>+ Post</button></Link>
              <Link href="/notifications">Inbox{unread > 0 ? ` (${unread})` : ""}</Link>
              <Link href="/saved">Saved</Link>
              {me.profile.is_admin && <Link href="/admin">Admin</Link>}
              <Link href={`/u/${me.profile.username}`}>{me.profile.display_name || me.profile.username}</Link>
              <Link href="/settings">Settings</Link>
              <form action={signOut}><button className="ghost">Log out</button></form>
            </>
          ) : (
            <Link href="/login"><button>Log in / Sign up</button></Link>
          )}
        </header>
        <main>{children}</main>
        <footer>
          <Link href="/rules">Rules &amp; responsibility</Link>
          <Link href="/modlog">Public mod log</Link>
          <Link href="/report">Report content / takedown</Link>
          <a href="https://github.com/sinanmurad/banyard">Open source (MIT)</a>
        </footer>
      </body>
    </html>
  );
}
