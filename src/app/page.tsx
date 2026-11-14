import Link from "next/link";
import { db, currentProfile } from "@/lib/supabase";
import { FeedList, SortTabs, orderFor, type FeedRow } from "@/components/FeedList";

export default async function Home({
  searchParams,
}: { searchParams: Promise<{ sort?: string; feed?: string }> }) {
  const q = await searchParams;
  const me = await currentProfile();
  const sort = q.sort ?? me?.profile.default_sort ?? "hot";
  const joinedOnly = q.feed === "joined" && !!me;
  const supabase = await db();

  let slugs: string[] | null = null;
  if (joinedOnly && me) {
    const { data } = await supabase
      .from("memberships").select("communities(slug)").eq("user_id", me.user.id);
    slugs = (data ?? []).map((m) => (m.communities as unknown as { slug: string }).slug);
  }

  let query = supabase.from("feed").select("*").order(orderFor(sort), { ascending: false }).limit(50);
  if (slugs) query = query.in("community_slug", slugs.length ? slugs : ["__none__"]);
  const { data } = await query;
  const { data: comms } = await supabase.from("communities").select("slug").limit(30);

  return (
    <>
      {!me && (
        <div className="card">
          <b>Banyard</b> — anything legal can be discussed here. Illegal content is banned, and
          you are responsible for what you post. <Link href="/rules">Rules</Link> ·{" "}
          <Link href="/login">Join in 30 seconds</Link>
        </div>
      )}
      <p className="row">
        <Link href="/" style={{ fontWeight: joinedOnly ? 400 : 700 }}>Everything</Link>
        {me && (
          <Link href="/?feed=joined" style={{ fontWeight: joinedOnly ? 700 : 400 }}>My communities</Link>
        )}
      </p>
      <p className="mute">
        Communities:{" "}
        {(comms ?? []).map((c) => (
          <Link key={c.slug} href={`/c/${c.slug}`} style={{ marginRight: 10 }}>c/{c.slug}</Link>
        ))}
        {(comms ?? []).length === 0 && <>none yet — <Link href="/c/new">create the first one</Link></>}
      </p>
      <SortTabs base="/" sort={sort} extra={joinedOnly ? "feed=joined&" : ""} />
      <FeedList rows={(data ?? []) as FeedRow[]} />
      {joinedOnly && (data ?? []).length === 0 && (
        <p className="mute">Join a few communities and their posts will show up here.</p>
      )}
    </>
  );
}
