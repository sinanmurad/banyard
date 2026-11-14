import Link from "next/link";
import { redirect } from "next/navigation";
import { db, currentUser } from "@/lib/supabase";
import { markNotificationsRead } from "../actions";

export default async function Notifications() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const supabase = await db();
  const { data } = await supabase
    .from("notifications").select("id,read,created_at,post_id,posts(title),profiles:from_user(username)")
    .order("created_at", { ascending: false }).limit(100);
  const rows = (data ?? []) as unknown as { id: string; read: boolean; created_at: string; post_id: string; posts: { title: string } | null; profiles: { username: string } | null }[];
  return (
    <>
      <h2>Inbox</h2>
      <form action={markNotificationsRead}><button className="ghost">Mark all read</button></form>
      {rows.map((n) => (
        <div key={n.id} className="card" style={{ opacity: n.read ? 0.6 : 1 }}>
          <Link href={`/p/${n.post_id}`}>{n.profiles?.username ?? "someone"} replied in “{n.posts?.title}”</Link>
          <span className="mute"> · {new Date(n.created_at).toLocaleString("en-US")}</span>
        </div>
      ))}
      {rows.length === 0 && <p className="mute">No replies yet. Banyard never emails you about this.</p>}
    </>
  );
}
