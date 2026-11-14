import { notFound } from "next/navigation";
import { db } from "@/lib/supabase";
import { FeedList, type FeedRow } from "@/components/FeedList";

export default async function Profile({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await db();
  const { data: u } = await supabase
    .from("profiles").select("username,display_name,bio,created_at").eq("username", username).single();
  if (!u) notFound();
  const { data } = await supabase
    .from("feed").select("*").eq("username", username).order("created_at", { ascending: false }).limit(50);
  return (
    <>
      <h2>{u.display_name || u.username}</h2>
      <p className="mute">
        u/{u.username} · Member since {new Date(u.created_at).toLocaleDateString("en-US")}
      </p>
      {u.bio && <p style={{ whiteSpace: "pre-wrap" }}>{u.bio}</p>}
      <FeedList rows={(data ?? []) as FeedRow[]} />
    </>
  );
}
