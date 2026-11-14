import Link from "next/link";
import { redirect } from "next/navigation";
import { db, currentUser } from "@/lib/supabase";
import { createPost } from "../actions";

export const metadata = { title: "Create post — Banyard" };

export default async function Submit({
  searchParams,
}: { searchParams: Promise<{ error?: string; c?: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const { error, c } = await searchParams;
  const supabase = await db();
  const { data: comms } = await supabase.from("communities").select("slug,title").order("slug");

  return (
    <div className="card">
      <h3>Create a post</h3>
      {error && <p className="err">{error}</p>}
      {(comms ?? []).length === 0 ? (
        <p>No communities yet. <Link href="/c/new">Create the first one</Link>, then come back.</p>
      ) : (
        <form action={createPost} className="stack">
          <label>Where do you want to post?
            <select name="slug" defaultValue={c ?? ""} required>
              <option value="" disabled>Choose a community</option>
              {(comms ?? []).map((x) => (
                <option key={x.slug} value={x.slug}>c/{x.slug} — {x.title}</option>
              ))}
            </select>
          </label>
          <input name="title" placeholder="Title" required maxLength={300} />
          <textarea name="body" placeholder="Text (optional). You can paste links too." />
          <label className="row"><input type="checkbox" name="nsfw" /> This post is 18+ (adults only)</label>
          <p className="mute">By posting you confirm it is legal and that you are responsible for it. <Link href="/rules">Rules</Link></p>
          <button>Post</button>
        </form>
      )}
    </div>
  );
}
