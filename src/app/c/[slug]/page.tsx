import Link from "next/link";
import { notFound } from "next/navigation";
import { db, currentUser } from "@/lib/supabase";
import { createPost } from "../../actions";
import { FeedList, SortTabs, orderFor, type FeedRow } from "@/components/FeedList";

export default async function Community({
  params, searchParams,
}: { params: Promise<{ slug: string }>; searchParams: Promise<{ error?: string; sort?: string }> }) {
  const { slug } = await params;
  const { error, sort = "hot" } = await searchParams;
  const supabase = await db();
  const { data: c } = await supabase.from("communities").select("id,title,description").eq("slug", slug).single();
  if (!c) notFound();
  const { data: posts } = await supabase
    .from("feed")
    .select("*")
    .eq("community_slug", slug)
    .order(orderFor(sort), { ascending: false })
    .limit(50);
  const user = await currentUser();

  return (
    <>
      <h2>c/{slug} — {c.title}</h2>
      <p className="mute">{c.description}</p>
      {user ? (
        <details className="card">
          <summary>New post</summary>
          {error && <p className="err">{error}</p>}
          <form action={createPost} className="stack">
            <input type="hidden" name="slug" value={slug} />
            <input name="title" placeholder="Title" required maxLength={300} />
            <textarea name="body" placeholder="Text (text and links only for now)" />
            <label className="row"><input type="checkbox" name="nsfw" /> 18+ content (adults only)</label>
            <button>Post</button>
          </form>
        </details>
      ) : (
        <p className="mute"><Link href="/login">Log in</Link> to post.</p>
      )}
      <SortTabs base={`/c/${slug}`} sort={sort} />
      <FeedList rows={(posts ?? []) as FeedRow[]} />
    </>
  );
}
