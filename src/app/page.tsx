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
        <b>Banyard</b> — yasalar çerçevesinde her şey konuşulabilir. Yasadışı içerik yasak,
        içeriğin sorumluluğu paylaşana aittir. <Link href="/rules">Kurallar</Link>
      </div>
      <p className="mute">
        Topluluklar:{" "}
        {(comms ?? []).map((c) => (
          <Link key={c.slug} href={`/c/${c.slug}`} style={{ marginRight: 10 }}>c/{c.slug}</Link>
        ))}
        {(comms ?? []).length === 0 && "henüz yok, ilkini sen aç"}
      </p>
      <SortTabs base="/" sort={sort} />
      <FeedList rows={(data ?? []) as FeedRow[]} />
    </>
  );
}
