import Link from "next/link";
import { notFound } from "next/navigation";
import { db, currentUser } from "@/lib/supabase";
import { createPost } from "../../actions";

export default async function Community({
  params, searchParams,
}: { params: Promise<{ slug: string }>; searchParams: Promise<{ error?: string }> }) {
  const { slug } = await params;
  const { error } = await searchParams;
  const supabase = await db();
  const { data: c } = await supabase.from("communities").select("id,title,description").eq("slug", slug).single();
  if (!c) notFound();
  const { data: posts } = await supabase
    .from("posts")
    .select("id,title,is_nsfw,created_at,profiles(username)")
    .eq("community_id", c.id)
    .order("created_at", { ascending: false })
    .limit(50);
  const user = await currentUser();

  return (
    <>
      <h2>c/{slug} — {c.title}</h2>
      <p className="mute">{c.description}</p>
      {user ? (
        <details className="card">
          <summary>Yeni gönderi</summary>
          {error && <p className="err">{error}</p>}
          <form action={createPost} className="stack">
            <input type="hidden" name="slug" value={slug} />
            <input name="title" placeholder="Başlık" required maxLength={300} />
            <textarea name="body" placeholder="Metin (şimdilik yalnızca metin/bağlantı)" />
            <label className="row"><input type="checkbox" name="nsfw" /> 18+ içerik (yetişkinlere özel)</label>
            <button>Paylaş</button>
          </form>
        </details>
      ) : (
        <p className="mute"><Link href="/login">Giriş yap</Link> ve paylaş.</p>
      )}
      {(posts ?? []).map((p) => (
        <div key={p.id} className="card">
          {p.is_nsfw && <span className="badge">18+</span>}
          <Link href={`/p/${p.id}`}>{p.title}</Link>
          <div className="mute">
            {(p.profiles as unknown as { username: string } | null)?.username} ·{" "}
            {new Date(p.created_at).toLocaleString("tr-TR")}
          </div>
        </div>
      ))}
    </>
  );
}
