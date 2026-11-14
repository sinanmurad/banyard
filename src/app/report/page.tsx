import Link from "next/link";
import { submitReport } from "../actions";

export const metadata = { title: "İçerik bildir — Banyard" };

export default async function Report({
  searchParams,
}: { searchParams: Promise<{ post_id?: string; comment_id?: string; sent?: string; error?: string }> }) {
  const q = await searchParams;
  return (
    <>
      <h2>İçerik bildir / takedown</h2>
      <p className="mute">
        Giriş yapmadan bildirebilirsiniz. Çocuk istismarı ve rızasız mahrem görüntü bildirimleri
        geçerliyse en geç 48 saat içinde kaldırılır. <Link href="/rules">Kurallar</Link>
      </p>
      {q.sent && <p className="ok">Bildiriminiz alındı.</p>}
      {q.error && <p className="err">{q.error}</p>}
      <form action={submitReport} className="stack card">
        <input name="post_id" placeholder="Gönderi kimliği" defaultValue={q.post_id ?? ""} />
        <input name="comment_id" placeholder="Yorum kimliği" defaultValue={q.comment_id ?? ""} />
        <select name="category" required defaultValue="">
          <option value="" disabled>Kategori seç</option>
          <option value="csam">Çocuk istismarı</option>
          <option value="non_consensual_intimate">Rızasız mahrem görüntü / deepfake</option>
          <option value="violence">Şiddet çağrısı / tehdit</option>
          <option value="drugs_weapons">Uyuşturucu / silah</option>
          <option value="illegal">Diğer yasa dışı içerik</option>
          <option value="other">Diğer</option>
        </select>
        <textarea name="details" placeholder="Ayrıntı" />
        <input name="email" type="email" placeholder="E-posta (isteğe bağlı, geri dönüş için)" />
        <button>Gönder</button>
      </form>
    </>
  );
}
