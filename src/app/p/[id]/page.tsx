import Link from "next/link";
import { notFound } from "next/navigation";
import { db, currentUser } from "@/lib/supabase";
import { createComment, vote } from "../../actions";

export default async function Post({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await db();
  const { data: p } = await supabase
    .from("posts")
    .select("id,title,body,is_nsfw,created_at,communities(slug),profiles(username)")
    .eq("id", id)
    .single();
  if (!p) notFound();
  const { data: sc } = await supabase.from("post_scores").select("score").eq("post_id", id).single();
  const { data: comments } = await supabase
    .from("comments")
    .select("id,body,created_at,profiles(username)")
    .eq("post_id", id)
    .order("created_at");
  const user = await currentUser();
  const comm = p.communities as unknown as { slug: string } | null;
  const author = p.profiles as unknown as { username: string } | null;

  const body = <p style={{ whiteSpace: "pre-wrap" }}>{p.body}</p>;

  return (
    <>
      <div className="card">
        <div className="mute">
          <Link href={`/c/${comm?.slug}`}>c/{comm?.slug}</Link> · {author?.username} ·{" "}
          {new Date(p.created_at).toLocaleString("tr-TR")}
        </div>
        <h2>{p.is_nsfw && <span className="badge">18+</span>}{p.title}</h2>
        {p.is_nsfw ? (
          <details><summary>18 yaşından büyüğüm, içeriği göster</summary>{body}</details>
        ) : body}
        <div className="row">
          <form action={vote}><input type="hidden" name="post_id" value={id} /><input type="hidden" name="value" value="1" /><button className="ghost">▲</button></form>
          <b>{sc?.score ?? 0}</b>
          <form action={vote}><input type="hidden" name="post_id" value={id} /><input type="hidden" name="value" value="-1" /><button className="ghost">▼</button></form>
          <span className="spacer" style={{ flex: 1 }} />
          <Link href={`/report?post_id=${id}`} className="mute">Bildir</Link>
        </div>
      </div>

      {error && <p className="err">{error}</p>}
      {user ? (
        <form action={createComment} className="stack">
          <input type="hidden" name="post_id" value={id} />
          <textarea name="body" placeholder="Yorum yaz" required />
          <button>Yorum yap</button>
        </form>
      ) : (
        <p className="mute"><Link href="/login">Giriş yap</Link> ve yorum yaz.</p>
      )}

      {(comments ?? []).map((c) => (
        <div key={c.id} className="card">
          <div className="mute">
            {(c.profiles as unknown as { username: string } | null)?.username} ·{" "}
            {new Date(c.created_at).toLocaleString("tr-TR")} ·{" "}
            <Link href={`/report?comment_id=${c.id}`}>Bildir</Link>
          </div>
          <p style={{ whiteSpace: "pre-wrap" }}>{c.body}</p>
        </div>
      ))}
    </>
  );
}
