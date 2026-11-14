import Link from "next/link";
import { db } from "@/lib/supabase";
import { FeedList, SortTabs, orderFor, type FeedRow } from "@/components/FeedList";

export default async function Home({ searchParams }: { searchParams: Promise<{ sort?: string }> }) {
  const { sort = "hot" } = await searchParams;
  const supabase = await db();
  const { data } = await supabase
    .from("feed")
    .select("*")
    .order(orderFor(sort), { ascending: false })
    .limit(50);
  const { data: comms } = await supabase.from("communities").select("slug").limit(30);

  return (
    <>
      <div className="card">
        <b>Banyard</b> — anything legal can be discussed here. Illegal content is banned, and
        you are responsible for what you post. <Link href="/rules">Rules</Link>
      </div>
      <p className="mute">
        Communities:{" "}
        {(comms ?? []).map((c) => (
          <Link key={c.slug} href={`/c/${c.slug}`} style={{ marginRight: 10 }}>c/{c.slug}</Link>
        ))}
        {(comms ?? []).length === 0 && "none yet — create the first one"}
      </p>
      <SortTabs base="/" sort={sort} />
      <FeedList rows={(data ?? []) as FeedRow[]} />
    </>
  );
}
