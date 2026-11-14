import Link from "next/link";
import { redirect } from "next/navigation";
import { db, currentUser } from "@/lib/supabase";
import { removeReported, dismissReport } from "../actions";

type Report = {
  id: string; post_id: string | null; comment_id: string | null; category: string;
  details: string; reporter_email: string | null; created_at: string;
};

const urgent = ["csam", "non_consensual_intimate"];

export default async function Admin() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const supabase = await db();
  const { data: me } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!me?.is_admin) redirect("/");
  const { data } = await supabase
    .from("reports").select("*").eq("status", "open").order("created_at");
  const reports = ((data ?? []) as Report[]).sort(
    (a, b) => Number(urgent.includes(b.category)) - Number(urgent.includes(a.category))
  );

  return (
    <>
      <h2>Rapor kuyruğu ({reports.length})</h2>
      <p className="mute">Çocuk istismarı ve rızasız görüntü bildirimleri en üstte; 48 saat içinde kaldırılmalı.</p>
      {reports.map((r) => (
        <div key={r.id} className={`card ${urgent.includes(r.category) ? "warn" : ""}`}>
          <b>{r.category}</b> · {new Date(r.created_at).toLocaleString("tr-TR")}
          {r.reporter_email && <> · {r.reporter_email}</>}
          <p>{r.details || "(ayrıntı yok)"}</p>
          {r.post_id && <Link href={`/p/${r.post_id}`}>Gönderiyi aç</Link>}
          {r.comment_id && <span className="mute"> yorum: {r.comment_id}</span>}
          <div className="row" style={{ marginTop: 8 }}>
            <form action={removeReported}>
              <input type="hidden" name="report_id" value={r.id} />
              <input type="hidden" name="post_id" value={r.post_id ?? ""} />
              <input type="hidden" name="comment_id" value={r.comment_id ?? ""} />
              <button>İçeriği kaldır</button>
            </form>
            <form action={dismissReport}>
              <input type="hidden" name="report_id" value={r.id} />
              <button className="ghost">Reddet</button>
            </form>
          </div>
        </div>
      ))}
      {reports.length === 0 && <p className="mute">Açık rapor yok.</p>}
    </>
  );
}
