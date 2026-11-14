import Link from "next/link";
import { db } from "@/lib/supabase";

export default async function Search({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  let rows: { id: string; title: string; snippet: string; created_at: string }[] = [];
  if (query) {
    const supabase = await db();
    const { data } = await supabase.rpc("search_posts", { q: query });
    rows = data ?? [];
  }
  return (
    <>
      <h2>Search</h2>
      <form action="/search" method="get" className="row">
        <input name="q" defaultValue={query} placeholder="Search posts and comments" />
        <button>Search</button>
      </form>
      {rows.map((r, i) => (
        <div key={`${r.id}-${i}`} className="card">
          <Link href={`/p/${r.id}`}><b>{r.title}</b></Link>
          <p className="mute">{r.snippet}</p>
        </div>
      ))}
      {query && rows.length === 0 && <p className="mute">No results.</p>}
    </>
  );
}
