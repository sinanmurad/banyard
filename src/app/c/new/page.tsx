import { createCommunity } from "../../actions";

export default async function NewCommunity({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <div className="card">
      <h3>Topluluk aç</h3>
      {error && <p className="err">{error}</p>}
      <form action={createCommunity} className="stack">
        <input name="slug" placeholder="adres (küçük harf, rakam, _)" pattern="[a-z0-9_]{3,24}" required />
        <input name="title" placeholder="Başlık" required />
        <textarea name="description" placeholder="Açıklama" />
        <button>Oluştur</button>
      </form>
    </div>
  );
}
