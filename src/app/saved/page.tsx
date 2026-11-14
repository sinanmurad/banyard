import Link from "next/link";
import { redirect } from "next/navigation";
import { db, currentUser } from "@/lib/supabase";

export default async function Saved({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const { q } = await searchParams;
  const supabase = await db();
  const { data } = await supabase
    .from("saved").select("created_at,posts!inner(id,title,removed)")
    .eq("user_id", user.id).order("created_at", { ascending: false });
  const query = (q ?? "").toLowerCase();
  const rows = ((data ?? []) as unknown as { posts: { id: string; title: string; removed: boolean } }[])
    .filter((r) => !r.posts.removed && r.posts.title.toLowerCase().includes(query));
  return (
    <>
      <h2>Saved posts</h2>
      <form method="get" className="row"><input name="q" defaultValue={q ?? ""} placeholder="Search saved" /><button>Search</button></form>
      {rows.map((r) => (
        <div key={r.posts.id} className="card"><Link href={`/p/${r.posts.id}`}>{r.posts.title}</Link></div>
      ))}
      {rows.length === 0 && <p className="mute">Nothing saved yet. No limit on how many you can save.</p>}
    </>
  );
}
