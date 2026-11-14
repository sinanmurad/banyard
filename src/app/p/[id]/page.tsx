import Link from "next/link";
import { notFound } from "next/navigation";
import { db, currentProfile } from "@/lib/supabase";
import { createComment, vote, deletePost, editPost } from "../../actions";

type Comment = {
  id: string; body: string; created_at: string; parent_id: string | null;
  profiles: { username: string; display_name: string | null } | null;
};

function Thread({
  all, parent, postId, canReply, depth,
}: { all: Comment[]; parent: string | null; postId: string; canReply: boolean; depth: number }) {
  const items = all.filter((c) => c.parent_id === parent);
  if (items.length === 0) return null;
  return (
    <>
      {items.map((c) => (
        <div key={c.id} className="card" style={{ marginLeft: Math.min(depth, 5) * 16 }}>
          <div className="mute">
            <Link href={`/u/${c.profiles?.username}`}>{c.profiles?.display_name || c.profiles?.username}</Link>
            {" · "}{new Date(c.created_at).toLocaleString("en-US")}
            {" · "}<Link href={`/report?comment_id=${c.id}`}>Report</Link>
          </div>
          <p style={{ whiteSpace: "pre-wrap" }}>{c.body}</p>
          {canReply && (
            <details>
              <summary>Reply</summary>
              <form action={createComment} className="stack">
                <input type="hidden" name="post_id" value={postId} />
                <input type="hidden" name="parent_id" value={c.id} />
                <textarea name="body" placeholder="Write a reply" required />
                <button>Reply</button>
              </form>
            </details>
          )}
          <Thread all={all} parent={c.id} postId={postId} canReply={canReply} depth={depth + 1} />
        </div>
      ))}
    </>
  );
}

export default async function Post({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await db();
  const { data: p } = await supabase
    .from("posts")
    .select("id,title,body,is_nsfw,created_at,edited_at,author_id,communities(slug),profiles(username,display_name)")
    .eq("id", id)
    .single();
  if (!p) notFound();
  const { data: sc } = await supabase.from("post_scores").select("score").eq("post_id", id).single();
  const { data: cm } = await supabase
    .from("comments")
    .select("id,body,created_at,parent_id,profiles(username,display_name)")
    .eq("post_id", id)
    .order("created_at");
  const me = await currentProfile();
  const comm = p.communities as unknown as { slug: string } | null;
  const author = p.profiles as unknown as { username: string; display_name: string | null } | null;
  const isMine = me?.user.id === p.author_id;

  const body = <p style={{ whiteSpace: "pre-wrap" }}>{p.body}</p>;
  const showDirectly = !p.is_nsfw || me?.profile.show_nsfw;

  return (
    <>
      <div className="card">
        <div className="mute">
          <Link href={`/c/${comm?.slug}`}>c/{comm?.slug}</Link> ·{" "}
          <Link href={`/u/${author?.username}`}>{author?.display_name || author?.username}</Link> ·{" "}
          {new Date(p.created_at).toLocaleString("en-US")}
          {p.edited_at && " · edited"}
        </div>
        <h2>{p.is_nsfw && <span className="badge">18+</span>}{p.title}</h2>
        {showDirectly ? body : (
          <details><summary>I am 18 or older, show content</summary>{body}</details>
        )}
        <div className="row">
          <form action={vote}><input type="hidden" name="post_id" value={id} /><input type="hidden" name="value" value="1" /><button className="ghost">▲</button></form>
          <b>{sc?.score ?? 0}</b>
          <form action={vote}><input type="hidden" name="post_id" value={id} /><input type="hidden" name="value" value="-1" /><button className="ghost">▼</button></form>
          <span style={{ flex: 1 }} />
          {isMine && (
            <form action={deletePost}><input type="hidden" name="post_id" value={id} /><button className="ghost">Delete</button></form>
          )}
          <Link href={`/report?post_id=${id}`} className="mute">Report</Link>
        </div>
        {isMine && (
          <details style={{ marginTop: 10 }}>
            <summary>Edit post</summary>
            <form action={editPost} className="stack">
              <input type="hidden" name="post_id" value={id} />
              <input name="title" defaultValue={p.title} required maxLength={300} />
              <textarea name="body" defaultValue={p.body} />
              <button>Save</button>
            </form>
          </details>
        )}
      </div>

      {error && <p className="err">{error}</p>}
      {me ? (
        <form action={createComment} className="stack">
          <input type="hidden" name="post_id" value={id} />
          <textarea name="body" placeholder="Write a comment" required />
          <button>Comment</button>
        </form>
      ) : (
        <p className="mute"><Link href="/login">Log in</Link> to comment.</p>
      )}

      <Thread all={(cm ?? []) as unknown as Comment[]} parent={null} postId={id} canReply={!!me} depth={0} />
    </>
  );
}
