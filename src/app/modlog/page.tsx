import Link from "next/link";
import { db } from "@/lib/supabase";

export default async function ModLog() {
  const supabase = await db();
  const { data } = await supabase.from("modlog").select("*").order("created_at", { ascending: false }).limit(200);
  return (
    <>
      <h2>Public mod log</h2>
      <p className="mute">Every removal is listed here with its reason. Nothing is removed silently.</p>
      {(data ?? []).map((m) => (
        <div key={m.id} className="card">
          <span className="mute">{new Date(m.created_at).toLocaleString("en-US")} · {m.kind}</span>
          <p><b>{m.title || "(untitled)"}</b></p>
          <p>Reason: {m.reason}</p>
          {m.post_id && <Link href={`/p/${m.post_id}`}>Open</Link>}
        </div>
      ))}
      {(data ?? []).length === 0 && <p className="mute">No removals yet.</p>}
    </>
  );
}
