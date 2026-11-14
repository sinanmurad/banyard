import Link from "next/link";
import { db } from "@/lib/supabase";

type Row = {
  id: string; title: string; is_nsfw: boolean; created_at: string;
  communities: { slug: string } | null; profiles: { username: string } | null;
};

export default async function Home() {
  const supabase = await db();
  const { data } = await supabase
    .from("posts")
    .select("id,title,is_nsfw,created_at,communities(slug),profiles(username)")
    .order("created_at", { ascending: false })
    .limit(50);
  const posts = (data ?? []) as unknown as Row[];
  const { data: comms } = await supabase.from("communities").select("slug,title").limit(30);

  return (
    <>
      <div className="card">
        <b>Agora</b> — yasalar çerçevesinde her şey konuşulabilir. Yasadışı içerik yasak,
        içeriğin sorumluluğu paylaşana aittir. <Link href="/rules">Kurallar</Link>
      </div>
      <p className="mute">
        Topluluklar:{" "}
        {(comms ?? []).map((c) => (
          <Link key={c.slug} href={`/c/${c.slug}`} style={{ marginRight: 10 }}>c/{c.slug}</Link>
        ))}
        {(comms ?? []).length === 0 && "henüz yok"}
      </p>
      {posts.map((p) => (
        <div key={p.id} className="card">
          {p.is_nsfw && <span className="badge">18+</span>}
          <Link href={`/p/${p.id}`}>{p.title}</Link>
          <div className="mute">
            c/{p.communities?.slug} · {p.profiles?.username} · {new Date(p.created_at).toLocaleString("tr-TR")}
          </div>
        </div>
      ))}
      {posts.length === 0 && <p className="mute">Henüz gönderi yok. İlk topluluğu sen aç.</p>}
    </>
  );
}
