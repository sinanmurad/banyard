import Link from "next/link";

export type FeedRow = {
  id: string; title: string; is_nsfw: boolean; created_at: string;
  community_slug: string; username: string; score: number;
};

export function SortTabs({ base, sort }: { base: string; sort: string }) {
  return (
    <p className="row">
      {["hot", "new", "top"].map((k) => (
        <Link key={k} href={`${base}?sort=${k}`} style={{ fontWeight: sort === k ? 700 : 400 }}>
          {k === "hot" ? "Hot" : k === "new" ? "New" : "Top"}
        </Link>
      ))}
    </p>
  );
}

export function FeedList({ rows }: { rows: FeedRow[] }) {
  return (
    <>
      {rows.map((p) => (
        <div key={p.id} className="card">
          {p.is_nsfw && <span className="badge">18+</span>}
          <Link href={`/p/${p.id}`}>{p.title}</Link>
          <div className="mute">
            {p.score} points · <Link href={`/c/${p.community_slug}`}>c/{p.community_slug}</Link> ·{" "}
            <Link href={`/u/${p.username}`}>{p.username}</Link> ·{" "}
            {new Date(p.created_at).toLocaleString("en-US")}
          </div>
        </div>
      ))}
      {rows.length === 0 && <p className="mute">No posts yet.</p>}
    </>
  );
}

export const orderFor = (sort: string) =>
  sort === "new" ? "created_at" : sort === "top" ? "score" : "hot";
